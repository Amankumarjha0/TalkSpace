import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Friendship from "../models/friendship.model.js";
import User from "../models/user.model.js";
import { ensureConversationForFriends } from "../services/friendship.service.js";
import { getPairKey } from "../utils/pairKey.js";
import { io } from "../socket/socket.js";

const userRoom = (userId) => `user:${userId}`;
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getFriendPreview = (user) => ({
  _id: user._id,
  username: user.username,
  fullName: user.fullName,
  profilePic: user.profilePic,
  authProvider: user.authProvider,
});

const broadcastFriendPresence = (firstUserId, secondUserId, online) => {
  const firstId = String(firstUserId);
  const secondId = String(secondUserId);
  io.to(userRoom(firstId)).emit("presence", { userId: secondId, online });
  io.to(userRoom(secondId)).emit("presence", { userId: firstId, online });
};

const acceptPending = async (friendship) => {
  friendship.status = "accepted";
  friendship.blockedBy = undefined;
  await friendship.save();
  await ensureConversationForFriends(friendship.requester, friendship.recipient);
  const requesterOnline = Boolean(io.sockets.adapter.rooms.get(userRoom(friendship.requester))?.size);
  const recipientOnline = Boolean(io.sockets.adapter.rooms.get(userRoom(friendship.recipient))?.size);
  io.to(userRoom(friendship.requester)).emit("presence", { userId: String(friendship.recipient), online: recipientOnline });
  io.to(userRoom(friendship.recipient)).emit("presence", { userId: String(friendship.requester), online: requesterOnline });

  const recipient = await User.findById(friendship.recipient).select("username fullName profilePic authProvider").lean();
  io.to(userRoom(friendship.requester)).emit("friendRequestAccepted", {
    user: getFriendPreview(recipient),
  });
  return friendship;
};

export const listIncomingRequests = asyncHandler(async (req, res) => {
  const requests = await Friendship.find({ recipient: req.user._id, status: "pending" })
    .sort({ createdAt: -1 })
    .populate("requester", "username fullName profilePic authProvider")
    .lean();

  res.status(200).json(requests);
});

export const listSentRequests = asyncHandler(async (req, res) => {
  const requests = await Friendship.find({ requester: req.user._id, status: "pending" })
    .sort({ createdAt: -1 })
    .populate("recipient", "username fullName profilePic authProvider")
    .lean();

  res.status(200).json(requests);
});

export const sendFriendRequest = asyncHandler(async (req, res) => {
  const recipientId = req.params.userId;
  if (!isValidId(recipientId) || String(req.user._id) === recipientId) {
    return res.status(400).json({ error: "Invalid user" });
  }
  const recipient = await User.findById(recipientId).select("username fullName profilePic");
  if (!recipient) return res.status(404).json({ error: "User not found" });

  const pairKey = getPairKey(req.user._id, recipientId);
  let friendship = await Friendship.findOne({ pairKey });
  if (friendship?.status === "blocked") {
    return res.status(403).json({ error: "This user is unavailable" });
  }
  if (friendship?.status === "accepted") {
    return res.status(200).json({ status: "accepted" });
  }
  if (friendship?.status === "pending") {
    if (String(friendship.requester) === String(req.user._id)) {
      return res.status(409).json({ error: "Request already sent" });
    }

    friendship = await acceptPending(friendship);
    return res.status(200).json({ status: "accepted", friendship });
  }

  try {
    if (friendship) {
      friendship.requester = req.user._id;
      friendship.recipient = recipientId;
      friendship.status = "pending";
      friendship.blockedBy = undefined;
      await friendship.save();
    } else {
      friendship = await Friendship.create({
        requester: req.user._id,
        recipient: recipientId,
        pairKey,
        status: "pending",
      });
    }
  } catch (error) {
    if (error.code !== 11000) throw error;
    friendship = await Friendship.findOne({ pairKey });
    if (friendship?.status === "pending" && String(friendship.requester) !== String(req.user._id)) {
      friendship = await acceptPending(friendship);
      return res.status(200).json({ status: "accepted", friendship });
    }
    if (friendship?.status === "accepted") return res.status(200).json({ status: "accepted" });
    return res.status(409).json({ error: "Request already sent" });
  }

  io.to(userRoom(recipientId)).emit("friendRequest", {
    _id: friendship._id,
    requester: getFriendPreview(await User.findById(req.user._id).select("username fullName profilePic").lean()),
    createdAt: friendship.createdAt,
  });
  res.status(201).json({ status: "pending" });
});

