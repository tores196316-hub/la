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
    <div className="w-full max-w-3xl mx-auto mt-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">İşlem Geçmişi</h2>
            <p className="text-xs text-slate-400">Bu tarayıcıda gerçekleştirdiğiniz son dönüşümler</p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-950/30 transition-colors"
            title="Geçmişi Temizle"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Temizle</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto text-slate-600">
            <History className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Henüz bir dönüştürme işlemi yapmadınız.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Yukarıdaki alana bir video bağlantısı yapıştırarak ilk dönüştürmenizi başlatın.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60 space-y-1">
          {history.map((item) => {
            const isAudio = item.format === 'mp3' || item.format === 'm4a';
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 py-3 hover:bg-slate-800/30 px-2 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        {isAudio ? <Music className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-white truncate max-w-md" title={item.title}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 font-mono text-[11px] uppercase font-bold">
                        {item.format} • {item.quality}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectHistoryItem(item)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors shrink-0"
                >
                  <span>Yeniden İncele</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-cyan-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
