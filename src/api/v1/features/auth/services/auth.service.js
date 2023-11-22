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
  generateChangeEmailToken,
  generateRefreshToken,
} from "../../../../../helpers/token.js";
import USER_ROLE from "../../../../../constants/userRole.js";
import { removeLocalFile } from "../../../../../helpers/filePath.js";
import sendEmail from "../../../../../utils/sendEmail.js";
import generateRandomOtp from "../../../../../helpers/generateRandomOtp.js";
import TOKEN_TYPE from "../../../../../constants/tokenType.js";
import { jwtChangeEmailDecode } from "../../../../../helpers/tokenDecode.js";

// client url will be useful when we use react
const { clientUrl } = config;

class AuthService {
  createUser = async (userInfo) => {
    // 1. extract all info
    const { userName, email, password } = userInfo;

    // 2. check if user already exist with email id or userName
    const prevUser = await User.findOne({
      $or: [{ email }, { userName }],
    });
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
      password: hashedPassword,
    });

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

    const verifyLink = `${clientUrl}/auth/verify-user?token=${verifyStr}&userId=${user._id}`;
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

  getUserInfo = async (userId) => {
    return await User.findOne({ _id: new ObjectId(userId) });
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

        const verifyLink = `${clientUrl}/auth/verify-user?token=${verifyStr}&userId=${user._id}`;
        const mailContent = {
          body: `<div>
      <h1>Welcome to next generation Authentication app</h1>
      <a href=${verifyLink}>Click here to verify</a>
    </div>`,
        };

        sendEmail(user.email, "Registration Successful", mailContent);
      }
      throw new CustomError(
        "Please verify first to login, verification link has been sended to your email id",
        STATUS_CODE.FORBIDDEN
      );
    }

    // for now not useful
    if (user.disable) {
      throw new CustomError("Please contact admin", STATUS_CODE.FORBIDDEN);
    }

    // updating last logged in time
    user.lastLoggedInAt = Date.now();
    await user.save();

    // generate access and refresh token and return it
    const payload = {
      userId: user._id.toString(),
      email,
    };
    // console.log(payload);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.password = undefined;

    return { accessToken, refreshToken, userInfo: user };
  };

  updateUser = async (userId, userInfo) => {
    const { userName } = userInfo;

    const prevUser = await User.findOne({
      userName,
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

      if (currentUserAvatar.avatar) {
        removeLocalFile(currentUserAvatar.avatar.localPath);
      }
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
      // throw new CustomError("Email does not exist", STATUS_CODE.NOT_FOUND);
      return { resetPasswordLink: null, otp: null };
    }

    // if token is already there first delete token
    let token = await Token.findOne({
      userId: user._id,
      tokenType: TOKEN_TYPE.RESET_PASSWORD,
    });
    if (token) await token.deleteOne();

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

    const resetPasswordLink = `${clientUrl}/auth/password-reset?token=${resetStr}&id=${user._id}`;
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
      { password: hashedPass, passwordUpdatedAt: Date.now() },
      { new: true }
    );

    // delete token
    await passwordResetToken.deleteOne();
    return true;
  };

  deleteUser = async (email, password) => {
    // find user in DB with email id
    const user = await User.findOne({ email });

    if (!user) {
      throw new CustomError("User does not exist", STATUS_CODE.NOT_FOUND);
    }

    const isPasswordValid = await decryptPassword(password, user.password);

    // match the password
    if (!(user && isPasswordValid)) {
      throw new CustomError("password is not valid", STATUS_CODE.BAD_REQUEST);
    }
    // if found correct delete that user
    const response = await User.findOneAndDelete({ _id: user._id });
    console.log("Deleted User Info", response);

    // find session with user id
    const query = { "session.userId": response._id.toString() };

    // if found then delete user session
    const allSessions = await Session.deleteMany(query);
    // console.log("Deleted Sessions Info",allSessions);

    response.password = undefined;
    return response;
  };

  changePassword = async (userId, password, newPassword, currentSessionId) => {
    // find user
    const user = await User.findOne({ _id: new ObjectId(userId) });

    // check password
    const isPasswordMatch = await decryptPassword(password, user.password);

    if (!isPasswordMatch) {
      throw new CustomError("Password is incorrect", STATUS_CODE.BAD_REQUEST);
    }

    // hash new password
    const hashedPassword = await encryptPassword(newPassword);

    // save new password and update password updated at
    const update = await User.updateOne(
      { _id: user._id },
      {
        password: hashedPassword,
        passwordUpdatedAt: Date.now(),
      }
    );
    console.log(update);

    // delete all sessions except current session
    // find session with user id
    const query = {
      "session.userId": user._id.toString(),
      _id: { $ne: currentSessionId }, // Exclude the current session
    };

    // if found then delete user session
    const allSessions = await Session.deleteMany(query);
    console.log("Deleted Sessions Info", allSessions);

    return true;
  };

  sendChangeEmailLink = async (userId, email) => {
    const user = await User.findOne({ _id: new ObjectId(userId) });

    await Token.findOneAndDelete({
      userId: new ObjectId(userId),
      tokenType: TOKEN_TYPE.RESET_EMAIL,
    });

    const currentEmail = user.email;

    const payload = {
      fromEmail: currentEmail,
      toEmail: email,
    };
    const encodedToken = generateChangeEmailToken(payload);

    const token = new Token({
      userId,
      token: encodedToken,
      tokenType: TOKEN_TYPE.RESET_EMAIL,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    });

    await token.save();

    const changeLink = `${clientUrl}/auth/change-email?token=${encodedToken}&userId=${userId}`;

    // send mail
    const mailContent = {
      body: `<h1>Email reset link</h1> <a href=${changeLink}>Click here to set password</a>`,
    };
    // send email with link
    sendEmail(email, "Email Change", mailContent);

    return changeLink;
  };

  changeEmail = async (userId, changeEmailToken, currentSessionId) => {
    // check user
    const user = await User.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new CustomError("User not found", STATUS_CODE.NOT_FOUND);
    }

    // find token
    const token = await Token.findOne({
      userId: new ObjectId(userId),
      tokenType: TOKEN_TYPE.RESET_EMAIL,
      token: changeEmailToken,
    });

    if (!token) {
      throw new CustomError("token Expired or invalid", STATUS_CODE.NOT_FOUND);
    }

    // extract value from token
    const decodeToken = jwtChangeEmailDecode(token.token);
    console.log("Change email info", decodeToken);
    const targetEmail = decodeToken.toEmail;

    // change email
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        email: targetEmail,
      },
      { new: true, runValidators: true }
    );
    updatedUser.password = undefined;

    await token.deleteOne();

    // delete all sessions except current session
    // find session with user id
    const query = {
      "session.userId": user._id.toString(),
      _id: { $ne: currentSessionId }, // if required Exclude the current session
    };

    // if found then delete user session
    const allSessions = await Session.deleteMany(query);
    // console.log("Deleted Sessions Info", allSessions);

    // return changed user info
    return updatedUser;
  };
}

const authService = new AuthService();
export default authService;