export const cancelFriendRequest = asyncHandler(async (req, res) => {
  const targetId = req.params.userId;
  if (!isValidId(targetId)) return res.status(400).json({ error: "Invalid user" });

  const result = await Friendship.deleteOne({
    pairKey: getPairKey(req.user._id, targetId),
    requester: req.user._id,
    status: "pending",
  });
  if (!result.deletedCount) return res.status(404).json({ error: "Pending request not found" });
  res.status(200).json({ status: "none" });
});

export const acceptFriendRequest = asyncHandler(async (req, res) => {
  const requesterId = req.params.userId;
  if (!isValidId(requesterId)) return res.status(400).json({ error: "Invalid user" });

  const friendship = await Friendship.findOne({
    pairKey: getPairKey(req.user._id, requesterId),
    requester: requesterId,
    recipient: req.user._id,
    status: "pending",
  });
  if (!friendship) return res.status(404).json({ error: "Incoming request not found" });

  const accepted = await acceptPending(friendship);
  const acceptingUser = await User.findById(req.user._id).select("username fullName profilePic").lean();
  res.status(200).json({ status: "accepted", friendship: accepted, user: getFriendPreview(acceptingUser) });
});

export const declineFriendRequest = asyncHandler(async (req, res) => {
  const requesterId = req.params.userId;
  if (!isValidId(requesterId)) return res.status(400).json({ error: "Invalid user" });

  const result = await Friendship.updateOne(
    {
      pairKey: getPairKey(req.user._id, requesterId),
      requester: requesterId,
      recipient: req.user._id,
      status: "pending",
    },
    { $set: { status: "declined" } }
  );
  if (!result.modifiedCount) return res.status(404).json({ error: "Incoming request not found" });
  res.status(200).json({ status: "declined" });
});

export const unfriend = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;
  if (!isValidId(otherUserId)) return res.status(400).json({ error: "Invalid user" });

  const result = await Friendship.updateOne(
    { pairKey: getPairKey(req.user._id, otherUserId), status: "accepted" },
    { $set: { status: "declined" } }
  );
  if (!result.modifiedCount) return res.status(404).json({ error: "Friendship not found" });
  broadcastFriendPresence(req.user._id, otherUserId, false);
  res.status(200).json({ status: "none" });
});

export const blockUser = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;
  if (!isValidId(otherUserId) || String(req.user._id) === otherUserId) {
    return res.status(400).json({ error: "Invalid user" });
  }
  if (!(await User.exists({ _id: otherUserId }))) {
    return res.status(404).json({ error: "User not found" });
  }

  const pairKey = getPairKey(req.user._id, otherUserId);
  const existing = await Friendship.findOne({ pairKey });
  if (existing?.status === "blocked" && String(existing.blockedBy) !== String(req.user._id)) {
    return res.status(403).json({ error: "This user is unavailable" });
  }
  if (!existing) {
    await Friendship.create({
      requester: req.user._id,
      recipient: otherUserId,
      pairKey,
      status: "blocked",
      blockedBy: req.user._id,
    });
  } else {
    existing.status = "blocked";
    existing.blockedBy = req.user._id;
    await existing.save();
  }
  broadcastFriendPresence(req.user._id, otherUserId, false);
  res.status(200).json({ status: "blocked" });
});

export const unblockUser = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;
  if (!isValidId(otherUserId)) return res.status(400).json({ error: "Invalid user" });

  const result = await Friendship.deleteOne({
    pairKey: getPairKey(req.user._id, otherUserId),
    status: "blocked",
    blockedBy: req.user._id,
  });
  if (!result.deletedCount) return res.status(404).json({ error: "Block not found" });
  res.status(200).json({ status: "none" });
});