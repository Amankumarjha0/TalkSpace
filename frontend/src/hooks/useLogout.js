import { useState } from "react";
import { useClerk } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

import { getUserFriendlyError } from "../utils/getUserFriendlyError";

const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const { setAuthUser } = useAuthContext();
  const { signOut } = useClerk();

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      await signOut();

      localStorage.removeItem("chat-user");
      setAuthUser(null);
      toast.success("Successfully logged out!");
    } catch (error) {
      console.error("Logout error:", error);
      const userMsg = getUserFriendlyError(error, "Could not log out cleanly. Please try again.");
      if (userMsg) toast.error(userMsg);
    } finally {
      setLoading(false);
    }
  };

  return { loading, logout };
};

export default useLogout;
