import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Friendship from "../models/friendship.model.js";
import Conversation from "../models/conversation.model.js";
import cloudinary, { configureCloudinary } from "../config/cloudinary.js";
import { getPairKey } from "../utils/pairKey.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getUsersForSidebar = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 50);
  const acceptedFriendships = await Friendship.find({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  }).select("requester recipient pairKey").lean();

  if (!acceptedFriendships.length) {
    return res.status(200).json({ conversations: [], nextCursor: null });
  }

  const friendIds = acceptedFriendships.map((friendship) =>
    String(friendship.requester) === String(userId) ? friendship.recipient : friendship.requester
  );
  const acceptedPairKeys = acceptedFriendships.map((friendship) => friendship.pairKey);
  const filter = {
    pairKey: { $in: acceptedPairKeys },
    participants: userId,
  };

  if (req.query.cursor) {
    try {
      const cursor = JSON.parse(Buffer.from(String(req.query.cursor), "base64url").toString());
      if (!mongoose.Types.ObjectId.isValid(cursor.id) || Number.isNaN(Date.parse(cursor.updatedAt))) {
        return res.status(400).json({ error: "Invalid cursor" });
      }
      const cursorDate = new Date(cursor.updatedAt);
      filter.$or = [
        { updatedAt: { $lt: cursorDate } },
        { updatedAt: cursorDate, _id: { $lt: cursor.id } },
      ];
    } catch {
      return res.status(400).json({ error: "Invalid cursor" });
    }
  }

  const conversations = await Conversation.find(filter)
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit + 1)
    .select("pairKey lastMessage updatedAt participants")
    .lean();
  const hasMore = conversations.length > limit;
  const page = conversations.slice(0, limit);
  const users = await User.find({ _id: { $in: friendIds } })
    .select("username fullName profilePic authProvider gender")
    .lean();
  const usersById = new Map(users.map((user) => [String(user._id), user]));
  const results = page.flatMap((conversation) => {
    const otherId = conversation.participants.find((id) => String(id) !== String(userId));
    const otherUser = usersById.get(String(otherId));
    if (!otherUser) return [];
    return [{ ...otherUser, conversationId: conversation._id, lastMessage: conversation.lastMessage, updatedAt: conversation.updatedAt }];
  });
  const lastConversation = page.at(-1);
  const nextCursor = hasMore && lastConversation
    ? Buffer.from(JSON.stringify({ updatedAt: lastConversation.updatedAt, id: lastConversation._id })).toString("base64url")
    : null;

  res.status(200).json({ conversations: results, nextCursor });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
  if (query.length < 2 || query.length > 20) {
    return res.status(400).json({ error: "Search must be 2-20 characters" });
  }

  const blocked = await Friendship.find({
    status: "blocked",
    $or: [{ requester: req.user._id }, { recipient: req.user._id }],
  }).select("requester recipient").lean();
  const blockedIds = blocked.map((friendship) =>
    String(friendship.requester) === String(req.user._id) ? friendship.recipient : friendship.requester
  );

  const exactUser = await User.findOne({
    username: query,
    _id: { $ne: req.user._id, $nin: blockedIds },
  })
    .select("username fullName profilePic authProvider")
    .lean();
  const excludedIds = [...blockedIds, req.user._id, ...(exactUser ? [exactUser._id] : [])];
  const prefixUsers = await User.find({
    username: { $regex: `^${escapeRegex(query)}` },
    _id: { $nin: excludedIds },
  })
    .select("username fullName profilePic authProvider")
    .sort({ username: 1 })
    .limit(exactUser ? 14 : 15)
    .lean();
  const users = exactUser ? [exactUser, ...prefixUsers] : prefixUsers;

  const pairKeys = users.map((user) => getPairKey(req.user._id, user._id));
  const friendships = await Friendship.find({ pairKey: { $in: pairKeys } }).lean();
  const friendshipByPair = new Map(friendships.map((friendship) => [friendship.pairKey, friendship]));

  const results = users.map((user) => {
    const friendship = friendshipByPair.get(getPairKey(req.user._id, user._id));
    let relationshipStatus = "none";
    if (friendship?.status === "accepted") relationshipStatus = "accepted";
    if (friendship?.status === "pending") {
      relationshipStatus = String(friendship.requester) === String(req.user._id) ? "outgoing" : "incoming";
    }
    return {
      _id: user._id,
      username: user.username,
      displayName: user.fullName,
      avatar: user.profilePic,
      authProvider: user.authProvider,
      relationshipStatus,
    };
  });
  results.sort((a, b) => Number(b.username === query) - Number(a.username === query) || a.username.localeCompare(b.username));

  res.status(200).json(results);
});

export const updateProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!fullName?.trim()) {
      return res.status(400).json({ error: "Full name is required" });
    }

    // Handle profile picture upload if a file is attached
    if (req.file) {
      const cloudinaryConfigured = [
        process.env.CLOUDINARY_CLOUD_NAME,
        process.env.CLOUDINARY_API_KEY,
        process.env.CLOUDINARY_API_SECRET,
      ].every(Boolean);

      if (!cloudinaryConfigured) {
        return res.status(400).json({ error: "Cloudinary is not configured on the server" });
      }

      configureCloudinary();

      // Upload buffer to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "talkspace/avatars",
            public_id: `user_${userId}`,
            overwrite: true,
            transformation: [
              { width: 400, height: 400, crop: "fill", gravity: "face" },
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      user.profilePic = uploadResult.secure_url;
    }

    user.fullName = fullName.trim();

    await user.save();

    const updatedUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      username: user.username,
      gender: user.gender,
      profilePic: user.profilePic,
    };

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in updateProfile controller:", error.message);
    res.status(500).json({ error: "Internal server error", message: error.message });
  }
});
