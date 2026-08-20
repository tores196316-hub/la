import React from 'react';
import { JobData } from '../types';
import { Loader2, Check, AlertCircle, RefreshCw, Film, Music, Zap, Crown, ArrowRight } from 'lucide-react';
import { useRouter } from '../context/RouterContext';

interface JobProgressCardProps {
  jobData: JobData;
  onRetry: () => void;
}

export const JobProgressCard: React.FC<JobProgressCardProps> = ({ jobData, onRetry }) => {
  const { navigate } = useRouter();
  const { progress, state, error, title, format, quality, isPremium, userPlan } = jobData;
  const isFailed = state === 'failed';
  const percentage = isFailed ? 0 : Math.min(Math.max(progress.percentage || 10, 5), 98);
  const isAudio = format === 'mp3' || format === 'm4a';

  const stages = [
    { key: 'queued', label: isPremium ? 'VIP Bağlantı' : 'Sıra & Kuyruk' },
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
    <div className="w-full max-w-2xl mx-auto rounded-xl bg-[#0e1017] border border-white/[0.08] p-5 sm:p-6 shadow-xl space-y-5 animate-in fade-in duration-150">
      {/* Title & Info */}
      <div className="space-y-1.5 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/[0.06] border border-white/[0.08] text-slate-300 uppercase">
            {isAudio ? <Music className="h-3 w-3 text-slate-400" /> : <Film className="h-3 w-3 text-slate-400" />}
            <span>{format.toUpperCase()} • {quality}</span>
          </div>

          {isPremium ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 border border-amber-400/25 text-amber-300">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{userPlan === 'premium_plus' ? 'VIP PLUS TURBO' : 'TURBO VIP HIZ'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] border border-white/[0.06] text-slate-400">
              <span>STANDART HIZ (FREE)</span>
            </div>
          )}
        </div>

        <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1 max-w-lg mx-auto">
          {title}
        </h2>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
        {stages.map((stg, idx) => {
          const isDone = currentStep > idx;
          const isCurrent = currentStep === idx && !isFailed;
          return (
            <div key={stg.key} className="space-y-1.5 flex flex-col items-center">
              <div
                className={`h-6 w-6 rounded-md flex items-center justify-center text-[11px] font-mono font-bold transition-all ${
                  isDone
                    ? 'bg-white/20 text-white'
                    : isCurrent
                    ? isPremium ? 'bg-amber-400 text-black' : 'bg-white text-black'
                    : 'bg-white/[0.04] text-slate-500 border border-white/[0.06]'
                }`}
              >
                {isDone ? <Check className="h-3 w-3" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] font-medium truncate max-w-full ${
                  isCurrent ? (isPremium ? 'text-amber-300 font-semibold' : 'text-white') : isDone ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {stg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Progress Bar */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 flex items-center gap-2">
            {!isFailed && <Loader2 className={`h-3.5 w-3.5 animate-spin ${isPremium ? 'text-amber-400' : 'text-slate-300'}`} />}
            <span>{progress.stageMessage || 'İşleniyor...'}</span>
          </span>
          <span className="text-white font-mono text-xs font-bold">
            {isFailed ? '0%' : `%${percentage}`}
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#111319] overflow-hidden border border-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFailed
                ? 'bg-red-500'
                : isPremium
                ? 'bg-gradient-to-r from-amber-400 to-amber-300'
                : 'bg-white'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Speed & ETA Badges */}
      {(progress.downloadSpeed || progress.eta) && !isFailed && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
          {progress.downloadSpeed && (
            <span className="bg-[#111319] px-2.5 py-1 rounded-md border border-white/[0.06] text-slate-300">
              Hız: <strong className={isPremium ? 'text-amber-300' : 'text-white'}>{progress.downloadSpeed}</strong>
            </span>
          )}
          {progress.eta && (
            <span className="bg-[#111319] px-2.5 py-1 rounded-md border border-white/[0.06] text-slate-300">
              Kalan Süre: <strong className="text-white">{progress.eta}</strong>
            </span>
          )}
        </div>
      )}

      {/* Tier Awareness Banner (Free Upgrade Teaser vs Premium Active Badge) */}
      {!isFailed && (
        <>
          {!isPremium ? (
            <div className="p-3 rounded-xl bg-amber-400/[0.04] border border-amber-400/20 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong className="text-white font-medium">Standart Hız Sınırı:</strong> Ücretsiz indirmeler kuyrukta işlenir.
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/premium')}
                className="px-2.5 py-1 rounded-md bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-black font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Turbo Hıza Geç</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>VIP Hat Aktif: Kuyruk beklemesi olmadan maksimum bant genişliğinde işleniyor.</span>
            </div>
          )}
        </>
      )}

      {/* Error state */}
      {isFailed && (
        <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-800/50 text-left space-y-2.5">
          <div className="flex items-start gap-2.5 text-red-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-red-200">İndirme başarısız oldu</p>
              <p className="text-red-300/90 leading-relaxed">
                {error || 'Sunucu işlemi tamamlarken bir hata ile karşılaştı.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-200 text-black text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Tekrar Dene</span>
          </button>
        </div>
      )}
    </div>
  );
};



