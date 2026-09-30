export const getUserFriendlyError = (error, fallback = "Something went wrong. Please try again.") => {
  if (!error) return fallback;
  const message = typeof error === "string" ? error : error.message || fallback;
  const lower = message.toLowerCase();

  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("net::err") || lower.includes("load failed")) {
    return "Unable to connect. Please check your internet connection.";
  }
  if (lower.includes("500") || lower.includes("internal server error")) {
    return "Something went wrong on our end. Please try again shortly.";
  }
  if (lower.includes("503") || lower.includes("service unavailable") || lower.includes("cloudinary is not configured")) {
    return "File attachment service is temporarily unavailable. Please try again later.";
  }
  if (lower.includes("502") || lower.includes("bad gateway") || lower.includes("could not retrieve attachment")) {
    return "Could not download file. Please try again.";
  }
  if (lower.includes("unauthorized") || lower.includes("401") || lower.includes("jwt")) {
    return "Your session has expired. Please sign in again.";
  }
  if (lower.includes("invalid recipient") || lower.includes("invalid user") || lower.includes("invalid cursor") || lower.includes("invalid attachment") || lower.includes("invalid message")) {
    return "The requested item could not be processed. Please try again.";
  }
  if (lower.includes("abort") || lower.includes("aborted")) {
    return "";
  }

  return message;
};
