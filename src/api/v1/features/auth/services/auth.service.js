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
import { removeLocalFile } from "../../../../../helpers/filePath.js";
import sendEmail from "../../../../../utils/sendEmail.js";
import generateRandomOtp from "../../../../../helpers/generateRandomOtp.js";
import TOKEN_TYPE from "../../../../../constants/tokenType.js";

// client url will be useful when we use react
const { clientUrl } = config;

class AuthService {
  createUser = async (userInfo) => {
    // 1. extract all info
    const { userName, email, gender, password } = userInfo;

    // 2. check if user already exist with email id or userName
    const prevUser = await User.findOne({ $or: [{ email }, { userName }] });
    // console.log("Prev User", prevUser);

    if (prevUser) {
      throw new CustomError("User already exist", STATUS_CODE.CONFLICT);
    }

    // 2. hash the password
    const hashedPassword = await encryptPassword(password);

    // 3. create user object
    const user = new User({
      userName,
      email,
      gender,
      password: hashedPassword,
    });
    user.role = USER_ROLE.USER;

    // 4. save user
    await user.save();
    // console.log("new User", user);

    // 5. send verification link
    const verifyStr = randomBytes(32).toString("hex");
    // hashing string
    // this operation is same type of password hashing
    const hashedStr = await encryptPassword(verifyStr);

    // after 1 day min token will expire
    const token = new Token({
      userId: user._id,
      token: hashedStr,
      tokenType: TOKEN_TYPE.VERIFY_USER,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hr
    });

    await token.save();

    console.log("verify user token", token);

    const verifyLink = `${clientUrl}/verify-user?token=${verifyStr}&userId=${user._id}`;
    const mailContent = {
      body: `<div>
      <h1>Welcome to next generation Authentication app</h1>
      <a href=${verifyLink}>Click here to verify</a>
    </div>`,
    };

    sendEmail(user.email, "Registration Successful", mailContent);

    // 6. return user
    user.password = undefined; // remove password filed while returning
    return { user, verifyLink };
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

  verifyUser = async (userId, token) => {
    // validate verify token
    const verifyToken = await Token.findOne({
      userId: new ObjectId(userId),
      tokenType: TOKEN_TYPE.VERIFY_USER,
    });

    if (!verifyToken) {
      throw new CustomError(
        "verify token expired, please login again to get verification link",
        STATUS_CODE.NOT_FOUND
      );
    }

    const isTokenValid = await decryptPassword(token, verifyToken.token);

    if (!isTokenValid) {
      throw new CustomError("Invalid token", STATUS_CODE.BAD_REQUEST);
    }

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

    await verifyToken.deleteOne();

    // user.verified = true;
    // await user.save();

    user.password = undefined;

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

    if (!user.verified) {
      // if token exists in db first delete that
      const verifyToken = await Token.findOne({
        userId: user._id,
        tokenType: TOKEN_TYPE.VERIFY_USER,
      });
      console.log("token already valid and exists, check email");
      if (!verifyToken) {
        //  send verification link
        const verifyStr = randomBytes(32).toString("hex");
        // hashing string
        // this operation is same type of password hashing
        const hashedStr = await encryptPassword(verifyStr);

        // after 1 day min token will expire
        const token = new Token({
          userId: user._id,
          token: hashedStr,
          tokenType: TOKEN_TYPE.VERIFY_USER,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hr
        });

        await token.save();

        console.log("verify user token", token);

        const verifyLink = `${clientUrl}/verify-user?token=${verifyStr}&userId=${user._id}`;
        const mailContent = {
          body: `<div>
      <h1>Welcome to next generation Authentication app</h1>
      <a href=${verifyLink}>Click here to verify</a>
    </div>`,
        };

        sendEmail(user.email, "Registration Successful", mailContent);
      }
      throw new CustomError(
        "Please verify first to login",
        STATUS_CODE.FORBIDDEN
      );
    }

    // for now not useful
    if (user.disable) {
      throw new CustomError("Please contact admin", STATUS_CODE.FORBIDDEN);
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
    const { userName, email, gender } = userInfo;
    // todo change update email flow

    const prevUser = await User.findOne({
      $or: [{ email }, { userName }],
      _id: { $ne: new ObjectId(userId) }, // Exclude the current user by their ID
    });
    // console.log("Prev User", prevUser);

    if (prevUser) {
      throw new CustomError("User already exist", STATUS_CODE.CONFLICT);
    }
    // console.log(userInfo);
    // if user is updating avatar
    // if avatar is present in user document, then delete it from local server
    if (userInfo.avatar) {
      const currentUserAvatar = await User.findOne(
        { _id: userId },
        { avatar: 1 }
      );
      console.log("user avatar info:", currentUserAvatar);

      removeLocalFile(currentUserAvatar.avatar.localPath);
    }

    // update user
    const updatedUser = await User.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { ...userInfo },
      { new: true, runValidators: true }
    );

    // delete password while returning
    updatedUser.password = undefined;

    // return updated user
    return updatedUser;
  };

  requestPasswordReset = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new CustomError("Email does not exist", STATUS_CODE.NOT_FOUND);
    }

