import { useState } from "react";
import { useClerk } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

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
      toast.error(error.message || "Failed to logout");
    } finally {
      setLoading(false);
    }
  };

  return { loading, logout };
};

export default useLogout;
