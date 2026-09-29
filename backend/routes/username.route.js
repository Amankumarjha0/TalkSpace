import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { checkUsername, setUsername } from "../controllers/username.controller.js";
import { usernameCheckLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get("/check", protectRoute, usernameCheckLimiter, checkUsername);
router.post("/", protectRoute, setUsername);

export default router;