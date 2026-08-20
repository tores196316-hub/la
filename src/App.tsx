/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { UrlInputSection } from './components/UrlInputSection';
import { VideoPreviewCard } from './components/VideoPreviewCard';
import { JobProgressCard } from './components/JobProgressCard';
import { DownloadReadyCard } from './components/DownloadReadyCard';
import { Footer } from './components/Footer';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { PremiumPage } from './pages/PremiumPage';
import { HistoryPage } from './pages/HistoryPage';
import { FaqPage } from './pages/FaqPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { VideoMetadata, VideoFormatOption, JobData, HistoryItem, SystemHealth } from './types';

const STORAGE_KEY = 'imgivo_history_v1';

function AppContent() {
  const { path, navigate } = useRouter();
  const { user, token, authFetch } = useAuth();

  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStartingConversion, setIsStartingConversion] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch system health on mount
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setSystemHealth(data);
        }
      } catch {
        // Ignore
      }
    };
    fetchHealth();
  }, []);

  // Clean up polling timer
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  // Poll job status while active
  useEffect(() => {
    if (!jobData || !jobData.jobId) {
      stopPolling();
      return;
    }

    const isJobActive =
      jobData.state === 'queued' ||
      jobData.state === 'analyzing' ||
      jobData.state === 'downloading' ||
      jobData.state === 'processing';

    if (isJobActive) {
      stopPolling();
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/jobs/${jobData.jobId}`);
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'İşlem durumu sorgulanamadı.');
          }
          const data = await res.json();
          if (data.success && data.job) {
            setJobData(data.job);

            // If job just completed, save to user history & localStorage
            if (data.job.state === 'completed') {
              stopPolling();

              const record: HistoryItem = {
                id: `${data.job.jobId}_${Date.now()}`,
                jobId: data.job.jobId,
                url: url,
                title: data.job.title,
                thumbnail: data.job.thumbnail,
                format: data.job.format,
                quality: data.job.quality,
                timestamp: Date.now(),
                fileSizeBytes: data.job.fileSizeBytes,
                status: 'completed',
              };

              // 1. Save to local storage for quick access
              try {
                const saved = localStorage.getItem(STORAGE_KEY);
                const list: HistoryItem[] = saved ? JSON.parse(saved) : [];
                const filtered = list.filter((i) => i.jobId !== data.job.jobId);
                filtered.unshift(record);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 30)));
              } catch {}

              // 2. If authenticated, save to backend user history
              if (token) {
                authFetch('/api/user/history', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(record),
                }).catch(() => {});
              }
            } else if (data.job.state === 'failed' || data.job.state === 'expired') {
              stopPolling();
            }
          }
        } catch (err: any) {
          // Keep polling or continue
        }
      }, 1000);
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [jobData?.jobId, jobData?.state, url, token, authFetch]);

  // Handle URL Analysis
  const handleAnalyze = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || url).trim();
    if (!targetUrl) return;

    setError(null);
    setIsAnalyzing(true);
    setJobData(null);
    setMetadata(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Video analiz edilemedi.');
      }

      setMetadata(data.data);
    } catch (err: any) {
      setError(err.message || 'Geçerli bir video bağlantısı gir.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Start conversion
  const handleStartConversion = async (formatOption: VideoFormatOption) => {
    if (!metadata) return;

    setError(null);
    setIsStartingConversion(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/download', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: metadata.url,
          format: formatOption.format,
          quality: formatOption.quality,
          title: metadata.title,
          thumbnail: metadata.thumbnail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.requiresPremium) {
          setError('2K ve 4K indirmeler IMGIVO Premium üyelerine özeldir.');
          navigate('/premium');
          return;
        }
        throw new Error(data.error || 'Dönüştürme başlatılamadı.');
      }

      // Initial job placeholder while first poll triggers
      setJobData({
        jobId: data.jobId,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        format: formatOption.format,
        quality: formatOption.quality,
        type: formatOption.type,
        state: 'queued',
        progress: {
          percentage: 5,
          stage: 'queued',
          stageMessage: 'İşlem sıraya alındı...',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      setError(err.message || 'İşlem başlatılırken bir hata oluştu.');
    } finally {
      setIsStartingConversion(false);
    }
  };

  const handleReset = () => {
    stopPolling();
    setMetadata(null);
    setJobData(null);
    setError(null);
    setUrl('');
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    navigate('/');
    setUrl(item.url);
    handleAnalyze(item.url);
  };

  const hasActiveResult = Boolean(metadata || jobData);

  // Router Dispatcher
  const renderRouteContent = () => {
    switch (path) {
      case '/':
      case '':
        return (
          <div className="space-y-6">
            {/* 1. URL Input */}
            <UrlInputSection
              url={url}
              setUrl={setUrl}
              onAnalyze={handleAnalyze}
              isLoading={isAnalyzing}
              error={error}
              hasActiveResult={hasActiveResult}
            />

            {/* 2. Format Selection Card (When analyzed & not started yet) */}
            {metadata && !jobData && (
              <VideoPreviewCard
                metadata={metadata}
                onStartConversion={handleStartConversion}
                onReset={handleReset}
                isSubmitting={isStartingConversion}
              />
            )}

            {/* 3. Progress Card (While converting) */}
            {jobData && jobData.state !== 'completed' && (
              <JobProgressCard
                jobData={jobData}
                onRetry={() => {
                  if (metadata && metadata.availableFormats.length > 0) {
                    const matchedFormat =
                      metadata.availableFormats.find(
                        (f) => f.format === jobData.format && f.quality === jobData.quality
                      ) || metadata.availableFormats[0];
                    handleStartConversion(matchedFormat);
                  } else {
                    handleAnalyze();
                  }
                }}
              />
            )}

            {/* 4. Ready / Download Card (When completed) */}
            {jobData && jobData.state === 'completed' && (
              <DownloadReadyCard jobData={jobData} onNewConversion={handleReset} />
            )}
          </div>
        );

      case '/giris':
        return <LoginPage />;

      case '/kayit':
        return <RegisterPage />;

      case '/profil':
        return <ProfilePage />;

      case '/premium':
        return <PremiumPage />;

      case '/gecmis':
        return <HistoryPage onSelectHistoryItem={handleSelectHistoryItem} />;

      case '/yardim':
        return <FaqPage />;

      case '/admin':
        return <AdminPage />;

      default:
        return <NotFoundPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-slate-100 flex flex-col selection:bg-slate-700 selection:text-white relative overflow-x-hidden">
      {/* Background ambient lighting accents - subtle, clean */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[220px] bg-slate-800/10 blur-[100px] pointer-events-none -z-10" />

      {/* Top Navigation */}
      <Header systemHealth={systemHealth} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 z-0">
        {renderRouteContent()}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </RouterProvider>
  );
}
