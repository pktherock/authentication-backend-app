import mongoose from "mongoose";
import { TOKEN_TYPES } from "../../../../../constants/tokenType.js";

const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    token: {
      type: String,
      require: true,
    },
    tokenType: {
      type: String,
      enum: TOKEN_TYPES,
      required: true,
    },
    otp: String,
    expiresAt: {
      type: Date,
      default: Date.now,
      expires: 0, // Set to 0 initially, which means the document won't expire automatically
    },
  },
  { timestamps: true }
);

const Token = mongoose.model("Token", tokenSchema);

export default Token;
