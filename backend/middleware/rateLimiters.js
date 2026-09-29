import { rateLimit } from "express-rate-limit";

const createLimiter = (limit) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    keyGenerator: (req) => String(req.user._id),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
  });

export const usernameCheckLimiter = createLimiter(300);
export const userSearchLimiter = createLimiter(180);
export const friendRequestLimiter = createLimiter(20);