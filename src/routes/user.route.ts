import * as express from "express";
import { UserController } from "../controllers/user.controller";
import { authentification } from "../middlewares/auth.middleware";
import { authorization } from "../middlewares/role.middleware";

const Router = express.Router();

Router.get("/getall", authentification, authorization(["admin"]), UserController.getAllUsers);
Router.get("/getprofile", authentification, UserController.getProfile);
Router.get("/updateprofile", authentification, UserController.updateProfile);
Router.put("/resetpassword", authentification, UserController.resetPassword);


export { Router as userRouter };