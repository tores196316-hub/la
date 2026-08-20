import React, { useState, useEffect } from 'react';
import { AdminStats } from '../types';
import { BarChart3, CheckCircle, XCircle, Activity, Server, HardDrive, RefreshCw, Trash2, Shield, Clock } from 'lucide-react';

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
    <div className="w-full max-w-4xl mx-auto mt-6 rounded-2xl bg-slate-900/95 border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Sistem & İstatistik Paneli</h2>
            <p className="text-xs text-slate-400">Sunucu durumu, medya işleme metrikleri ve disk yönetimi</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>

      {stats ? (
        <div className="space-y-6">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-xs font-medium text-slate-400">Toplam Dönüşüm</span>
              <p className="text-2xl font-black text-white">{stats.totalConversions}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Başarılı
              </span>
              <p className="text-2xl font-black text-emerald-400">{stats.successfulConversions}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-xs font-medium text-red-400 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Başarısız
              </span>
              <p className="text-2xl font-black text-red-400">{stats.failedConversions}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-xs font-medium text-cyan-400 flex items-center gap-1">
                <Activity className="h-3 w-3" /> Aktif İşlemler
              </span>
              <p className="text-2xl font-black text-cyan-400">{stats.activeJobs}</p>
            </div>
          </div>

          {/* Sub Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System Status */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-cyan-400" />
                <span>Sistem & Bağımlılıklar</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">yt-dlp Sürümü:</span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    {stats.system.ytdlpVersion || 'Mevcut değil'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">FFmpeg Durumu:</span>
                  <span className="font-semibold text-emerald-400">
                    {stats.system.ffmpegAvailable ? '✓ Yüklü ve Aktif' : '✗ Bulunamadı'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Geçici Disk Kullanımı:</span>
                  <span className="font-mono text-slate-200">
                    {stats.system.tempStorageUsedMb} MB
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Çalışma Süresi (Uptime):</span>
                  <span className="text-slate-300 font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-500" />
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
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Trash2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>{cleanupLoading ? 'Temizleniyor...' : 'Geçici Dosyaları Manuel Temizle'}</span>
                </button>
                {cleanupResult && (
                  <p className="text-[11px] text-emerald-400 mt-1.5 text-center">{cleanupResult}</p>
                )}
              </div>
            </div>

            {/* Popular Formats */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-cyan-400" />
                <span>En Çok Tercih Edilen Formatlar</span>
              </h3>

              {Object.keys(stats.formatPopularity).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Henüz format kullanım verisi yok.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.formatPopularity).map(([formatName, countVal]) => {
                    const count = typeof countVal === 'number' ? countVal : Number(countVal) || 0;
                    const total = stats.totalConversions || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={formatName} className="space-y-1 text-xs">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-200">{formatName}</span>
                          <span className="text-cyan-400 font-mono">{count} adet (%{pct})</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
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
        <div className="py-12 text-center text-slate-400 text-sm">
          İstatistikler yükleniyor...
        </div>
      )}
    </div>
  );
};
