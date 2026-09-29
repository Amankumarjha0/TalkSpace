import { SignUp } from "@clerk/clerk-react";

const SignUpPage = () => {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center mx-auto px-4 py-8 bg-[#0a0a0a]">
      <div className="mb-6 flex flex-col items-center text-center">
        <img src="/nav_logo.webp" alt="TalkSpace Logo" className="w-14 h-14 mb-3 object-contain" />
        <h1 className="text-3xl font-extrabold text-white mb-2">
          Join <span className="text-pink">TalkSpace</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Create an account with Google or Email
        </p>
      </div>

      <SignUp
        routing="hash"
        signInUrl="/login"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
      />
    </div>
  );
};

export default SignUpPage;
