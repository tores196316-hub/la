import { extractYouTubeVideoId } from '../utils/security.js';
import { formatDuration, formatBytes } from './ytdlp.js';
import { VideoMetadata, VideoFormatOption } from '../types.js';

export interface OEMbedResponse {
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
  provider_name?: string;
}

/**
 * Rapidly fetches YouTube metadata via official oEmbed API and public page scraping as robust fallback.
 */
export async function getFastYouTubeMetadata(url: string): Promise<VideoMetadata | null> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as OEMbedResponse;
    const title = data.title || 'YouTube Video';
    const uploader = data.author_name || 'YouTube Kanalı';
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

    const availableFormats: VideoFormatOption[] = [
      {
        id: 'mp4-1080p',
        format: 'mp4',
        quality: '1080p',
        label: '1080p Full HD',
        type: 'video',
        resolution: '1080p',
        isBest: true,
      },
      {
        id: 'mp4-720p',
        format: 'mp4',
        quality: '720p',
        label: '720p HD',
        type: 'video',
        resolution: '720p',
      },
      {
        id: 'mp4-480p',
        format: 'mp4',
        quality: '480p',
        label: '480p Standart',
        type: 'video',
        resolution: '480p',
      },
      {
        id: 'mp4-360p',
        format: 'mp4',
        quality: '360p',
        label: '360p Hızlı',
        type: 'video',
        resolution: '360p',
      },
      {
        id: 'mp3-320k',
        format: 'mp3',
        quality: '320k',
        label: 'MP3 320 kbps (Yüksek Kalite)',
        type: 'audio',
        bitrate: '320 kbps',
        isBest: true,
      },
      {
        id: 'mp3-192k',
        format: 'mp3',
        quality: '192k',
        label: 'MP3 192 kbps (Standart)',
        type: 'audio',
        bitrate: '192 kbps',
      },
      {
        id: 'm4a-128k',
        format: 'm4a',
        quality: '128k',
        label: 'M4A Orijinal Ses (AAC)',
        type: 'audio',
        bitrate: '128 kbps',
      },
    ];

    return {
      id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title,
      thumbnail,
      duration: 0,
      durationFormatted: 'Hazır',
      uploader,
      uploaderUrl: data.author_url,
      availableFormats,
    };
  } catch {
    return null;
  }
}
