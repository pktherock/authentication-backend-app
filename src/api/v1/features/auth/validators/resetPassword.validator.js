import { body, validationResult } from "express-validator";
import STATUS_CODE from "../../../../../constants/statusCode.js";

const resetPassword = async (req, res, next) => {
  const rules = [
    body("token").trim().notEmpty().withMessage("token is required"),
    body("userId").trim().notEmpty().withMessage("userId is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ];

  await Promise.all(rules.map((rule) => rule.run(req)));

  const validationErrors = validationResult(req);

  // if error is there then isEmpty will give false
  if (!validationErrors.isEmpty()) {
    return res
      .status(STATUS_CODE.BAD_REQUEST)
      .json({ success: false, error: validationErrors.array() });
  }

  return next();
};

export default resetPassword;
