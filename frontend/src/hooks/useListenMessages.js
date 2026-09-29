import { useEffect } from "react";

import { useSocketContext } from "../context/SocketContext.jsx";
import useConversation from "../zustand/useConversation.js";
import { useAuthContext } from "../context/AuthContext";

import notificationSound from "../assets/notification.mp3";

const useListenMessages = () => {
  const { socket } = useSocketContext();
  const { selectedConversation, setMessages } = useConversation();
  const { authUser } = useAuthContext();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const isForSelectedConversation =
        newMessage.senderId === selectedConversation?._id ||
        newMessage.receiverId === selectedConversation?._id;

      if (!isForSelectedConversation) return;

      setMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (msg) => msg._id === newMessage._id
        );

        if (alreadyExists) return prevMessages;

        return [...prevMessages, { ...newMessage, shouldShake: true }];
      });

      const sound = new Audio(notificationSound);
      sound.play().catch(() => {});
    };

    socket.on("newMessage", handleNewMessage);

    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, selectedConversation?._id, authUser?._id, setMessages]);
};

export default useListenMessages;
