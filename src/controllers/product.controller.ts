import { Request, Response } from "express";
import { Product } from "../models/product.entity";
import { AppDataSource } from "../config/data-source";
import { Category } from "../models/category.entity";
import { SubCategory } from "../models/subcategory.entity";
import { Model } from "../models/model.entity";
import { OrderItem } from "../models/orderItem.entity";
import { In, Like } from "typeorm";
import { cacheService } from "../services/cache.service";
import { Review } from "../models/review.entity";
import { EReview } from "../models/enums/EReview";

export class ProductController {
    static async createProduct(req: Request, res: Response): Promise<Response> {
        const { name, description, price, categoryIds, subCategoryIds, images, modelId, oldprice, stock, visible, stockAvailability, options} = req.body;

        if ( !modelId) {
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
              // Fetch all subcategory-category relationships in one query
              const subCategoryCategories = await subCategoryRepository
                  .createQueryBuilder("subCategory")
                  .select(["subCategory.id", "category.id"])
                  .innerJoin("subCategory.categories", "category")
                  .where("subCategory.id IN (:...subCategoryIds)", { subCategoryIds: subCategoryIds })
                  .andWhere("category.id IN (:...categoryIds)", { categoryIds: categoryIds })
                  .getMany();

              // Create a map of subcategory IDs to their category IDs
              const subCategoryMap = new Map<string, Set<string>>();
              subCategoryCategories.forEach(subCat => {
                  if (!subCategoryMap.has(subCat.id)) {
                      subCategoryMap.set(subCat.id, new Set());
                  }
                  subCat.categories.forEach(cat => {
                      subCategoryMap.get(subCat.id)?.add(cat.id);
                  });
              });

              // Validate each subcategory
              for (const subCategoryId of subCategoryIds) {
                  const validCategories = subCategoryMap.get(subCategoryId);
                  const isValid = validCategories && categoryIds.some((catId: string) => validCategories.has(catId));
                  
                  if (!isValid) {
                      return res.status(400).json({
                          message: `Subcategory with id ${subCategoryId} does not belong to the provided categories`
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
            product.images = images;
            product.model = model;
            product.stock = stock;
            product.visible = visible;
            product.stockAvailability = stockAvailability;
            product.oldprice = oldprice;
            product.options = options;
            product.createdAt = new Date();

            await productRepository.save(product);

            return res.status(201).json(product);
        } catch (error: unknown) {
            console.error('Error in createProduct:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return res.status(500).json({ message: "Error creating product", error: errorMessage });
        }
    }

    static async getAllVisibleProducts(req: Request, res: Response): Promise<Response> {
        try {
            const CACHE_KEY = `visible_products`;

            // Try to get from cache first
            const cachedData = await cacheService.get(CACHE_KEY);
            if (cachedData) {
                return res.json(cachedData);
            }

            interface RawProduct {
                id: string;
                name: string;
                price: number;
                oldprice: number;
                images: string | string[];
                categories: string | null;
                subcategories: string | null;
                averagerating: number;
            }

            interface CategoryData {
                id: string;
                name: string;
            }

            // Use a single query with limited fields and no relations
            const products = await AppDataSource
                .createQueryBuilder()
                .select([
                    'p.id as id',
                    'p.name as name',
                    'p.price as price',
                    'p.oldprice as oldprice',
                    'p."averageRating" as averageRating',
                    'p.images as images',
                    'STRING_AGG(DISTINCT c.id || \':\' || c.name, \',\') as categories',
                    'STRING_AGG(DISTINCT sc.id || \':\' || sc.name, \',\') as subcategories'
                ])
                .from('product', 'p')
                .leftJoin('product_categories', 'pc', 'pc.productId = p.id')
                .leftJoin('category', 'c', 'c.id = pc.categoryId')
                .leftJoin('product_subcategories', 'psc', 'psc.productId = p.id')
                .leftJoin('sub_category', 'sc', 'sc.id = psc.subCategoryId')
                .where('p.visible = :visible', { visible: true })
                .groupBy('p.id, p.name, p.price, p.oldprice, p."averageRating", p.images')
                .getRawMany<RawProduct>();

                console.log('Fetched products:', products); // Log pour vérifier les données avant transformation


            // Transform the aggregated data into the desired format
            const mappedProducts = products.map(product => {
                console.log('averageRating',product.averagerating); // Ajoutez ceci pour vérifier la valeur

                // Parse categories string into array of objects
                const categories: CategoryData[] = product.categories ? product.categories.split(',').map((cat: string): CategoryData => {
                    const [id, name] = cat.split(':');
                    return { id, name };
                }) : [];

                // Parse subcategories string into array of objects
                const subcategories: CategoryData[] = product.subcategories ? product.subcategories.split(',').map((subcat: string): CategoryData => {
                    const [id, name] = subcat.split(':');
                    return { id, name };
                }) : [];

                // Parse images string if it's stored as a string
                let images: string[] = Array.isArray(product.images) ? product.images : [];
                if (typeof product.images === 'string') {
                    try {
                        images = JSON.parse(product.images);
                    } catch (e) {
                        images = [];
                    }
                }

                return {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    oldprice: product.oldprice,
                    averageRating: product.averagerating,
                    images: images.slice(0, 2),
                    categories,
                    subCategories: subcategories
                };
            });

            const response = {
                data: mappedProducts
            };

            // Store in Redis cache
            await cacheService.set(CACHE_KEY, response, 300); // 5 minutes
            return res.json(response);
        } catch (error: unknown) {
            console.error('Error in getAllVisibleProducts:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return res.status(500).json({ message: "Error fetching products", error: errorMessage });
        }
    }

    static async getAllProducts(req: Request, res: Response): Promise<Response> {
        const productRepository = AppDataSource.getRepository(Product);
      //  const page = parseInt(req.query.page as string) || 1;
       // const limit = parseInt(req.query.limit as string) || 10;
     //   const offset = (page - 1) * limit;

        try {
            const [products, total] = await productRepository.findAndCount({
                select: ["id", "images", "name", "price", "stock", "visible"],
                relations: ["categories"],
             //   skip: offset,
                //take: limit,
            });

            const mappedProducts = products.map(product => ({
                id: product.id,
                images: product.images,
                name: product.name,
                price: product.price,
                stock: product.stock,
                visible: product.visible,
                categories: product.categories.map(category => ({
                    id: category.id,
                    name: category.name,
                })),
            }));

           // const totalPages = Math.ceil(total / limit);

            return res.json({
                data: mappedProducts,
                //pagination: {total, page,totalPages},
            });
        } catch (error: unknown) {
            console.error('Error in getAllProducts:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return res.status(500).json({ message: "Error retrieving products", error: errorMessage });
        }
    }

    static async updateProduct(req: Request, res: Response): Promise<Response> {
        const {id} = req.params; 

        const { name, description, price, categoryIds, subCategoryIds, images, modelId, oldprice, stock, visible, stockAvailability, options } = req.body;
    
        const productRepository = AppDataSource.getRepository(Product);
        const categoryRepository = AppDataSource.getRepository(Category);
        const subCategoryRepository = AppDataSource.getRepository(SubCategory);
        const modelRepository = AppDataSource.getRepository(Model);
    
        try {
            const product = await productRepository.findOne({
                where: { id },
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
                // Fetch all subcategory-category relationships in one query
                const subCategoryCategories = await subCategoryRepository
                    .createQueryBuilder("subCategory")
                    .select(["subCategory.id", "category.id"])
                    .innerJoin("subCategory.categories", "category")
                    .where("subCategory.id IN (:...subCategoryIds)", { subCategoryIds: subCategoryIds })
                    .andWhere("category.id IN (:...categoryIds)", { categoryIds: categoryIds })
                    .getMany();

                // Create a map of subcategory IDs to their category IDs
                const subCategoryMap = new Map<string, Set<string>>();
                subCategoryCategories.forEach(subCat => {
                    if (!subCategoryMap.has(subCat.id)) {
                        subCategoryMap.set(subCat.id, new Set());
                    }
                    subCat.categories.forEach(cat => {
                        subCategoryMap.get(subCat.id)?.add(cat.id);
                    });
                });

                // Validate each subcategory
                for (const subCategoryId of subCategoryIds) {
                    const validCategories = subCategoryMap.get(subCategoryId);
                    const isValid = validCategories && categoryIds.some((catId: string) => validCategories.has(catId));
                    
                    if (!isValid) {
                        return res.status(400).json({
                            message: `Subcategory with id ${subCategoryId} does not belong to the provided categories`
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
            if (options !== undefined) {
                product.options = options;
            }

            await productRepository.save(product);
    
            return res.status(200).json(product);
        } catch (error: unknown) {
            console.error('Error in updateProduct:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return res.status(500).json({ message: "Error updating product", error: errorMessage });
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
        } catch (error: unknown) {
            console.error('Error in deleteProduct:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return res.status(500).json({ message: "Error deleting product", error: errorMessage });
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
        } catch (error: unknown) {
            console.error('Error in getProductById:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return res.status(500).json({ message: "Error retrieving product", error: errorMessage });
        }
    }

      static async deleteMultipleProducts(req: Request, res: Response): Promise<Response> {
        const { ids } = req.body;
    
        if (!Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({ message: "No product IDs provided" });
        }
    
        const productRepository = AppDataSource.getRepository(Product);
        const orderItemRepository = AppDataSource.getRepository(OrderItem);
    
        try {
          const products = await productRepository.findByIds(ids);
    
          if (products.length === 0) {
            return res.status(404).json({ message: "No products found with the provided IDs" });
          }
    
          // Récupérer les order_items associés aux produits à supprimer
          const orderItems = await orderItemRepository.find({
            where: { product: In(ids) } 
          });
    
          // Supprimer les order_items associés
          await orderItemRepository.remove(orderItems);
    
          // Supprimer les produits
          await productRepository.remove(products);
    
          return res.status(200).json({ message: "Products and associated order items deleted successfully", ids });
        } catch (error: unknown) {
            console.error('Error in deleteMultipleProducts:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return res.status(500).json({ message: "Error deleting products", error: errorMessage });
        }
    }
    static async getProductsByFilter(req: Request, res: Response) {
        console.log('Received request with params:', req.query);
        const categoryName = req.query.category as string;
        const subcategoryName = req.query.subcategory as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        try {
            const productRepository = AppDataSource.getRepository(Product);
            const queryBuilder = productRepository.createQueryBuilder('product')
                .select([
                    'product.id',
                    'product.name',
                    'product.price',
                    'product.oldPrice',
                    'product.images'
                ]);

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

            console.log('Params received from query:', {
                category: req.query.category,
                subcategory: req.query.subcategory,
                page: req.query.page,
                limit: req.query.limit
            });
                return res.json({
                products: products.map(product => ({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    oldPrice: product.oldprice,
                    images: product.images?.slice(0, 2) || []
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            });
        } catch (error: unknown) {
            console.error('Error in getProductsByFilter:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return res.status(500).json({ message: "Internal server error", error: errorMessage });
        }
    }
    static async getProductsByName(req: Request, res: Response): Promise<Response> {
        const { name } = req.query;
        console.log('Received request with name:', name);
        if (!name) {
            return res.status(400).json({ message: "Name query parameter is required" });
        }
        const productRepository = AppDataSource.getRepository(Product);
        try {
            console.log(`Searching for products with name containing: ${name}`);

            // Construire une requête dynamique pour vérifier la présence de chaque lettre
            const queryBuilder = productRepository.createQueryBuilder('product');
            const letters = (name as String).split('');
            letters.forEach((letter: String, index: any) => {
                queryBuilder.andWhere(`LOWER(product.name) LIKE :letter${index}`, { [`letter${index}`]: `%${letter}%` });
            });

            const products = await queryBuilder
                .select(['product.id', 'product.images', 'product.name', 'product.price', 'product.oldprice'])
                .getMany();

            if (!products || products.length === 0) {
                return res.status(404).json({ message: "No products found" });
            }

            console.log(`Found ${products.length} products`);

            const mappedProducts = products.map(product => ({
                id: product.id,
                images: product.images.slice(0, 2),
                name: product.name,
                price: product.price,
                oldprice: product.oldprice
            }));
            return res.status(200).json(mappedProducts);
        } catch (error: unknown) {
            console.error('Error fetching products by name:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return res.status(500).json({ message: "Internal server error", error: errorMessage });
        }
    }

    static async getRecentProducts(req: Request, res: Response): Promise<Response> {
        const CACHE_KEY = 'recent_products';
        try {
            // Try to get from cache first
            const cachedData = await cacheService.get(CACHE_KEY);
            if (cachedData) {
                return res.json(cachedData);
            }

            const productRepository = AppDataSource.getRepository(Product);
            const products = await productRepository
                .createQueryBuilder("product")
                .select(["product.id", "product.name", "product.price", "product.oldprice", "product.images"])
                .orderBy("product.createdAt", "DESC")
                .limit(8)
                .cache(true, 300000) // TypeORM cache for 5 minutes
                .getMany();

            const mappedProducts = products.map(product => ({
                id: product.id,
                name: product.name,
                price: product.price,
                oldprice: product.oldprice,
                images: product.images
            }));

            // Store in Redis cache
            await cacheService.set(CACHE_KEY, mappedProducts, 300); // 5 minutes
            return res.json(mappedProducts);
        } catch (error: unknown) {
            console.error('Error fetching recent products:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return res.status(500).json({ message: "Internal server error", error: errorMessage });
        }
    }

    static async updateAverageRating(productId: string): Promise<void> {
        console.log(`Updating average rating for product with ID: ${productId}`);
        const reviewRepository = AppDataSource.getRepository(Review);
        const productRepository = AppDataSource.getRepository(Product);
    
        // Calculer la moyenne des reviews approuvés
        const { average } = await reviewRepository
            .createQueryBuilder("review")
            .select("AVG(review.rating)", "average")
            .where("review.product = :productId", { productId })
            .andWhere("review.status = :status", { status: EReview.APPROVED })
            .getRawOne();

            console.log(`Average rating for product with ID ${productId}:`, average);
    
        // Mettre à jour la moyenne dans le produit
        await productRepository.update(productId, {
            averageRating: average || 0, // Par défaut 0 si aucun avis approuvé
        });
    }

    static async verifyAverageRating(productId: string) {
        const reviewRepository = AppDataSource.getRepository(Review);
        const productRepository = AppDataSource.getRepository(Product);
    
        // Calculer la moyenne depuis les reviews approuvés
        const { average } = await reviewRepository
            .createQueryBuilder("review")
            .select("AVG(review.rating)", "average")
            .where("review.product = :productId", { productId })
            .andWhere("review.status = :status", { status: EReview.APPROVED })
            .getRawOne();
    
        // Récupérer la moyenne enregistrée dans le produit
        const product = await productRepository.findOne({ where: { id: productId } });
    
        console.log("Moyenne calculée :", average || 0);
        console.log("Moyenne enregistrée :", product?.averageRating);
    
        if (parseFloat(String(average || 0)) === parseFloat(String(product?.averageRating || "0"))) {
            console.log("✅ La moyenne est correcte !");
        } else {
            console.log("❌ La moyenne est incorrecte !");
        }
    }

      
}
