import { Link } from "react-router-dom";
import LogoutBtn from "./LogoutBtn";
import { useAuthContext } from "../../context/AuthContext";
import { isDefaultAvatar } from "../common/AvatarWithFallback";

const Header = () => {
  const { authUser } = useAuthContext();
  const initial = (authUser?.fullName || authUser?.email || "?").charAt(0).toUpperCase();
  const showPhoto = authUser?.profilePic && !isDefaultAvatar(authUser.profilePic, authUser?.authProvider);

  return (
    <section className="hidden md:flex absolute top-0 bottom-0 w-[70px] border-r-[1px] border-[#FFF]/40 px-1">
      <div className="flex flex-col justify-between h-full w-full py-8">
        <div className="flex flex-col items-center">
          <Link to="/" title="TalkSpace Home">
            <img
              src="/favicon.webp"
              alt="TalkSpace Logo"
              className="w-9 h-9 object-contain hover:scale-105 transition-transform"
            />
          </Link>
        </div>
        <div className="flex flex-col gap-4 w-full items-center">
          {/* Profile icon — shows real photo or initial letter */}
          <Link
            to="/profile"
            title="Edit profile"
            className="group relative block"
          >
            {showPhoto ? (
              <img
                src={authUser.profilePic}
                alt={authUser.fullName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20 group-hover:ring-pink-500 transition-all"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white text-black ring-2 ring-white/20 group-hover:ring-pink-500 transition-all"
              >
                <span className="text-sm font-bold text-black select-none">{initial}</span>
              </div>
            )}
          </Link>
          <LogoutBtn />
        </div>
      </div>
    </section>
  );
};

export default Header;
