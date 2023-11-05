import { compare } from "bcrypt";

const decryptPassword = async (password, encPassword) => {
  return await compare(password, encPassword);
};

export default decryptPassword;
