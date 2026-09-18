import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './src/server/config/db.ts';
import { seedDatabase } from './src/server/seed/seedData.ts';
import apiRouter from './src/server/routes/api.ts';
import { errorHandler } from './src/server/middleware/errorHandler.ts';

// Safe resolution for both ESM and CJS bundle
const rootDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// Start database connection & seeding in background so port 3000 opens immediately
let isDbReady = false;
const dbInitPromise = (async () => {
  try {
    await connectDB();
    await seedDatabase();
    isDbReady = true;
    console.log('[ARAMBH ERP] Database connection & seed ready.');
  } catch (err) {
    console.error('[ARAMBH ERP] Database bootstrap error:', err);
  }
})();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint (always responds instantly)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      dbReady: isDbReady,
      service: 'Arambh Construction ERP API',
      timestamp: new Date().toISOString(),
    });
  });

  // Database readiness middleware for API routes
  app.use('/api', async (req, res, next) => {
    if (!isDbReady) {
      await dbInitPromise;
    }
    next();
  });

  // Mount Core API routes
  app.use('/api', apiRouter);

  // Central error handler for API
  app.use(errorHandler);

  // Vite Middleware for development OR static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
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

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});

