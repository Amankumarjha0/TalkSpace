import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSocketContext } from "../../context/SocketContext";
import AvatarWithFallback from "../common/AvatarWithFallback";
import { getUserFriendlyError } from "../../utils/getUserFriendlyError";

const FriendRequests = ({ refreshKey, onChanged, onCountChange }) => {
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [busyId, setBusyId] = useState("");
  const { socket } = useSocketContext();

  // Load both incoming and sent requests
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [incomingRes, sentRes] = await Promise.all([
          fetch("/api/friendships/requests", { credentials: "include", signal: controller.signal }),
          fetch("/api/friendships/sent", { credentials: "include", signal: controller.signal }),
        ]);
        const [incomingData, sentData] = await Promise.all([
          incomingRes.json(),
          sentRes.json(),
        ]);
        if (!incomingRes.ok) throw new Error(incomingData?.error || "Could not load requests");
        if (!sentRes.ok) throw new Error(sentData?.error || "Could not load sent requests");
        setIncoming(incomingData);
        setSent(sentData);
      } catch (err) {
        if (err.name !== "AbortError") {
          const userMsg = getUserFriendlyError(err, "Could not load requests. Please check your connection.");
          setError(userMsg);
          if (userMsg) toast.error(userMsg);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [retryCount, refreshKey]);

  // Update badge count (only incoming)
  useEffect(() => {
    onCountChange?.(incoming.length);
  }, [incoming.length, onCountChange]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const handleNewRequest = (request) => {
      setIncoming((cur) =>
        cur.some((r) => r._id === request._id) ? cur : [request, ...cur]
      );
      toast("New friend request received 👋");
    };
    const handleAccepted = ({ user }) => {
      setIncoming((cur) => cur.filter((r) => r.requester?._id !== user?._id));
      setSent((cur) => cur.filter((r) => r.recipient?._id !== user?._id));
      onChanged?.();
      toast.success(`${user?.fullName || "A user"} accepted your friend request`);
    };
    socket.on("friendRequest", handleNewRequest);
    socket.on("friendRequestAccepted", handleAccepted);
    return () => {
      socket.off("friendRequest", handleNewRequest);
      socket.off("friendRequestAccepted", handleAccepted);
    };
  }, [socket, onChanged]);

  // Accept or decline incoming request
  const respond = async (requesterId, action) => {
    setBusyId(requesterId);
    try {
      const res = await fetch(`/api/friendships/${requesterId}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not update request");
      setIncoming((cur) => cur.filter((r) => r.requester?._id !== requesterId));
      if (action === "accept") onChanged?.();
    } catch (err) {
      const userMsg = getUserFriendlyError(err, "Action could not be completed. Please try again.");
      if (userMsg) toast.error(userMsg);
    } finally {
      setBusyId("");
    }
  };

  // Cancel a sent request
  const cancelSent = async (recipientId) => {
    setBusyId(recipientId);
    try {
      const res = await fetch(`/api/friendships/${recipientId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not cancel request");
      setSent((cur) => cur.filter((r) => r.recipient?._id !== recipientId));
      toast.success("Request cancelled");
    } catch (err) {
      const userMsg = getUserFriendlyError(err, "Could not cancel request. Please try again.");
      if (userMsg) toast.error(userMsg);
    } finally {
      setBusyId("");
    }
  };

  if (loading)
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="loading loading-spinner text-pink-400" />
      </div>
    );

  if (error)
    return (
      <div className="px-2 py-6 text-center">
        <p className="text-sm text-red-300">Could not load requests.</p>
        <button
          type="button"
          onClick={() => setRetryCount((c) => c + 1)}
          className="mt-2 text-sm text-pink-300 hover:text-white"
        >
          Retry
        </button>
      </div>
    );

  const hasNone = incoming.length === 0 && sent.length === 0;
  if (hasNone)
    return (
      <p className="px-2 py-6 text-center text-sm text-gray-400">
        No friend requests.
      </p>
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2 gap-4">

      {/* ── Incoming requests ── */}
      {incoming.length > 0 && (
        <div>
          <p className="px-2 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Received
          </p>
          <div className="flex flex-col gap-1">
            {incoming.map((request) => {
              const person = request.requester || {};
              return (
                <div
                  key={request._id}
                  className="flex min-w-0 items-center gap-3 rounded-lg p-2 hover:bg-white/5"
                >
                  <AvatarWithFallback
                    src={person.profilePic}
                    name={person.fullName}
                    authProvider={person.authProvider}
                    size="w-11 h-11"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{person.fullName}</p>
                    <p className="truncate text-sm text-gray-400">@{person.username}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      disabled={busyId === person._id}
                      onClick={() => respond(person._id, "accept")}
                      className="rounded-md bg-pink-500 px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-pink-600"
                    >
                      Accept
                    </button>
                    <button
                      disabled={busyId === person._id}
                      onClick={() => respond(person._id, "decline")}
                      className="rounded-md border border-white/15 px-2 py-1.5 text-xs text-gray-300 disabled:opacity-50 hover:bg-white/5"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sent requests ── */}
      {sent.length > 0 && (
        <div>
          <p className="px-2 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Sent
          </p>
          <div className="flex flex-col gap-1">
            {sent.map((request) => {
              const person = request.recipient || {};
              return (
                <div
                  key={request._id}
                  className="flex min-w-0 items-center gap-3 rounded-lg p-2 hover:bg-white/5"
                >
                  <AvatarWithFallback
                    src={person.profilePic}
                    name={person.fullName}
                    authProvider={person.authProvider}
                    size="w-11 h-11"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{person.fullName}</p>
                    <p className="truncate text-sm text-gray-400">@{person.username}</p>
                  </div>
                  <button
                    disabled={busyId === person._id}
                    onClick={() => cancelSent(person._id)}
                    className="shrink-0 rounded-md border border-white/15 px-2 py-1.5 text-xs text-gray-300 disabled:opacity-50 hover:border-red-500/50 hover:text-red-400"
                  >
                    {busyId === person._id ? "..." : "Cancel"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

FriendRequests.propTypes = {
  refreshKey: PropTypes.number,
  onChanged: PropTypes.func,
  onCountChange: PropTypes.func,
};

export default FriendRequests;
