import { useEffect, useRef } from "react";
import useGetMessages from "../../hooks/useGetMessages.js";
import Message from "./Message.jsx";
import MessageSkeleton from "../shimmerUi/MessageSkeleton.jsx";
import useListenMessages from "../../hooks/useListenMessages.js";

const Messages = () => {
  const { loading, messages } = useGetMessages();
  // console.log(messages);
  useListenMessages();
  const lastMessageRef = useRef();
  const containerRef = useRef();

  // To scroll down to new messages automatically
  useEffect(() => {
    const scrollToBottom = () => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      } else if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    };

    const timer = setTimeout(scrollToBottom, 50);
    const frame = requestAnimationFrame(scrollToBottom);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [messages]);

  return (
    <div ref={containerRef} className="px-4 flex-1 min-h-0 overflow-y-auto overscroll-contain">
      {loading &&
        [...Array(3)].map((_, index) => <MessageSkeleton key={index} />)}

      {!loading && messages.length === 0 && (
        <p className="flex justify-center items-center h-full text-center text-gray-400">
          Send a message to start the conversation
        </p>
      )}

      {!loading &&
        messages?.length > 0 &&
        messages.map((message) => (
          <div key={message._id} ref={lastMessageRef}>
            <Message message={message} />
          </div>
        ))}
    </div>
  );
};
export default Messages;
