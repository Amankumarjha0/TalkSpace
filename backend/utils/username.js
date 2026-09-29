export const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;

export const normalizeUsername = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const isValidUsername = (value) => USERNAME_PATTERN.test(value);

export const usernameFromIdentity = (fullName, email) => {
  const source = /^new user$/i.test(fullName || "") ? "" : fullName || "";
  const localPart = (email || "").split("@")[0];
  const base = (source || localPart)
    .toLowerCase()
    .replace(/[^a-z0-9_.]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "")
    .slice(0, 20);

  return base.length >= 3 ? base : `user_${base}`.slice(0, 20);
};

export const displayNameFromEmail = (email) => {
  const localPart = (email || "").split("@")[0];
  const words = localPart.split(/[._-]+/).filter(Boolean);
  if (!words.length) return "TalkSpace User";
  const displayName = words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
  return /^new user$/i.test(displayName) ? "TalkSpace User" : displayName;
};