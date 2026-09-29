import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";

export const AuthContext = createContext();

export const useAuthContext = () => {
  return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [authUser, setAuthUser] = useState(
    JSON.parse(localStorage.getItem("chat-user")) || null
  );
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncAttempt, setSyncAttempt] = useState(0);
  const syncedClerkId = useRef(null);

  const retrySync = () => {
    setSyncError("");
    syncedClerkId.current = null;
    setSyncAttempt((n) => n + 1);
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      // Skip if already synced for this Clerk user
      if (syncedClerkId.current === user.id && authUser?._id) return;

      const syncUser = async () => {
        setSyncing(true);
        setSyncError("");
        try {
          const email =
            user.primaryEmailAddress?.emailAddress ||
            user.emailAddresses?.[0]?.emailAddress ||
            "";
          const fullName =
            user.fullName ||
            user.firstName ||
            email.split("@")[0] ||
            "TalkSpace User";
          const profilePic = user.hasImage ? user.imageUrl : "";

          // Try to get Clerk token (optional — backend clerk-sync doesn't require it)
          let token = null;
          try {
            token = await getToken();
          } catch (_) {
            // safe to ignore
          }

          const res = await fetch("/api/auth/clerk-sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify({ clerkId: user.id, email, fullName, profilePic }),
          });

          // If backend is down or returned HTML (e.g. Vite proxy error page)
          const contentType = res.headers.get("content-type") || "";
          if (!contentType.includes("application/json")) {
            throw new Error(
              "Backend server is not running. Start it with: cd backend && npm run dev"
            );
          }

          const data = await res.json();

          if (res.ok && data?._id) {
            localStorage.setItem("chat-user", JSON.stringify(data));
            setAuthUser(data);
            syncedClerkId.current = user.id;
          } else {
            console.error("clerk-sync error:", data);
            setSyncError(
              data?.error || "Could not finish signing in. Please retry."
            );
          }
        } catch (error) {
          console.error("clerk-sync network error:", error.message);
          setSyncError(error.message || "Could not connect to the server.");
        } finally {
          setSyncing(false);
        }
      };

      syncUser();
    } else if (isLoaded && !isSignedIn) {
      localStorage.removeItem("chat-user");
      setAuthUser(null);
      syncedClerkId.current = null;
      setSyncError("");
    }
  }, [isSignedIn, user?.id, isLoaded, syncAttempt]);

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser, syncing, syncError, retrySync }}>
      {children}
    </AuthContext.Provider>
  );
};
