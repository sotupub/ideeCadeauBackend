import * as express from "express";
import { authentification } from "../middlewares/auth.middleware";
import { OrderController } from "../controllers/order.controller";
import { authorization } from "../middlewares/role.middleware";

const Router = express.Router();

Router.get('/best-sellers', authentification, authorization(["admin"]), OrderController.getTopSellers);
Router.get('/monthly-sales', authentification, authorization(["admin"]),OrderController.getMonthlySalesStatistics);
Router.post("/create", authentification, authorization(["client"]), OrderController.createOrder);
Router.get("/all", authentification, authorization(["admin"]),OrderController.getAllOrders);
Router.get("/myorders", authentification, authorization(["client"]), OrderController.getUserOrders);
Router.get("/:id", authentification, authorization(["client","admin"]), OrderController.getOrderById);
Router.get("/review/:id", authentification, authorization(["client","admin"]), OrderController.getOrderForReview);
Router.put("/:id", authentification, authorization(["admin"]),OrderController.updateOrderStatus); 
Router.get('/track/:id', OrderController.TrackOrder);
Router.get('/client-orders/:id', authentification, authorization(["admin"]), OrderController.getClientOrders);
Router.put('/order-items/:orderItemId', authentification, authorization(["admin"]), OrderController.updateOrderItemQuantity);
export { Router as orderRouter };
