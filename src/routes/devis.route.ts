import * as express from "express";
import { authentification } from "../middlewares/auth.middleware";
import { authorization } from "../middlewares/role.middleware";
import { DevisController } from "../controllers/devis.controller";

const Router = express.Router();

Router.post("/create", DevisController.createDevis);
Router.get("/getall",authentification, authorization(["admin"]), DevisController.getAllDevis);
Router.get("/:id", DevisController.getDevisById);
Router.delete("/delete",authentification, authorization(["admin"]), DevisController.deleteMultipleDeviss);
Router.put("/update",authentification, authorization(["admin"]), DevisController.updateDevisReadStatus);



export { Router as devisRouter };