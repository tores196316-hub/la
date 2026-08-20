import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ConversionJob, JobState, JobProgress, AdminStats, MediaType } from '../types.js';
import { downloadAndProcessMedia } from './ytdlp.js';
import { getSystemDiagnostic } from './systemChecker.js';

const TEMP_DIR = path.resolve(process.cwd(), 'tmp', 'downloads');
const JOB_EXPIRATION_MS = (parseInt(process.env.JOB_EXPIRATION_MINUTES || '30', 10)) * 60 * 1000;
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || '5', 10);

class JobManager {
  private jobs: Map<string, ConversionJob> = new Map();
  private stats = {
    totalConversions: 0,
    successfulConversions: 0,
    failedConversions: 0,
    todayConversions: 0,
    lastDayTracked: new Date().toDateString(),
    formatPopularity: {} as Record<string, number>,
  };
  private startTime = Date.now();

  constructor() {
    this.ensureTempDir();
    this.cleanExpiredFiles();
    // Run cleanup every 5 minutes
    setInterval(() => this.cleanExpiredFiles(), 5 * 60 * 1000);
  }

  private ensureTempDir() {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  }

  private resetDailyStatsIfNeeded() {
    const today = new Date().toDateString();
    if (this.stats.lastDayTracked !== today) {
      this.stats.todayConversions = 0;
      this.stats.lastDayTracked = today;
    }
  }

  public createJob(params: {
    url: string;
    format: 'mp4' | 'mp3' | 'm4a' | 'webm';
    quality: string;
    title: string;
    thumbnail: string;
    type: MediaType;
    isPremium?: boolean;
    userPlan?: 'free' | 'premium' | 'premium_plus';
  }): ConversionJob {
    this.resetDailyStatsIfNeeded();
    const jobId = crypto.randomBytes(12).toString('hex');
    const now = Date.now();
    const isPremium = Boolean(params.isPremium);
    const userPlan = params.userPlan || (isPremium ? 'premium' : 'free');

    const job: ConversionJob = {
      jobId,
      url: params.url,
      title: params.title,
      thumbnail: params.thumbnail,
      format: params.format,
      quality: params.quality,
      type: params.type,
      state: 'queued',
      userPlan,
      isPremium,
      progress: {
        percentage: 0,
        stage: 'queued',
        stageMessage: isPremium
          ? '⚡ VIP Turbo Sıra: Anında bağlanılıyor...'
          : 'Standart İndirme Sırası: Yoğunluk kuyruğunda bekleniyor...',
        queuePosition: isPremium ? 0 : 3,
      },
      createdAt: now,
      updatedAt: now,
      expiresAt: now + JOB_EXPIRATION_MS,
    };

    this.jobs.set(jobId, job);
    this.stats.totalConversions++;
    this.stats.todayConversions++;

    const formatKey = `${params.format.toUpperCase()} ${params.quality}`;
    this.stats.formatPopularity[formatKey] = (this.stats.formatPopularity[formatKey] || 0) + 1;

    // Start background processing
    this.processJob(jobId);

    return job;
  }

  public getJob(jobId: string): ConversionJob | undefined {
    return this.jobs.get(jobId);
  }

