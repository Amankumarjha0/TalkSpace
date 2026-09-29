import { useEffect } from "react";

import MessageInput from "./MessageInput";
import Messages from "./Messages";
import useConversation from "../../zustand/useConversation";
import { useAuthContext } from ".././../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import AvatarWithFallback from "../common/AvatarWithFallback";
import { IoArrowBack } from "react-icons/io5";

const MessageContainer = () => {
  const { selectedConversation, setSelectedConversation } = useConversation();

  const { onlineUsers } = useSocketContext();
  const isOnline = onlineUsers.some(
    (userId) => userId === String(selectedConversation?._id)
  );

  useEffect(() => {
    return () => setSelectedConversation(null);
  }, []);

  return (
    <div
      className={`${selectedConversation ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0a] md:flex`}
    >
      {!selectedConversation ? (
        <NoChatSelected />
      ) : (
        <>
          <div className="mb-2 flex h-14 shrink-0 items-center gap-2 bg-black px-3 py-2 sm:px-4">
            <button
              type="button"
              aria-label="Back to chats"
              title="Back to chats"
              onClick={() => setSelectedConversation(null)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10 md:hidden"
            >
              <IoArrowBack size={22} />
            </button>
            <div className="w-10 rounded-full">
              <AvatarWithFallback
                src={selectedConversation?.profilePic}
                name={selectedConversation?.fullName}
                authProvider={selectedConversation?.authProvider}
                size="w-10 h-10"
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-white font-bold">
                {selectedConversation?.fullName}
              </span>
              {isOnline ? (
                <span className="text-gray-300 italic">online</span>
              ) : (
                <span className="text-gray-300 italic">offline</span>
              )}
            </div>
          </div>

          <Messages />
          <MessageInput />
        </>
      )}
    </div>
  );
};

export default MessageContainer;

import { TiMessages } from "react-icons/ti";
import { FaLock } from "react-icons/fa";
import { RiSecurePaymentLine } from "react-icons/ri";

const NoChatSelected = () => {
  const { authUser } = useAuthContext();

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="px-4 sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-3 text-center">
        <img src="/nav_logo.webp" alt="TalkSpace Logo" className="w-44 h-auto object-contain mb-2" />
        <div>
          <p className="text-gray-400">
            Welcome 👋 <span className="text-white">{authUser?.fullName} ❄</span>
          </p>
          <p className="text-gray-400 text-sm mt-1">Select a chat to start messaging</p>
        </div>
        <div className="text-left">
          <div className="flex items-center text-gray-400 gap-2">
            <FaLock className="text-xl" />
            <span>Your Chats are Secure</span>
          </div>
          <div className="flex items-center text-gray-400 gap-2">
            <RiSecurePaymentLine className="text-xl" />
            <span>Safe and Reliable Messaging</span>
          </div>
        </div>
      </div>
    </div>
  );
};
