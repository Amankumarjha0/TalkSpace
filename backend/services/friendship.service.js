import Conversation from "../models/conversation.model.js";
import Friendship from "../models/friendship.model.js";
import { getPairKey } from "../utils/pairKey.js";

export const ensureConversationForFriends = async (firstUserId, secondUserId) => {
  const pairKey = getPairKey(firstUserId, secondUserId);
  const friendship = await Friendship.exists({ pairKey, status: "accepted" });
  if (!friendship) return null;

  try {
    const conversation = await Conversation.findOneAndUpdate(
      { pairKey },
      {
        $setOnInsert: {
          pairKey,
          participants: [firstUserId, secondUserId],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const participants = conversation.participants.map(String);
    if (!participants.includes(String(firstUserId)) || !participants.includes(String(secondUserId))) {
      return null;
    }
    return conversation;
  } catch (error) {
    if (error.code === 11000) return Conversation.findOne({ pairKey });
    throw error;
  }
};