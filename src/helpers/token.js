import jwt from "jsonwebtoken";
import config from "../config/config.js";

const {
  jwtAccessSecret,
  jwtRefreshSecret,
  jwtAccessTimeOut,
  jwtRefreshTimeOut,
  jwtChangeEmailSecret,
} = config;

const generateAccessToken = (payload) => {
  const token = jwt.sign(payload, jwtAccessSecret, {
    expiresIn: jwtAccessTimeOut, // 15 min
  });
  return token;
};

const generateRefreshToken = (payload) => {
  const token = jwt.sign(payload, jwtRefreshSecret, {
    expiresIn: jwtRefreshTimeOut, // 1 day
  });

  return token;
};

const generateChangeEmailToken = (payload) => {
  const token = jwt.sign(payload, jwtChangeEmailSecret, {
    expiresIn: "15m", // 15 min
  });

  return token;
};

export { generateAccessToken, generateRefreshToken, generateChangeEmailToken };
