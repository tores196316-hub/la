import React, { useState } from 'react';
import { Search, Youtube, Clipboard, X, Loader2, Zap, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

interface UrlInputSectionProps {
  url: string;
  setUrl: (url: string) => void;
  onAnalyze: (urlToAnalyze?: string) => void;
  isLoading: boolean;
  error?: string | null;
  hasActiveResult?: boolean;
}

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  url,
  setUrl,
  onAnalyze,
  isLoading,
  error,
  hasActiveResult = false,
}) => {
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 1500);
        }
      }
    } catch {
      // Fallback if clipboard permission is not granted
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim() && !isLoading) {
      onAnalyze();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto text-center space-y-6 pt-2 sm:pt-4">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#111319] px-3.5 py-1 text-[11px] font-medium text-slate-300">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
        <span className="tracking-wide">FAST • PRIVATE • HIGH QUALITY</span>
      </div>

      {/* Main Hero Headlines */}
      <div className="space-y-2 px-2">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Videonu <span className="text-slate-100 underline decoration-slate-600 underline-offset-4">istediğin kalitede</span> indir.
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          YouTube videolarını saniyeler içinde yüksek kaliteli video veya sese dönüştür.
        </p>
      </div>

      {/* Input Box Area */}
      <div className="relative max-w-2xl mx-auto">
        <div className="relative flex flex-col sm:flex-row items-stretch gap-2 p-1.5 rounded-xl bg-[#111319] border border-white/[0.08] focus-within:border-white/20 transition-all shadow-lg">
          <div className="flex items-center flex-1 min-w-0 pl-2.5 pr-1 py-1 gap-2">
            <div className="p-1 rounded-md bg-red-500/10 text-red-400 shrink-0">
              <Youtube className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="YouTube video URL'sini yapıştır..."
              disabled={isLoading}
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-60 font-medium"
            />
            {url && !isLoading && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
                title="Temizle"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handlePaste}
              disabled={isLoading}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] rounded-lg border border-white/[0.08] transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
              title="Panodan Yapıştır"
            >
              <Clipboard className="h-3 w-3 text-slate-400" />
              <span className="hidden sm:inline">{pasteSuccess ? 'Yapıştırıldı' : 'Yapıştır'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onAnalyze()}
            disabled={isLoading || !url.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white hover:bg-slate-200 text-black text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-98"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                <span>Analiz Ediliyor...</span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5 text-black" />
                <span>Analiz Et</span>
              </>
            )}
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs text-left flex items-start gap-2 animate-in fade-in duration-150">
            <span className="font-semibold shrink-0 text-red-400">Hata:</span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}
      </div>

      {/* Feature Strip & Workflow (Only shown when not actively converting or showing preview) */}
      {!hasActiveResult && (
        <div className="space-y-8 pt-4 sm:pt-6 text-left">
          {/* Compact Feature Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#0e1017] border border-white/[0.06]">
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="p-1.5 rounded-md bg-white/[0.05] text-slate-300 shrink-0">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">Hızlı İşlem</p>
                <p className="text-[11px] text-slate-400 truncate">Saniyeler içinde hazır</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-2 py-1 sm:border-l sm:border-white/[0.06]">
              <div className="p-1.5 rounded-md bg-white/[0.05] text-slate-300 shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">Yüksek Kalite</p>
                <p className="text-[11px] text-slate-400 truncate">1080p, 2K, 4K ve 320k ses</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-2 py-1 sm:border-l sm:border-white/[0.06]">
              <div className="p-1.5 rounded-md bg-white/[0.05] text-slate-300 shrink-0">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">Güvenli & Gizli</p>
                <p className="text-[11px] text-slate-400 truncate">Geçici dosyalar temizlenir</p>
              </div>
            </div>
          </div>

          {/* Compact "Nasıl Çalışır?" Process Timeline */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#0e1017] border border-white/[0.06] space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Nasıl Çalışır?</h2>
              <span className="text-[11px] text-slate-500">4 basit adım</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/[0.05] px-1.5 py-0.5 rounded">01</span>
                  <p className="text-xs font-semibold text-slate-200">Linki Yapıştır</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">YouTube linkini kutuya ekleyin.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/[0.05] px-1.5 py-0.5 rounded">02</span>
                  <p className="text-xs font-semibold text-slate-200">Kaliteyi Seç</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">MP4 veya MP3 formatı belirleyin.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/[0.05] px-1.5 py-0.5 rounded">03</span>
                  <p className="text-xs font-semibold text-slate-200">Dönüştür</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">Medya motorumuz dosyayı işlesin.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/[0.05] px-1.5 py-0.5 rounded">04</span>
                  <p className="text-xs font-semibold text-slate-200">İndir</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">Dosyayı doğrudan cihazına kaydet.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



