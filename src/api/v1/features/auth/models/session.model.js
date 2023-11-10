import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  { _id: String },
  { timestamps: true, _id: false }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
