import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

import { getUserFriendlyError } from "../utils/getUserFriendlyError";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { setMessages, selectedConversation } = useConversation();

  const sendMessage = async (message, attachments = []) => {
    if (!selectedConversation?._id) return false;

    setLoading(true);
    try {
      const body = new FormData();
      body.append("message", message);
      attachments.forEach((file) => body.append("attachments", file));

      const res = await fetch(`/api/messages/send/${selectedConversation._id}`, {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Message could not be sent");

      setMessages((prevMessages) => prevMessages.some(
        (messageItem) => String(messageItem._id) === String(data._id)
      ) ? prevMessages : [...prevMessages, data]);
      return true;
    } catch (error) {
      const userMessage = getUserFriendlyError(error, "Message could not be sent. Please try again.");
      if (userMessage) toast.error(userMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
};
export default useSendMessage;
