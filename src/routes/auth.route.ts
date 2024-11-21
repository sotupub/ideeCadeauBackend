import * as express from "express";
import { AuthController } from "../controllers/auth.controller";

const Router = express.Router();

Router.post("/login", AuthController.login);
Router.post("/signup", AuthController.signup);
Router.post("/forget-password", AuthController.sendPasswordResetCode);
Router.post("/verify-reset-code", AuthController.verifyResetCode);
Router.post("/reset-password", AuthController.resetPassword);
Router.post("/verify-token", AuthController.verifyToken);

export { Router as authRouter };