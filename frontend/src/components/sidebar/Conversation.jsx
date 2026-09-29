import PropTypes from "prop-types";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import AvatarWithFallback from "../common/AvatarWithFallback";
import "../../index.css";

const Conversation = ({ conversation }) => {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const activeConversation = selectedConversation?._id === conversation._id;

  const { onlineUsers } = useSocketContext();
  const isOnline = onlineUsers.some(
    (userId) => userId === String(conversation?._id)
  );

  return (
    <>
      <div
        className={`flex gap-3 items-center hover:bg-[#212020] rounded p-2 py-2 cursor-pointer mr-4 ${
          activeConversation ? "bg-[#212020] border-l-2 border-pink-500" : ""
        }`}
        onClick={() => setSelectedConversation(conversation)}
      >
        <div className={`avatar ${isOnline ? "online" : "offlineStatus"}`}>
          <div className="w-12 rounded-full">
            <AvatarWithFallback
              src={conversation?.profilePic}
              name={conversation?.fullName}
              authProvider={conversation?.authProvider}
              size="w-12 h-12"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className="truncate font-bold text-gray-200">
              {conversation?.fullName || conversation?.username}
            </p>
            <time className="shrink-0 text-xs text-gray-400">
              {conversation?.updatedAt ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(conversation.updatedAt)) : ""}
            </time>
          </div>
          <p className="truncate text-sm text-gray-400">{conversation?.lastMessage || `@${conversation?.username}`}</p>
        </div>
      </div>
    </>
  );
};

Conversation.propTypes = {
  conversation: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    fullName: PropTypes.string,
    username: PropTypes.string,
    profilePic: PropTypes.string,
    updatedAt: PropTypes.string,
    lastMessage: PropTypes.string,
  }).isRequired,
};

export default Conversation;
