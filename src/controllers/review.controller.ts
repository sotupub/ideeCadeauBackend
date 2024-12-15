import { Request, Response } from "express";
import { Review } from "../models/review.entity";
import { AppDataSource } from "../config/data-source";
import { OrderItem } from "../models/orderItem.entity";
import { EOrder } from "../models/enums/EOrder";
import { EReview } from "../models/enums/EReview";
import { User } from "../models/user.entity";
import { Product } from "../models/product.entity";
import { ProductController } from "./product.controller";

export class ReviewController {
  static async createReview(req: Request, res: Response): Promise<Response> {
    const { rating, comment, orderItemId } = req.body;
    const userId = (req as any)["currentUser"].id;
    const reviewRepository = AppDataSource.getRepository(Review);
    const userRepository = AppDataSource.getRepository(User);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);

    try {
       const user = await userRepository.findOne({ where: { id: userId } });

       if (!user) {
           return res.status(404).json({ message: "User not found" });
       }
      const orderItem = await orderItemRepository.findOne({
        where: {
          id: orderItemId,
          order: {
            user: { id: userId },
            status: EOrder.DELIVERED
          }
        },
        relations: ["order", "product", "reviews"],
      });

      if (!orderItem) {
        return res.status(403).json({ message: "You can only review products you have purchased with delivered orders" });
      }

      const existingReview = await reviewRepository.findOne({
        where: { user: { id: userId }, orderItem: { id: orderItemId } },
      });

      //console.log(orderItemId, orderItem);
      //console.log(existingReview);

      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this product for this order item" });
      }

      const review = new Review();
      review.rating = rating;
      review.comment = comment;
      review.user = { id: userId } as any;
      review.firstname = user.firstname;
      review.lastname = user.lastname;
      review.product = orderItem.product;
      review.orderItem = orderItem;


      await reviewRepository.save(review);

      return res.status(201).json(review);
    } catch (error) {
      return res.status(500).json({ message: "Error creating review", error });
    }
  }


  static async addReviewByAdmin(req: Request, res: Response): Promise<Response> {
    const { rating, comment, productId, firstname, lastname } = req.body;
    const reviewRepository = AppDataSource.getRepository(Review);

    try {
      const review = new Review();
      review.rating = rating;
      review.comment = comment;
      review.firstname =firstname;
      review.lastname = lastname;
      review.product = productId;
      review.status = EReview.APPROVED;

      await ProductController.updateAverageRating(productId);
      await ProductController.verifyAverageRating(productId);

      await reviewRepository.save(review);

      return res.status(201).json(review);
    } catch (error) {
      return res.status(500).json({ message: "Error creating review", error });
    }
  }



  static async getAllReviews(req: Request, res: Response): Promise<Response> {
    const reviewRepository = AppDataSource.getRepository(Review);

    try {
      const reviews = await reviewRepository.createQueryBuilder("review")
        .leftJoinAndSelect("review.user", "user")
        .leftJoinAndSelect("review.product", "product")
        .select([
          "review.id",
          "review.rating",
          "review.comment",
          "review.status",
          "review.firstname",
          "review.lastname",
          "product.name"
        ])
        .getMany();

      return res.status(200).json(reviews);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving reviews", error });
    }
  }

  static async updateReviewStatus(req: Request, res: Response): Promise<Response> {
    const { reviewId, status } = req.body;

    if (!Object.values(EReview).includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const reviewRepository = AppDataSource.getRepository(Review);

    try {
      const review = await reviewRepository.findOne({ 
        where: { id: reviewId },
        relations: ["product"],
      });

      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      review.status = status;    
      await reviewRepository.save(review);

      await ProductController.updateAverageRating(review.product.id);
      await ProductController.verifyAverageRating(review.product.id);



      return res.status(200).json(review);
    } catch (error) {
      return res.status(500).json({ message: "Error updating review status", error });
    }
  }

  static async getApprovedReviewsByProduct(req: Request, res: Response): Promise<Response> {
    const { productId } = req.params;
    const reviewRepository = AppDataSource.getRepository(Review);

    try {
      const reviews = await reviewRepository.find({
        where: { product: { id: productId }, status: EReview.APPROVED },
        relations: ["user", "orderItem"],
      });

      if (reviews.length === 0) {
        return res.status(404).json({ message: "No approved reviews found for this product" });
      }

      return res.status(200).json(reviews);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving reviews", error });
    }
  }


}
