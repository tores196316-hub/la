import React, { useState, useEffect } from 'react';
import { AdminStats } from '../types';
import { BarChart3, CheckCircle2, XCircle, Activity, Server, HardDrive, RefreshCw, Trash2, Clock, Key, ShieldCheck, HelpCircle } from 'lucide-react';

interface AdminStatsModalProps {
  onClose: () => void;
}

export const AdminStatsModal: React.FC<AdminStatsModalProps> = ({ onClose }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  // Cookie management state
  const [cookieStatus, setCookieStatus] = useState<{ hasCookies: boolean; fileSize: number } | null>(null);
  const [cookieInput, setCookieInput] = useState('');
  const [cookieSaving, setCookieSaving] = useState(false);
  const [cookieMsg, setCookieMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCookieBox, setShowCookieBox] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }

      // Also check cookies
      const cookieRes = await fetch('/api/admin/cookies');
      const cookieData = await cookieRes.json();
      if (cookieData.success) {
        setCookieStatus({
          hasCookies: cookieData.hasCookies,
          fileSize: cookieData.fileSize || 0,
        });
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

  const handleSaveCookies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cookieInput.trim()) return;

    try {
      setCookieSaving(true);
      setCookieMsg(null);
      const res = await fetch('/api/admin/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies: cookieInput }),
      });
      const data = await res.json();
      if (data.success) {
        setCookieMsg({ type: 'success', text: data.message || 'Cookie başarıyla kaydedildi.' });
        setCookieInput('');
        fetchStats();
      } else {
        setCookieMsg({ type: 'error', text: data.error || 'Cookie kaydedilemedi.' });
      }
    } catch (err: any) {
      setCookieMsg({ type: 'error', text: 'Bağlantı hatası oluştu.' });
    } finally {
      setCookieSaving(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} saat ${minutes} dakika`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-xl bg-[#0e1017] border border-white/[0.08] p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-3.5">
        <div className="flex items-center gap-2.5 text-left">
          <div className="p-2 rounded-lg bg-white/[0.06] text-slate-300">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">Sistem & İstatistik Paneli</h2>
            <p className="text-xs text-slate-400">Sunucu durumu, YouTube kimlik doğrulaması ve disk yönetimi</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-slate-300 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>

      {stats ? (
        <div className="space-y-4">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-lg bg-[#111319] border border-white/[0.06] space-y-0.5 text-left">
              <span className="text-[11px] font-medium text-slate-400">Toplam Dönüşüm</span>
              <p className="text-xl sm:text-2xl font-bold text-white font-mono">{stats.totalConversions}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#111319] border border-white/[0.06] space-y-0.5 text-left">
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Başarılı
              </span>
              <p className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">{stats.successfulConversions}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#111319] border border-white/[0.06] space-y-0.5 text-left">
              <span className="text-[11px] font-medium text-red-400 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Başarısız
              </span>
              <p className="text-xl sm:text-2xl font-bold text-red-400 font-mono">{stats.failedConversions}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#111319] border border-white/[0.06] space-y-0.5 text-left">
              <span className="text-[11px] font-medium text-cyan-400 flex items-center gap-1">
                <Activity className="h-3 w-3" /> Aktif İşlem
              </span>
              <p className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono">{stats.activeJobs}</p>
            </div>
          </div>

          {/* Sub Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* System Status */}
            <div className="p-4 rounded-lg bg-[#111319] border border-white/[0.06] space-y-2.5 text-left">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-slate-400" />
                <span>Sistem & Bağımlılıklar</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">yt-dlp Sürümü:</span>
                  <span className="font-mono text-white font-semibold bg-white/[0.06] px-1.5 py-0.5 rounded">
                    {stats.system.ytdlpVersion || 'Mevcut değil'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">FFmpeg:</span>
                  <span className="font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Yüklü & Aktif</span>
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">YouTube Cookie:</span>
                  {cookieStatus?.hasCookies ? (
                    <span className="font-medium text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                      <ShieldCheck className="h-3 w-3" /> Aktif ({Math.round(cookieStatus.fileSize / 1024)} KB)
                    </span>
                  ) : (
                    <span className="font-medium text-amber-400 font-mono text-[11px]">
                      Tanımlı Değil (Multi-Client Aktif)
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Geçici Disk:</span>
                  <span className="font-mono text-slate-200">
                    {stats.system.tempStorageUsedMb} MB
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Çalışma Süresi:</span>
                  <span className="text-slate-300 font-mono flex items-center gap-1 text-[11px]">
                    <Clock className="h-3 w-3 text-slate-500" />
                    {formatUptime(stats.system.uptimeSeconds)}
                  </span>
                </div>
              </div>

              {/* Cleanup trigger button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleCleanup}
                  disabled={cleanupLoading}
                  className="w-full py-2 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
            <div className="p-4 rounded-lg bg-[#111319] border border-white/[0.06] space-y-2.5 text-left">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                <span>Tercih Edilen Formatlar</span>
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
                        <div className="flex justify-between">
                          <span className="text-slate-300 uppercase font-mono">{formatName}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{count} adet (%{pct})</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full bg-white/40 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cookie & Bot Verification Resolver Card */}
          <div className="p-4 rounded-lg bg-[#111319] border border-white/[0.06] space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-slate-300" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    YouTube Bot Doğrulaması & Cookie Tanımlama
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    YouTube zaman zaman bulut sunucularına bot doğrulaması koyabilir. Cookie ekleyerek doğrulamayı anında aşabilirsiniz.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCookieBox(!showCookieBox)}
                className="px-2.5 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-medium transition-colors cursor-pointer shrink-0"
              >
                {showCookieBox ? 'Kapat' : 'Cookie Ekle / Düzenle'}
              </button>
            </div>

            {showCookieBox && (
              <form onSubmit={handleSaveCookies} className="space-y-2.5 pt-2 border-t border-white/[0.04]">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tarayıcınızdan (Cookie-Editor uzantısı vb.) YouTube için kopyaladığınız Netscape (txt) veya JSON formatındaki cookie metnini buraya yapıştırıp kaydedin:
                </p>
                <textarea
                  value={cookieInput}
                  onChange={(e) => setCookieInput(e.target.value)}
                  placeholder="# Netscape HTTP Cookie File&#10;.youtube.com TRUE / TRUE 2147483647 SID ..."
                  rows={4}
                  className="w-full rounded-md bg-[#08090c] border border-white/[0.08] p-2.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/30"
                />
                <div className="flex items-center justify-between">
                  {cookieMsg && (
                    <span className={`text-xs ${cookieMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {cookieMsg.text}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={cookieSaving || !cookieInput.trim()}
                    className="ml-auto px-4 py-1.5 rounded-md bg-white text-black font-semibold text-xs hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {cookieSaving ? 'Kaydediliyor...' : 'Cookieyi Sisteme Tanımla'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 text-xs">
          İstatistikler yükleniyor...
        </div>
      )}
    </div>
  );
};



