import { body, validationResult } from "express-validator";
import asyncHandler from "express-async-handler";

import STATUS_CODE from "../../../../../constants/statusCode.js";
import { CustomError } from "../../../../common/middlewares/error.middleware.js";

const resetPasswordValidator = asyncHandler(async (req, res, next) => {
  const rules = [
    body("token").trim().notEmpty().withMessage("token is required"),
    body("otp").trim().notEmpty().withMessage("otp is required"),
    body("userId").trim().notEmpty().withMessage("userId is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
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

export default resetPasswordValidator;
