import * as express from "express";
import { ProductController } from "../controllers/product.controller";
import { authentification } from "../middlewares/auth.middleware";
import { authorization } from "../middlewares/role.middleware";

const Router = express.Router();

Router.post("/create", authentification, authorization(["admin"]), ProductController.createProduct);
Router.get("/getallvisible", ProductController.getAllVisibleProducts);
Router.get("/getall", authentification, authorization(["admin"]), ProductController.getAllProducts);
Router.put("/update/:id", authentification, authorization(["admin"]), ProductController.updateProduct);
Router.get("/filter",ProductController.getProductsByFilter);
Router.get("/search", ProductController.getProductsByName);
Router.delete("/delete/:id", authentification, authorization(["admin"]), ProductController.deleteProduct);
Router.get("/:id", ProductController.getProductById);
Router.delete('/delete',  authentification, authorization(["admin"]),ProductController.deleteMultipleProducts);


export { Router as productRouter };
