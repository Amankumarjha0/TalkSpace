import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { clerkMiddleware } from "@clerk/express";

// Utils
import { app, server } from "./socket/socket.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import usernameRoutes from "./routes/username.route.js";
import friendshipRoutes from "./routes/friendship.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

if (!process.env.MONGO_URI && !process.env.JWT_SECRET) {
  dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
}

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI);

app.use(express.json());
app.use(cookieParser());

if (process.env.CLERK_SECRET_KEY) {
  app.use(clerkMiddleware());
}

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/username", usernameRoutes);
app.use("/api/friendships", friendshipRoutes);

const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      res.status(200).json({ message: "TalkSpace Backend API is running!" });
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
