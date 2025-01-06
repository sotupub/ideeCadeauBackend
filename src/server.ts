import express, { Application } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./config/data-source";
import routes from "./config/routes";
import { errorHandler } from "./middlewares/error.middleware";
import cors from "cors";
import { test } from "./config/initialize";
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config({ path: 'config.env' });

const app: Application = express();
const server = http.createServer(app);

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:4000",
    "http://54.37.40.39:3000",
    "http://54.37.40.39:3001",
    "http://54.37.40.39:4000"
];

const corsOptions = {
    origin: function (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Apply CORS middleware before other middleware
app.use(cors(corsOptions));

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression middleware
app.use(compression());

// Rate limiting
/*const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);*/

// Body parser with limits
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const PORT: number = Number(process.env.PORT) || 8000;
const SOCKET_PORT : number = Number(process.env.SOCKET_PORT) || 8000;
const HOST: string = String(process.env.PGHOST);

app.use(errorHandler);

app.use(routes);

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Endpoint to serve image files
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  res.sendFile(filePath);
});

// Handle Socket.IO connections
// const socketApp = express();
// const socketServer = http.createServer(socketApp);
// const io = new Server(socketServer, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"]
//   },
//   maxHttpBufferSize: 7000000 // 1MB
// });

// io.on('connection', (socket) => {
//   console.log('A user connected');

//   socket.on('upload', (data, callback) => {
//     const { json, png, productId, userId } = data;
//     const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
//     try {

//       // Save JSON file
//       const jsonFilePath = path.join('uploads', `${productId}-${timestamp}.json`);
//       fs.writeFileSync(jsonFilePath, json);
//       console.log('JSON file saved');

//       // Save PNG file
//       const pngFilePath = path.join('uploads', `${productId}-${timestamp}.png`);
//       fs.writeFileSync(pngFilePath, Buffer.from(png, 'base64'));
//       console.log('PNG file saved');
//       console.log("key", userId);

//       // Emit PNG to another front-end project
//       io.emit('newImage', { name: pngFilePath, key: userId, png: png });

//       console.log('Files saved and PNG sent to another front-end project');
//       if (callback) {
//         callback({ success: true, message: 'Upload successful' });
//       }
//     } catch (error) {
//       console.error('Error saving files:', error);
//       if (callback) {
//         callback({ success: false, message: 'Upload failed', error });
//       }
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//   });
// });

// Start the socket server on a different port
// try {
//   console.log("SOCKET_PORT", SOCKET_PORT);
  
//   socketServer.listen(SOCKET_PORT, () => {
//     console.log(`Socket server is running on port ${SOCKET_PORT}`);
//   });
// } catch (error) {
//   console.error(`❌ Error starting socket server on port ${SOCKET_PORT}:`, error);
// }

// Start the main server
server.listen(PORT, async () => {
  try {
    await AppDataSource.initialize();
    console.log(`🗄️  Server Fire on http://${HOST}:${PORT}`);
    console.log("📦 Connected to the database successfully");
    // test(); // Assuming you have a test function
  } catch (error) {
    console.error("❌ Error during Data Source initialization:", error);
  }
  console.log(`Server is running on port ${PORT}`);
});
