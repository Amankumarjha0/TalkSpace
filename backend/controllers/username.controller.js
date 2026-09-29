import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import { isValidUsername, normalizeUsername } from "../utils/username.js";

export const checkUsername = asyncHandler(async (req, res) => {
  const username = normalizeUsername(req.query.u);
  if (!isValidUsername(username)) {
    return res.status(400).json({ error: "Username must be 3-20 characters: letters, numbers, _ or ." });
  }

  const owner = await User.exists({ username });
  const available = !owner || String(owner._id) === String(req.user._id);
  return res.status(200).json({ available });
});

export const setUsername = asyncHandler(async (req, res) => {
  const username = normalizeUsername(req.body.username);
  if (!isValidUsername(username)) {
    return res.status(400).json({ error: "Username must be 3-20 characters: letters, numbers, _ or ." });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { username } },
      { new: true, runValidators: true }
    ).select("username fullName email profilePic gender");

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      gender: user.gender,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Username taken" });
    }
    throw error;
  }
});