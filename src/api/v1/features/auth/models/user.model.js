import mongoose from "mongoose";
const avatarSchema = new mongoose.Schema(
  {
    url: String,
    localPath: String,
  },
  { _id: false }
);

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
    gender: {
      type: String,
      enum: {
        values: ["M", "F", "O"],
        message: "Gender should be either M , F, O",
      }
    },
    avatar: avatarSchema,
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
    phoneNumber: {
      type: String,
      trim: true,
      minLength: 10,
      maxLength: 10,
      unique: true, // Enforce uniqueness when phoneNumber is provided
      sparse: true, // Allows multiple documents to have a null value for phoneNumber
      validate: {
        validator: function (v) {
          return /^([987]{1})(\d{1})(\d{8})$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number`,
      },
    },
    dateOfBirth: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
