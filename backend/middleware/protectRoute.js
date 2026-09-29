import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return req.cookies?.jwt || null;
};

const protectRoute = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        if (user) {
          req.user = user;
          return next();
        }
      } catch (err) {
        // Fall through to check Clerk auth
      }
    }

    // Fallback: Check Clerk authentication if clerk middleware is active
    const clerkAuth = req.auth;
    if (clerkAuth?.userId) {
      const user = await User.findOne({ clerkId: clerkAuth.userId });
      if (user) {
        req.user = user;
        return next();
      }
    }

    res.clearCookie("jwt", { path: "/" });
    return res.status(401).json({ error: "Unauthorized - Please sign in" });
  } catch (error) {
    console.log("Error in protectRoute middleware:", error.message);
    res.clearCookie("jwt", { path: "/" });
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default protectRoute;
