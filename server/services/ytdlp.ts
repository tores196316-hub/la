import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { findYtDlp, findFfmpeg } from './systemChecker.js';
import { VideoMetadata, VideoFormatOption, MediaType } from '../types.js';
import { sanitizeFileName } from '../utils/security.js';

/**
 * Formats duration seconds into readable time string (e.g. 03:45 or 01:12:30).
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats bytes to readable size string.
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Resolves optional cookie file path from environment variables safely.
 */
export function getResolvedCookiePath(): string | null {
  const customPath = process.env.YTDLP_COOKIES_PATH;
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  const defaultCookieFile = path.resolve(process.cwd(), 'tmp', 'cookies.txt');
  if (fs.existsSync(defaultCookieFile)) {
    try {
      const stats = fs.statSync(defaultCookieFile);
      if (stats.size > 10) return defaultCookieFile;
    } catch {
      // ignore
    }
  }

  // Check if base64 or raw string is in env
  const envContent = process.env.YTDLP_COOKIE_CONTENT || process.env.YTDLP_COOKIES_BASE64;
  if (envContent) {
    try {
      const decoded = process.env.YTDLP_COOKIES_BASE64
        ? Buffer.from(process.env.YTDLP_COOKIES_BASE64, 'base64').toString('utf-8')
        : envContent;
      const tmpDir = path.resolve(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(defaultCookieFile, decoded, { mode: 0o600 });
      return defaultCookieFile;
    } catch (e) {
      console.warn('Cookie içeriği yazılamadı:', e);
    }
  }

  return null;
}

/**
 * Detects Node executable path for explicit --js-runtimes configuration.
 */
export function getNodeExecutablePath(): string {
  if (process.execPath && fs.existsSync(process.execPath)) {
    return process.execPath;
  }
  if (fs.existsSync('/usr/local/bin/node')) {
    return '/usr/local/bin/node';
  }
  if (fs.existsSync('/usr/bin/node')) {
    return '/usr/bin/node';
  }
  return 'node';
}

/**
 * Builds base yt-dlp arguments including JavaScript runtime, anti-blocking, proxy & cookies.
 */
export function buildBaseYtDlpArgs(): string[] {
  const nodePath = getNodeExecutablePath();

  const args: string[] = [
    '--no-warnings',
    '--no-playlist',
    '--no-check-certificates',
    '--force-ipv4',
    '--geo-bypass',
    // Explicit JavaScript Runtime configuration for yt-dlp & yt-dlp-ejs
    '--js-runtimes',
    `node:${nodePath}`,
    // YouTube player client priority
    '--extractor-args',
    'youtube:player_client=android,web',
  ];

  // Configure optional proxy if provided via env
  const proxy = process.env.YTDLP_PROXY || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  if (proxy && proxy.trim()) {
    args.push('--proxy', proxy.trim());
  }

  // Configure optional cookies if available
  const cookiePath = getResolvedCookiePath();
  if (cookiePath) {
    args.push('--cookies', cookiePath);
  }

  return args;
}

/**
 * Parses stderr output and maps it to clear, descriptive error messages.
 */
export function parseYtDlpError(rawError: string): Error {
  const lower = rawError.toLowerCase();

  if (lower.includes('429') || lower.includes('too many requests')) {
    return new Error(
      'YouTube sunucusu IP adresine geçici istek sınırı (HTTP 429) uyguladı. Lütfen birkaç dakika sonra tekrar deneyin veya Railway ayarlarından bir proxy/cookie yapılandırın.'
    );
  }

  if (lower.includes('sign in to confirm you’re not a bot') || lower.includes('sign in to confirm you are not a bot') || (lower.includes('bot') && lower.includes('confirm'))) {
    return new Error(
      'YouTube bot doğrulaması talep etti. Lütfen başka bir video/format deneyin veya sistem için YouTube cookie tanımlayın.'
    );
  }

  if (lower.includes('no supported javascript runtime could be found') || lower.includes('javascript runtime')) {
    return new Error(
      'JavaScript çalışma ortamı (Node.js runtime) hatası oluştu. Sistem ortamı güncelleniyor.'
    );
  }

  if (lower.includes('video unavailable') || lower.includes('this video is unavailable') || lower.includes('private video') || lower.includes('has been removed')) {
    return new Error('Bu video kullanılamıyor, gizli veya YouTube tarafından kaldırılmış.');
  }

  if (lower.includes('requested format is not available')) {
    return new Error('Seçtiğin kalite veya format bu içerik için mevcut değil. Lütfen başka bir seçenek belirleyin.');
  }

  if (lower.includes('timed out') || lower.includes('timeout')) {
    return new Error('İşlem zaman aşımına uğradı. Sunucu yoğun olabilir, lütfen tekrar deneyin.');
  }

  return new Error('Bu içerik şu anda işlenemiyor. Lütfen bağlantıyı kontrol edip tekrar deneyin.');
}

/**
 * Extracts metadata for a given YouTube URL using yt-dlp.
 */
export async function extractMetadata(url: string): Promise<VideoMetadata> {
  const ytdlp = await findYtDlp();
  if (!ytdlp) {
    throw new Error('yt-dlp medya işleyicisi sistemde bulunamadı. Lütfen sistem yapılandırmasını kontrol edin.');
  }

  const args = [
    '--dump-single-json',
    ...buildBaseYtDlpArgs(),
    '--',
    url,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(ytdlp.path, args, {
      timeout: 30000,
      env: { ...process.env, PYTHONUNBUFFERED: '1', YTDLP_JS_ENGINE: 'node' },
    });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`yt-dlp başlatılamadı: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        const errorMsg = stderrData || stdoutData || 'Bilinmeyen analiz hatası';
        return reject(parseYtDlpError(errorMsg));
      }

      try {
        const info = JSON.parse(stdoutData);
        const duration = typeof info.duration === 'number' ? info.duration : 0;
        
        // Parse available formats from yt-dlp formats list
        const rawFormats: any[] = Array.isArray(info.formats) ? info.formats : [];
        
        // Find max video height available
        const videoHeights = new Set<number>();
        rawFormats.forEach((f) => {
          if (f.height && typeof f.height === 'number') {
            videoHeights.add(f.height);
          }
        });

        // Determine available video options based on stream availability
        const availableFormats: VideoFormatOption[] = [];

        // Check video resolutions (4K, 2K, 1080p, 720p, 480p, 360p)
        const targetHeights = [
          { height: 2160, label: '4K Ultra HD (2160p)', quality: '2160p' },
          { height: 1440, label: '2K Quad HD (1440p)', quality: '1440p' },
          { height: 1080, label: '1080p Full HD', quality: '1080p', isBest: true },
          { height: 720, label: '720p HD', quality: '720p' },
          { height: 480, label: '480p Standart', quality: '480p' },
          { height: 360, label: '360p Hızlı', quality: '360p' },
        ];

        targetHeights.forEach((t) => {
          const hasQuality = Array.from(videoHeights).some((h) => h >= t.height) || t.height <= 720;
          if (hasQuality) {
            let approxBytes: number | undefined;
            if (duration > 0) {
              const bitrateKbps = t.height >= 2160 ? 15000 : t.height >= 1440 ? 8000 : t.height >= 1080 ? 4000 : t.height >= 720 ? 2200 : t.height >= 480 ? 1000 : 600;
              approxBytes = (bitrateKbps * 1000 * duration) / 8;
            }
            availableFormats.push({
              id: `mp4-${t.quality}`,
              format: 'mp4',
              quality: t.quality,
              label: t.label,
              type: 'video',
              resolution: `${t.height}p`,
              filesizeApprox: approxBytes ? `~${formatBytes(approxBytes)}` : undefined,
              isBest: t.isBest,
            });
          }
        });

        // Audio options (MP3 & M4A)
        const audioOptions: VideoFormatOption[] = [
          {
            id: 'mp3-320k',
            format: 'mp3',
            quality: '320k',
            label: 'MP3 320 kbps (Yüksek Kalite)',
            type: 'audio',
            bitrate: '320 kbps',
            filesizeApprox: duration > 0 ? `~${formatBytes((320 * 1000 * duration) / 8)}` : undefined,
            isBest: true,
          },
          {
            id: 'mp3-192k',
            format: 'mp3',
            quality: '192k',
            label: 'MP3 192 kbps (Standart)',
            type: 'audio',
            bitrate: '192 kbps',
            filesizeApprox: duration > 0 ? `~${formatBytes((192 * 1000 * duration) / 8)}` : undefined,
          },
          {
            id: 'mp3-128k',
            format: 'mp3',
            quality: '128k',
            label: 'MP3 128 kbps (Hızlı İndirme)',
            type: 'audio',
            bitrate: '128 kbps',
            filesizeApprox: duration > 0 ? `~${formatBytes((128 * 1000 * duration) / 8)}` : undefined,
          },
          {
            id: 'm4a-128k',
            format: 'm4a',
            quality: '128k',
            label: 'M4A Orijinal Ses (AAC)',
            type: 'audio',
            bitrate: '128 kbps',
            filesizeApprox: duration > 0 ? `~${formatBytes((128 * 1000 * duration) / 8)}` : undefined,
          },
        ];

        availableFormats.push(...audioOptions);

        let thumbnail = info.thumbnail || '';
        if (Array.isArray(info.thumbnails) && info.thumbnails.length > 0) {
          const sorted = [...info.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
          if (sorted[0]?.url) {
            thumbnail = sorted[0].url;
          }
        }

        const metadata: VideoMetadata = {
          id: info.id || 'video',
          url: info.webpage_url || url,
          title: info.title || 'YouTube Video',
          thumbnail,
          duration,
          durationFormatted: formatDuration(duration),
          uploader: info.uploader || info.channel || 'YouTube Kanalı',
          uploaderUrl: info.uploader_url || info.channel_url,
          viewCount: typeof info.view_count === 'number' ? info.view_count : undefined,
          uploadDate: info.upload_date,
          descriptionSnippet: typeof info.description === 'string' ? info.description.slice(0, 200) : undefined,
          availableFormats,
        };

        resolve(metadata);
      } catch (err: any) {
        reject(new Error(`Video metadata ayrıştırılamadı: ${err.message}`));
      }
    });
  });
}

export interface DownloadMediaOptions {
  url: string;
  format: 'mp4' | 'mp3' | 'm4a' | 'webm';
  quality: string;
  jobId: string;
  outputDir: string;
  onProgress?: (progress: {
    percentage: number;
    stage: 'queued' | 'downloading' | 'converting' | 'packaging' | 'ready';
    stageMessage: string;
    downloadSpeed?: string;
    eta?: string;
    downloadedBytes?: number;
    totalBytes?: number;
  }) => void;
}

/**
 * Downloads and processes video or audio into requested format.
 */
export async function downloadAndProcessMedia(options: DownloadMediaOptions): Promise<{
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
}> {
  const { url, format, quality, jobId, outputDir, onProgress } = options;

  const ytdlp = await findYtDlp();
  if (!ytdlp) {
    throw new Error('yt-dlp medya işleyicisi sistemde bulunamadı.');
  }

  const ffmpeg = await findFfmpeg();

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputTemplate = path.join(outputDir, `${jobId}_%(title).50s.%(ext)s`);

  const args: string[] = [
    ...buildBaseYtDlpArgs(),
    '--newline',
    '--output', outputTemplate,
  ];

  if (ffmpeg) {
    args.push('--ffmpeg-location', ffmpeg.path);
  }

  const isAudio = format === 'mp3' || format === 'm4a';

  if (isAudio) {
    args.push('-x');
    args.push('-f', 'ba/b');
    if (format === 'mp3') {
      args.push('--audio-format', 'mp3');
      const bitrateValue = quality.replace('k', '') || '320';
      args.push('--audio-quality', `${bitrateValue}k`);
    } else if (format === 'm4a') {
      args.push('--audio-format', 'm4a');
    }
  } else {
    let maxDim = 1080;
    if (quality === '2160p') maxDim = 2160;
    else if (quality === '1440p') maxDim = 1440;
    else if (quality === '1080p') maxDim = 1080;
    else if (quality === '720p') maxDim = 720;
    else if (quality === '480p') maxDim = 480;
    else if (quality === '360p') maxDim = 360;

    args.push(
      '-f',
      `bv*[height<=?${maxDim}]+ba/bv*[width<=?${maxDim}]+ba/b[height<=?${maxDim}]/b[width<=?${maxDim}]/bv*+ba/b`
    );
    args.push('--merge-output-format', 'mp4');
  }

  args.push('--', url);

  return new Promise((resolve, reject) => {
    onProgress?.({
      percentage: 5,
      stage: 'downloading',
      stageMessage: 'Medya akışları bağlanıyor...',
    });

    const child = spawn(ytdlp.path, args, {
      timeout: 10 * 60 * 1000,
      env: { ...process.env, PYTHONUNBUFFERED: '1', YTDLP_JS_ENGINE: 'node' },
    });

    let stderrData = '';

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const downloadMatch = trimmed.match(/\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+~?([^\s]+)\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/i);
        if (downloadMatch) {
          const pct = Math.min(Math.max(parseFloat(downloadMatch[1]), 5), 85);
          onProgress?.({
            percentage: Math.round(pct),
            stage: 'downloading',
            stageMessage: `Medya indiriliyor... (%${Math.round(pct)})`,
            downloadSpeed: downloadMatch[3],
            eta: downloadMatch[4],
          });
          continue;
        }

        if (trimmed.includes('[download] 100%')) {
          onProgress?.({
            percentage: 85,
            stage: 'converting',
            stageMessage: 'İndirme tamamlandı, dönüştürme başlatılıyor...',
          });
          continue;
        }

        if (trimmed.includes('[Merger]') || trimmed.includes('[ExtractAudio]') || trimmed.includes('[FixupM4a]')) {
          onProgress?.({
            percentage: 90,
            stage: 'converting',
            stageMessage: isAudio ? 'Ses FFmpeg ile dönüştürülüyor...' : 'Video ve ses birleştiriliyor...',
          });
          continue;
        }

        if (trimmed.includes('[Metadata]') || trimmed.includes('[Thumbnails]')) {
          onProgress?.({
            percentage: 95,
            stage: 'packaging',
            stageMessage: 'Dosya etiketleri ve paketleme tamamlanıyor...',
          });
          continue;
        }
      }
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`İndirme işlemi başlatılamadı: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`yt-dlp download failed with code ${code}. Stderr:`, stderrData);
        return reject(parseYtDlpError(stderrData));
      }

      try {
        const files = fs.readdirSync(outputDir);
        const matchingFile = files.find((f) => f.startsWith(`${jobId}_`));

        if (!matchingFile) {
          return reject(new Error('Dönüştürülen dosya oluşturulamadı.'));
        }

        const fullPath = path.join(outputDir, matchingFile);
        const stats = fs.statSync(fullPath);

        const cleanName = matchingFile.replace(new RegExp(`^${jobId}_`), '');
        const ext = path.extname(matchingFile) || `.${format}`;
        const base = path.basename(cleanName, ext);
        const sanitizedBase = sanitizeFileName(base, 'imgivo_media');
        const finalDisplayName = `${sanitizedBase}${ext}`;

        onProgress?.({
          percentage: 100,
          stage: 'ready',
          stageMessage: 'Dönüştürme tamamlandı ✓',
        });

        resolve({
          filePath: fullPath,
          fileName: finalDisplayName,
          fileSizeBytes: stats.size,
        });
      } catch (err: any) {
        reject(new Error(`Dosya çıktısı okunamadı: ${err.message}`));
      }
    });
  });
}
