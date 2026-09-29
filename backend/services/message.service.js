import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { ensureConversationForFriends } from "./friendship.service.js";

export const createMessageForFriends = async (senderId, receiverId, text) => {
  const conversation = await ensureConversationForFriends(senderId, receiverId);
  if (!conversation) return null;
  const participantIds = conversation.participants.map(String);
  if (!participantIds.includes(String(senderId)) || !participantIds.includes(String(receiverId))) {
    return null;
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    receiverId,
    message: text,
  });

  await Conversation.updateOne(
    { _id: conversation._id, participants: { $all: [senderId, receiverId] } },
    {
      $push: { messages: message._id },
      $set: { lastMessage: text, updatedAt: message.createdAt },
    }
  );

  return message;
};