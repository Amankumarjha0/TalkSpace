import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "../../context/AuthContext";
import AvatarWithFallback, { isDefaultAvatar } from "../../components/common/AvatarWithFallback";

const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;

const StatusIcon = ({ status }) => {
  if (status === "checking")
    return <span className="loading loading-spinner loading-xs text-gray-400" />;
  if (status === "available")
    return <span className="text-emerald-400 text-lg">✓</span>;
  if (status === "taken" || status === "invalid" || status === "error")
    return <span className="text-red-400 text-lg">✗</span>;
  return null;
};

const ChooseUsernamePage = () => {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuthContext();
  const [username, setUsername] = useState("");
  const [availability, setAvailability] = useState("idle");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const normalized = username.trim().toLowerCase();
    if (!normalized) { setAvailability("idle"); return; }
    if (!USERNAME_PATTERN.test(normalized)) { setAvailability("invalid"); return; }

    const controller = new AbortController();
    setAvailability("checking");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check?u=${encodeURIComponent(normalized)}`, {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await res.json();
        if (res.status === 400) setAvailability("invalid");
        else if (!res.ok) setAvailability("error");
        else setAvailability(data.available ? "available" : "taken");
      } catch (err) {
        if (err.name !== "AbortError") setAvailability("error");
      }
    }, 400);

    return () => { clearTimeout(timeout); controller.abort(); };
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (availability !== "available") return;
    setSaving(true);
    try {
      const res = await fetch("/api/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not save username");

      const updatedUser = { ...authUser, ...data };
      localStorage.setItem("chat-user", JSON.stringify(updatedUser));
      setAuthUser(updatedUser);
      toast.success("Welcome to TalkSpace! 🎉");
      navigate("/", { replace: true });
    } catch (err) {
      if (err.message === "Username taken") setAvailability("taken");
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const statusMsg = {
    invalid: "3–20 characters: letters, numbers, _ or . only",
    checking: "Checking availability...",
    available: `@${username.trim()} is available!`,
    taken: "That username is already taken",
    error: "Could not check right now. Try again.",
  }[availability] || "Pick a unique username — you can always change it later.";

  const statusColor = {
    available: "text-emerald-400",
    taken: "text-red-400",
    invalid: "text-red-400",
    error: "text-red-400",
    checking: "text-gray-400",
    idle: "text-gray-500",
  }[availability] || "text-gray-500";

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-black px-4 py-8">
      {/* Glow background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-pink-600/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#111111] p-8 shadow-2xl">
          {/* Avatar + greeting */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              {/* Custom avatar: show real photo if available, else show initial letter */}
              {authUser?.profilePic && !isDefaultAvatar(authUser.profilePic, authUser?.authProvider) ? (
                <img
                  src={authUser.profilePic}
                  alt={authUser.fullName}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-pink-500/40 ring-offset-2 ring-offset-[#111]"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center bg-white text-black ring-2 ring-pink-500/40 ring-offset-2 ring-offset-[#111]"
                >
                  <span className="text-3xl font-bold text-black select-none">
                    {(authUser?.fullName || authUser?.email || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 text-xl">👋</span>
            </div>
            <h1 className="text-2xl font-bold text-white text-center">
              Hey, {authUser?.fullName?.split(" ")[0] || "there"}!
            </h1>
            <p className="mt-1 text-sm text-gray-400 text-center">
              One last step — choose a username for TalkSpace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div
                className={`flex items-center rounded-xl border px-4 py-3 bg-[#1a1a1a] transition-colors focus-within:ring-1 ${
                  availability === "available"
                    ? "border-emerald-500 focus-within:ring-emerald-500"
                    : availability === "taken" || availability === "invalid"
                    ? "border-red-500 focus-within:ring-red-500"
                    : "border-white/10 focus-within:border-pink-500 focus-within:ring-pink-500"
                }`}
              >
                <span className="mr-2 text-gray-500 font-medium select-none">@</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  aria-describedby="username-status"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_.]/g, "").toLowerCase())}
                  className="flex-1 bg-transparent text-white outline-none placeholder-gray-600 text-sm"
                  placeholder="yourname"
                  required
                />
                <StatusIcon status={availability} />
              </div>

              {/* Status message */}
              <p
                id="username-status"
                aria-live="polite"
                className={`mt-2 text-xs min-h-4 ${statusColor}`}
              >
                {statusMsg}
              </p>
            </div>

            {/* Rules */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {["3–20 chars", "a–z 0–9", "_ or . allowed", "no spaces"].map((rule) => (
                <span key={rule} className="rounded-full border border-white/10 px-2 py-0.5 bg-white/5">
                  {rule}
                </span>
              ))}
            </div>

            {/* Submit — centered with border */}
            <div className="flex justify-center pt-1">
              <button
                type="submit"
                disabled={saving || availability !== "available"}
                className="rounded-xl px-8 py-2.5 font-semibold text-white text-sm
                  border-2 border-pink-500
                  bg-gradient-to-r from-pink-500 to-rose-500
                  transition-all duration-200
                  hover:brightness-110 hover:shadow-lg hover:shadow-pink-500/30
                  active:brightness-95
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:border-white/10"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-xs" />
                    Saving...
                  </span>
                ) : (
                  "Continue to TalkSpace →"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ChooseUsernamePage;