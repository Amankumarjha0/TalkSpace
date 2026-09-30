import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { getUserFriendlyError } from "../utils/getUserFriendlyError";

const useGetConversations = (refreshKey = 0) => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const getFirstPage = async () => {
      setLoading(true);
      setError("");
      setConversations([]);
      setNextCursor(null);
      try {
        const response = await fetch("/api/users?limit=50", {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Could not load chats");
        setConversations(data.conversations || []);
        setNextCursor(data.nextCursor || null);
      } catch (err) {
        if (err.name !== "AbortError") {
          const userMessage = getUserFriendlyError(err, "Could not load chats. Please check your connection.");
          setError(userMessage);
          if (userMessage) toast.error(userMessage);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    getFirstPage();
    return () => controller.abort();
  }, [refreshKey, retryCount]);

  const loadMore = async () => {
    if (!nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/users?limit=50&cursor=${encodeURIComponent(nextCursor)}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not load more chats");
      setConversations((current) => [...current, ...(data.conversations || [])]);
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      const userMessage = getUserFriendlyError(err, "Could not load more chats.");
      if (userMessage) toast.error(userMessage);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  return {
    loading,
    loadingMore,
    conversations,
    nextCursor,
    loadMore,
    error,
    retry: () => setRetryCount((count) => count + 1),
  };
};

export default useGetConversations;
