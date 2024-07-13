import * as express from "express";
import { CategoryController } from "../controllers/category.controller";
import { authentification } from "../middlewares/auth.middleware";
import { authorization } from "../middlewares/role.middleware";

const Router = express.Router();

Router.post("/create",authentification, authorization(["admin"]), CategoryController.createCategory);
Router.get("/all", CategoryController.getAllCategories);
Router.put("/update/:id", authentification, authorization(["admin"]),CategoryController.updateCategory);
Router.delete("/delete/:id", authentification, authorization(["admin"]),CategoryController.deleteCategory);

export { Router as categoryRouter };
