import { Request, Response } from "express";
import { Category } from "../models/category.entity";
import { AppDataSource } from "../config/data-source";

export class CategoryController {
  static async createCategory(req: Request, res: Response): Promise<Response> {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const categoryRepository = AppDataSource.getRepository(Category);

    const existingCategory = await categoryRepository.findOneBy({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category name already exists" });
    }

    try {
      const newCategory = new Category();
      newCategory.name = name;

      const savedCategory = await categoryRepository.save(newCategory);
      return res.status(201).json(savedCategory);
    } catch (error) {
      return res.status(500).json({ message: "Error creating category", error });
    }
  }

  static async getAllCategories(req: Request, res: Response): Promise<Response> {
    const categoryRepository = AppDataSource.getRepository(Category);

    try {
      const categories = await categoryRepository.find();
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving categories", error });
    }
  }

  static async updateCategory(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const categoryRepository = AppDataSource.getRepository(Category);

    try {
      const category = await categoryRepository.findOne({ where: { id } });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const existingCategory = await categoryRepository.findOneBy({ name });
      if (existingCategory) {
        return res.status(400).json({ message: "Category name already exists" });
      }

      category.name = name;
      const updatedCategory = await categoryRepository.save(category);

      return res.status(200).json(updatedCategory);
    } catch (error) {
      return res.status(500).json({ message: "Error updating category", error });
    }
  }

  static async deleteCategory(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const categoryRepository = AppDataSource.getRepository(Category);

    try {
      const category = await categoryRepository.findOne({ where: { id } });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      await categoryRepository.remove(category);

      return res.status(200).json({ message: "Category deleted successfully",id });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting category", error });
    }
  }
}
