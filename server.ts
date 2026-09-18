import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './src/server/config/db.ts';
import { seedDatabase } from './src/server/seed/seedData.ts';
import apiRouter from './src/server/routes/api.ts';
import { errorHandler } from './src/server/middleware/errorHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Connect to MongoDB and seed initial ERP data
  try {
    await connectDB();
    await seedDatabase();
  } catch (err) {
    console.error('Database bootstrap error:', err);
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Arambh Construction ERP API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Core API routes FIRST
  app.use('/api', apiRouter);

  // Central error handler for API
  app.use(errorHandler);

  // Vite Middleware for development OR static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ARAMBH CONSTRUCTION] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
