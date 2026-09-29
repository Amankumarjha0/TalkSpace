import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

import App from "./App.jsx";
import "./index.css";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: "#ec4899",
            colorBackground: "#111111",
            colorInputBackground: "#010102",
            colorInputText: "#f6f6f6",
          },
        }}
      >
        <BrowserRouter>
          <AuthContextProvider>
            <SocketContextProvider>
              <App />
            </SocketContextProvider>
          </AuthContextProvider>
        </BrowserRouter>
      </ClerkProvider>
    ) : (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl border border-pink/30 bg-[#141414] shadow-2xl">
          <h1 className="text-2xl font-bold text-pink mb-3">Clerk Setup Required</h1>
          <p className="text-gray-400 mb-6 text-sm">
            Please add your Clerk Publishable Key to continue.
          </p>
          <div className="bg-[#050505] p-4 rounded-lg text-left text-xs font-mono text-gray-300 border border-white/10 mb-6">
            <p className="text-gray-500 mb-1"># In frontend/.env:</p>
            <p className="text-yellow">VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</p>
          </div>
          <p className="text-xs text-gray-500">
            Get your free keys at <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" className="text-pink underline">dashboard.clerk.com</a>
          </p>
        </div>
      </div>
    )}
  </React.StrictMode>
);
