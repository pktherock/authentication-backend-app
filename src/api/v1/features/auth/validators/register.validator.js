import { body, validationResult } from "express-validator";
import asyncHandler from "express-async-handler";

import STATUS_CODE from "../../../../../constants/statusCode.js";
import { CustomError } from "../../../../common/middlewares/error.middleware.js";

const registerValidator = asyncHandler(async (req, res, next) => {
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
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .withMessage(
        "Password : Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character:"
      ),
  ];

  await Promise.all(rules.map((rule) => rule.run(req)));

  const validationErrors = validationResult(req);

  // if error is there then isEmpty will give false
  if (!validationErrors.isEmpty()) {
    // Get the first validation error from the array
    const firstError = validationErrors.array()[0];
    throw new CustomError(firstError.msg, STATUS_CODE.BAD_REQUEST);
  }

  return next();
});

export default registerValidator;
