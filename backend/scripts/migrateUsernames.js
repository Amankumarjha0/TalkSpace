import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Friendship from "../models/friendship.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { displayNameFromEmail, isValidUsername, normalizeUsername, usernameFromIdentity } from "../utils/username.js";
import { getPairKey } from "../utils/pairKey.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
if (!process.env.MONGO_URI) dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is required to run the username migration");
}

const migrateUsernames = async () => {
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  const users = await User.find().sort({ _id: 1 }).lean();
  const assigned = new Set();

  for (const user of users) {
    const existing = normalizeUsername(user.username);
    const base = isValidUsername(existing)
      ? existing
      : usernameFromIdentity(user.fullName, user.email);
    let username = base;
    let suffix = 2;

    while (assigned.has(username)) {
      const suffixText = String(suffix++);
      username = `${base.slice(0, 20 - suffixText.length)}${suffixText}`;
    }
    assigned.add(username);

    const fullName = /^new user$/i.test(user.fullName || "")
      ? displayNameFromEmail(user.email)
      : user.fullName;

    await User.collection.updateOne(
      { _id: user._id },
      { $set: { username, fullName } }
    );
  }

  const canonicalConversations = new Map();
  const conversations = Conversation.find({ participants: { $size: 2 } })
    .sort({ _id: 1 })
    .cursor();

  for await (const conversation of conversations) {
    const [firstUserId, secondUserId] = conversation.participants;
    const pairKey = getPairKey(firstUserId, secondUserId);
    await Friendship.updateOne(
      { pairKey },
      {
        $setOnInsert: {
          requester: firstUserId,
          recipient: secondUserId,
          pairKey,
          status: "accepted",
        },
      },
      { upsert: true }
    );

    let canonical = canonicalConversations.get(pairKey);
    if (!canonical) {
      canonical = {
        _id: conversation._id,
        messageIds: [],
      };
      canonicalConversations.set(pairKey, canonical);
    } else if (canonical._id.toString() !== conversation._id.toString()) {
      await Conversation.deleteOne({ _id: conversation._id });
    }

    canonical.messageIds.push(...conversation.messages);
    await Conversation.updateOne(
      { _id: canonical._id },
      {
        $set: { pairKey },
        $addToSet: { messages: { $each: canonical.messageIds } },
      }
    );
    if (canonical.messageIds.length) {
      await Message.updateMany(
        { _id: { $in: canonical.messageIds } },
        { $set: { conversationId: canonical._id } }
      );
      const latestMessage = await Message.findOne({ _id: { $in: canonical.messageIds } })
        .sort({ createdAt: -1 })
        .select("message createdAt")
        .lean();
      if (latestMessage) {
        await Conversation.updateOne(
          { _id: canonical._id },
          { $set: { lastMessage: latestMessage.message, updatedAt: latestMessage.createdAt } }
        );
      }
    }
  }

  const userIndexes = await User.collection.indexes();
  const obsoleteUsernameIndexes = userIndexes.filter((index) =>
    index.key.username === 1 && (!index.unique || !index.sparse)
  );
  for (const index of obsoleteUsernameIndexes) {
    await User.collection.dropIndex(index.name);
  }
  await User.collection.createIndex({ username: 1 }, { unique: true, sparse: true });
  await Friendship.collection.createIndex({ pairKey: 1 }, { unique: true });
  await Friendship.collection.createIndex({ recipient: 1, status: 1 });
  await Friendship.collection.createIndex({ requester: 1, status: 1 });
  await Conversation.collection.createIndex({ pairKey: 1 }, { unique: true, sparse: true });
  await Conversation.collection.createIndex({ participants: 1, updatedAt: -1 });
  await Message.collection.createIndex({ conversationId: 1, createdAt: 1 });

  console.log(`Migrated ${users.length} users and ${canonicalConversations.size} conversations.`);
};

migrateUsernames()
  .catch((error) => {
    console.error("Username migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });