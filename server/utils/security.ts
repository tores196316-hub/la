import path from 'path';

// Allowed YouTube domains and formats
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})([?&][\w=&%-]*)?$/;

/**
 * Validates whether a URL is a legitimate YouTube URL.
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length > 500) return false;
  return YOUTUBE_REGEX.test(trimmed);
}

/**
 * Extracts clean video ID from YouTube URL.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!isValidYouTubeUrl(url)) return null;
  const match = url.trim().match(YOUTUBE_REGEX);
  return match && match[5] ? match[5] : null;
}

/**
 * Reconstructs a canonical clean YouTube URL from video ID.
 * Prevents URL parameter injection / shell tricks.
 */
export function getCanonicalYouTubeUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Sanitizes a filename to prevent path traversal and filesystem issues.
 */
export function sanitizeFileName(name: string, fallback: string = 'media'): string {
  if (!name || typeof name !== 'string') return fallback;
  
  // Remove relative path segments (e.g. ../ or ./)
  let sanitized = name.replace(/\.{2,}[\\/]+/g, '');

  // Remove control characters, slashes, backslashes, colons, null bytes, quotes
  sanitized = sanitized
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip leading dots, hyphens or underscores
  sanitized = sanitized.replace(/^[._-]+/, '');

  // Truncate to maximum 80 characters
  if (sanitized.length > 80) {
    sanitized = sanitized.substring(0, 80).trim();
  }

  return sanitized || fallback;
}

/**
 * Validates Job ID format (UUID v4 or nanoid safe charset).
 */
export function isValidJobId(jobId: string): boolean {
  if (!jobId || typeof jobId !== 'string') return false;
  return /^[a-zA-Z0-9_-]{8,64}$/.test(jobId);
}

/**
 * Ensures target path is strictly within the allowed directory (Path Traversal protection).
 */
export function isSafePath(baseDir: string, targetPath: string): boolean {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase;
}
