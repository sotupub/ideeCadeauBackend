import * as express from "express";
import { authentification } from "../middlewares/auth.middleware";
import { authorization } from "../middlewares/role.middleware";
import { ContactController } from "../controllers/contact.controller";

const Router = express.Router();

Router.post("/create", ContactController.createContact);
Router.get("/getall",authentification, authorization(["admin"]), ContactController.getAllContacts);
Router.get("/:id", ContactController.getContactById);
Router.delete("/delete",authentification, authorization(["admin"]), ContactController.deleteMultipleContacts);
Router.put("/update",authentification, authorization(["admin"]), ContactController.updateContactReadStatus);



export { Router as contactRouter };