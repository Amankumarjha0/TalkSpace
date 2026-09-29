import express from "express";
import { syncClerkUser, getMe, logout } from "../controllers/auth.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/clerk-sync", syncClerkUser);
router.get("/me", protectRoute, getMe);
router.post("/logout", logout);

export default router;
