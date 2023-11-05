import { Router } from "express";

import authController from "../controllers/auth.controller.js";
import { loginValidator, registerValidator } from "../validators/index.js";
import isLoggedIn from "../middlewares/isLoggedIn.js";
import jwtAuth from "../../../middlewares/jwtAuth.middleware.js";
import resetPassword from "../validators/resetPassword.validator.js";

const authRouter = Router();

// /api/v1/auth

authRouter.post(
  "/register",
  registerValidator,
  isLoggedIn,
  authController.postRegister
);

authRouter.get(
  "/verify-user/:userId",
  authController.getUserVerificationStatus
);

authRouter.post(
  "/verify-user/:userId",
  authController.postUserVerificationStatus
);


authRouter.post("/login", isLoggedIn, loginValidator, authController.postLogin);

// note: important do not use get method to logout
authRouter.post("/logout", authController.postLogoutUser);

authRouter.patch("/update", jwtAuth, authController.postUpdateUser);

authRouter.post(
  "/request-reset-password",
  authController.postRequestResetPassword
);

authRouter.get("/token-validate", authController.getResetPasswordTokenValidity);

authRouter.patch(
  "/reset-password",
  resetPassword,
  authController.postResetPassword
);

authRouter.delete("/delete-user", jwtAuth, authController.postDeleteUser);

export default authRouter;
