import React from 'react';
import { HistoryItem } from '../types';
import { History, Trash2, ArrowUpRight, Film, Music, Clock } from 'lucide-react';

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
    <div className="w-full max-w-3xl mx-auto rounded-xl bg-[#0e1017] border border-white/[0.08] p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-white/[0.06] text-slate-300">
            <History className="h-4 w-4" />
          </div>
          <div className="text-left">
            <h2 className="text-sm sm:text-base font-bold text-white">İşlem Geçmişi</h2>
            <p className="text-xs text-slate-400">Bu tarayıcıda gerçekleştirdiğiniz son dönüşümler</p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-2.5 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
            title="Geçmişi Temizle"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Temizle</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <div className="h-10 w-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto text-slate-500">
            <History className="h-5 w-5" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-semibold">Henüz bir dönüştürme işlemi yapmadınız</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Dönüştürücü alanına bir YouTube linki yapıştırarak başlayabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] space-y-1">
          {history.map((item) => {
            const isAudio = item.format === 'mp3' || item.format === 'm4a';
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 pb-2 hover:bg-white/[0.03] px-2.5 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-16 sm:w-20 aspect-video rounded-md overflow-hidden bg-black shrink-0 border border-white/[0.08]">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        {isAudio ? <Music className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5 text-left">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate max-w-sm" title={item.title}>
                      {item.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-mono uppercase text-slate-300 bg-white/[0.06] px-1 rounded">
                        {item.format} • {item.quality}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectHistoryItem(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-xs text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
                  >
                    <span>İncele</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
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


