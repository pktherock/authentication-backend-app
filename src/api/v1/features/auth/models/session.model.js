import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({});

const Session = mongoose.model("Session", sessionSchema);

export default Session;
