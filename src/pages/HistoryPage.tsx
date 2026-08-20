import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { HistoryItem } from '../types';
import {
  History,
  Trash2,
  ExternalLink,
  Film,
  Music,
  CheckCircle2,
  Clock,
  XCircle,
  Play,
  ArrowRight,
  DownloadCloud,
} from 'lucide-react';
import {
  subscribeToUserHistory,
  clearUserHistoryInFirestore,
} from '../firebase/firebase';

interface HistoryPageProps {
  onSelectHistoryItem?: (item: HistoryItem) => void;
}

export function HistoryPage({ onSelectHistoryItem }: HistoryPageProps) {
  const { navigate } = useRouter();
  const { user, authFetch } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'video' | 'audio'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    if (user?.id) {
      // Real-time Firestore history subscription for authenticated user
      const unsubscribe = subscribeToUserHistory(
        user.id,
        (liveItems) => {
          setItems(liveItems);
          setIsLoading(false);
        },
        () => {
          // If Firestore fails, fallback to local storage
          const saved = localStorage.getItem('imgivo_history_v1');
          if (saved) {
            try {
              setItems(JSON.parse(saved));
            } catch {}
          }
          setIsLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } else {
      // Local storage for guest
      try {
        const saved = localStorage.getItem('imgivo_history_v1');
        if (saved) {
          setItems(JSON.parse(saved));
        } else {
          setItems([]);
        }
      } catch {}
      setIsLoading(false);
    }
  }, [user]);

  const handleClearHistory = async () => {
    try {
      if (user?.id) {
        await clearUserHistoryInFirestore(user.id);
        authFetch('/api/user/history', { method: 'DELETE' }).catch(() => {});
      }
      localStorage.removeItem('imgivo_history_v1');
      setItems([]);
    } finally {
      setShowClearConfirm(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const isAudio = item.format === 'mp3' || item.format === 'm4a';
    if (filterType === 'video') return !isAudio;
    if (filterType === 'audio') return isAudio;
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-8 space-y-6 text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">İndirme Geçmişim</h1>
            <p className="text-xs text-slate-400">
              {user ? `Hesabınıza (@${user.username}) ait bulut ve yerel kayıtlar` : 'Tarayıcınıza ait yerel geçmiş'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filters */}
          <div className="flex items-center p-1 rounded-lg bg-[#0e1017] border border-white/[0.08] text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filterType === 'all' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tümü
            </button>
            <button
              type="button"
              onClick={() => setFilterType('video')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filterType === 'video' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Video
            </button>
            <button
              type="button"
              onClick={() => setFilterType('audio')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filterType === 'audio' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ses
            </button>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.08] text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Geçmişi Temizle"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Geçmiş yükleniyor...</div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl bg-[#0e1017] border border-white/[0.08] p-12 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] text-slate-500">
            <DownloadCloud className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">Henüz Kaydedilmiş İndirme Yok</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Dönüştürdüğünüz videolar burada listelenir. Hemen bir video bağlantısı yapıştırarak başlayın.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <span>Dönüştürücüye Git</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const isAudio = item.format === 'mp3' || item.format === 'm4a';
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#0e1017] hover:bg-[#12151f] border border-white/[0.06] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail / Icon */}
                  <div className="w-16 h-12 rounded-lg bg-black/40 border border-white/[0.08] overflow-hidden shrink-0 relative flex items-center justify-center">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : isAudio ? (
                      <Music className="w-5 h-5 text-slate-500" />
                    ) : (
                      <Film className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 space-y-1 text-left">
                    <h4 className="text-xs sm:text-sm font-semibold text-white truncate max-w-md" title={item.title}>
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.2 rounded bg-white/[0.06] font-mono text-slate-300 uppercase">
                        {item.format}
                      </span>
                      <span className="font-mono text-slate-400">{item.quality}</span>
                      {item.fileSizeBytes && (
                        <span className="font-mono text-slate-500">{formatBytes(item.fileSizeBytes)}</span>
                      )}
                      <span>•</span>
                      <span>{formatDate(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions & Status */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.status === 'failed' ? (
                    <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-medium flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Başarısız
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Tamamlandı
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectHistoryItem) {
                        onSelectHistoryItem(item);
                      }
                      navigate('/');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white text-slate-300 hover:text-black font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>Aç</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl bg-[#0e1017] border border-white/[0.1] p-6 text-left space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Geçmişi Temizle</h3>
            <p className="text-xs text-slate-400">
              Tüm indirme geçmişiniz silinecektir. Bu işlem geri alınamaz. Onaylıyor musunuz?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-500"
              >
                Evet, Temizle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
