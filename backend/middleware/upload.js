import multer from "multer";

// Store files in memory (as Buffer) so we can upload directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, WEBP, GIF) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const messageUpload = multer({
  storage,
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
    fieldSize: 20000,
  },
});

export const uploadMessageAttachments = (req, res, next) => {
  messageUpload.array("attachments", 5)(req, res, (error) => {
    if (!error) return next();

    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Each file must be 5 MB or smaller"
      : error.code === "LIMIT_UNEXPECTED_FILE"
        ? "You can attach up to 5 files"
        : error.message || "Could not process attachments";

    return res.status(400).json({ error: message });
  });
};

export default upload;
