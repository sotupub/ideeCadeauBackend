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
const HOST: string = String(process.env.PGHOST);

app.use(errorHandler);


app.listen(PORT, async () => {
    try {
        await AppDataSource.initialize();
        console.log(`🗄️  Server Fire on http://${HOST}:${PORT}`);
        console.log("📦 Connected to the database successfully");
        test();
    } catch (error) {
        console.error("❌ Error during Data Source initialization:", error);
    }
});

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(routes);


