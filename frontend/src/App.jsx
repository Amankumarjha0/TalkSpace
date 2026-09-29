import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";

import Login from "./pages/auth/Login.jsx";
import SignUp from "./pages/auth/Signup.jsx";
import ChooseUsernamePage from "./pages/auth/ChooseUsernamePage.jsx";
import Home from "./pages/home/Home.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import { useAuthContext } from "./context/AuthContext.jsx";
import LandingPage from "./components/LandingPage.jsx";

function App() {
  const { authUser, syncing, syncError, retrySync } = useAuthContext();
  const { isSignedIn, isLoaded } = useUser();

  // 1. Clerk SDK still loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-pink-500"></span>
      </div>
    );
  }

  // 2. Signed in — waiting for backend clerk-sync to complete
  if (isSignedIn && !authUser && syncing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-pink-500"></span>
          <p className="text-gray-400 text-sm">Signing you in...</p>
        </div>
      </div>
    );
  }

  // 3. Signed in but clerk-sync failed — show actionable error
  if (isSignedIn && !authUser && syncError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="max-w-md p-6 rounded-2xl border border-red-500/30 bg-[#1a0000]">
          <h2 className="text-red-400 font-bold text-lg mb-2">Sign-in Error</h2>
          <p className="text-gray-300 text-sm mb-4">{syncError}</p>
          <div className="bg-black/50 rounded-lg p-3 text-left text-xs font-mono text-gray-400 mb-4">
            <p className="text-yellow-400 mb-1"># Make sure backend is running:</p>
            <p>cd backend &amp;&amp; npm run dev</p>
          </div>
          <button
            type="button"
            onClick={retrySync}
            className="rounded-lg bg-pink-500 px-6 py-2 font-semibold text-white hover:bg-pink-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <Routes>
        {/* Public landing page */}
        <Route path="/landingpage" element={<LandingPage />} />

        {/* Home — requires authUser AND username */}
        <Route
          path="/"
          element={
            authUser
              ? authUser.username
                ? <Home />
                : <Navigate to="/choose-username" replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* Login — redirect away if already signed in */}
        <Route
          path="/login/*"
          element={
            authUser
              ? authUser.username
                ? <Navigate to="/" replace />
                : <Navigate to="/choose-username" replace />
              : <Login />
          }
        />

        {/* Sign Up — redirect away if already signed in */}
        <Route
          path="/signup/*"
          element={
            authUser
              ? authUser.username
                ? <Navigate to="/" replace />
                : <Navigate to="/choose-username" replace />
              : <SignUp />
          }
        />

        {/* Choose username — only for signed-in users without a username */}
        <Route
          path="/choose-username"
          element={
            authUser
              ? authUser.username
                ? <Navigate to="/" replace />  // already has username, go home
                : <ChooseUsernamePage />
              : <Navigate to="/login" replace />
          }
        />

        {/* Profile — requires authUser AND username */}
        <Route
          path="/profile"
          element={
            authUser
              ? authUser.username
                ? <ProfilePage />
                : <Navigate to="/choose-username" replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
