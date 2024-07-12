import * as express from "express";
import { AuthController } from "../controllers/auth.controller";
import { authentification } from "../middlewares/auth.middleware";

const Router = express.Router();

Router.post("/login", AuthController.login);
Router.post("/signup", AuthController.signup);


export { Router as authRouter };