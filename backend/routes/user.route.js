import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import upload from "../middleware/upload.js";
import {
  getUsersForSidebar,
  searchUsers,
  updateProfile,
} from "../controllers/user.controller.js";
import { userSearchLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get("/search", protectRoute, userSearchLimiter, searchUsers);
router.get("/", protectRoute, getUsersForSidebar);
router.put("/update-profile", protectRoute, upload.single("profilePic"), updateProfile);

export default router;
