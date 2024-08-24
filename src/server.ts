import express from "express";
import { Application } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./config/data-source";
import routes from "./config/routes";
import { errorHandler } from "./middlewares/error.middleware";
dotenv.config({ path: 'config.env' });
import cors from "cors";
import { test } from "./config/initialize";

const app: Application = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


const PORT: number = Number(process.env.PORT);

app.use(errorHandler);


app.listen(PORT, async () => {
    try {
        await AppDataSource.initialize();
        console.log(`🗄️  Server Fire on http://localhost:${PORT}`);
        console.log("📦 Connected to the database successfully");
        test();
    } catch (error) {
        console.error("❌ Error during Data Source initialization:", error);
    }
});

app.use(cors());

app.use(routes);


