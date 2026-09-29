import asyncHandler from "express-async-handler";
import { clerkClient } from "@clerk/express";
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";
import { displayNameFromEmail } from "../utils/username.js";

// @desc    Sync Clerk authenticated user with MongoDB
// @route   POST /api/auth/clerk-sync
export const syncClerkUser = asyncHandler(async (req, res) => {
  try {
    // req.auth?.userId is set by clerkMiddleware() when a valid Clerk session/token is present.
    // Fallback to clerkId from the request body — we then validate it by calling
    // clerkClient.users.getUser() which throws if the ID is invalid/fake.
    const cleanClerkId = req.auth?.userId || req.body?.clerkId;
    if (!cleanClerkId) return res.status(401).json({ error: "Unauthorized — no Clerk session" });

    const clerkUser = await clerkClient.users.getUser(cleanClerkId);
    const verifiedEmail = clerkUser.emailAddresses.find(
      (address) => address.verification?.status === "verified" && address.id === clerkUser.primaryEmailAddressId
    ) || clerkUser.emailAddresses.find((address) => address.verification?.status === "verified");
    if (!verifiedEmail) return res.status(400).json({ error: "A verified email is required" });

    const normalizedEmail = verifiedEmail.emailAddress.trim().toLowerCase();
    const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");

    console.log("SYNC CLERK USER DATA:", {
      id: clerkUser.id,
      imageUrl: clerkUser.imageUrl,
      hasImage: clerkUser.hasImage,
      externalAccounts: clerkUser.externalAccounts?.map(a => ({ provider: a.provider, avatarUrl: a.avatarUrl, imageUrl: a.imageUrl, picture: a.picture, strategy: a.verification?.strategy })),
    });

    const googleAccount = clerkUser.externalAccounts?.find(
      (acc) =>
        String(acc.provider || "").toLowerCase().includes("google") ||
        String(acc.verification?.strategy || "").toLowerCase().includes("google")
    );
    const googlePhoto = googleAccount?.avatarUrl || googleAccount?.imageUrl || googleAccount?.picture;
    const hasGoogleAccount = Boolean(googleAccount);
    const authProvider = hasGoogleAccount ? "google" : "email";
    const profilePic = googlePhoto || clerkUser.imageUrl || "";

    let user = null;

    if (cleanClerkId) {
      user = await User.findOne({ clerkId: cleanClerkId });
    }

    if (!user) {
      user = await User.findOne({ email: normalizedEmail });
    }

    if (user?.clerkId && user.clerkId !== cleanClerkId) {
      return res.status(409).json({ error: "This email is linked to another account" });
    }

    if (!user) {
      user = await User.create({
        clerkId: cleanClerkId,
        email: normalizedEmail,
        fullName: (fullName && fullName.trim()) || displayNameFromEmail(normalizedEmail),
        profilePic: profilePic || "",
        authProvider,
        gender: "other",
      });
    } else {
      if (cleanClerkId && !user.clerkId) {
        user.clerkId = cleanClerkId;
      }
      if (fullName && fullName.trim() && (user.fullName === "New User" || !user.fullName)) {
        user.fullName = fullName.trim();
      }
      user.authProvider = authProvider;
      user.profilePic = profilePic;
      await user.save();
    }

    // Set JWT cookie so socket and existing protected routes work seamlessly
    generateToken(user._id, res);

    return res.status(200).json({
      _id: user._id,
      clerkId: user.clerkId,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      authProvider: user.authProvider,
      gender: user.gender,
    });
  } catch (error) {
    console.log("Error in syncClerkUser controller:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
});
