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
 * Extracts metadata for a given YouTube URL using yt-dlp.
 */
export async function extractMetadata(url: string): Promise<VideoMetadata> {
  const ytdlp = await findYtDlp();
  if (!ytdlp) {
    throw new Error('yt-dlp medya işleyicisi sistemde bulunamadı. Lütfen sistem yapılandırmasını kontrol edin.');
  }

  const args = [
    '--dump-single-json',
    '--no-warnings',
    '--no-playlist',
    '--no-check-certificates',
    '--prefer-free-formats',
    '--',
    url,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(ytdlp.path, args, {
      timeout: 30000,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
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
        if (errorMsg.includes('Video unavailable') || errorMsg.includes('Private video')) {
          return reject(new Error('Bu video kullanılamıyor veya gizli olarak işaretlenmiş.'));
        }
        if (errorMsg.includes('Sign in') || errorMsg.includes('bot')) {
          return reject(new Error('Bu içerik şu anda işlenemiyor.'));
        }
        return reject(new Error('Geçerli bir video bağlantısı gir.'));
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
          // If video has at least this resolution or if it's 360p/480p/720p
          const hasQuality = Array.from(videoHeights).some((h) => h >= t.height) || t.height <= 720;
          if (hasQuality) {
            // Find approximate filesize if duration is known
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

        // Select high-res thumbnail if available
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
        reject(new Error(`Video metadata parse edilemedi: ${err.message}`));
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

  // Define unique output template
  const outputTemplate = path.join(outputDir, `${jobId}_%(title).50s.%(ext)s`);

  // Build command arguments safely without shell injection
  const args: string[] = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    '--newline', // Output progress line by line
    '--output', outputTemplate,
  ];

  if (ffmpeg) {
    args.push('--ffmpeg-location', ffmpeg.path);
  }

  const isAudio = format === 'mp3' || format === 'm4a';

  if (isAudio) {
    args.push('-x'); // Extract audio
    if (format === 'mp3') {
      args.push('--audio-format', 'mp3');
      const bitrateValue = quality.replace('k', '') || '320';
      args.push('--audio-quality', `${bitrateValue}k`);
    } else if (format === 'm4a') {
      args.push('--audio-format', 'm4a');
    }
  } else {
    // Video format
    let maxH = 1080;
    if (quality === '2160p') maxH = 2160;
    else if (quality === '1440p') maxH = 1440;
    else if (quality === '1080p') maxH = 1080;
    else if (quality === '720p') maxH = 720;
    else if (quality === '480p') maxH = 480;
    else if (quality === '360p') maxH = 360;

    args.push(
      '-f',
      `bestvideo[height<=${maxH}]+bestaudio/best[height<=${maxH}]/bestvideo+bestaudio/best`
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
      timeout: 10 * 60 * 1000, // 10 minutes timeout
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    let stderrData = '';
    let lastPercentage = 5;

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Parse download percentage: [download]  45.2% of ~ 15.34MiB at 4.21MiB/s ETA 00:02
        const downloadMatch = trimmed.match(/\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+~?([^\s]+)\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/i);
        if (downloadMatch) {
          const pct = Math.min(Math.max(parseFloat(downloadMatch[1]), 5), 85);
          lastPercentage = pct;
          onProgress?.({
            percentage: Math.round(pct),
            stage: 'downloading',
            stageMessage: `Medya indiriliyor... (%${Math.round(pct)})`,
            downloadSpeed: downloadMatch[3],
            eta: downloadMatch[4],
          });
          continue;
        }

        // Generic 100% download match
        if (trimmed.includes('[download] 100%')) {
          lastPercentage = 85;
          onProgress?.({
            percentage: 85,
            stage: 'converting',
            stageMessage: 'İndirme tamamlandı, dönüştürme başlatılıyor...',
          });
          continue;
        }

        // Processing & conversion hooks
        if (trimmed.includes('[Merger]') || trimmed.includes('[ExtractAudio]') || trimmed.includes('[FixupM4a]')) {
          lastPercentage = 90;
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
        const errorMsg = stderrData || 'Dönüştürme işlemi başarısız oldu.';
        if (errorMsg.includes('Requested format is not available')) {
          return reject(new Error('Seçtiğin format bu içerik için kullanılamıyor.'));
        }
        if (errorMsg.includes('timed out')) {
          return reject(new Error('İşlem zaman aşımına uğradı. Lütfen tekrar dene.'));
        }
        return reject(new Error('Bu içerik şu anda işlenemiyor.'));
      }

      // Locate the created file in outputDir matching jobId
      try {
        const files = fs.readdirSync(outputDir);
        const matchingFile = files.find((f) => f.startsWith(`${jobId}_`));

        if (!matchingFile) {
          return reject(new Error('Dönüştürülen dosya oluşturulamadı.'));
        }

        const fullPath = path.join(outputDir, matchingFile);
        const stats = fs.statSync(fullPath);

        // Sanitize final download filename
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
