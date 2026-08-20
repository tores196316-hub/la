import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { isValidYouTubeUrl, getCanonicalYouTubeUrl, isValidJobId, isSafePath } from '../utils/security.js';
import { extractMetadata, getResolvedCookiePath, saveRuntimeCookieContent } from '../services/ytdlp.js';
import { getFastYouTubeMetadata } from '../services/fastMeta.js';
import { jobManager } from '../services/jobManager.js';
import { getSystemDiagnostic } from '../services/systemChecker.js';

export const apiRouter = Router();

const TEMP_DIR = path.resolve(process.cwd(), 'tmp', 'downloads');

// Validation schemas
const analyzeSchema = z.object({
  url: z.string().min(1, 'Lütfen bir video bağlantısı girin.').max(500),
});

const downloadSchema = z.object({
  url: z.string().min(1, 'Lütfen geçerli bir URL girin.').max(500),
  format: z.enum(['mp4', 'mp3', 'm4a', 'webm']),
  quality: z.string().min(1).max(20),
  title: z.string().max(200).optional(),
  thumbnail: z.string().max(1000).optional(),
});

/**
 * POST /api/analyze
 * Analyzes video URL and retrieves title, thumbnail, duration, available formats
 */
apiRouter.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = analyzeSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Geçerli bir video bağlantısı gir.',
      });
      return;
    }

    const rawUrl = parseResult.data.url.trim();
    if (!isValidYouTubeUrl(rawUrl)) {
      res.status(400).json({
        success: false,
        error: 'Geçerli bir video bağlantısı gir.',
      });
      return;
    }

    const canonicalUrl = getCanonicalYouTubeUrl(rawUrl);
    if (!canonicalUrl) {
      res.status(400).json({
        success: false,
        error: 'Geçerli bir video bağlantısı gir.',
      });
      return;
    }

    // Try primary yt-dlp metadata extraction
    try {
      const metadata = await extractMetadata(canonicalUrl);
      res.json({
        success: true,
        data: metadata,
      });
      return;
    } catch (primaryErr: any) {
      console.warn('yt-dlp metadata failed, attempting fast oEmbed fallback:', primaryErr?.message);
      
      // Fallback to official YouTube oEmbed API
      const fallbackMeta = await getFastYouTubeMetadata(canonicalUrl);
      if (fallbackMeta) {
        res.json({
          success: true,
          data: fallbackMeta,
        });
        return;
      }
      
      throw primaryErr;
    }
  } catch (err: any) {
    console.error('Video analiz hatası:', err);
    const message = err.message || 'Video bilgileri alınırken bir hata oluştu.';
    res.status(422).json({
      success: false,
      error: message || 'Bu içerik şu anda işlenemiyor.',
    });
  }
});

/**
 * POST /api/download
 * Starts background media conversion job
 */
apiRouter.post('/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = downloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Geçersiz indirme parametreleri.',
      });
      return;
    }

    const { url, format, quality, title, thumbnail } = parseResult.data;

    if (!isValidYouTubeUrl(url)) {
      res.status(400).json({
        success: false,
        error: 'Geçerli bir video bağlantısı gir.',
      });
      return;
    }

    const canonicalUrl = getCanonicalYouTubeUrl(url);
    if (!canonicalUrl) {
      res.status(400).json({
        success: false,
        error: 'Geçerli bir video bağlantısı gir.',
      });
      return;
    }

    const isAudio = format === 'mp3' || format === 'm4a';
    const job = jobManager.createJob({
      url: canonicalUrl,
      format,
      quality,
      title: title || 'IMGIVO Medya',
      thumbnail: thumbnail || '',
      type: isAudio ? 'audio' : 'video',
    });

    res.json({
      success: true,
      jobId: job.jobId,
      message: 'Dönüştürme işlemi başlatıldı.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'İşlem başlatılamadı. Lütfen tekrar deneyin.',
    });
  }
});

/**
 * GET /api/jobs/:jobId
 * Returns real-time status of the job
 */
apiRouter.get('/jobs/:jobId', (req: Request, res: Response): void => {
  const { jobId } = req.params;

  if (!isValidJobId(jobId)) {
    res.status(400).json({
      success: false,
      error: 'Geçersiz işlem kimliği.',
    });
    return;
  }

  const job = jobManager.getJob(jobId);
  if (!job) {
    res.status(404).json({
      success: false,
      error: 'İşlem bulunamadı veya süresi doldu.',
    });
    return;
  }

  res.json({
    success: true,
    job: {
      jobId: job.jobId,
      title: job.title,
      thumbnail: job.thumbnail,
      format: job.format,
      quality: job.quality,
      type: job.type,
      state: job.state,
      progress: job.progress,
      fileName: job.fileName,
      fileSizeBytes: job.fileSizeBytes,
      error: job.error,
      downloadUrl: job.state === 'completed' ? `/api/download/${job.jobId}` : undefined,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    },
  });
});

