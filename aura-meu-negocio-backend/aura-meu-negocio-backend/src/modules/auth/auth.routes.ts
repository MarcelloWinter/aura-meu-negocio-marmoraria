import { Router } from "express";
import * as authController from "./auth.controller";

const router = Router();

router.post(
	"/login",
	authController.login
);

router.post(
	"/forgot-password",
	authController.forgotPassword
);

router.post(
	"/send-reset-code",
	authController.sendResetCode
);

router.post(
	"/verify-code",
	authController.verifyCode
);

router.post(
	"/reset-password",
	authController.resetPassword
);

export default router;