    // if token is already there first delete token
    let token = await Token.findOne({
      userId: user._id,
      tokenType: TOKEN_TYPE.RESET_PASSWORD,
    });
    if (token) await Token.deleteOne();

    const resetStr = randomBytes(32).toString("hex");
    // hashing string
    // this operation is same type of password hashing
    const hashedStr = await encryptPassword(resetStr);

    // requirement is to implement otp based password reset
    const resetOtp = generateRandomOtp().toString();
    // hashing otp
    // this operation same type of password hashing
    const hashedOtp = await encryptPassword(resetOtp);

    // after 30 min token will expire
    token = new Token({
      userId: user._id,
      token: hashedStr,
      tokenType: TOKEN_TYPE.RESET_PASSWORD,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    });

    await token.save();

    console.log("Reset password token", token);

    const resetPasswordLink = `${clientUrl}/password-reset?token=${resetStr}&id=${user._id}`;
    console.log(resetPasswordLink);

    const mailContent = {
      body: `<h1>Password reset link</h1> <p>Otp: ${resetOtp}</p> <a href=${resetPasswordLink}>Click here to set password</a>`,
    };
    // send email with link
    sendEmail(email, "Forgot Password", mailContent);

    return { resetPasswordLink, otp: resetOtp };
  };

  isResetPasswordTokenValid = async (token, userId) => {
    // check if token exist into DB
    const passwordResetToken = await Token.findOne({
      userId: new ObjectId(userId),
      tokenType: TOKEN_TYPE.RESET_PASSWORD,
    });

    if (!passwordResetToken) {
      throw new CustomError(
        "Invalid or expired password reset token",
        STATUS_CODE.NOT_FOUND
      );
    }

    // compare token with DB token
    const isTokenValid = await decryptPassword(token, passwordResetToken.token);

    if (!isTokenValid) {
      throw new CustomError(
        "Invalid or token does'nt match",
        STATUS_CODE.NOT_FOUND
      );
    }

    return isTokenValid;
  };

  resetPassword = async (resetInfo) => {
    const { token, userId, otp, password } = resetInfo;
    // check if token exist into DB
    const passwordResetToken = await Token.findOne({
      userId: new ObjectId(userId),
      tokenType: TOKEN_TYPE.RESET_PASSWORD,
    });

    if (!passwordResetToken) {
      throw new CustomError(
        "Invalid or expired password reset token",
        STATUS_CODE.NOT_FOUND
      );
    }

    // compare token with DB token
    const isTokenValid = await decryptPassword(token, passwordResetToken.token);

    // compare otp with DB Otp
    const isOtpValid = await decryptPassword(otp, passwordResetToken.otp);

    if (!(isTokenValid && isOtpValid)) {
      throw new CustomError(
        "Invalid OTP or token does'nt match",
        STATUS_CODE.NOT_FOUND
      );
    }

    // encrypt the password
    const hashedPass = await encryptPassword(password);

    await User.updateOne(
      { _id: new ObjectId(userId) },
      { password: hashedPass },
      { new: true }
    );

    // delete token
    await passwordResetToken.deleteOne();
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

const authService = new AuthService();
export default authService;
