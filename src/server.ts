import express from "express";
import { Application } from "express";
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

dotenv.config({ path: 'config.env' });

const app: Application = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 7000000 // 1MB
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PORT: number = Number(process.env.PORT) || 3000;
const SOCKET_PORT: number = 1234;
const HOST: string = String(process.env.PGHOST);

app.use(errorHandler);

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001", "http://localhost:4000"];

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

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
console.log('Socket initialized');

// Endpoint to serve image files
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  res.sendFile(filePath);
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('upload', (data, callback) => {
    const { json, png, productId, userId } = data;
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    try {

      // Save JSON file
      const jsonFilePath = path.join('uploads', `${productId}-${timestamp}.json`);
      fs.writeFileSync(jsonFilePath, json);
      console.log('JSON file saved');

      // Save PNG file
      const pngFilePath = path.join('uploads', `${productId}-${timestamp}.png`);
      fs.writeFileSync(pngFilePath, Buffer.from(png, 'base64'));
      console.log('PNG file saved');
      console.log("key", userId);

      // Emit PNG to another front-end project
      io.emit('newImage', { name: pngFilePath, key: userId, png: png });

      console.log('Files saved and PNG sent to another front-end project');
      if (callback) {
        callback({ success: true, message: 'Upload successful' });
      }
    } catch (error) {
      console.error('Error saving files:', error);
      if (callback) {
        callback({ success: false, message: 'Upload failed', error });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
server.listen(PORT, async () => {
  try {
    await AppDataSource.initialize();
    console.log(`🗄️  Server Fire on http://${HOST}:${PORT}`);
    console.log("📦 Connected to the database successfully");
    test();
  } catch (error) {
    console.error("❌ Error during Data Source initialization:", error);
  }
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket server is also running on port ${PORT}`);
});