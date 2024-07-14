import * as express from "express";
import { ModelController } from "../controllers/model.controller";
import { authentification } from "../middlewares/auth.middleware";
import { authorization } from "../middlewares/role.middleware";

const Router = express.Router();

Router.post("/create", authentification, authorization(["superadmin"]), ModelController.createModel);
Router.get("/all", authentification, authorization(["superadmin","admin"]), ModelController.getAllModels);
Router.put("/update/:id", authentification, authorization(["superadmin"]), ModelController.updateModel);
Router.delete("/delete/:id", authentification, authorization(["superadmin"]), ModelController.deleteModel);
Router.get("/:id", ModelController.getModelById);

export { Router as modelRouter };
