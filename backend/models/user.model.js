import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    clerkId: {
      type: String,
      sparse: true,
      unique: true,
    },
    username: {
      type: String,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_.]{3,20}$/,
    },
    phone: {
      type: String,
      sparse: true,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    profilePic: {
      type: String,
      default: "",
    },
    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
  },
  { timestamps: true }
);

userSchema.index({ username: 1 }, { unique: true, sparse: true });

const User = mongoose.model("User", userSchema);

export default User;
