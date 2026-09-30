import express from "express";
import { deleteMessageForEveryone, deleteMessageForMe, downloadMessageAttachment, getMessage, sendMessage } from "../controllers/message.controller.js";
import { uploadMessageAttachments } from "../middleware/upload.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/:id/attachments/:attachmentIndex/download", protectRoute, downloadMessageAttachment);
router.get("/:id", protectRoute, getMessage);
router.post("/send/:id", protectRoute, uploadMessageAttachments, sendMessage);
router.delete("/:id/for-me", protectRoute, deleteMessageForMe);
router.delete("/:id", protectRoute, deleteMessageForEveryone);

export default router;
