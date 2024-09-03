import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../models/user.entity";
import { Category } from "../models/category.entity";
import { SubCategory } from "../models/subcategory.entity";
import { Product } from "../models/product.entity";
import { Model } from "../models/model.entity";
import { Order } from "../models/order.entity";
import { OrderItem } from "../models/orderItem.entity";
import { Review } from "../models/review.entity";

dotenv.config({ path: 'config.env' });

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    synchronize: true,
    logging: true,
    entities: [User, Category, SubCategory, Product, Model, Order, OrderItem, Review], 
    migrations: [__dirname + "/migration/*.ts"],
    subscribers: [],
});