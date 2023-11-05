import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      trim: true,
      lowercase: true,
      minLength: 5,
      maxLength: 25,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email id!`,
      },
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImgUrl: {
      url: String,
    },
    lastLoggedInAt: {
      type: Date,
    },
    passwordUpdatedAt: {
      type: Date,
    },
    role: {
      type: String,
      enum: ["USER"],
      default: "USER",
    },
    disable: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
