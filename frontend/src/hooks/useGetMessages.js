import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import useConversation from "../zustand/useConversation";
import { useSocketContext } from "../context/SocketContext.jsx";

import { getUserFriendlyError } from "../utils/getUserFriendlyError";

const useGetMessages = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessages, selectedConversation } = useConversation();
  const { socket } = useSocketContext();

  useEffect(() => {
    const getMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages/${selectedConversation?._id}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (data?.error) throw new Error(data.error);

        setMessages(data);

        // Mark all messages from selectedConversation as seen
        if (selectedConversation?._id) {
          fetch(`/api/messages/mark-seen/${selectedConversation._id}`, {
            method: "PUT",
            credentials: "include",
          }).catch(() => {});
          if (socket) {
            socket.emit("markAsSeen", { senderId: selectedConversation._id });
          }
        }
      } catch (error) {
        const userMsg = getUserFriendlyError(error, "Could not load messages. Please try again.");
        if (userMsg) toast.error(userMsg);
      } finally {
        setLoading(false);
      }
    };

    if (selectedConversation?._id) getMessages();
  }, [selectedConversation?._id, setMessages, socket]);

  return { loading, messages };
};
export default useGetMessages;
