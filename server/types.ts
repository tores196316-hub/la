export type MediaType = 'video' | 'audio';

export interface VideoFormatOption {
  id: string;
  format: 'mp4' | 'mp3' | 'm4a' | 'webm';
  quality: string; // e.g. '1080p', '720p', '480p', '360p', '320k', '192k', '128k'
  label: string;
  type: MediaType;
  resolution?: string;
  bitrate?: string;
  filesizeApprox?: string;
  isBest?: boolean;
}

export interface VideoMetadata {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: number; // in seconds
  durationFormatted: string;
  uploader: string;
  uploaderUrl?: string;
  viewCount?: number;
  uploadDate?: string;
  descriptionSnippet?: string;
  availableFormats: VideoFormatOption[];
}

export type JobState =
  | 'queued'
  | 'analyzing'
  | 'downloading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired';

export interface JobProgress {
  percentage: number;
  stage: 'queued' | 'downloading' | 'converting' | 'packaging' | 'ready';
  stageMessage: string;
  downloadSpeed?: string;
  eta?: string;
  downloadedBytes?: number;
  totalBytes?: number;
  queuePosition?: number;
}

export interface ConversionJob {
  jobId: string;
  url: string;
  title: string;
  thumbnail: string;
  format: 'mp4' | 'mp3' | 'm4a' | 'webm';
  quality: string;
  type: MediaType;
  state: JobState;
  progress: JobProgress;
  userPlan?: 'free' | 'premium' | 'premium_plus';
  isPremium?: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  fileSizeBytes?: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
  downloadedAt?: number;
  expiresAt: number;
}

export interface AnalyzeRequest {
  url: string;
}

export interface DownloadRequest {
  url: string;
  format: 'mp4' | 'mp3' | 'm4a' | 'webm';
  quality: string;
  title?: string;
}

export interface AdminStats {
  totalConversions: number;
  successfulConversions: number;
  failedConversions: number;
  activeJobs: number;
  todayConversions: number;
  formatPopularity: Record<string, number>;
  system: {
    ytdlpVersion: string | null;
    ffmpegAvailable: boolean;
    tempStorageUsedMb: number;
    uptimeSeconds: number;
  };
}
