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
  queuePosition?: number;
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
  userPlan?: 'free' | 'premium' | 'premium_plus';
  isPremium?: boolean;
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
  fileSizeBytes?: number;
  status?: 'completed' | 'processing' | 'failed';
}

export type UserRole = 'user' | 'admin';
export type UserPlan = 'free' | 'premium' | 'premium_plus';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  premiumActive: boolean;
  premiumStartedAt: number | null;
  premiumExpiresAt: number | null;
  remainingDays: number | null;
  remainingFormatted: string;
  disabled?: boolean;
  totalDownloads?: number;
  lastActiveAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface AdminDashboardData {
  users: {
    totalUsers: number;
    activePremiumUsers: number;
    expiredPremiumUsers: number;
    todayUsers: number;
  };
  conversions: {
    total: number;
    successful: number;
    failed: number;
    today: number;
    activeJobs: number;
    formatPopularity: Record<string, number>;
    recentJobs?: any[];
  };
  system: {
    ytdlpVersion: string | null;
    ffmpegAvailable: boolean;
    tempStorageUsedMb: number;
    uptimeSeconds: number;
  };
}

export interface PricingSettings {
  premiumMonthly: number;
  premiumDiscountPercent: number; // e.g. 30 (for 30% off on yearly)
  premiumPlusMonthly: number;
  premiumPlusDiscountPercent: number;
  updatedAt?: number;
}

export const DEFAULT_PRICING: PricingSettings = {
  premiumMonthly: 69,
  premiumDiscountPercent: 30,
  premiumPlusMonthly: 119,
  premiumPlusDiscountPercent: 25,
};

export interface SpeedSettings {
  freeSpeedLimitKbps: number; // 0 = Sınırsız, veya 2000, 3500, 5000 vb. (KB/s)
  freeQueueDelaySeconds: number; // 0 = Anında, veya 1, 2, 3, 5 saniye
  premiumSpeedLimitKbps: number; // 0 = Sınırsız
  premiumConcurrentFragments: number; // 1 to 16 (Örn: 4)
  premiumPlusSpeedLimitKbps: number; // 0 = Sınırsız
  premiumPlusConcurrentFragments: number; // 1 to 32 (Örn: 8)
  updatedAt?: number;
}

export const DEFAULT_SPEED_SETTINGS: SpeedSettings = {
  freeSpeedLimitKbps: 3500, // 3.5 MB/s (Hızlı ve stabil)
  freeQueueDelaySeconds: 1, // 1 saniyelik hafif bekleme
  premiumSpeedLimitKbps: 0, // Sınırsız
  premiumConcurrentFragments: 4, // 4 eşzamanlı parça
  premiumPlusSpeedLimitKbps: 0, // Sınırsız Turbo
  premiumPlusConcurrentFragments: 8, // 8 eşzamanlı parça
};

