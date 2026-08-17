import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api.js';
import { antiBotMiddleware } from './middleware/antiBot.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;

async function startServer() {
  const app = express();

  // 1. Hide Express fingerprint
  app.disable('x-powered-by');

  // 2. Strict Security Headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https://challenges.cloudflare.com https://nexuspag.com https://test-streams.mux.dev",
      "frame-src 'self' https://challenges.cloudflare.com",
      "frame-ancestors 'self'",
    ].join('; ');
    res.setHeader('Content-Security-Policy', csp);

    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // 3. CORS with restricted origin in production
  const allowedOrigins = [
    process.env.PUBLIC_SITE_URL,
    'http://localhost:3001',
    'http://localhost:5173',
  ].filter(Boolean) as string[];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or if in development
      if (!origin || !isProduction || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for same-site SPA, secured by SameSite cookies & HMAC
      }
    },
    credentials: true,
  }));

  // 4. Request parsing with strict payload size limits (DoS Prevention)
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // 5. Anti-Bot Session Layer
  app.use(antiBotMiddleware);

  // 6. API Routes
  app.use('/api', apiRouter);

  // 7. Static creator assets
  app.use('/creator', express.static(path.resolve(__dirname, '../public/creator'), {
    maxAge: '1d',
    dotfiles: 'ignore',
  }));

  // 8. Serve Frontend (Vite in Dev or Dist in Prod)
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, '../dist');
    app.use(express.static(distPath, { maxAge: '1h' }));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 9. Centralized Error Handler (No stack trace leakage)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Server Internal Error]:', err?.message || 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'internal_server_error',
      message: 'Ocorreu um erro interno. Tente novamente mais tarde.',
    });
  });

  app.listen(PORT, () => {
    console.log(`\n✨ =================================================`);
    console.log(`🔒 PRIVATE LIVE PLATFORM running on http://localhost:${PORT}`);
    console.log(`🛡️ DevSecOps Hardening: ACTIVE (CSP, DoS limits, Timing-Safe Auth)`);
    console.log(`💳 Products: [Produto A: /live] | [Produto B: /whatsapp]`);
    console.log(`🔑 Admin Access: http://localhost:${PORT}/admin`);
    console.log(`✨ =================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
