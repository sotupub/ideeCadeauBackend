import * as express from "express";
import { authentification } from "../middlewares/auth.middleware";
import { authorization } from "../middlewares/role.middleware";
import { WidgetController } from "../controllers/widget.controller";

const Router = express.Router();

Router.post("/create", WidgetController.createWidget);
Router.get("/getall", WidgetController.getAllWidgets);
Router.put("/update/:id", WidgetController.updateWidget);
Router.delete("/delete", WidgetController.deleteMultipleWidgets);
Router.get("/:id", WidgetController.getWidgetById);


export { Router as widgetRouter };
