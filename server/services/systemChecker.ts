import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface SystemDiagnostic {
  ytdlpFound: boolean;
  ytdlpPath: string | null;
  ytdlpVersion: string | null;
  ffmpegFound: boolean;
  ffmpegPath: string | null;
  ffmpegVersion: string | null;
  tempDir: string;
  tempDirWritable: boolean;
  error?: string;
}

let cachedDiagnostic: SystemDiagnostic | null = null;
let lastCheckTime = 0;

/**
 * Searches for a working yt-dlp binary across common locations.
 */
export async function findYtDlp(): Promise<{ path: string; version: string } | null> {
  const candidatePaths = [
    process.env.YT_DLP_PATH,
    '/app/applet/bin/yt-dlp',
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp',
    'yt-dlp',
    path.resolve(process.cwd(), 'bin', 'yt-dlp'),
    path.resolve(process.cwd(), 'bin', 'yt-dlp.exe'),
  ].filter(Boolean) as string[];

  for (const binPath of candidatePaths) {
    try {
      if (binPath.startsWith('/') || binPath.includes(path.sep)) {
        if (!fs.existsSync(binPath)) continue;
      }
      const version = await runVersionCheck(binPath, ['--version']);
      if (version) {
        return { path: binPath, version: version.trim() };
      }
    } catch {
      // Continue search
    }
  }

  return null;
}

/**
 * Searches for ffmpeg binary.
 */
export async function findFfmpeg(): Promise<{ path: string; version: string } | null> {
  const candidatePaths = [
    process.env.FFMPEG_PATH,
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    'ffmpeg',
    path.resolve(process.cwd(), 'bin', 'ffmpeg'),
    path.resolve(process.cwd(), 'bin', 'ffmpeg.exe'),
  ].filter(Boolean) as string[];

  for (const binPath of candidatePaths) {
    try {
      if (binPath.startsWith('/') || binPath.includes(path.sep)) {
        if (!fs.existsSync(binPath)) continue;
      }
      const version = await runVersionCheck(binPath, ['-version']);
      if (version) {
        const firstLine = version.split('\n')[0] || 'ffmpeg available';
        return { path: binPath, version: firstLine.trim() };
      }
    } catch {
      // Continue search
    }
  }

  return null;
}

function runVersionCheck(cmd: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const child = spawn(cmd, args, { timeout: 8000 });
      let stdout = '';
      child.stdout.on('data', (d) => { stdout += d.toString(); });
      child.on('error', () => resolve(null));
      child.on('close', (code) => {
        if (code === 0 && stdout) resolve(stdout);
        else resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Runs full system diagnostic.
 */
export async function getSystemDiagnostic(forceRefresh = false): Promise<SystemDiagnostic> {
  const now = Date.now();
  if (!forceRefresh && cachedDiagnostic && now - lastCheckTime < 60000) {
    return cachedDiagnostic;
  }

  const tempDir = path.resolve(process.cwd(), 'tmp', 'downloads');
  let tempDirWritable = false;
  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const testFile = path.join(tempDir, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    tempDirWritable = true;
  } catch (err: any) {
    tempDirWritable = false;
  }

  const ytdlp = await findYtDlp();
  const ffmpeg = await findFfmpeg();

  cachedDiagnostic = {
    ytdlpFound: !!ytdlp,
    ytdlpPath: ytdlp?.path || null,
    ytdlpVersion: ytdlp?.version || null,
    ffmpegFound: !!ffmpeg,
    ffmpegPath: ffmpeg?.path || null,
    ffmpegVersion: ffmpeg?.version || null,
    tempDir,
    tempDirWritable,
  };

  lastCheckTime = now;
  return cachedDiagnostic;
}
