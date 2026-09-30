import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { BiLogOut, BiUser } from "react-icons/bi";
import { useAuthContext } from "../../context/AuthContext";
import useLogout from "../../hooks/useLogout";
import { isDefaultAvatar } from "./AvatarWithFallback";

const MobileProfileMenu = () => {
  const { authUser } = useAuthContext();
  const { loading, logout } = useLogout();
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  const initial = (authUser?.fullName || authUser?.email || "?").charAt(0).toUpperCase();
  const showPhoto = authUser?.profilePic && !isDefaultAvatar(authUser.profilePic, authUser?.authProvider);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative md:hidden" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Profile menu"
        title="Profile menu"
        className="flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-white/20 focus:outline-none focus:ring-pink-500 hover:ring-pink-400 transition-all"
      >
        {showPhoto ? (
          <img
            src={authUser.profilePic}
            alt={authUser.fullName}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black font-bold text-sm">
            {initial}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-44 rounded-lg border border-white/10 bg-[#181818] p-1.5 shadow-xl animate-in fade-in zoom-in-95">
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-white/10"
          >
            <BiUser size={18} />
            <span>View Profile</span>
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 disabled:opacity-50"
          >
            <BiLogOut size={18} />
            <span>{loading ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileProfileMenu;
