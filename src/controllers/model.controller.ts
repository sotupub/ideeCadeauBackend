import { Request, Response } from "express";
import { Model } from "../models/model.entity";
import { AppDataSource } from "../config/data-source";

export class ModelController {
  static async createModel(req: Request, res: Response): Promise<Response> {
    const { name, image, options } = req.body;

    if (!name || !image ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const modelRepository = AppDataSource.getRepository(Model);

    try {
      const newModel = new Model();
      newModel.name = name;
      newModel.image = image;
      newModel.options = JSON.stringify(options);

      const savedModel = await modelRepository.save(newModel);
      return res.status(201).json(savedModel);
    } catch (error) {
      return res.status(500).json({ message: "Error creating model", error });
    }
  }

  static async getAllModels(req: Request, res: Response): Promise<Response> {
    const modelRepository = AppDataSource.getRepository(Model);

    try {
      const models = await modelRepository.find();
      return res.status(200).json(models);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving models", error });
    }
  }

  static async updateModel(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { name, image, options } = req.body;

    const modelRepository = AppDataSource.getRepository(Model);

    try {
      const model = await modelRepository.findOne({ where: { id } });

      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }

      if (name) model.name = name;
      if (image) model.image = image;
      if (options) model.options = JSON.stringify(options);

      const updatedModel = await modelRepository.save(model);
      return res.status(200).json(updatedModel);
    } catch (error) {
      return res.status(500).json({ message: "Error updating model", error });
    }
  }

  static async deleteModel(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const modelRepository = AppDataSource.getRepository(Model);

    try {
      const model = await modelRepository.findOne({ where: { id } });

      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }

      await modelRepository.remove(model);

      return res.status(200).json({ message: "Model deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting model", error });
    }
  }

  static async getModelById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const modelRepository = AppDataSource.getRepository(Model);

    try {
      const model = await modelRepository.findOne({ where: { id } });

      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }

      return res.status(200).json(model);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving model", error });
    }
  }
}
