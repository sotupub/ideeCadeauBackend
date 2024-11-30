import { Request, Response } from "express";
import { Product } from "../models/product.entity";
import { AppDataSource } from "../config/data-source";
import { Widget } from "../models/widget.entity";

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
      
            return res.status(201).json(widget);
          } catch (error) {
            console.error('Error creating widget:', error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getAllWidgets(req: Request, res: Response): Promise<Response> {
        const widgetRepository = AppDataSource.getRepository(Widget);
            try {
              const widgets = await widgetRepository.find({
                relations: ['products']
              });     
              return res.status(200).json(widgets);
            } catch (error) {
              console.error('Error fetching widgets:', error);
              return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getWidgetById(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        const widgetRepository = AppDataSource.getRepository(Widget);
    
        try {
          const widget = await widgetRepository.findOne({
            where: { id },
            relations: ['products'] 
          });
    
          if (!widget) {
            return res.status(404).json({ message: "Widget not found" });
          }
    
          return res.status(200).json(widget);
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

      return res.status(200).json(widget);
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
