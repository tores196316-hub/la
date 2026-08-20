import React from 'react';
import { JobData } from '../types';
import { Loader2, CheckCircle2, Clock, Zap, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

interface JobProgressCardProps {
  jobData: JobData;
  onRetry: () => void;
}

export const JobProgressCard: React.FC<JobProgressCardProps> = ({ jobData, onRetry }) => {
  const { progress, state, error, title, format, quality } = jobData;
  const isFailed = state === 'failed';
  const percentage = isFailed ? 0 : Math.min(Math.max(progress.percentage || 10, 5), 98);

  const stages = [
    { key: 'queued', label: 'Analiz & Sıra' },
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
    <div className="w-full max-w-3xl mx-auto mt-4 rounded-2xl bg-slate-900/95 border border-slate-800/90 p-6 sm:p-8 shadow-2xl space-y-7 animate-in fade-in duration-200">
      {/* Title & Info */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 uppercase tracking-wide">
          <Sparkles className="h-3 w-3 text-cyan-400" />
          <span>{format.toUpperCase()} • {quality}</span>
        </div>
        <h2 className="text-base sm:text-xl font-bold text-white line-clamp-1 max-w-xl mx-auto">
          {title}
        </h2>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2">
        {stages.map((stg, idx) => {
          const isDone = currentStep > idx;
          const isCurrent = currentStep === idx && !isFailed;
          return (
            <div key={stg.key} className="space-y-2 flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-emerald-900/40'
                    : isCurrent
                    ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-cyan-500/40 ring-4 ring-cyan-500/20 animate-pulse'
                    : 'bg-slate-800/80 text-slate-500 border border-slate-700/60'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] sm:text-xs font-semibold ${
                  isCurrent ? 'text-cyan-300' : isDone ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {stg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Progress Bar */}
      <div className="space-y-2.5 pt-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-2">
            {!isFailed && <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />}
            <span>{progress.stageMessage || 'İşleniyor...'}</span>
          </span>
          <span className="text-cyan-400 font-mono text-sm font-bold">
            {isFailed ? '0%' : `%${percentage}`}
          </span>
        </div>

        <div className="w-full h-3.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800 p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFailed
                ? 'bg-red-500'
                : 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 shadow-md shadow-cyan-500/50'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Speed & ETA Badges */}
      {(progress.downloadSpeed || progress.eta) && !isFailed && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-400 pt-1">
          {progress.downloadSpeed && (
            <span className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>Hız: <strong className="text-white">{progress.downloadSpeed}</strong></span>
            </span>
          )}
          {progress.eta && (
            <span className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Tahmini Kalan Süre: <strong className="text-white">{progress.eta}</strong></span>
            </span>
          )}
        </div>
      )}

      {/* Error state */}
      {isFailed && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-left space-y-3.5 shadow-lg">
          <div className="flex items-start gap-3 text-red-300 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-red-200">İndirme sırasında bir sorun oluştu</p>
              <p className="text-xs text-red-300/90 leading-relaxed">
                {error || 'Sunucu işlemi tamamlarken bir hata ile karşılaştı. Lütfen tekrar deneyin.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Tekrar Dene</span>
          </button>
        </div>
      )}
    </div>
  );
};

