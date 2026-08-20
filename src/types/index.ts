export type MediaType = 'video' | 'audio';

export interface VideoFormatOption {
  id: string;
  format: 'mp4' | 'mp3' | 'm4a' | 'webm';
  quality: string;
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
  duration: number;
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
}

export interface JobData {
  jobId: string;
  title: string;
  thumbnail: string;
  format: 'mp4' | 'mp3' | 'm4a' | 'webm';
  quality: string;
  type: MediaType;
  state: JobState;
  progress: JobProgress;
  fileName?: string;
  fileSizeBytes?: number;
  error?: string;
  downloadUrl?: string;
  createdAt: number;
  updatedAt: number;
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

export interface SystemHealth {
  status: string;
  service: string;
  dependencies: {
    ytdlp: {
      available: boolean;
      version: string | null;
    };
    ffmpeg: {
      available: boolean;
      version: string | null;
    };
    storage: {
      writable: boolean;
    };
  };
  timestamp: string;
}

export interface HistoryItem {
  id: string;
  jobId: string;
  url: string;
  title: string;
  thumbnail: string;
  format: string;
  quality: string;
  timestamp: number;
  fileSize?: string;
}
