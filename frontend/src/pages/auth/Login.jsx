import { SignIn } from "@clerk/clerk-react";

const Login = () => {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center mx-auto px-4 py-8 bg-[#0a0a0a]">
      <div className="mb-6 flex flex-col items-center text-center">
        <img src="/nav_logo.webp" alt="TalkSpace Logo" className="w-14 h-14 mb-3 object-contain" />
        <h1 className="text-3xl font-extrabold text-white mb-2">
          Welcome to <span className="text-pink">TalkSpace</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Sign in with Google or Email to continue
        </p>
      </div>

      <SignIn
        routing="hash"
        signUpUrl="/signup"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
      />
    </div>
  );
};

export default Login;
