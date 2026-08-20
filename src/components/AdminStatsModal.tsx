import React, { useState, useEffect } from 'react';
import { AdminStats } from '../types';
import { BarChart3, CheckCircle2, XCircle, Activity, Server, HardDrive, RefreshCw, Trash2, Clock, ShieldCheck } from 'lucide-react';

interface AdminStatsModalProps {
  onClose: () => void;
}

export const AdminStatsModal: React.FC<AdminStatsModalProps> = ({ onClose }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCleanup = async () => {
    try {
      setCleanupLoading(true);
      const res = await fetch('/api/admin/cleanup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCleanupResult(`${data.message} (${data.freedMb} MB boşaltıldı)`);
        fetchStats();
        setTimeout(() => setCleanupResult(null), 4000);
      }
    } catch {
      setCleanupResult('Temizleme sırasında hata oluştu.');
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} saat ${minutes} dakika`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 sm:p-7 shadow-2xl space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/90 pb-4">
        <div className="flex items-center gap-3 text-left">
          <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Sistem & İstatistik Paneli</h2>
            <p className="text-xs sm:text-sm text-slate-400">Sunucu durumu, medya işleme metrikleri ve disk yönetimi</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-bold text-slate-200 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>

      {stats ? (
        <div className="space-y-6">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 text-left">
              <span className="text-xs font-semibold text-slate-400">Toplam Dönüşüm</span>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.totalConversions}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 text-left">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Başarılı
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{stats.successfulConversions}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 text-left">
              <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> Başarısız
              </span>
              <p className="text-2xl sm:text-3xl font-black text-red-400 font-mono">{stats.failedConversions}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 text-left">
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" /> Aktif İşlemler
              </span>
              <p className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">{stats.activeJobs}</p>
            </div>
          </div>

          {/* Sub Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System Status */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5 text-left">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Server className="h-4 w-4 text-cyan-400" />
                <span>Sistem & Bağımlılıklar</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400 font-medium">yt-dlp Sürümü:</span>
                  <span className="font-mono text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {stats.system.ytdlpVersion || 'Mevcut değil'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400 font-medium">FFmpeg Durumu:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Yüklü ve Aktif</span>
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/70">
                  <span className="text-slate-400 font-medium">Geçici Disk Alanı:</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {stats.system.tempStorageUsedMb} MB
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400 font-medium">Çalışma Süresi:</span>
                  <span className="text-slate-300 font-mono flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    {formatUptime(stats.system.uptimeSeconds)}
                  </span>
                </div>
              </div>

              {/* Cleanup trigger button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCleanup}
                  disabled={cleanupLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer active:scale-98"
                >
                  <Trash2 className="h-4 w-4 text-amber-400" />
                  <span>{cleanupLoading ? 'Temizleniyor...' : 'Geçici Dosyaları Manuel Temizle'}</span>
                </button>
                {cleanupResult && (
                  <p className="text-[11px] text-emerald-400 mt-2 text-center font-medium">{cleanupResult}</p>
                )}
              </div>
            </div>

            {/* Popular Formats */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5 text-left">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-cyan-400" />
                <span>En Çok Tercih Edilen Formatlar</span>
              </h3>

              {Object.keys(stats.formatPopularity).length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">Henüz format kullanım verisi yok.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.formatPopularity).map(([formatName, countVal]) => {
                    const count = typeof countVal === 'number' ? countVal : Number(countVal) || 0;
                    const total = stats.totalConversions || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={formatName} className="space-y-1.5 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-200 uppercase">{formatName}</span>
                          <span className="text-cyan-400 font-mono">{count} adet (%{pct})</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 text-sm">
          İstatistikler yükleniyor...
        </div>
      )}
    </div>
  );
};

