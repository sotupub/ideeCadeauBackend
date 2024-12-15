import { Request, Response } from "express";
import { Product } from "../models/product.entity";
import { AppDataSource } from "../config/data-source";
import { Widget } from "../models/widget.entity";
import { cacheService } from "../services/cache.service";

export class WidgetController {
    static async createWidget(req: Request, res: Response): Promise<Response> {
        const { name, type, visible, productIds} = req.body;
        if (!name || !type || visible === undefined || !Array.isArray(productIds)) {
            return res.status(400).json({ message: "Invalid input data" });
        }
        const widgetRepository = AppDataSource.getRepository(Widget);
        const productRepository = AppDataSource.getRepository(Product);
        try {
            const products = await productRepository.findByIds(productIds);
      
            if (products.length !== productIds.length) {
              return res.status(404).json({ message: "One or more products not found" });
            }
      
            const widget = new Widget();
            widget.name = name;
            widget.type = type;
            widget.visible = visible;
            widget.products = products;
      
            await widgetRepository.save(widget);
      
            return res.status(201).json();
          } catch (error) {
            console.error('Error creating widget:', error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getAllWidgets(req: Request, res: Response): Promise<Response> {
        const widgetRepository = AppDataSource.getRepository(Widget);
            try {
              const widgets = await widgetRepository.find();     
              return res.status(200).json(widgets);
            } catch (error) {
              console.error('Error fetching widgets:', error);
              return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getAllVisibleWidgets(req: Request, res: Response): Promise<Response> {
      const widgetRepository = AppDataSource.getRepository(Widget);

    try {
      const CACHE_KEY = `visible_widgets`;

      // Try to get from cache first
      const cachedData = await cacheService.get(CACHE_KEY);
      if (cachedData) {
        return res.json(cachedData);
      }

      const widgets = await widgetRepository.find({
        where: { visible: true },
        select: ['id', 'name', 'type']
      });

      await cacheService.set(CACHE_KEY, widgets, 300); // 5 minutes
      return res.status(200).json(widgets);
    } catch (error) {
      console.error('Error fetching visible widgets:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getWidgetById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const widgetRepository = AppDataSource.getRepository(Widget);

    try {
      const CACHE_KEY = `widgets_detail_${id}`;

      // Try to get from cache first
      const cachedData = await cacheService.get(CACHE_KEY);
      if (cachedData) {
        return res.json(cachedData);
      }

      const widget = await widgetRepository.findOne({
        where: { id },
        relations: ['products', 'products.categories', 'products.subCategories']
      });

      if (!widget) {
        return res.status(404).json({ message: "Widget not found" });
      }

      const products = widget.products.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        oldprice: product.oldprice,
        images: product.images.length > 0 ? [product.images[0]] : [],
        categories: product.categories,
        subCategories: product.subCategories
      }));

      const widgets ={
        id: widget.id,
        name: widget.name,
        type: widget.type,
        visible: widget.visible,
        products: products
      }
      await cacheService.set(CACHE_KEY, widgets, 300); // 5 minutes
      return res.status(200).json(widgets);
    } catch (error) {
      console.error('Error fetching widget by ID:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async updateWidget(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { name, type, visible, productIds } = req.body;

    if (!name && !type && visible === undefined && !Array.isArray(productIds)) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const widgetRepository = AppDataSource.getRepository(Widget);
    const productRepository = AppDataSource.getRepository(Product);

    try {
      const widget = await widgetRepository.findOne({
        where: { id },
        relations: ['products']
      });

      if (!widget) {
        return res.status(404).json({ message: "Widget not found" });
      }

      if (name) {
        widget.name = name;
      }
      if (type) {
        widget.type = type;
      }
      if (visible !== undefined) {
        widget.visible = visible;
      }

      if (productIds && productIds.length > 0) {
        const products = await productRepository.findByIds(productIds);
        if (products.length !== productIds.length) {
          return res.status(404).json({ message: "One or more products not found" });
        }
        widget.products = products;
      }

      await widgetRepository.save(widget);

      return res.status(200).json();
    } catch (error) {
      console.error('Error updating widget:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async deleteMultipleWidgets(req: Request, res: Response): Promise<Response> {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No widget IDs provided" });
    }

    const widgetRepository = AppDataSource.getRepository(Widget);

    try {
      const widgets = await widgetRepository.findByIds(ids);

      if (widgets.length === 0) {
        return res.status(404).json({ message: "No widgets found with the provided IDs" });
      }

      await widgetRepository.remove(widgets);

      return res.status(200).json({ message: "Widgets deleted successfully", ids });
    } catch (error) {
      console.error('Error deleting widgets:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }


   
}
