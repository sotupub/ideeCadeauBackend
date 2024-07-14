import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../models/user.entity";
import { Category } from "../models/category.entity";
import { SubCategory } from "../models/subcategory.entity";

dotenv.config({ path: 'config.env' });

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: true,
    entities: [User, Category, SubCategory], 
    migrations: [__dirname + "/migration/*.ts"],
    subscribers: [],
});