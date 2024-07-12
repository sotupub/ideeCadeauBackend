import "reflect-metadata";
import express from "express";
import { Application } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./config/data-source";
import routes from "./config/routes";

dotenv.config({ path: 'config.env' });

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT: number = Number(process.env.PORT);

app.listen(PORT, async () => {
    try {
        await AppDataSource.initialize();
        console.log(`🗄️  Server Fire on http://localhost:${PORT}`);
        console.log("📦 Connected to the database successfully");
    } catch (error) {
        console.error("❌ Error during Data Source initialization:", error);
    }
});

app.use(routes);


