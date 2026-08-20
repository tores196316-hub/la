import React from 'react';
import { HistoryItem } from '../types';
import { History, Trash2, ArrowUpRight, Film, Music, Clock, Sparkles } from 'lucide-react';

interface HistorySectionProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onSelectHistoryItem: (item: HistoryItem) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  onClearHistory,
  onSelectHistoryItem,
}) => {
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Az önce';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    return `${days} gün önce`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 sm:p-7 shadow-2xl space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-slate-800/90 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
            <History className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h2 className="text-lg sm:text-xl font-bold text-white">İşlem Geçmişi</h2>
            <p className="text-xs sm:text-sm text-slate-400">Bu tarayıcıda gerçekleştirdiğiniz son dönüşümler</p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-900/40 transition-colors"
            title="Geçmişi Temizle"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Geçmişi Temizle</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-16 text-center space-y-3.5">
          <div className="h-14 w-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto text-slate-500">
            <History className="h-7 w-7" />
          </div>
          <p className="text-base text-slate-300 font-bold">Henüz bir dönüştürme işlemi yapmadınız</p>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Dönüştürücü sekmesine bir YouTube linki yapıştırarak ilk videonuzu dönüştürün.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/70 space-y-2">
          {history.map((item) => {
            const isAudio = item.format === 'mp3' || item.format === 'm4a';
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-3 pb-2 hover:bg-slate-800/40 px-3 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-20 sm:w-24 aspect-video rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800 shadow-sm">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        {isAudio ? <Music className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1 text-left">
                    <p className="text-sm sm:text-base font-bold text-white truncate max-w-md" title={item.title}>
                      {item.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-cyan-300 font-mono text-[11px] uppercase font-bold border border-slate-700/60">
                        {item.format} • {item.quality}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectHistoryItem(item)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-cyan-950/60 hover:border-cyan-500/40 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-cyan-300 transition-all shrink-0 cursor-pointer"
                  >
                    <span>Yeniden İncele</span>
                    <ArrowUpRight className="h-4 w-4 text-cyan-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

