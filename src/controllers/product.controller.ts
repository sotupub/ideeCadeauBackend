import { Request, Response } from "express";
import { Product } from "../models/product.entity";
import { AppDataSource } from "../config/data-source";
import { Category } from "../models/category.entity";
import { SubCategory } from "../models/subcategory.entity";
import { Model } from "../models/model.entity";

export class ProductController {
    static async createProduct(req: Request, res: Response): Promise<Response> {
        const { name, description, price, categoryIds, subCategoryIds, images, modelId, oldprice, stock, visible, stockAvailability} = req.body;

        if ( !modelId) {
            return res.status(400).json({ message: "Name, description,model ,price and at least one category are required" });
        }
        
        const productRepository = AppDataSource.getRepository(Product);
        const categoryRepository = AppDataSource.getRepository(Category);
        const subCategoryRepository = AppDataSource.getRepository(SubCategory);
        const modelRepository = AppDataSource.getRepository(Model);
        console.log("yess0")

        try {
            const model = await modelRepository.findOne({ where: { id: modelId } });
            if (!model) {
              return res.status(404).json({ message: "Model not found" });
            }
            console.log("yess1")

            const categories = await categoryRepository.findByIds(categoryIds);
            if (categories.length !== categoryIds.length) {
                return res.status(404).json({ message: "One or more categories not found" });
            }
            console.log("yess2")

            let subCategories: string | any[] | undefined = [];
            if (subCategoryIds && subCategoryIds.length > 0) {
              subCategories = await subCategoryRepository.findByIds(subCategoryIds);
              if (subCategories.length !== subCategoryIds.length) {
                return res.status(404).json({ message: "One or more subcategories not found" });
              }
              console.log("yess3")

              // Vérifier si les sous-catégories appartiennent aux catégories concernées
              for (const subCategory of subCategories) {
                const parentCategories = await subCategoryRepository
                    .createQueryBuilder("subCategory")
                    .leftJoinAndSelect("subCategory.categories", "category")
                    .where("subCategory.id = :id", { id: subCategory.id })
                    .getMany();
                    console.log("yess4")

                const parentCategoryIds = parentCategories.flatMap(subCat => subCat.categories.map(cat => cat.id));
                console.log("yess5")

                const isValidSubCategory = categoryIds.some((id: string) => parentCategoryIds.includes(id));
                console.log("yess6")

                if (!isValidSubCategory) {
                    console.log(`La sous-catégorie ${subCategory.id} n'appartient pas aux catégories fournies.`);
                    return res.status(400).json({
                        message: `Subcategory with id ${subCategory.id} does not belong to the provided categories`
                    });
                }
              }
            }
            console.log("yess")
            const product = new Product();
            product.name = name;
            product.description = description;
            product.price = price;
            product.categories = categories;
            product.subCategories = subCategories;
            product.images = images;
            product.model = model;
            product.stock = stock;
            product.visible = visible;
            product.stockAvailability = stockAvailability;
            product.oldprice = oldprice;
            console.log("yess8")

            await productRepository.save(product);
            console.log("yess9")

            return res.status(201).json(product);
        } catch (error) {
            return res.status(500).json({ message: "Error creating product", error });
        }
    }

    static async getAllProducts(req: Request, res: Response): Promise<Response> {
        const productRepository = AppDataSource.getRepository(Product);
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        try {
            const [products, total] = await productRepository.findAndCount({
                relations: ["categories", "subCategories"],
                skip: offset,
                take: limit,
            });
            const totalPages = Math.ceil(total / limit);

            return res.json({
                data: products,
                total,
                page,
                totalPages,
            });
        } catch (error) {
            return res.status(500).json({ message: "Error retrieving products", error });
        }
    }

    static async updateProduct(req: Request, res: Response): Promise<Response> {
        const productId = req.params.productId; 
        const { name, description, price, categoryIds, subCategoryIds, images, modelId, oldprice, stock, visible, stockAvailability } = req.body;
    
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
            if (images) {
                product.images = images;
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
            if (stock) {
                product.stock = stock;
            }
            if (visible !== undefined) {
                product.visible = visible;
            }
            if (stockAvailability !== undefined) {
                product.stockAvailability = stockAvailability;
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

    static async getProductById(req: Request, res: Response): Promise<Response> {
        const { id } = req.params; 
    
        const productRepository = AppDataSource.getRepository(Product); 
    
        try {
            const product = await productRepository.findOne({ where: { id } , relations: ["categories", "subCategories","model"],}); 
            if (!product) {
                return res.status(404).json({ message: "Product not found" }); 
            }
            return res.json(product); 
        } catch (error) {
            return res.status(500).json({ message: "Error retrieving product", error }); 
        }
    }

    static async deleteMultipleProducts(req: Request, res: Response): Promise<Response> {
        const { ids } = req.body; 
    
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No product IDs provided" });
        }
    
        const productRepository = AppDataSource.getRepository(Product);
    
        try {
            const products = await productRepository.findByIds(ids);
    
            if (products.length === 0) {
                return res.status(404).json({ message: "No products found with the provided IDs" });
            }
    
            await productRepository.remove(products);
    
            return res.status(200).json({ message: "Products deleted successfully", ids });
        } catch (error) {
            return res.status(500).json({ message: "Error deleting products", error });
        }
    }

    static async getProductsByFilter(req: Request, res: Response) {
        console.log('Received request with params:', req.query);
        const categoryName = req.query.category as string;
    const subcategoryName = req.query.subcategory as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    try {
        const productRepository = AppDataSource.getRepository(Product);
        const queryBuilder = productRepository.createQueryBuilder('product');

        if (categoryName) {
            const categoryRepository = AppDataSource.getRepository(Category);
            const category = await categoryRepository.findOne({
                where: { name: categoryName }
            });

            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            queryBuilder.innerJoin('product.categories', 'category')
                        .where('category.name = :categoryName', { categoryName });
        }

        if (subcategoryName) {
            const subCategoryRepository = AppDataSource.getRepository(SubCategory);
            const subCategory = await subCategoryRepository.findOne({
                where: { name: subcategoryName }
            });

            if (!subCategory) {
                return res.status(404).json({ error: 'Subcategory not found' });
            }

            queryBuilder.innerJoin('product.subCategories', 'subCategory')
                        .andWhere('subCategory.name = :subcategoryName', { subcategoryName });
        }

        const [products, total] = await queryBuilder.skip((page - 1) * limit)
                                                     .take(limit)
                                                     .getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        return res.json({
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    } catch (error) {
        console.error(error); // Log detailed error information
        return res.status(500).json({ error: 'Internal server error' });
    }
}
}
