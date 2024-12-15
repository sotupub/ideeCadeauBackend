import * as express from "express";
import { authentification } from "../middlewares/auth.middleware";
import { authorization } from "../middlewares/role.middleware";
import { WidgetController } from "../controllers/widget.controller";

const Router = express.Router();

Router.post("/create",authentification, authorization(["admin"]), WidgetController.createWidget);
Router.get("/getall",authentification, authorization(["admin"]), WidgetController.getAllWidgets);
Router.get("/getallvisible", WidgetController.getAllVisibleWidgets);
Router.put("/update/:id",authentification, authorization(["admin"]), WidgetController.updateWidget);
Router.delete("/delete",authentification, authorization(["admin"]), WidgetController.deleteMultipleWidgets);
Router.get("/:id", WidgetController.getWidgetById);


export { Router as widgetRouter };
