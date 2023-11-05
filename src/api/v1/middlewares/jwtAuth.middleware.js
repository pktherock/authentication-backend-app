import asyncHandler from "express-async-handler";

import { CustomError } from "../../common/middlewares/error.middleware.js";
import STATUS_CODE from "../../../constants/statusCode.js";
import {
  jwtAccessDecode,
  jwtRefreshDecode,
} from "../../../helpers/tokenDecode.js";
import { generateAccessToken } from "../../../helpers/token.js";
import destroySession from "../../../helpers/destroySession.js";

const jwtAuth = asyncHandler(async (req, res, next) => {
  const { accessToken, refreshToken } = req.session;
  // console.log(accessToken, refreshToken);

  // if not token, then stop here
  if (!(accessToken && refreshToken)) {
    await destroySession(req);
    res.clearCookie("connect.sid");
    throw new CustomError("Unauthorized access", STATUS_CODE.UNAUTHORIZED);
  }

  try {
    const decodedAccessToken = jwtAccessDecode(accessToken);
    req.user = decodedAccessToken;
    console.log("Access token is valid");
  } catch (error) {
    // if token is expired then reassign the access token and attach to the session
    console.log("Access token is expired");
    if (error.name === "TokenExpiredError") {
      try {
        // now verify the refresh token
        const decodedRefreshToken = jwtRefreshDecode(refreshToken);
        console.log("refresh token is valid");

        const payload = {
          userId: decodedRefreshToken.userId,
          email: decodedRefreshToken.email,
        };

        // generate new access token and attach to the session
        const newAccessToken = generateAccessToken(payload);
        req.session.accessToken = newAccessToken;

        req.user = payload;
        console.log("new Access token generated");
      } catch (error) {
        console.log("Refresh token expired");
        console.log(error);

        await destroySession(req);
        throw new CustomError(
          "Invalid or expired refresh token.",
          STATUS_CODE.UNAUTHORIZED
        );
      }
    } else {
      console.log("You are doing something wrong");
      await destroySession(req);
      throw new CustomError(
        "Bad Activity detected..✍️",
        STATUS_CODE.UNAUTHORIZED
      );
    }
  }

  return next();
});

export default jwtAuth;
