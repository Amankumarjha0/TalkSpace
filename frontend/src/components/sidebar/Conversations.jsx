import PropTypes from "prop-types";
import useGetConversations from "../../hooks/useGetConversations";
import Conversation from "./Conversation";

const Conversations = ({ refreshKey }) => {
  const { loading, loadingMore, conversations, nextCursor, loadMore, error, retry } = useGetConversations(refreshKey);
  const handleScroll = (event) => {
    const element = event.currentTarget;
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 80) loadMore();
  };

  return (
    <div onScroll={handleScroll} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto py-2">
      {!loading && error && (
        <div className="px-2 py-6 text-center">
          <p className="text-sm text-red-300">Could not load chats.</p>
          <button type="button" onClick={retry} className="mt-2 text-sm text-pink-300 hover:text-white">Retry</button>
        </div>
      )}
      {!loading && !error && conversations.length === 0 && (
        <p className="px-2 py-6 text-center text-sm text-gray-400">
          No chats yet. Search a username to get started.
        </p>
      )}
      {conversations.map((conversation) => (
        <Conversation
          key={conversation._id}
          conversation={conversation}
        />
      ))}
      {loading || loadingMore ? (
        <div className="flex h-24 w-full items-center justify-center">
          <span className="loading loading-spinner mx-auto"></span>
        </div>
      ) : null}
      {nextCursor && !loadingMore && (
        <button className="py-2 text-xs text-gray-400 hover:text-white" onClick={loadMore}>
          Load more
        </button>
      )}
    </div>
  );
};

Conversations.propTypes = {
  refreshKey: PropTypes.number,
};

export default Conversations;
