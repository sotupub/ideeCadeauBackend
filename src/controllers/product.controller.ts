import { Request, Response } from "express";
import { Product } from "../models/product.entity";
import { AppDataSource } from "../config/data-source";
import { Category } from "../models/category.entity";
import { SubCategory } from "../models/subcategory.entity";
import { Model } from "../models/model.entity";

export class ProductController {
    static async createProduct(req: Request, res: Response): Promise<Response> {
        const { name, description, price, categoryIds, subCategoryIds, image, modelId, oldprice} = req.body;

        if (!name || !description || !price || !categoryIds || categoryIds.length === 0 || !modelId) {
            return res.status(400).json({ message: "Name, description,model ,price and at least one category are required" });
        }
        const productRepository = AppDataSource.getRepository(Product);
        const categoryRepository = AppDataSource.getRepository(Category);
        const subCategoryRepository = AppDataSource.getRepository(SubCategory);
        const modelRepository = AppDataSource.getRepository(Model);

        try {
            const model = await modelRepository.findOne({ where: { id: modelId } });
            if (!model) {
              return res.status(404).json({ message: "Model not found" });
            }

            const categories = await categoryRepository.findByIds(categoryIds);
            if (categories.length !== categoryIds.length) {
                return res.status(404).json({ message: "One or more categories not found" });
            }

            let subCategories: string | any[] | undefined = [];
            if (subCategoryIds && subCategoryIds.length > 0) {
              subCategories = await subCategoryRepository.findByIds(subCategoryIds);
              if (subCategories.length !== subCategoryIds.length) {
                return res.status(404).json({ message: "One or more subcategories not found" });
              }

              // Vérifier si les sous-catégories appartiennent aux catégories concernées
              for (const subCategory of subCategories) {
                const parentCategories = await subCategoryRepository
                    .createQueryBuilder("subCategory")
                    .leftJoinAndSelect("subCategory.categories", "category")
                    .where("subCategory.id = :id", { id: subCategory.id })
                    .getMany();

                const parentCategoryIds = parentCategories.flatMap(subCat => subCat.categories.map(cat => cat.id));

                const isValidSubCategory = categoryIds.some((id: string) => parentCategoryIds.includes(id));

                if (!isValidSubCategory) {
                    console.log(`La sous-catégorie ${subCategory.id} n'appartient pas aux catégories fournies.`);
                    return res.status(400).json({
                        message: `Subcategory with id ${subCategory.id} does not belong to the provided categories`
                    });
                }
              }
            }

            const product = new Product();
            product.name = name;
            product.description = description;
            product.price = price;
            product.categories = categories;
            product.subCategories = subCategories;
            product.image = image;
            product.model = model;
            product.oldprice = oldprice;


            await productRepository.save(product);

            return res.status(201).json(product);
        } catch (error) {
            return res.status(500).json({ message: "Error creating product", error });
        }
    }

    static async getAllProducts(req: Request, res: Response): Promise<Response> {
        const productRepository = AppDataSource.getRepository(Product);

        try {
            const products = await productRepository.find({ relations: ["categories", "subCategories"] });
            return res.json(products);
        } catch (error) {
            return res.status(500).json({ message: "Error retrieving products", error });
        }
    }

    static async updateProduct(req: Request, res: Response): Promise<Response> {
        const productId = req.params.productId; 
        const { name, description, price, categoryIds, subCategoryIds, image, modelId, oldprice } = req.body;
    
        const productRepository = AppDataSource.getRepository(Product);
        const categoryRepository = AppDataSource.getRepository(Category);
        const subCategoryRepository = AppDataSource.getRepository(SubCategory);
        const modelRepository = AppDataSource.getRepository(Model);
    
        try {
            const product = await productRepository.findOne({
                where: { id: productId },
                relations: ["categories", "subCategories","model"],
            });
    
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
    
            if (name) {
                product.name = name;
            }
            if (description) {
                product.description = description;
            }
            if (price) {
                product.price = price;
            }
            if (categoryIds && categoryIds.length > 0) {
                const categories = await categoryRepository.findByIds(categoryIds);
                if (categories.length !== categoryIds.length) {
                    return res.status(404).json({ message: "One or more categories not found" });
                }
                product.categories = categories;
            }
            if (subCategoryIds && subCategoryIds.length > 0) {
                const subCategories = await subCategoryRepository.findByIds(subCategoryIds);
                if (subCategories.length !== subCategoryIds.length) {
                    return res.status(404).json({ message: "One or more subcategories not found" });
                }
                // Vérifier si les sous-catégories appartiennent aux catégories concernées
                for (const subCategory of subCategories) {
                    const parentCategories = await subCategoryRepository
                        .createQueryBuilder("subCategory")
                        .leftJoinAndSelect("subCategory.categories", "category")
                        .where("subCategory.id = :id", { id: subCategory.id })
                        .getMany();
    
                    const parentCategoryIds = parentCategories.flatMap(subCat => subCat.categories.map(cat => cat.id));
    
                    const isValidSubCategory = categoryIds.some((id: string) => parentCategoryIds.includes(id));
    
                    if (!isValidSubCategory) {
                        console.log(`La sous-catégorie ${subCategory.id} n'appartient pas aux catégories fournies.`);
                        return res.status(400).json({
                            message: `Subcategory with id ${subCategory.id} does not belong to the provided categories`
                        });
                    }
                }
                product.subCategories = subCategories;
            }
            if (image) {
                product.image = image;
            }
            if (modelId) {
                console.log(`Recherche du modèle avec l'ID : ${modelId}`);
                const model = await modelRepository.findOne({ where: { id: modelId } });
                console.log(`Résultat de la recherche :`, model);
                if (!model) {
                    return res.status(404).json({ message: "Model not found" });
                }
                product.model = model;
            }
            if (oldprice) {
                product.oldprice = oldprice;
            }
    
            await productRepository.save(product);
    
            return res.status(200).json(product);
        } catch (error) {
            return res.status(500).json({ message: "Error updating product", error });
        }
    }
    

    static async deleteProduct(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;

        const productRepository = AppDataSource.getRepository(Product);

        try {
            const product = await productRepository.findOne({ where: { id } });
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            await productRepository.remove(product);

            return res.status(204).json({ message: "Product deleted successfully" });
        } catch (error) {
            return res.status(500).json({ message: "Error deleting product", error });
        }
    }
}
