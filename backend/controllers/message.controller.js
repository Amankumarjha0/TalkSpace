import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { createMessageForFriends } from "../services/message.service.js";
import { ensureConversationForFriends } from "../services/friendship.service.js";
import { io } from "../socket/socket.js";

const userRoom = (userId) => `user:${userId}`;

export const sendMessage = asyncHandler(async (req, res) => {
  const receiverId = req.params.id;
  const senderId = req.user._id;
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

  if (!mongoose.Types.ObjectId.isValid(receiverId) || String(senderId) === receiverId) {
    return res.status(400).json({ error: "Invalid recipient" });
  }
  if (!message || message.length > 5000) {
    return res.status(400).json({ error: "Message must be 1-5000 characters" });
  }

  const newMessage = await createMessageForFriends(senderId, receiverId, message);
  if (!newMessage) return res.status(403).json({ error: "You can only message accepted friends" });

  io.to(userRoom(receiverId)).emit("newMessage", newMessage);
  res.status(201).json(newMessage);
});

export const getMessage = asyncHandler(async (req, res) => {
  const otherUserId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(otherUserId) || String(req.user._id) === otherUserId) {
    return res.status(400).json({ error: "Invalid user" });
  }

  const conversation = await ensureConversationForFriends(req.user._id, otherUserId);
  if (!conversation) return res.status(403).json({ error: "You can only view chats with accepted friends" });

  const messages = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: 1 })
    .lean();
  res.status(200).json(messages);
});