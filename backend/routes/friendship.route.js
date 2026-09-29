import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import {
  acceptFriendRequest,
  blockUser,
  cancelFriendRequest,
  declineFriendRequest,
  listIncomingRequests,
  listSentRequests,
  sendFriendRequest,
  unblockUser,
  unfriend,
} from "../controllers/friendship.controller.js";
import { friendRequestLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();
router.use(protectRoute);

router.get("/requests", listIncomingRequests);
router.get("/sent", listSentRequests);
router.post("/:userId", friendRequestLimiter, sendFriendRequest);
router.delete("/:userId", friendRequestLimiter, cancelFriendRequest);
router.post("/:userId/accept", friendRequestLimiter, acceptFriendRequest);
router.post("/:userId/decline", friendRequestLimiter, declineFriendRequest);
router.delete("/:userId/friend", friendRequestLimiter, unfriend);
router.post("/:userId/block", friendRequestLimiter, blockUser);
router.delete("/:userId/block", friendRequestLimiter, unblockUser);

export default router;