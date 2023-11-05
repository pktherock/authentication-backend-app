import STATUS_CODE from "../../../../../constants/statusCode.js";
import destroySession from "../../../../../helpers/destroySession.js";
import sendEmail from "../../../../../utils/sendEmail.js";
import { CustomError } from "../../../../common/middlewares/error.middleware.js";
import userService from "../services/user.service.js";
import asyncHandler from "express-async-handler";

class AuthController {
  postLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const token = await userService.loginUser({ email, password });

    // set access token and refresh token in session
    const { accessToken, refreshToken, userId } = token;

    req.session.accessToken = accessToken;
    req.session.refreshToken = refreshToken;
    req.session.userId = userId;

    // if you are creating Only API then return this
    return res
      .status(STATUS_CODE.OK)
      .json({ message: "Successfully Logged In", ...token });
  });

  postRegister = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body;

    const newUser = await userService.createUser({ userName, email, password });

    sendEmail(
      newUser.email,
      "Registration Successful",
      "Welcome to next generation employee review system app"
    );

    // if you are creating Only API then return this
    return res
      .status(STATUS_CODE.CREATED)
      .json({ message: "user created", user: newUser });
  });

  getUserVerificationStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const isVerified = await userService.verificationStatus(userId);

    return res.status(STATUS_CODE.OK).json({
      success: true,
      isVerified,
    });
  });

  postUserVerificationStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const verifiedUser = await userService.verifyUser(userId);

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

  postUpdateUser = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { userName, email } = req.body;
    // if nothing is passed then return from here
    if (!(userName || email)) {
      throw new CustomError(
        "userName or email is required to update",
        STATUS_CODE.BAD_REQUEST
      );
    }

    const updateInfo = { userName, email };

    Object.keys(updateInfo).forEach((key) => {
      // todo utils
      if (req.body[key] === undefined) {
        // If the value is undefined, delete the key from req.body
        delete updateInfo[key];
      }
    });

    const updateUser = await userService.updateUser(userId, updateInfo);

    return res.status(STATUS_CODE.OK).json(updateUser);
  });

  postRequestResetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      throw new CustomError(
        "email is required to reset password",
        STATUS_CODE.BAD_REQUEST
      );
    }

    const resetLink = await userService.requestPasswordReset(email);

    return res.status(STATUS_CODE.OK).json({ success: true, resetLink });
  });

  getResetPasswordTokenValidity = asyncHandler(async (req, res) => {
    const { token, userId } = req.query;
    if (!(token && userId)) {
      throw new CustomError(
        "token and userId in query params is mandatory",
        STATUS_CODE.BAD_REQUEST
      );
    }

    const tokenValid = await userService.isResetPasswordTokenValid(
      token,
      userId
    );

    return res.status(STATUS_CODE.OK).json({ success: true, tokenValid });
  });

  postResetPassword = asyncHandler(async (req, res) => {
    const { token, userId, password } = req.body;
    const success = await userService.resetPassword({
      token,
      userId,
      password,
    });

    return res.status(STATUS_CODE.OK).json({
      success,
      message:
        "Password reset was successful, please login with you new password",
    });
  });

  postDeleteUser = asyncHandler(async (req, res) => {
    const { email } = req.user;
    const { password } = req.body;
    if (!password) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: "password is required." });
    }

    const deletedUser = await userService.deleteUser(email, password);
    await destroySession(req);
    res.clearCookie("connect.sid");

    return res.status(STATUS_CODE.OK).json(deletedUser);
  });
}

const authController = new AuthController();

export default authController;
