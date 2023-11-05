import asyncHandler from "express-async-handler";
import regenerateSession from "../../../../../helpers/regenerateSession.js";

// function to check if already logged and again trying to logging in, then destroy previous session and call next() regenerate new session with both token;
const isLoggedIn = asyncHandler(async (req, res, next) => {
  const { accessToken, refreshToken } = req.session;
  if (accessToken && refreshToken) {
    await regenerateSession(req);
    console.log("Previous session destroyed..");
  }

  return next();
});

export default isLoggedIn;
