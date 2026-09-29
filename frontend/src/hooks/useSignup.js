import { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

const handleInputValidation = ({ fullName, email, gender }) => {
  if (!fullName?.trim() || !email?.trim() || !gender) {
    toast.error("Please fill all required fields");
    return false;
  }

  if (!isValidEmail(email)) {
    toast.error("Please enter a valid email address");
    return false;
  }

  return true;
};

const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const { setAuthUser } = useAuthContext();

  const sendOtp = async ({ fullName, email, gender }) => {
    const trimmedEmail = String(email || "").trim().toLowerCase();
    const valid = handleInputValidation({
      fullName,
      email: trimmedEmail,
      gender,
    });
    if (!valid) return false;

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
      toast.error(error?.message || "Failed to send OTP");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async ({ fullName, email, gender, otp }) => {
    const trimmedEmail = String(email || "").trim().toLowerCase();
    const trimmedOtp = String(otp || "").trim();

    if (!fullName?.trim() || !trimmedEmail || !gender || !trimmedOtp) {
      toast.error("Please fill all required fields and enter the OTP");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: trimmedEmail,
          gender,
          otp: trimmedOtp,
        }),
      });

      const data = await res?.json();

      if (!res.ok) {
        throw new Error(data?.error || "OTP verification failed");
      }

      localStorage.setItem("chat-user", JSON.stringify(data));
      setAuthUser(data);
      toast.success("Account created successfully!");
    } catch (error) {
      toast.error(error?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendOtp, signup };
};

export default useSignup;
