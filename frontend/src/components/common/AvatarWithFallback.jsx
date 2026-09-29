import PropTypes from "prop-types";
import { useState } from "react";

export const isDefaultAvatar = (url = "", authProvider = "") => {
  if (!url) return true;
  const str = String(url).toLowerCase();

  // 1. If provider is google, OR URL has google/oauth/cloudinary keywords -> REAL PHOTO (return false)
  if (
    authProvider === "google" ||
    str.includes("googleusercontent.com") ||
    str.includes("oauth") ||
    str.includes("google") ||
    str.includes("cloudinary.com") ||
    str.includes("res.cloudinary") ||
    str.startsWith("data:image") ||
    str.startsWith("blob:")
  ) {
    return false;
  }

  // 2. Known default avatar placeholders or generic Clerk email avatars
  if (
    str.includes("gravatar.com") ||
    str.includes("avatar.iran.liara.run") ||
    str.includes("img.clerk.com") ||
    str.includes("images.clerk.dev") ||
    str.includes("default")
  ) {
    return true;
  }

  return false;
};

const getInitials = (name = "") => {
  const trimmed = name ? String(name).trim() : "";
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
};

const AvatarWithFallback = ({
  src,
  name,
  authProvider,
  size = "w-12 h-12",
  className = "",
  imageClassName = "",
  textClassName = "",
}) => {
  const [hasError, setHasError] = useState(false);
  const initials = getInitials(name);
  const isDefault = isDefaultAvatar(src, authProvider);

  const showImage = !hasError && src && !isDefault;

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 overflow-hidden rounded-full font-bold select-none ${size} ${
        showImage ? "bg-zinc-800" : "bg-white text-black"
      } ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={`${name || "user"} avatar`}
          className={`object-cover w-full h-full ${imageClassName}`}
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={`flex items-center justify-center w-full h-full text-black font-bold ${textClassName}`}>
          {initials}
        </span>
      )}
    </div>
  );
};

AvatarWithFallback.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  authProvider: PropTypes.string,
  size: PropTypes.string,
  className: PropTypes.string,
  imageClassName: PropTypes.string,
  textClassName: PropTypes.string,
};

export default AvatarWithFallback;
