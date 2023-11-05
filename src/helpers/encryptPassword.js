import { genSalt, hash } from "bcrypt";
import config from "../config/config.js";

const encryptPassword = async (password) => {
  const { saltRounds } = config;
  const salt = await genSalt(saltRounds);
  const encPassword = await hash(password, salt);
  return encPassword;
};

export default encryptPassword;
