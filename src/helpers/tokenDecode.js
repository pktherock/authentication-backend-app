import jwt from "jsonwebtoken";
import config from "../config/config.js";

const { jwtAccessSecret, jwtRefreshSecret, jwtChangeEmailSecret } = config;

const jwtAccessDecode = (token) => {
  try {
    const payload = jwt.verify(token, jwtAccessSecret);
    return payload;
  } catch (error) {
    throw error;
  }
};

const jwtRefreshDecode = (token) => {
  try {
    const payload = jwt.verify(token, jwtRefreshSecret);
    return payload;
  } catch (error) {
    throw error;
  }
};

const jwtChangeEmailDecode = (token) => {
  try {
    const payload = jwt.verify(token, jwtChangeEmailSecret);
    return payload;
  } catch (error) {
    throw error;
  }
};

export { jwtAccessDecode, jwtRefreshDecode, jwtChangeEmailDecode };
