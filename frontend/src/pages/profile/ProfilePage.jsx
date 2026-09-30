import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MdAddAPhoto } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";

import { useAuthContext } from "../../context/AuthContext";
import AvatarWithFallback from "../../components/common/AvatarWithFallback";
import { getUserFriendlyError } from "../../utils/getUserFriendlyError";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuthContext();

  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
  });

  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const hasChanges =
    Boolean(profilePhoto) ||
    formData.fullName.trim() !== (authUser?.fullName || "").trim();

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be 5 MB or smaller");
      e.target.value = "";
      return;
    }

    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authUser) {
      navigate("/login");
      return;
    }

    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("fullName", formData.fullName.trim());
      if (profilePhoto) payload.append("profilePic", profilePhoto);

      const res = await fetch("/api/users/update-profile", {
        method: "PUT",
        credentials: "include",
        body: payload,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update profile");
      }

      localStorage.setItem("chat-user", JSON.stringify(data));
      setAuthUser(data);
      toast.success("Profile updated successfully");
      navigate("/");
    } catch (error) {
      const userMsg = getUserFriendlyError(error, "Could not update profile. Please try again.");
      if (userMsg) toast.error(userMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-black px-4 py-6 text-white">
      <div className="w-full max-w-xl rounded-xl border border-white/10 bg-[#111111] p-4 shadow-2xl sm:p-6">
        {/* Header / Back Button */}
        <div className="relative flex items-center justify-center mb-6 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            title="Back to Chats"
            className="absolute left-0 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <IoArrowBack size={16} />
            <span>Back</span>
          </button>
          <h2 className="text-xl font-bold text-white text-center">Edit Profile</h2>
        </div>

        <div className="flex flex-col items-center mb-8">
          <AvatarWithFallback
            src={photoPreview || authUser?.profilePic}
            name={authUser?.fullName}
            authProvider={authUser?.authProvider}
            size="w-20 h-20"
            className="border-2 border-black shadow-md"
            textClassName="text-2xl"
          />
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-gray-200 transition hover:bg-white/5">
            <MdAddAPhoto aria-hidden="true" />
            <span>Change photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePhotoChange}
              className="sr-only"
            />
          </label>
          {profilePhoto && (
            <span className="mt-1 max-w-full truncate text-xs text-gray-400">
              {profilePhoto.name}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Full name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-white outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={authUser?.username ? `@${authUser.username}` : ""}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-gray-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Email address</label>
            <input
              type="email"
              value={authUser?.email || ""}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-gray-400 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 rounded-lg border border-white/10 bg-transparent px-4 py-2 font-medium text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !hasChanges || !formData.fullName.trim()}
              className={`flex-1 rounded-lg px-4 py-2 font-semibold transition ${
                hasChanges && formData.fullName.trim()
                  ? "border-2 border-pink-200 bg-pink-500 text-white hover:bg-pink-600"
                  : "cursor-not-allowed border border-white/10 bg-white/10 text-gray-400"
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
