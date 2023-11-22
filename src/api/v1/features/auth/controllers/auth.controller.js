import asyncHandler from "express-async-handler";

import { CustomError } from "../../../../common/middlewares/error.middleware.js";
import destroySession from "../../../../../helpers/destroySession.js";
import ApiResponse from "../../../../../utils/ApiResponse.js";
import STATUS_CODE from "../../../../../constants/statusCode.js";
import authService from "../services/auth.service.js";
import {
  getLocalPath,
  getStaticFilePath,
} from "../../../../../helpers/filePath.js";

class AuthController {
  postLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const token = await authService.loginUser({ email, password });

    // set access token and refresh token in session
    const { accessToken, refreshToken, userInfo } = token;

    req.session.accessToken = accessToken;
    req.session.refreshToken = refreshToken;
    req.session.userId = userInfo._id.toString();

    const response = new ApiResponse(
      STATUS_CODE.OK,
      token,
      "Successfully Logged In..."
    );

    return res.status(STATUS_CODE.OK).json(response);
  });

  getUserSession = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { accessToken, refreshToken } = req.session;

    const user = await authService.getUserInfo(userId);

    const response = new ApiResponse(
      STATUS_CODE.OK,
      {
        accessToken,
        refreshToken,
        userInfo: user,
      },
      "User info fetched"
    );

    return res.status(STATUS_CODE.OK).json(response);
  });

  postRegister = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body;

    const { user, verifyLink } = await authService.createUser({
      userName,
      email,
      password,
    });

    const response = new ApiResponse(
      STATUS_CODE.CREATED,
      { user, verifyLink },
      "user created"
    );

    return res.status(STATUS_CODE.CREATED).json(response);
  });

  getUserVerificationStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const isVerified = await authService.verificationStatus(userId);

    const response = new ApiResponse(
      STATUS_CODE.OK,
      { isVerified },
      "User verification"
    );

    return res.status(STATUS_CODE.OK).json(response);
  });

  postUserVerificationStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { token } = req.body;

    if (!token) {
      throw new CustomError("token is required", STATUS_CODE.BAD_REQUEST);
    }
    const verifiedUser = await authService.verifyUser(userId, token);

    const response = new ApiResponse(
      STATUS_CODE.OK,
      { userInfo: verifiedUser },
      "User verified successfully"
    );

    return res.status(STATUS_CODE.OK).json(response);
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

    const response = new ApiResponse(
      STATUS_CODE.OK,
      null,
      "logout successfully"
    );
    return res.status(STATUS_CODE.OK).json(response);
  });

  patchUpdateUser = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { userName, gender, phoneNumber, dateOfBirth } = req.body;

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
    if (!(userName || gender || phoneNumber || dateOfBirth || avatar)) {
      throw new CustomError(
        "Please provide userName, gender, phoneNumber or imageUrl to update",
        STATUS_CODE.BAD_REQUEST
      );
    }

    const updateInfo = { userName, gender, phoneNumber, dateOfBirth, avatar };

    Object.keys(updateInfo).forEach((key) => {
      // todo utils
      if (req.body[key] === undefined || req.body[key] === "") {
        // If the value is undefined, delete the key from req.body
        delete updateInfo[key];
      }
    });

    const updatedUser = await authService.updateUser(userId, updateInfo);

    const response = new ApiResponse(
      STATUS_CODE.OK,
      updatedUser,
      "User updated successfully"
    );

    return res.status(STATUS_CODE.OK).json(response);
  });

  postRequestResetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      throw new CustomError(
        "email is required to reset password",
        STATUS_CODE.BAD_REQUEST
      );
    }

    const resetInfo = await authService.requestPasswordReset(email);

    const response = new ApiResponse(
      STATUS_CODE.OK,
      resetInfo,
      "Reset password email sended successfully"
    );

    return res.status(STATUS_CODE.OK).json(response);
  });

  getResetPasswordTokenValidity = asyncHandler(async (req, res) => {
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

    const response = new ApiResponse(
      STATUS_CODE.OK,
      { tokenValid },
      "Token validity fetched"
    );

    return res.status(STATUS_CODE.OK).json(response);
  });

  postResetPassword = asyncHandler(async (req, res) => {
    const { token, userId, otp, password } = req.body;
    await authService.resetPassword({
      token,
      userId,
      otp,
      password,
    });

    const response = new ApiResponse(
      STATUS_CODE.OK,
      null,
      "Password reset was successful, please login with you new password"
    );

    return res.status(STATUS_CODE.OK).json(response);
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

    const response = new ApiResponse(
      STATUS_CODE.OK,
      deletedUser,
      "User deleted successfully"
    );

    return res.status(STATUS_CODE.OK).json(response);
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

    const response = new ApiResponse(
      STATUS_CODE.OK,
      null,
      "password updated successfully"
    );

    return res.status(STATUS_CODE.OK).json(response);
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

    const response = new ApiResponse(
      STATUS_CODE.OK,
      { changeEmailLink },
      "email update link has been sended to your new email id"
    );

    return res.status(STATUS_CODE.OK).json(response);
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
    // destroy current session as well
    await destroySession(req);

    const response = new ApiResponse(
      STATUS_CODE.OK,
      updatedUser,
      "email updated successfully"
    );

    return res.status(STATUS_CODE.OK).json(response);
  });
}

const authController = new AuthController();

export default authController;
