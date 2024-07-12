import * as express from "express";
import { AuthController } from "../controllers/auth.controller";

const Router = express.Router();

Router.post("/login", AuthController.login);
Router.post("/signup", AuthController.signup);


export { Router as authRouter };