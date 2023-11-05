import { body, validationResult } from "express-validator";
import STATUS_CODE from "../../../../../constants/statusCode.js";

const registerValidator = async (req, res, next) => {
  const rules = [
    body("userName")
      .trim()
      .notEmpty()
      .withMessage("user name is required")
      .isLowercase()
      .withMessage("user name must be in lowercase")
      .isLength({ min: 5 })
      .withMessage("User name must be at least 5 characters long"),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),

    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("password must be at least length of 6"),
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

export default registerValidator;
