import asyncHandler from "express-async-handler";
import { CustomError } from "../../../../common/middlewares/error.middleware.js";
import STATUS_CODE from "../../../../../constants/statusCode.js";

const canResetPassword = asyncHandler(async (req, res, next) => {
  const { accessToken, refreshToken } = req.session;

  if (accessToken && refreshToken) {
    throw new CustomError(
      "Logged in user is not allowed to do this operation",
      STATUS_CODE.NOT_ALLOWED
    );
  }

  return next();
});

export default canResetPassword;
