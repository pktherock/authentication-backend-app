import { randomBytes } from "node:crypto";

import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

import encryptPassword from "../../../../../helpers/encryptPassword.js";
import decryptPassword from "../../../../../helpers/decryptPassword.js";
import { CustomError } from "../../../../common/middlewares/error.middleware.js";
import STATUS_CODE from "../../../../../constants/statusCode.js";

import User from "../models/user.model.js";
import Token from "../models/token.model.js";
import Session from "../models/session.model.js";
import config from "../../../../../config/config.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../../../helpers/token.js";
import USER_ROLE from "../../../../../constants/userRole.js";

class UserService {
  createUser = async (userInfo) => {
    // 1. extract all info
    const { userName, email, password } = userInfo;

    // 2. check if user already exist with email id or userName
    const prevUser = await User.findOne({ $or: [{ email }, { userName }] });
    // console.log("Prev User", prevUser);

    if (prevUser) {
      throw new CustomError("User already exist", STATUS_CODE.CONFLICT);
    }

    // 2. hash the password
    const hashedPassword = await encryptPassword(password);

    // 3. create user object
    const user = new User({ userName, email, password: hashedPassword });
    user.role = USER_ROLE.DOCTOR;

    // 4. save user
    await user.save();
    // console.log("new User", user);

    // 5. return user
    user.password = undefined; // remove password filed while returning
    return user;
  };

  verificationStatus = async (userId) => {
    const user = await User.findOne({
      _id: userId,
    });

    if (!user) {
      throw new CustomError("No user found", STATUS_CODE.NOT_FOUND);
    }

    return user.verified;
  };

  verifyUser = async (userId) => {
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        verified: true,
      },
      { new: true }
    );

    if (!user) {
      throw new CustomError("No user found", STATUS_CODE.NOT_FOUND);
    }

    // user.verified = true;
    // await user.save();

    return user;
  };

  loginUser = async (userInfo) => {
    const { email, password } = userInfo;

    // 1. check if user exist
    const user = await User.findOne({ email });

    if (!user) {
      throw new CustomError("Invalid Credentials", STATUS_CODE.NOT_FOUND);
    }

    // 2. match the password
    const hashedPass = user.password;
    const isPassMatch = await decryptPassword(password, hashedPass);

    if (!isPassMatch) {
      throw new CustomError("Invalid Credentials", STATUS_CODE.NOT_FOUND);
    }

    // generate access and refresh token and return it
    const payload = {
      userId: user._id.toString(),
      email,
    };
    // console.log(payload);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return { accessToken, refreshToken, userId: user._id.toString() };
  };

  updateUser = async (userId, userInfo) => {
    const { userName, email } = userInfo;

    const prevUser = await User.findOne({
      $or: [{ email }, { userName }],
      _id: { $ne: new ObjectId(userId) }, // Exclude the current user by their ID
    });
    // console.log("Prev User", prevUser);

    if (prevUser) {
      throw new CustomError("User already exist", STATUS_CODE.CONFLICT);
    }

    // update user
    const updatedUser = await User.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: userInfo },
      { new: true }
    );

    // delete password while returning
    updatedUser.password = undefined;

    // return updated user
    return updatedUser;
  };

  requestPasswordReset = async (email) => {
    const user = await User.findOne({ email });
    // if (!user) throw new Error('Email does not exist');
    if (!user) {
      throw new CustomError("Email does not exist", STATUS_CODE.NOT_FOUND);
    }

    // if token is already there first delete token
    let token = await Token.findOne({ userId: user._id });
    if (token) await Token.deleteOne();

    const resetStr = randomBytes(32).toString("hex");
    // hashing string
    // this operation same type of password hashing
    const hash = await encryptPassword(resetStr);

    token = new Token({
      userId: user._id,
      token: hash,
    });

    await token.save();

    console.log("Reset password token", token);

    // client url will be useful when we use react
    const { clientUrl } = config;
    const resetPasswordLink = `${clientUrl}/password-reset?token=${resetStr}&id=${user._id}`;
    console.log(resetPasswordLink);

    // send email with link

    return resetPasswordLink;
  };

  isResetPasswordTokenValid = async (token, userId) => {
    // check if token exist into DB
    const passwordResetToken = await Token.findOne({
      userId: new ObjectId(userId),
    });

    if (!passwordResetToken) {
      throw new CustomError(
        "Invalid or expired password reset token",
        STATUS_CODE.NOT_FOUND
      );
    }

    // compare token with DB token
    const isValid = await decryptPassword(token, passwordResetToken.token);

    if (!isValid) {
      throw new CustomError(
        "Invalid or token does'nt match",
        STATUS_CODE.NOT_FOUND
      );
    }

    return isValid;
  };

  resetPassword = async (resetInfo) => {
    const { token, userId, password } = resetInfo;
    // check if token exist into DB
    const passwordResetToken = await Token.findOne({
      userId: new ObjectId(userId),
    });

    if (!passwordResetToken) {
      throw new CustomError(
        "Invalid or expired password reset token",
        STATUS_CODE.NOT_FOUND
      );
    }

    // compare token with DB token
    const isValid = await decryptPassword(token, passwordResetToken.token);

    if (!isValid) {
      throw new CustomError(
        "Invalid or token does'nt match",
        STATUS_CODE.NOT_FOUND
      );
    }

    // encrypt the password
    const hashedPass = await encryptPassword(password);

    await User.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedPass } },
      { new: true }
    );
    return true;
  };

  deleteUser = async (email, password) => {
    // find user in DB with email id
    const user = await User.findOne({ email });

    const isPasswordValid = await decryptPassword(password, user.password);

    // match the password
    if (!(user && isPasswordValid)) {
      throw new CustomError(
        "Token or password is not valid",
        STATUS_CODE.BAD_REQUEST
      );
    }

    // if found correct delete that user
    const response = await user.deleteOne();
    // console.log("Deleted User Info", response)

    // find session with user id
    const query = { "session.userId": response._id.toString() };

    // if found then delete user session
    const allSessions = await Session.deleteMany(query);
    // console.log("Deleted Sessions Info",allSessions);

    response.password = undefined;
    return response;
  };
}

const userService = new UserService();
export default userService;
