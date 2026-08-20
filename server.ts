import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes/api.js';
import { getSystemDiagnostic } from './server/services/systemChecker.js';
import { jobManager } from './server/services/jobManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Enable trust proxy for Railway / container reverse proxies
app.set('trust proxy', 1);

// Security middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Rate limiting configured for reverse proxies
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10),
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
  },
  message: {
    success: false,
    error: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.',
  },
});

app.use('/api', limiter);
app.use('/api', apiRouter);

// Setup frontend serving
async function setupFrontend() {
  if (!isProd) {
    // Development mode: Use Vite dev middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite Dev Middleware devrede');
  } else {
    // Production mode: Serve dist folder
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
      console.log(`📦 Production static dist sunuluyor: ${distPath}`);
    } else {
      console.warn('⚠️ dist klasörü bulunamadı. Lütfen "npm run build" çalıştırın.');
    }
  }
}

async function startServer() {
  // Check system dependencies on start
  const diag = await getSystemDiagnostic(true);
  console.log('--- IMGIVO Başlatma Kontrolleri ---');
  console.log(`yt-dlp: ${diag.ytdlpFound ? `✓ (${diag.ytdlpVersion}) [${diag.ytdlpPath}]` : '✗ Bulunamadı'}`);
  console.log(`FFmpeg: ${diag.ffmpegFound ? `✓ (${diag.ffmpegVersion})` : '✗ Bulunamadı'}`);
  console.log(`Geçici Dizin: ${diag.tempDir} (Yazılabilir: ${diag.tempDirWritable})`);

  jobManager.cleanExpiredFiles();

  await setupFrontend();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 IMGIVO Sunucusu http://0.0.0.0:${PORT} adresinde çalışıyor`);
  });
}

startServer().catch((err) => {
  console.error('Sunucu başlatılırken kritik hata:', err);
  process.exit(1);
});