/**
 * GET /api/download/:jobId
 * Downloads the converted file and schedules temporary file cleanup
 */
apiRouter.get('/download/:jobId', (req: Request, res: Response): void => {
  const { jobId } = req.params;

  if (!isValidJobId(jobId)) {
    res.status(400).json({
      success: false,
      error: 'Geçersiz işlem kimliği.',
    });
    return;
  }

  const job = jobManager.getJob(jobId);
  if (!job) {
    res.status(404).json({
      success: false,
      error: 'İndirme dosyası bulunamadı veya süresi doldu.',
    });
    return;
  }

  if (job.state !== 'completed' || !job.filePath) {
    res.status(400).json({
      success: false,
      error: 'Dosya henüz hazır değil veya oluşturulamadı.',
    });
    return;
  }

  if (!isSafePath(TEMP_DIR, job.filePath) || !fs.existsSync(job.filePath)) {
    res.status(404).json({
      success: false,
      error: 'Dosya sunucu diskinde bulunamadı.',
    });
    return;
  }

  const fileName = job.fileName || `imgivo_${job.jobId}.${job.format}`;
  const contentType =
    job.format === 'mp3'
      ? 'audio/mpeg'
      : job.format === 'm4a'
      ? 'audio/mp4'
      : 'video/mp4';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

  const stat = fs.statSync(job.filePath);
  res.setHeader('Content-Length', stat.size);

  const fileStream = fs.createReadStream(job.filePath);
  fileStream.pipe(res);

  fileStream.on('close', () => {
    // Schedule file deletion 2 minutes after download to allow retries / save disk
    setTimeout(() => {
      jobManager.deleteJobFile(jobId);
    }, 2 * 60 * 1000);
  });

  fileStream.on('error', () => {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Dosya aktarılırken bir hata oluştu.',
      });
    }
  });
});

/**
 * GET /api/health
 * Health check endpoint as required by spec
 */
apiRouter.get('/health', async (_req: Request, res: Response): Promise<void> => {
  const diag = await getSystemDiagnostic();
  res.json({
    status: 'ok',
    service: 'imgivo-converter',
    dependencies: {
      ytdlp: {
        available: diag.ytdlpFound,
        version: diag.ytdlpVersion,
      },
      ffmpeg: {
        available: diag.ffmpegFound,
        version: diag.ffmpegVersion,
      },
      storage: {
        writable: diag.tempDirWritable,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/admin/stats
 * Admin analytics & stats
 */
apiRouter.get('/admin/stats', async (_req: Request, res: Response): Promise<void> => {
  const stats = await jobManager.getAdminStats();
  res.json({
    success: true,
    data: stats,
  });
});

/**
 * POST /api/admin/cleanup
 * Trigger temp storage cleanup
 */
apiRouter.post('/admin/cleanup', (_req: Request, res: Response): void => {
  const result = jobManager.cleanExpiredFiles();
  res.json({
    success: true,
    message: `${result.removedCount} geçici dosya temizlendi.`,
    freedMb: (result.freedBytes / (1024 * 1024)).toFixed(2),
  });
});

/**
 * GET /api/admin/cookies
 * Checks if a valid cookie file is configured
 */
apiRouter.get('/admin/cookies', (_req: Request, res: Response): void => {
  const cookiePath = getResolvedCookiePath();
  let fileSize = 0;
  if (cookiePath && fs.existsSync(cookiePath)) {
    try {
      fileSize = fs.statSync(cookiePath).size;
    } catch {
      // ignore
    }
  }

  res.json({
    success: true,
    hasCookies: Boolean(cookiePath),
    cookiePath: cookiePath ? path.basename(cookiePath) : null,
    fileSize,
  });
});

/**
 * POST /api/admin/cookies
 * Saves user-provided cookies (Netscape or JSON format) to disk
 */
apiRouter.post('/admin/cookies', (req: Request, res: Response): void => {
  const { cookies } = req.body;
  if (!cookies || typeof cookies !== 'string' || !cookies.trim()) {
    res.status(400).json({
      success: false,
      error: 'Lütfen geçerli bir YouTube cookie içeriği (Netscape veya JSON formatında) yapıştırın.',
    });
    return;
  }

  const result = saveRuntimeCookieContent(cookies);
  if (result.success) {
    res.json({
      success: true,
      message: result.message,
    });
  } else {
    res.status(500).json({
      success: false,
      error: result.message,
    });
  }
});

/**
 * GET /api/history
 * Returns recent processed jobs
 */
apiRouter.get('/history', (_req: Request, res: Response): void => {
  const history = jobManager.getRecentHistory(20);
  res.json({
    success: true,
    data: history,
  });
});
