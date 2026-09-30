import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Friendship from "../models/friendship.model.js";
import Message from "../models/message.model.js";
import { createMessageForFriends } from "../services/message.service.js";
import { ensureConversationForFriends } from "../services/friendship.service.js";
import cloudinary, { configureCloudinary } from "../config/cloudinary.js";
import { io } from "../socket/socket.js";
import { getPairKey } from "../utils/pairKey.js";
import { getMessagePreview } from "../utils/messagePreview.js";
import { getAttachmentContentDisposition } from "../utils/contentDisposition.js";

const userRoom = (userId) => `user:${userId}`;
const MAX_IMAGE_SIZE = 1.5 * 1024 * 1024;

const uploadToCloudinary = (file, originalName) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: "talkspace/messages",
      resource_type: "auto",
      filename_override: originalName,
    },
    (error, result) => error ? reject(error) : resolve(result)
  );
  stream.end(file.buffer);
});

const destroyCloudinaryAsset = (attachment) => new Promise((resolve, reject) => {
  cloudinary.uploader.destroy(
    attachment.publicId,
    { resource_type: attachment.resourceType, invalidate: true },
    (error, result) => error ? reject(error) : resolve(result)
  );
});

const removeUploadedAssets = async (attachments) => {
  await Promise.allSettled(attachments.map(destroyCloudinaryAsset));
};

const refreshConversationPreview = async (conversationId, fallbackDate) => {
  const latestMessage = await Message.findOne({
    conversationId,
    deletedForEveryone: { $ne: true },
  }).sort({ createdAt: -1 }).lean();

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: {
        lastMessage: getMessagePreview(latestMessage),
        updatedAt: latestMessage?.createdAt || fallbackDate,
      },
    }
  );
};

export const sendMessage = asyncHandler(async (req, res) => {
  const receiverId = req.params.id;
  const senderId = req.user._id;
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  const files = req.files || [];

  if (!mongoose.Types.ObjectId.isValid(receiverId) || String(senderId) === receiverId) {
    return res.status(400).json({ error: "Invalid recipient" });
  }
  if (message.length > 5000) {
    return res.status(400).json({ error: "Message must be 5000 characters or fewer" });
  }
  if (!message && !files.length) return res.status(400).json({ error: "Add a message or attachment" });
  const acceptedFriendship = await Friendship.exists({
    pairKey: getPairKey(senderId, receiverId),
    status: "accepted",
  });
  if (!acceptedFriendship) {
    return res.status(403).json({ error: "You can only message accepted friends" });
  }
  if (files.some((file) => file.mimetype?.startsWith("image/") && file.size > MAX_IMAGE_SIZE)) {
    return res.status(400).json({ error: "Each image must be 1.5 MB or smaller" });
  }

  const cloudinaryConfigured = [
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET,
  ].every(Boolean);
  if (files.length && !cloudinaryConfigured) {
    return res.status(503).json({ error: "Cloudinary is not configured on the server" });
  }

  const uploadedAttachments = [];
  if (files.length) {
    configureCloudinary();
    try {
      for (const file of files) {
        const originalName = file.originalname.replace(/[\\/\0\r\n]/g, "").slice(0, 255) || "attachment";
        const result = await uploadToCloudinary(file, originalName);
        const isImage = file.mimetype?.startsWith("image/") && result.resource_type === "image";
        const attachment = {
          url: result.secure_url,
          previewUrl: isImage ? cloudinary.url(result.public_id, {
            secure: true,
            resource_type: result.resource_type,
            type: result.type || "upload",
            transformation: [
              { width: 320, height: 240, crop: "limit" },
              { effect: "blur:1000" },
              { quality: "auto:low" },
            ],
          }) : "",
          openUrl: !isImage ? cloudinary.url(result.public_id, {
            secure: true,
            resource_type: result.resource_type,
            type: result.type || "upload",
            flags: "inline",
          }) : "",
          downloadUrl: cloudinary.url(result.public_id, {
            secure: true,
            resource_type: result.resource_type,
            type: result.type || "upload",
            flags: "attachment",
          }),
          publicId: result.public_id,
          resourceType: result.resource_type,
          originalName,
          mimeType: file.mimetype || "application/octet-stream",
          size: file.size,
        };
        uploadedAttachments.push(attachment);

        if (result.resource_type === "image" && file.size > MAX_IMAGE_SIZE) {
          await removeUploadedAssets(uploadedAttachments);
          return res.status(400).json({ error: "Each image must be 1.5 MB or smaller" });
        }
      }
    } catch (error) {
      await removeUploadedAssets(uploadedAttachments);
      console.error("Message attachment upload failed:", error.message);
      return res.status(502).json({ error: "Could not upload one or more attachments" });
    }
  }

  let newMessage;
  try {
    newMessage = await createMessageForFriends(senderId, receiverId, message, uploadedAttachments);
  } catch (error) {
    await removeUploadedAssets(uploadedAttachments);
    console.error("Message save failed:", error.message);
    return res.status(500).json({ error: "Message could not be saved" });
  }
  if (!newMessage) {
    await removeUploadedAssets(uploadedAttachments);
    return res.status(403).json({ error: "You can only message accepted friends" });
  }

  io.to(userRoom(receiverId)).to(userRoom(senderId)).emit("newMessage", newMessage);
  res.status(201).json(newMessage);
});

