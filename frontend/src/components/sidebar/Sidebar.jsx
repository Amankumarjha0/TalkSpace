import { useCallback, useState } from "react";
import Conversations from "./Conversations.jsx";
import FriendRequests from "./FriendRequests.jsx";
import LogoutBtn from "./LogoutBtn.jsx";
import SearchInput from "./SearchInput.jsx";
import { Link } from "react-router-dom";
import { AiOutlineUser } from "react-icons/ai";
import useConversation from "../../zustand/useConversation";

const Sidebar = () => {
  const { selectedConversation } = useConversation();
  const [activeTab, setActiveTab] = useState("chats");
  const [refreshKey, setRefreshKey] = useState(0);
  const [requestRefreshKey, setRequestRefreshKey] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const refreshSocialLists = useCallback(() => {
    setRefreshKey((key) => key + 1);
    setRequestRefreshKey((key) => key + 1);
  }, []);

  return (
    <div
      className={`${selectedConversation ? "hidden" : "flex"} h-full min-h-0 w-full flex-col border-r border-[#FFF]/20 bg-[#0a0a0a] px-4 py-2 md:ml-[74px] md:flex md:w-[300px] lg:w-[380px] 2xl:w-[450px]`}
    >
      <SearchInput onFriendshipsChanged={refreshSocialLists} />
      <div className="mb-1 flex shrink-0 border-b border-white/10" role="tablist" aria-label="People and chats">
        <button role="tab" aria-selected={activeTab === "chats"} onClick={() => setActiveTab("chats")} className={`flex-1 border-b-2 px-3 py-2 text-sm ${activeTab === "chats" ? "border-pink-400 text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
          Chats
        </button>
        <button role="tab" aria-selected={activeTab === "requests"} onClick={() => setActiveTab("requests")} className={`flex-1 border-b-2 px-3 py-2 text-sm ${activeTab === "requests" ? "border-pink-400 text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
          Requests{requestCount > 0 && <span className="ml-2 rounded-full bg-pink-500 px-1.5 py-0.5 text-xs text-white">{requestCount}</span>}
        </button>
      </div>
      <div className={activeTab === "chats" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
        <Conversations refreshKey={refreshKey} />
      </div>
      <div className={activeTab === "requests" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
        <FriendRequests refreshKey={requestRefreshKey} onChanged={refreshSocialLists} onCountChange={setRequestCount} />
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-white/10 pt-3 md:hidden">
        <Link to="/profile" className="inline-flex items-center gap-2 py-2 text-sm text-gray-200">
          <AiOutlineUser size={22} aria-hidden="true" />
          <span>Profile</span>
        </Link>
        <LogoutBtn />
      </div>
    </div>
  );
};
export default Sidebar;
