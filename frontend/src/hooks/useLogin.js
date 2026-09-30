import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import { getUserFriendlyError } from "../utils/getUserFriendlyError";

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const { setAuthUser } = useAuthContext();

  const sendOtp = async (email) => {
    const trimmedEmail = String(email || "").trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Please enter your email address");
      return false;
    }

    if (!isValidEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to send OTP");
      }

      if (data?.devOtp) {
        toast.success(`Demo OTP: ${data.devOtp}`, { duration: 8000 });
      } else {
        toast.success("OTP sent to your email!");
      }

      return true;
    } catch (error) {
      const userMsg = getUserFriendlyError(error, "Could not send OTP. Please try again.");
      if (userMsg) toast.error(userMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, otp) => {
    const trimmedEmail = String(email || "").trim().toLowerCase();
    const trimmedOtp = String(otp || "").trim();

    if (!trimmedEmail || !trimmedOtp) {
      toast.error("Please enter your email and OTP code");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: trimmedEmail, otp: trimmedOtp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "OTP verification failed");
      }

      localStorage.setItem("chat-user", JSON.stringify(data));
      setAuthUser(data);
      toast.success("Successfully logged in!");
    } catch (error) {
      const userMsg = getUserFriendlyError(error, "Login failed. Please check your OTP and try again.");
      if (userMsg) toast.error(userMsg);
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendOtp, login };
};

export default useLogin;