  public getActiveJobsCount(): number {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (job.state === 'queued' || job.state === 'downloading' || job.state === 'processing') {
        count++;
      }
    }
    return count;
  }

  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Standard Free Tier Queue Throttle (Simulation: 4.5s queue delay with status updates)
    if (!job.isPremium) {
      // Step 1: Queue position #3
      await new Promise((r) => setTimeout(r, 2200));
      const jobStep1 = this.jobs.get(jobId);
      if (!jobStep1 || jobStep1.state === 'failed') return;
      jobStep1.progress = {
        percentage: 3,
        stage: 'queued',
        stageMessage: 'Standart İndirme Sırası: Sunucu hazırlanıyor (Sıra #1)...',
        queuePosition: 1,
      };
      jobStep1.updatedAt = Date.now();

      // Step 2: Queue position #1
      await new Promise((r) => setTimeout(r, 2000));
      const jobStep2 = this.jobs.get(jobId);
      if (!jobStep2 || jobStep2.state === 'failed') return;
    }

    job.state = 'downloading';
    job.progress.stage = 'downloading';
    job.progress.percentage = 5;
    job.progress.stageMessage = job.isPremium
      ? '⚡ VIP Turbo Hat Bağlandı: Maksimum Hızda İndiriliyor...'
      : 'Medya indiriliyor (Standart Hız Modu)...';
    job.progress.queuePosition = 0;
    job.updatedAt = Date.now();

    try {
      const result = await downloadAndProcessMedia({
        url: job.url,
        format: job.format,
        quality: job.quality,
        jobId: job.jobId,
        outputDir: TEMP_DIR,
        isPremium: job.isPremium,
        userPlan: job.userPlan,
        onProgress: (progress: JobProgress) => {
          const currentJob = this.jobs.get(jobId);
          if (currentJob && currentJob.state !== 'failed') {
            currentJob.progress = progress;
            currentJob.updatedAt = Date.now();
            if (progress.stage === 'converting') {
              currentJob.state = 'processing';
            }
          }
        },
      });

      const finishedJob = this.jobs.get(jobId);
      if (finishedJob) {
        finishedJob.state = 'completed';
        finishedJob.filePath = result.filePath;
        finishedJob.fileName = result.fileName;
        finishedJob.fileSizeBytes = result.fileSizeBytes;
        finishedJob.progress = {
          percentage: 100,
          stage: 'ready',
          stageMessage: 'Dönüştürme tamamlandı ✓',
        };
        finishedJob.updatedAt = Date.now();
        finishedJob.expiresAt = Date.now() + JOB_EXPIRATION_MS;
        this.stats.successfulConversions++;
      }
    } catch (err: any) {
      const failedJob = this.jobs.get(jobId);
      if (failedJob) {
        failedJob.state = 'failed';
        failedJob.error = err.message || 'Dönüştürme sırasında beklenmeyen bir hata oluştu.';
        failedJob.progress = {
          percentage: 0,
          stage: 'queued',
          stageMessage: failedJob.error || 'Hata',
        };
        failedJob.updatedAt = Date.now();
        this.stats.failedConversions++;
      }
    }
  }

  public deleteJobFile(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || !job.filePath) return false;

    try {
      if (fs.existsSync(job.filePath)) {
        fs.unlinkSync(job.filePath);
      }
      job.filePath = undefined;
      job.state = 'expired';
      return true;
    } catch {
      return false;
    }
  }

  public cleanExpiredFiles(): { removedCount: number; freedBytes: number } {
    this.ensureTempDir();
    let removedCount = 0;
    let freedBytes = 0;
    const now = Date.now();

    // 1. Clean jobs from memory and disk
    for (const [jobId, job] of this.jobs.entries()) {
      if (now > job.expiresAt || job.state === 'failed') {
        if (job.filePath && fs.existsSync(job.filePath)) {
          try {
            const stat = fs.statSync(job.filePath);
            freedBytes += stat.size;
            fs.unlinkSync(job.filePath);
            removedCount++;
          } catch {
            // Ignore error
          }
        }
        // If expired or failed for more than 1 hour, remove from memory
        if (now - job.updatedAt > 60 * 60 * 1000) {
          this.jobs.delete(jobId);
        }
      }
    }

    // 2. Clean orphan files in temp directory older than 30 mins
    try {
      const files = fs.readdirSync(TEMP_DIR);
      for (const file of files) {
        const fullPath = path.join(TEMP_DIR, file);
        try {
          const stat = fs.statSync(fullPath);
          if (now - stat.mtimeMs > JOB_EXPIRATION_MS) {
            freedBytes += stat.size;
            fs.unlinkSync(fullPath);
            removedCount++;
          }
        } catch {
          // Ignore error
        }
      }
    } catch {
      // Ignore error
    }

    return { removedCount, freedBytes };
  }

  public async getAdminStats(): Promise<AdminStats> {
    this.resetDailyStatsIfNeeded();
    const diag = await getSystemDiagnostic();

    // Calculate temp storage usage
    let tempStorageUsedMb = 0;
    try {
      const files = fs.readdirSync(TEMP_DIR);
      let totalBytes = 0;
      for (const file of files) {
        const fullPath = path.join(TEMP_DIR, file);
        const stat = fs.statSync(fullPath);
        totalBytes += stat.size;
      }
      tempStorageUsedMb = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
    } catch {
      tempStorageUsedMb = 0;
    }

    return {
      totalConversions: this.stats.totalConversions,
      successfulConversions: this.stats.successfulConversions,
      failedConversions: this.stats.failedConversions,
      activeJobs: this.getActiveJobsCount(),
      todayConversions: this.stats.todayConversions,
      formatPopularity: this.stats.formatPopularity,
      system: {
        ytdlpVersion: diag.ytdlpVersion,
        ffmpegAvailable: diag.ffmpegFound,
        tempStorageUsedMb,
        uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      },
    };
  }

  public getRecentHistory(limit = 15): ConversionJob[] {
    const list = Array.from(this.jobs.values())
      .map((j) => ({
        ...j,
        filePath: undefined, // Never leak server paths
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
    return list.slice(0, limit);
  }
}

export const jobManager = new JobManager();
