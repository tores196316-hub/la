import React from 'react';
import { JobData } from '../types';
import { Loader2, CheckCircle2, Clock, Zap, AlertCircle, RefreshCw } from 'lucide-react';

interface JobProgressCardProps {
  jobData: JobData;
  onRetry: () => void;
}

export const JobProgressCard: React.FC<JobProgressCardProps> = ({ jobData, onRetry }) => {
  const { progress, state, error, title, format, quality } = jobData;
  const isFailed = state === 'failed';
  const percentage = isFailed ? 0 : Math.min(Math.max(progress.percentage || 10, 5), 98);

  const stages = [
    { key: 'queued', label: 'Sıraya Alındı' },
    { key: 'downloading', label: 'Medya İndiriliyor' },
    { key: 'converting', label: 'FFmpeg İşlemi' },
    { key: 'ready', label: 'Hazırlanıyor' },
  ];

  const getCurrentStepIndex = () => {
    if (isFailed) return -1;
    if (progress.stage === 'queued') return 0;
    if (progress.stage === 'downloading') return 1;
    if (progress.stage === 'converting' || progress.stage === 'packaging') return 2;
    if (progress.stage === 'ready' || state === 'completed') return 3;
    return 1;
  };

  const currentStep = getCurrentStepIndex();

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 rounded-2xl bg-slate-900/95 border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Title & Info */}
      <div className="space-y-1 text-center">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 border border-cyan-700/60 text-cyan-300 uppercase">
          {format.toUpperCase()} • {quality}
        </span>
        <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">
          {title}
        </h2>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {stages.map((stg, idx) => {
          const isDone = currentStep > idx;
          const isCurrent = currentStep === idx && !isFailed;
          return (
            <div key={stg.key} className="space-y-1.5 flex flex-col items-center">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50 animate-pulse'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={`hidden sm:inline font-medium ${
                  isCurrent ? 'text-cyan-400' : isDone ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {stg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-1.5">
            {!isFailed && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />}
            {progress.stageMessage || 'İşleniyor...'}
          </span>
          <span className="text-cyan-400 font-mono text-sm">
            {isFailed ? '0%' : `%${percentage}`}
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFailed
                ? 'bg-red-500'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md shadow-cyan-500/50'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Speed & ETA Badges */}
      {(progress.downloadSpeed || progress.eta) && !isFailed && (
        <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-400 pt-1">
          {progress.downloadSpeed && (
            <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
              <Zap className="h-3 w-3 text-cyan-400" />
              <span>Hız: {progress.downloadSpeed}</span>
            </span>
          )}
          {progress.eta && (
            <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span>Kalan Süre: {progress.eta}</span>
            </span>
          )}
        </div>
      )}

      {/* Error state */}
      {isFailed && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-left space-y-3">
          <div className="flex items-start gap-2 text-red-300 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold">Dönüştürme Başarısız Oldu</p>
              <p className="text-xs text-red-400/90 mt-0.5">
                {error || 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Tekrar Dene</span>
          </button>
        </div>
      )}
    </div>
  );
};
