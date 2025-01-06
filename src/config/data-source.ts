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
import { Widget } from "../models/widget.entity";
import { Contact } from "../models/contact.entity";
import { Devis } from "../models/devis.entity";

dotenv.config({ path: 'config.env' });

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    synchronize: true,
    logging: true,
    entities: [User, Category, SubCategory, Product, Model, Order, OrderItem, Review, Widget, Contact, Devis], 
    migrations: [__dirname + "/../migrations/*.ts"],
    subscribers: [],
});