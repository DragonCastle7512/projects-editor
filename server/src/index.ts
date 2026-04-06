import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';

import { authMiddleware } from './middleware/auth';
import authRouter from './routes/auth';
import filesRouter from './routes/files';

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_BUILD_PATH = path.resolve(__dirname, '../../client/dist');

// Middleware
app.use(cors({
  origin: true, 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Custom Auth Middleware
app.use(authMiddleware);

// Routes
app.use('/api', authRouter);
app.use('/api', filesRouter);

// --- STATIC FILES & SPA ROUTING ---
if (fs.existsSync(CLIENT_BUILD_PATH)) {
  app.use(express.static(CLIENT_BUILD_PATH));
  
  // SPA Fallback: Serve index.html for any request that doesn't match an API or static file
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && req.method === 'GET') {
      return res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
    }
    next();
  });
}

app.listen(Number(PORT), process.env.NODE_ENV ? '0.0.0.0' : '', () => {
  console.log(`Server running at ${PORT}`);
});
