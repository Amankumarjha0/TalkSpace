import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Friendship from "../models/friendship.model.js";
import { createMessageForFriends } from "../services/message.service.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://talkspace.vercel.app",
  "https://*.vercel.app",
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const isVercelPreview = /https:\/\/.*\.vercel\.app$/i.test(origin);
      const isRender = /https:\/\/.*\.onrender\.com$/i.test(origin);

      if (isVercelPreview || isRender) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

import Message from "../models/message.model.js";

const userSocketMap = new Map();
const userRoom = (userId) => `user:${userId}`;

export const isUserOnline = (userId) => userSocketMap.has(String(userId)) && userSocketMap.get(String(userId))?.size > 0;

const getAcceptedFriendIds = async (userId) => {
  const friendships = await Friendship.find({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  }).select("requester recipient").lean();

  return friendships.map((friendship) =>
    String(friendship.requester) === String(userId) ? String(friendship.recipient) : String(friendship.requester)
  );
};

const sendPresenceToFriends = async (userId, online) => {
  const friendIds = await getAcceptedFriendIds(userId);
  friendIds.forEach((friendId) => {
    io.to(userRoom(friendId)).emit("presence", { userId: String(userId), online });
  });
};

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.cookie
        ?.split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("jwt="))
        ?.split("=")[1];

    const fallbackUserId = socket.handshake.auth?.userId;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (mongoose.Types.ObjectId.isValid(decoded.userId)) {
          socket.data.userId = String(decoded.userId);
          return next();
        }
      } catch (_) {
        // Fall through to fallbackUserId if token verification fails
      }
    }

    if (fallbackUserId && mongoose.Types.ObjectId.isValid(fallbackUserId)) {
      socket.data.userId = String(fallbackUserId);
      return next();
    }

    return next(new Error("Unauthorized"));
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", async (socket) => {
  const userId = String(socket.data.userId);
  const sockets = userSocketMap.get(userId) || new Set();
  const wasOffline = sockets.size === 0;
  sockets.add(socket.id);
  userSocketMap.set(userId, sockets);
  socket.join(userRoom(userId));

  // Send all currently online user IDs to the connected client
  const allOnlineUsers = Array.from(userSocketMap.keys());
  io.to(userRoom(userId)).emit("getOnlineUsers", allOnlineUsers);

  // Broadcast presence update to all connected clients
  if (wasOffline) {
    io.emit("presence", { userId, online: true });
  }

  // Update pending 'sent' messages to 'delivered' now that receiver is online
  try {
    const pendingMessages = await Message.find({ receiverId: userId, status: "sent" }).select("senderId _id").lean();
    if (pendingMessages.length > 0) {
      await Message.updateMany({ receiverId: userId, status: "sent" }, { $set: { status: "delivered" } });
      const senderIds = [...new Set(pendingMessages.map((m) => String(m.senderId)))];
      senderIds.forEach((senderId) => {
        io.to(userRoom(senderId)).emit("messageStatusUpdated", {
          receiverId: userId,
          status: "delivered",
        });
      });
    }
  } catch (err) {
    console.error("Error updating delivered status on connection:", err.message);
  }

  socket.on("sendMessage", async (payload, acknowledge = () => {}) => {
    const receiverId = String(payload?.receiverId || "");
    const message = typeof payload?.message === "string" ? payload.message.trim() : "";
    if (!mongoose.Types.ObjectId.isValid(receiverId) || receiverId === userId) {
      return acknowledge({ error: "Invalid recipient" });
    }
    if (!message || message.length > 5000) {
      return acknowledge({ error: "Message must be 1-5000 characters" });
    }

    try {
      const newMessage = await createMessageForFriends(userId, receiverId, message);
      if (!newMessage) return acknowledge({ error: "You can only message accepted friends" });
      io.to(userRoom(receiverId)).emit("newMessage", newMessage);
      acknowledge({ message: newMessage });
    } catch (error) {
      console.error("Socket message failed:", error.message);
      acknowledge({ error: "Message could not be sent" });
    }
  });

  socket.on("markAsSeen", async ({ senderId, conversationId }, acknowledge = () => {}) => {
    if (!senderId || !mongoose.Types.ObjectId.isValid(senderId)) return;
    try {
      const query = { senderId, receiverId: userId, status: { $ne: "seen" } };
      if (conversationId) query.conversationId = conversationId;

      const result = await Message.updateMany(query, { $set: { status: "seen" } });
      if (result.modifiedCount > 0) {
        const payload = { senderId: userId, receiverId: senderId, conversationId, status: "seen" };
        io.to(userRoom(senderId)).emit("messagesSeen", payload);
        io.to(userRoom(userId)).emit("messagesSeen", payload);
      }
      acknowledge({ success: true });
    } catch (err) {
      console.error("Error marking messages as seen:", err.message);
    }
  });

  socket.on("disconnect", async () => {
    const currentSockets = userSocketMap.get(userId);
    currentSockets?.delete(socket.id);
    if (currentSockets?.size) return;
    userSocketMap.delete(userId);
    io.emit("presence", { userId, online: false });
  });
});

export const getReceiverSocketId = (receiverId) => userSocketMap.get(String(receiverId))?.values().next().value;
export { app, io, server };
