import { useEffect, useRef } from "react";

import { useSocketContext } from "../context/SocketContext.jsx";
import useConversation from "../zustand/useConversation.js";
import { useAuthContext } from "../context/AuthContext";

import notificationSound from "../assets/notification.mp3";

const useListenMessages = () => {
  const { socket } = useSocketContext();
  const { selectedConversation, setMessages } = useConversation();
  const { authUser } = useAuthContext();

  const selectedConversationRef = useRef(selectedConversation);
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (!newMessage) return;
      const currentSelected = selectedConversationRef.current;
      if (!currentSelected) return;

      const senderId = String(newMessage.senderId?._id || newMessage.senderId || "");
      const receiverId = String(newMessage.receiverId?._id || newMessage.receiverId || "");
      const conversationId = String(newMessage.conversationId?._id || newMessage.conversationId || "");

      const currentUserId = String(currentSelected._id || "");
      const currentConvId = String(currentSelected.conversationId || "");

      const isForSelectedConversation =
        senderId === currentUserId ||
        receiverId === currentUserId ||
        (currentConvId && conversationId === currentConvId);

      if (!isForSelectedConversation) return;

      setMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (msg) => String(msg._id) === String(newMessage._id)
        );

        if (alreadyExists) return prevMessages;

        return [...prevMessages, { ...newMessage, shouldShake: true }];
      });

      // Play notification sound if message is received from recipient
      if (String(newMessage.senderId) !== String(authUser?._id)) {
        try {
          const sound = new Audio(notificationSound);
          sound.volume = 0.8;
          const playPromise = sound.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("Audio autoplay blocked by browser policy until first user touch/click:", err);
            });
          }
        } catch (_) {
          // Fallback if Audio constructor fails
        }
      }
    };

    const handleDeleteForMe = ({ messageId }) => {
      setMessages((prevMessages) => prevMessages.filter((message) => String(message._id) !== String(messageId)));
    };

    const handleDeleteForEveryone = ({ messageId }) => {
      setMessages((prevMessages) => prevMessages.map((message) => String(message._id) === String(messageId)
        ? { ...message, message: "", attachments: [], deletedForEveryone: true }
        : message));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeletedForMe", handleDeleteForMe);
    socket.on("messageDeleted", handleDeleteForEveryone);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeletedForMe", handleDeleteForMe);
      socket.off("messageDeleted", handleDeleteForEveryone);
    };
  }, [socket, authUser?._id, setMessages]);
};

export default useListenMessages;
