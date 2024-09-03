import * as express from "express";
import { SubCategoryController } from "../controllers/subcategory.controller";
import { authentification } from "../middlewares/auth.middleware";
import { authorization } from "../middlewares/role.middleware";

const Router = express.Router();

Router.post("/create", authentification, authorization(["admin"]),SubCategoryController.createSubCategory);
Router.get("/all", SubCategoryController.getAllSubCategories);
Router.post('/by-categories', SubCategoryController.getSubCategoriesByCategories);
Router.put("/update/:id", authentification, authorization(["admin"]), SubCategoryController.updateSubCategory);
Router.delete("/delete/:id", authentification, authorization(["admin"]), SubCategoryController.deleteSubCategory);

export { Router as subCategoryRouter };
