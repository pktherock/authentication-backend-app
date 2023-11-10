import asyncHandler from "express-async-handler";

import { CustomError } from "../../../../common/middlewares/error.middleware.js";
import destroySession from "../../../../../helpers/destroySession.js";
import sendEmail from "../../../../../utils/sendEmail.js";
import ApiResponse from "../../../../../utils/ApiResponse.js";
import STATUS_CODE from "../../../../../constants/statusCode.js";
import authService from "../services/auth.service.js";

class AuthController {
  postLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const token = await authService.loginUser({ email, password });

    // set access token and refresh token in session
    const { accessToken, refreshToken, userId } = token;

    req.session.accessToken = accessToken;
    req.session.refreshToken = refreshToken;
    req.session.userId = userId;

    // if you are creating Only API then return this

    const response = new ApiResponse(
      STATUS_CODE.OK,
      token,
      "Successfully Logged In..."
    );
    return res.status(STATUS_CODE.OK).json(response);
  });

  postRegister = asyncHandler(async (req, res) => {
    const { userName, email, gender, password } = req.body;

    const { user, verifyLink } = await authService.createUser({
      userName,
      email,
      gender,
      password,
    });

    // if you are creating Only API then return this
    return res
      .status(STATUS_CODE.CREATED)
      .json({ message: "user created", user, verifyLink });
  });

  getUserVerificationStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const isVerified = await authService.verificationStatus(userId);

    return res.status(STATUS_CODE.OK).json({
      success: true,
      isVerified,
    });
  });

  postUserVerificationStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { token } = req.query;
    console.log(token);

    if (!token) {
      throw new CustomError("token is required", STATUS_CODE.BAD_REQUEST);
    }
    const verifiedUser = await authService.verifyUser(userId, token);

    return res.status(STATUS_CODE.OK).json(verifiedUser);
  });

  postLogoutUser = asyncHandler(async (req, res) => {
    const { accessToken, refreshToken } = req.session;
    if (!(accessToken && refreshToken)) {
      throw new CustomError("login first to logout", STATUS_CODE.BAD_REQUEST);
    }

    await destroySession(req);
    res.clearCookie("connect.sid");
    console.log("User logged out successfully.. ✅");
    console.log("Session destroyed successfully.. ✅");
    return res.status(STATUS_CODE.OK).json({ message: "logout successfully" });
  });

  patchUpdateUser = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { userName, gender } = req.body;

    let avatar;
    if (req.file) {
      // extract file info and create one object with imageUrl and localPath
      const image = req.file;
      const imageUrl = getStaticFilePath(req, image.filename);
      const imageLocalPath = getLocalPath(image.filename);
      avatar = { url: imageUrl, localPath: imageLocalPath };
      req.body.avatar = avatar;
      console.log("This is a avatar:", avatar);
    }

    // if nothing is passed then return from here
    // todo put this code inside validator
    if (!(userName  || gender || avatar)) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Please provide username, gender, or image to update",
      });
    }

    const updateInfo = { userName, gender, avatar };

    Object.keys(updateInfo).forEach((key) => {
      // todo utils
      if (req.body[key] === undefined) {
        // If the value is undefined, delete the key from req.body
        delete updateInfo[key];
      }
    });

    const updatedUser = await authService.updateUser(userId, updateInfo);

    return res.status(STATUS_CODE.OK).json(updatedUser);
  });

  postRequestResetPassword = asyncHandler(async (req, res) => {
    // validator not required
    const { email } = req.body;
    if (!email) {
      throw new CustomError(
        "email is required to reset password",
        STATUS_CODE.BAD_REQUEST
      );
    }

    const resetInfo = await authService.requestPasswordReset(email);

    return res.status(STATUS_CODE.OK).json({ success: true, resetInfo });
  });

  getResetPasswordTokenValidity = asyncHandler(async (req, res) => {
    // validator not required
    const { token, userId } = req.query;
    if (!(token && userId)) {
      throw new CustomError(
        "token and userId in query params is mandatory",
        STATUS_CODE.BAD_REQUEST
      );
    }

    const tokenValid = await authService.isResetPasswordTokenValid(
      token,
      userId
    );

    return res.status(STATUS_CODE.OK).json({ success: true, tokenValid });
  });

  postResetPassword = asyncHandler(async (req, res) => {
    const { token, userId, otp, password } = req.body;
    const success = await authService.resetPassword({
      token,
      userId,
      otp,
      password,
    });

    return res.status(STATUS_CODE.OK).json({
      success,
      message:
        "Password reset was successful, please login with you new password",
    });
  });

  deleteUser = asyncHandler(async (req, res) => {
    const { email } = req.user;
    const { password } = req.body;
    if (!password) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: "password is required." });
    }

    const deletedUser = await authService.deleteUser(email, password);
    await destroySession(req);
    res.clearCookie("connect.sid");

    return res.status(STATUS_CODE.OK).json(deletedUser);
  });

  postChangePassword = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { password, newPassword } = req.body;
    const sessionId = req.sessionID;
    if (!(password && newPassword)) {
      throw new CustomError(
        "password and newPassword is required",
        STATUS_CODE.BAD_REQUEST
      );
    }

    if (password === newPassword) {
      throw new CustomError(
        "both password should not be same",
        STATUS_CODE.BAD_REQUEST
      );
    }
    await authService.changePassword(userId, password, newPassword, sessionId);

    return res
      .status(STATUS_CODE.OK)
      .json({ success: true, message: "password updated successfully" });
  });

  postChangeEmailRequest = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { email } = req.body;
    if (!email) {
      throw new CustomError("email is required", STATUS_CODE.BAD_REQUEST);
    }

    const changeEmailLink = await authService.sendChangeEmailLink(
      userId,
      email
    );

    return res.status(STATUS_CODE.OK).json({
      success: true,
      message: "email update link has been sended to your new email id",
      changeEmailLink,
    });
  });

  postChangeEmail = asyncHandler(async (req, res) => {
    const { token, userId } = req.body;
    const sessionId = req.sessionID;
    if (!(token && userId)) {
      throw new CustomError(
        "token and userId is required",
        STATUS_CODE.BAD_REQUEST
      );
    }
    const updatedUser = await authService.changeEmail(userId, token, sessionId);

    return res.status(STATUS_CODE.OK).json({
      success: true,
      message: "email updated successfully",
      user: updatedUser,
    });
  });
}

const authController = new AuthController();

export default authController;
