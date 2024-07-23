import * as express from "express";
import { ReviewController } from "../controllers/review.controller";
import { authentification } from "../middlewares/auth.middleware";
import { authorization } from "../middlewares/role.middleware";

const Router = express.Router();

Router.post("/create", authentification, authorization(["client"]), ReviewController.createReview);
Router.get("/all", authentification, authorization(["admin"]), ReviewController.getAllReviews);
Router.patch("/update-status", authentification, authorization(["admin"]), ReviewController.updateReviewStatus);
Router.get("/product/:productId", ReviewController.getApprovedReviewsByProduct);

export { Router as reviewRouter };
