import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { IoSearchSharp, IoCloseSharp } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import AvatarWithFallback from "../common/AvatarWithFallback";

import { getUserFriendlyError } from "../../utils/getUserFriendlyError";

const SearchInput = ({ onFriendshipsChanged }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [busyId, setBusyId] = useState("");
  const { setSelectedConversation } = useConversation();

  useEffect(() => {
    const query = search.trim().toLowerCase();
    if (query.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    setSearching(true);
    setSearchError("");
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Search failed");
        setResults(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          setResults([]);
          const userMsg = getUserFriendlyError(error, "Could not perform search. Please try again.");
          setSearchError(userMsg);
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search]);

  const runAction = async (result, action) => {
    setBusyId(result._id);
    try {
      if (action === "message") {
        setSelectedConversation({
          _id: result._id,
          username: result.username,
          fullName: result.displayName,
          profilePic: result.avatar,
        });
        setSearch("");
        setResults([]);
        return;
      }

      if (action === "unfriend" || action === "block") {
        const response = await fetch(`/api/friendships/${result._id}${action === "unfriend" ? "/friend" : "/block"}`, {
          method: action === "unfriend" ? "DELETE" : "POST",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || `Could not ${action} user`);
        setResults((current) => current.filter((item) => item._id !== result._id));
        onFriendshipsChanged?.();
        toast.success(action === "unfriend" ? "Friend removed" : "User blocked");
        return;
      }

      const method = action === "cancel" ? "DELETE" : "POST";
      const path = action === "accept" || action === "decline" ? `/${action}` : "";
      const response = await fetch(`/api/friendships/${result._id}${path}`, {
        method,
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not update friend request");

      const relationshipStatus = action === "accept" || data.status === "accepted"
        ? "accepted"
        : action === "decline" || action === "cancel"
          ? "none"
          : "outgoing";
      setResults((current) => current.map((item) => item._id === result._id ? { ...item, relationshipStatus } : item));
      if (relationshipStatus === "accepted") onFriendshipsChanged?.();
    } catch (error) {
      const userMsg = getUserFriendlyError(error, "Action could not be completed. Please try again.");
      if (userMsg) toast.error(userMsg);
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="relative z-20 shrink-0 pb-3">
      <h4 className="text-lg font-semibold py-2">Find people</h4>
      <form className="relative" onSubmit={(event) => event.preventDefault()}>
        <input
          type="text"
          placeholder="Search or start a new chat"
          aria-label="Search usernames"
          autoComplete="off"
          maxLength={20}
          className="w-full p-2 pr-9 border rounded bg-[#1a1a1a] placeholder-[#eaeaeab0] text-[#F6F6F6] outline-none border-transparent border-b-[#6e6e6e]"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {search ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setResults([]);
            }}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <IoCloseSharp size={20} />
          </button>
        ) : (
          <IoSearchSharp aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        )}
      </form>
      {search.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-[min(60vh,28rem)] overflow-y-auto rounded-lg border border-white/15 bg-[#141414] p-2 shadow-xl">
          {searching && <p className="px-2 py-3 text-sm text-gray-400">Searching...</p>}
          {!searching && searchError && <p className="px-2 py-3 text-sm text-red-300">Search failed. Try again.</p>}
          {!searching && !searchError && results.length === 0 && <p className="px-2 py-3 text-sm text-gray-400">No users found.</p>}
          {results.map((result) => (
            <div key={result._id} className="flex min-w-0 items-center gap-2 border-b border-white/5 px-1 py-2 last:border-0">
              <AvatarWithFallback src={result.avatar} name={result.displayName} authProvider={result.authProvider} size="w-10 h-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{result.displayName}</p>
                <p className="truncate text-xs text-gray-400">@{result.username}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                {result.relationshipStatus === "none" && <button disabled={busyId === result._id} onClick={() => runAction(result, "request")} className="rounded bg-pink-500 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">Add friend</button>}
                {result.relationshipStatus === "outgoing" && <button disabled={busyId === result._id} onClick={() => runAction(result, "cancel")} className="rounded border border-white/20 px-2 py-1 text-xs text-gray-200 disabled:opacity-50">Requested</button>}
                {result.relationshipStatus === "incoming" && <div className="flex gap-1"><button disabled={busyId === result._id} onClick={() => runAction(result, "accept")} className="rounded bg-pink-500 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">Accept</button><button disabled={busyId === result._id} onClick={() => runAction(result, "decline")} className="rounded border border-white/20 px-2 py-1 text-xs text-gray-200 disabled:opacity-50">Decline</button></div>}
                {result.relationshipStatus === "accepted" && <><button onClick={() => runAction(result, "message")} className="rounded bg-pink-500 px-2 py-1 text-xs font-semibold text-white">Message</button><div className="flex gap-1"><button onClick={() => runAction(result, "unfriend")} className="rounded border border-white/20 px-1.5 py-1 text-[10px] text-gray-300">Unfriend</button><button onClick={() => runAction(result, "block")} className="rounded border border-white/20 px-1.5 py-1 text-[10px] text-gray-300">Block</button></div></>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

SearchInput.propTypes = {
  onFriendshipsChanged: PropTypes.func,
};

export default SearchInput;
