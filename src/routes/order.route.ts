import * as express from "express";
import { authentification } from "../middlewares/auth.middleware";
import { OrderController } from "../controllers/order.controller.entity";
import { authorization } from "../middlewares/role.middleware";

const Router = express.Router();

Router.post("/create", authentification, authorization(["client"]), OrderController.createOrder);
Router.get("/all", authentification, authorization(["admin"]),OrderController.getAllOrders);
Router.get("/myorders", authentification, authorization(["client"]), OrderController.getUserOrders);
Router.get("/:id", authentification, authorization(["client","admin"]), OrderController.getOrderById);
Router.put("/:id", authentification,  authorization(["admin"]),OrderController.updateOrder); // Route pour mettre à jour une commande

export { Router as orderRouter };