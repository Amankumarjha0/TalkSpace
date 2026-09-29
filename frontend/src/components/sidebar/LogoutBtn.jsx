import { BiLogOut } from "react-icons/bi";

import useLogout from "../../hooks/useLogout";
const LogoutBtn = () => {
  const { loading, logout } = useLogout();
  return (
    <button
      type="button"
      aria-label="Log out"
      title="Log out"
      onClick={logout}
      disabled={loading}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-white hover:bg-white/10 disabled:opacity-60"
    >
      {loading ? <span className="loading loading-spinner" /> : <BiLogOut size={26} />}
    </button>
  );
};
export default LogoutBtn;
