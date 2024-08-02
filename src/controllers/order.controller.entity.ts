import { Request, Response } from "express";
import { Order } from "../models/order.entity";
import { AppDataSource } from "../config/data-source";
import { Product } from "../models/product.entity";
import { User } from "../models/user.entity";
import { OrderItem } from "../models/orderItem.entity";
import { classToPlain } from "class-transformer";

export class OrderController {
  static async createOrder(req: Request, res: Response): Promise<Response> {
    const { orderItems } = req.body; // orderItems: [{ productId, quantity }]
    const userId = (req as any)["currentUser"].id;

    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);
    const productRepository = AppDataSource.getRepository(Product);
    const userRepository = AppDataSource.getRepository(User);

    try {
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let total = 0;
      const items = [];

      for (const item of orderItems) {
        const product = await productRepository.findOne({ where: { id: item.productId } });
        if (!product) {
          return res.status(404).json({ message: `Product with id ${item.productId} not found` });
        }

        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = item.quantity;
        orderItem.price = product.price;
        total += product.price * item.quantity;
        items.push(orderItem);
      }

      await orderItemRepository.save(items);

      const order = new Order();
      order.user = user;
      order.orderItems = items;
      order.total = total;
      order.createdAt = new Date();

      await orderRepository.save(order);

      return res.status(201).json(order);
    } catch (error) {
      return res.status(500).json({ message: "Error creating order", error });
    }
  }

  static async getOrderById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = (req as any)["currentUser"].id;
    const userRole = (req as any)["currentUser"].role;

    const orderRepository = AppDataSource.getRepository(Order);

    try {
      const order = await orderRepository.findOne({
        where: { id },
        relations: ["orderItems", "orderItems.product", "user"],
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      console.log("id",order.user.id, userId);
      console.log("role",userRole)

      // Vérifier si l'utilisateur est client et que l'ID de l'utilisateur de la commande correspond à l'ID de l'utilisateur actuel
      if (userRole === "client" && order.user.id !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only access your own orders" });
      }

      return res.json(order);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving order", error });
    }
  }


  static async getAllOrders(req: Request, res: Response): Promise<Response> {
    const orderRepository = AppDataSource.getRepository(Order);

    try {
      const orders = await orderRepository.find({
        relations: ["orderItems", "orderItems.product", "user"],
      });

      return res.json(orders);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving orders", error });
    }
  }

  static async getUserOrders(req: Request, res: Response): Promise<Response> {
    const userId = (req as any)["currentUser"].id;

    const orderRepository = AppDataSource.getRepository(Order);
    const userRepository = AppDataSource.getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["orders", "orders.orderItems", "orders.orderItems.product"],
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(user.orders);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving user orders", error });
    }
  }

  static async updateOrderStatus(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { status } = req.body; 

    const orderRepository = AppDataSource.getRepository(Order);

    try {
      const order = await orderRepository.findOne({
        where: { id },
        relations: ["orderItems", "orderItems.product", "user"],
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (status) {
        order.status = status;
      }
      
      await orderRepository.save(order);
      const orderResponse = classToPlain(order); // Convertit l'entité en objet sans références circulaires


      return res.status(201).json(orderResponse);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error updating order", error });
    }
  }

  static async updateOrderItemQuantity(req: Request, res: Response): Promise<Response> {
    const { orderItemId } = req.params;
    const { quantity } = req.body;

    const orderItemRepository = AppDataSource.getRepository(OrderItem);
    const productRepository = AppDataSource.getRepository(Product);
    const orderRepository = AppDataSource.getRepository(Order);

    try {
      const orderItem = await orderItemRepository.findOne({
        where: { id: orderItemId },
        relations: ["order", "product"],
      });

      if (!orderItem) {
        return res.status(404).json({ message: "OrderItem not found" });
      }

      const product = await productRepository.findOne({ where: { id: orderItem.product.id } });
      if (!product) {
        return res.status(404).json({ message: `Product with id ${orderItem.product.id} not found` });
      }

      const order = orderItem.order;
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Mettre à jour la quantité de l'élément de commande
      orderItem.quantity = quantity;
      await orderItemRepository.save(orderItem);

      // Recalculer le total de la commande
      const orderItems = await orderItemRepository.find({ where: { order: { id: order.id } }, relations: ["product"] });
      console.log("orderItems", orderItems);
      let total = 0;
      for (const item of orderItems) {
        total += item.product.price * item.quantity;
      }

      order.total = parseFloat(total.toFixed(2)); 
      await orderRepository.save(order);

      return res.status(200).json({ message: "OrderItem quantity updated successfully", orderItem, total: order.total });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error updating order item quantity", error });
    }
  }
}

