import { Request, Response } from "express";
import { SubCategory } from "../models/subcategory.entity";
import { Category } from "../models/category.entity";
import { AppDataSource } from "../config/data-source";

export class SubCategoryController {
  static async createSubCategory(req: Request, res: Response): Promise<Response> {
    const { name, categoryIds } = req.body;

    if (!name || !categoryIds || categoryIds.length === 0) {
      return res.status(400).json({ message: "Name and at least one category are required" });
    }

    const subCategoryRepository = AppDataSource.getRepository(SubCategory);
    const existingSubCategory = await subCategoryRepository.findOneBy({ name });
    if (existingSubCategory) {
      return res.status(400).json({ message: "SubCategory name already exists" });
    }

    const categoryRepository = AppDataSource.getRepository(Category);

    try {
      const categories = await categoryRepository.findByIds(categoryIds);

      if (categories.length !== categoryIds.length) {
        return res.status(400).json({ message: "Invalid category IDs" });
      }

      const newSubCategory = new SubCategory();
      newSubCategory.name = name;
      newSubCategory.categories = categories;

      const savedSubCategory = await subCategoryRepository.save(newSubCategory);
      return res.status(201).json(savedSubCategory);
    } catch (error) {
      return res.status(500).json({ message: "Error creating subcategory", error });
    }
  }

  static async updateSubCategory(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { name, categoryIds } = req.body;

    const subCategoryRepository = AppDataSource.getRepository(SubCategory);
    const categoryRepository = AppDataSource.getRepository(Category);

    try {
      const subCategory = await subCategoryRepository.findOne({ where: { id }, relations: ["categories"] });

      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }

      if (name) {
        subCategory.name = name;
      }

      if (categoryIds) {
        const categories = await categoryRepository.findByIds(categoryIds);

        if (categories.length !== categoryIds.length) {
          return res.status(400).json({ message: "Invalid category IDs" });
        }

        subCategory.categories = categories;
      }

      const updatedSubCategory = await subCategoryRepository.save(subCategory);
      return res.status(200).json(updatedSubCategory);
    } catch (error) {
      return res.status(500).json({ message: "Error updating subcategory", error });
    }
  }
  
  static async getAllSubCategories(req: Request, res: Response): Promise<Response> {
    const subCategoryRepository = AppDataSource.getRepository(SubCategory);

    try {
      const subCategories = await subCategoryRepository.find({ relations: ["categories"] });
      return res.status(200).json(subCategories);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error retrieving subcategories", error });
    }
  }

  static async deleteSubCategory(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const subCategoryRepository = AppDataSource.getRepository(SubCategory);

    try {
      const subCategory = await subCategoryRepository.findOne({ where: { id } });

      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }

      await subCategoryRepository.remove(subCategory);

      return res.status(200).json({ message: "Subcategory deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting subcategory", error });
    }
  }
}
