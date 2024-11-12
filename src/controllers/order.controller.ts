import { Request, Response } from "express";
import { Order } from "../models/order.entity";
import { AppDataSource } from "../config/data-source";
import { Product } from "../models/product.entity";
import { User } from "../models/user.entity";
import { OrderItem } from "../models/orderItem.entity";
import { classToPlain } from "class-transformer";
import EmailService from "../helpers/sendemail";
import { EOrder } from "../models/enums/EOrder";

export class OrderController {
  static async createOrder(req: Request, res: Response): Promise<Response> {
    const { orderItems, address, paymentmode, city, zipCode, country, comment, total } = req.body; // orderItems: [{ productId, quantity }]
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

      const items = [];

      for (const item of orderItems) {
        console.log("item", item);
        const product = await productRepository.findOne({ where: { id: item.product } });

        if (!product) {
          return res.status(404).json({ message: `Product with id ${item.product} not found` });
        }

        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = item.quantity;
        orderItem.price = product.price;
        orderItem.image = item.image;
        items.push(orderItem);
      }

      await orderItemRepository.save(items);

      const order = new Order();
      order.user = user;
      order.orderItems = items;
      order.address = address;
      order.city = city;
      order.zipCode = zipCode;
      order.country = country;
      order.comment = comment;
      order.paymentmode = paymentmode;
      order.total = total;
      order.createdAt = new Date();

      await orderRepository.save(order);

      const email = user.email;
      const subject = "Order Confirmation";
      const text = `Votre commande a été passée avec succès. Numéro de la commande: ${order.id}`;
      await EmailService.sendEmail(email, subject, text);
      //console.log(order);

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

      console.log("id", order.user.id, userId);
      console.log("role", userRole)

      // Vérifier si l'utilisateur est client et que l'ID de l'utilisateur de la commande correspond à l'ID de l'utilisateur actuel
      if (userRole === "client" && order.user.id !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only access your own orders" });
      }

      return res.json(order);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving order", error });
    }
  }

  static async getOrderForReview(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = (req as any)["currentUser"].id;
    const userRole = (req as any)["currentUser"].role;

    const orderRepository = AppDataSource.getRepository(Order);

    try {
      const order = await orderRepository.findOne({
        where: { id, status: EOrder.COMPLETED },
        relations: ["orderItems", "orderItems.product", "user"],
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      console.log("id", order.user.id, userId);
      console.log("role", userRole);

      // Vérifier si l'utilisateur est client et que l'ID de l'utilisateur de la commande correspond à l'ID de l'utilisateur actuel
      if (order.user.id !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only access your own orders" });
      }

      // Define the type for transformedOrder
      type TransformedOrder = {
        id: string;
        orderItems: {
          id: string;
          id_product: string;
          name: string;
          images: string[];
        }[];
      };

      // Transform the order data to include only the required fields
      const transformedOrder: TransformedOrder = {
        id: order.id,
        orderItems: []
      };

      const productMap = new Map<string, { id: string; id_product: string; name: string; images: string[] }>();

      order.orderItems.forEach(item => {
        if (!productMap.has(item.product.id)) {
          productMap.set(item.product.id, {
            id: item.id,
            id_product: item.product.id,
            name: item.product.name,
            images: item.product.images ? [item.product.images[0]] : []
          });
        }
      });

      transformedOrder.orderItems = Array.from(productMap.values());

      return res.json(transformedOrder);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving order", error });
    }
  }


  static async getAllOrders(req: Request, res: Response): Promise<Response> {
    const orderRepository = AppDataSource.getRepository(Order);

    try {
      const orders = await orderRepository.find({
        select: {
          id: true,
          status: true,
          total: true,
          user: {
            email: true,
            firstname: true,
            lastname: true,
          },
          createdAt: true,
        },
        relations: ["user"],
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

      if (status === "Complétée") {
        const email = order.user.email;
        const subject = "Order Shipped";
        const text = `Nous espérons que votre commande a bien été livrée 
        et attendons avec impatience votre avis.
        Veuillez laisser votre avis ici : http://localhost:3000/review/${order.id}`;
        await EmailService.sendEmail(email, subject, text);
      }

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

  static async getClientOrders(req: Request, res: Response): Promise<Response> {
    const clientId = req.params.id;

    const orderRepository = AppDataSource.getRepository(Order);
    const userRepository = AppDataSource.getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: clientId },
        relations: ["orders"],
      });

      if (!user) {
        return res.status(404).json({ message: "Client not found" });
      }

      return res.json({
        user: {
          firstname: user.firstname,
          lastname: user.lastname,
          address : user.address,
          city : user.city,
          zipCode : user.zipCode,
          country : user.country,
        },
        orders: user.orders,
      });
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving orders", error });
    }
  }

  static async getMonthlySalesStatistics(req: Request, res: Response): Promise<Response> {
    const orderRepository = AppDataSource.getRepository(Order);

    try {
      console.log("entered");

      const monthlySales = await orderRepository
        .createQueryBuilder("order")
        .select("TO_CHAR(order.createdAt, 'YYYY-MM-01')", "month")
        .addSelect("COUNT(order.id)", "orderCount")
        .groupBy("TO_CHAR(order.createdAt, 'YYYY-MM-01')")
        .orderBy("month")
        .getRawMany();
      console.log("monthlySales: ", monthlySales);

      // Formater les résultats pour une meilleure lisibilité
      const formattedResults = monthlySales.map(sale => ({
        month: sale.month,
        orderCount: parseInt(sale.orderCount, 10)
      }));
      console.log("formattedResults: ", formattedResults);

      return res.status(200).json(formattedResults);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error retrieving monthly sales statistics", error });
    }
  }

  static async getTopSellers(req: Request, res: Response): Promise<Response> {
    const orderItemRepository = AppDataSource.getRepository(OrderItem);
    const productRepository = AppDataSource.getRepository(Product);

    try {
      const topSellers = await orderItemRepository
        .createQueryBuilder("orderItem")
        .select("orderItem.productId", "productId")
        .addSelect("SUM(orderItem.quantity)", "quantity")
        .groupBy("orderItem.productId")
        .orderBy("quantity", "DESC")
        .limit(5)
        .getRawMany();

      // Récupérer les informations du produit pour chaque best seller
      const productIds = topSellers.map(seller => seller.productId);
      const products = await productRepository.findByIds(productIds);

      const formattedResults = topSellers.map(seller => {
        const product = products.find(p => p.id === seller.productId);
        return {
          id: seller.productId,
          totalQuantity: parseInt(seller.quantity, 10),
          name: product?.name,
          images: product?.images.slice(0, 2),
          price: product?.price,
          oldprice: product?.oldprice,
          visible: product?.visible,
        };
      });

      return res.status(200).json(formattedResults);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error retrieving top sellers", error });
    }
  }


  static async TrackOrder(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const orderRepository = AppDataSource.getRepository(Order);

    try {
      const order = await orderRepository.findOne({
        where: { id },
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.status(200).json({ status: order.status });
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving order", error });
    }
  }
}


