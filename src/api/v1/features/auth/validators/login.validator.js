import { body, validationResult } from "express-validator";
import STATUS_CODE from "../../../../../constants/statusCode.js";

const loginValidator = async (req, res, next) => {
  const rules = [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),

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

export default loginValidator;