export const getMessage = asyncHandler(async (req, res) => {
  const otherUserId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(otherUserId) || String(req.user._id) === otherUserId) {
    return res.status(400).json({ error: "Invalid user" });
  }

  const conversation = await ensureConversationForFriends(req.user._id, otherUserId);
  if (!conversation) return res.status(403).json({ error: "You can only view chats with accepted friends" });

  const messages = await Message.find({
    conversationId: conversation._id,
    deletedFor: { $ne: req.user._id },
  })
    .sort({ createdAt: 1 })
    .lean();
  res.status(200).json(messages);
});

export const downloadMessageAttachment = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id) || !/^\d+$/.test(req.params.attachmentIndex)) {
    return res.status(400).json({ error: "Invalid attachment" });
  }

  const message = await Message.findById(req.params.id)
    .select("senderId receiverId attachments deletedFor deletedForEveryone")
    .lean();
  if (!message || message.deletedForEveryone || message.deletedFor?.some((id) => String(id) === String(req.user._id))) {
    return res.status(404).json({ error: "Attachment not found" });
  }

  const userId = String(req.user._id);
  if (String(message.senderId) !== userId && String(message.receiverId) !== userId) {
    return res.status(403).json({ error: "You cannot download this attachment" });
  }

  const attachment = message.attachments[Number(req.params.attachmentIndex)];
  if (!attachment) return res.status(404).json({ error: "Attachment not found" });

  let sourceUrl;
  try {
    sourceUrl = new URL(attachment.url);
  } catch {
    return res.status(502).json({ error: "Attachment URL is invalid" });
  }
  if (sourceUrl.protocol !== "https:" || sourceUrl.hostname !== "res.cloudinary.com") {
    return res.status(502).json({ error: "Attachment source is invalid" });
  }

  let cloudinaryResponse;
  try {
    cloudinaryResponse = await fetch(sourceUrl);
  } catch {
    return res.status(502).json({ error: "Could not retrieve attachment" });
  }
  if (!cloudinaryResponse.ok) {
    return res.status(502).json({ error: "Could not retrieve attachment" });
  }

  const fileBuffer = Buffer.from(await cloudinaryResponse.arrayBuffer());
  if (attachment.mimeType?.startsWith("image/")) {
    await Message.updateOne(
      { _id: message._id, "attachments.publicId": attachment.publicId },
      { $addToSet: { "attachments.$.revealedFor": req.user._id } }
    );
  }

  res.set({
    "Content-Type": attachment.mimeType || "application/octet-stream",
    "Content-Disposition": getAttachmentContentDisposition(attachment.originalName),
    "Content-Length": fileBuffer.length,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  return res.status(200).send(fileBuffer);
});

export const deleteMessageForMe = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid message" });
  }

  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ error: "Message not found" });

  const userId = String(req.user._id);
  if (![String(message.senderId), String(message.receiverId)].includes(userId)) {
    return res.status(403).json({ error: "You cannot delete this message" });
  }

  message.deletedFor.addToSet(req.user._id);
  await message.save();

  const event = {
    messageId: String(message._id),
    conversationId: String(message.conversationId),
  };
  io.to(userRoom(req.user._id)).emit("messageDeletedForMe", event);
  res.status(200).json(event);
});

export const deleteMessageForEveryone = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid message" });
  }

  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ error: "Message not found" });
  if (String(message.senderId) !== String(req.user._id)) {
    return res.status(403).json({ error: "Only the sender can delete for everyone" });
  }

  if (!message.deletedForEveryone) {
    const attachmentAssets = message.attachments;
    message.message = "";
    message.attachments = [];
    message.deletedForEveryone = true;
    message.deletedAt = new Date();
    await message.save();
    await refreshConversationPreview(message.conversationId, message.createdAt);

    if (attachmentAssets.length && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      configureCloudinary();
      const results = await Promise.allSettled(attachmentAssets.map(destroyCloudinaryAsset));
      results.filter((result) => result.status === "rejected").forEach((result) => {
        console.error("Could not remove deleted message attachment:", result.reason?.message);
      });
    }
  }

  const event = {
    messageId: String(message._id),
    conversationId: String(message.conversationId),
    deletedForEveryone: true,
  };
  io.to(userRoom(message.senderId)).to(userRoom(message.receiverId)).emit("messageDeleted", event);
  res.status(200).json(event);
});