import React, { useState } from 'react';
import { Search, Youtube, Clipboard, X, Loader2, Sparkles, Zap, Film, ShieldCheck, Link2, Sliders, PlayCircle, Download } from 'lucide-react';

interface UrlInputSectionProps {
  url: string;
  setUrl: (url: string) => void;
  onAnalyze: (urlToAnalyze?: string) => void;
  isLoading: boolean;
  error?: string | null;
  hasActiveResult?: boolean;
}

const SAMPLE_VIDEOS = [
  {
    title: 'Örnek 1: Big Buck Bunny (4K/60fps)',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  },
  {
    title: 'Örnek 2: Tears of Steel (Sci-Fi)',
    url: 'https://www.youtube.com/watch?v=R6MlUcmOul8',
  },
];

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
      // Fallback
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim() && !isLoading) {
      onAnalyze();
    }
  };

  const handleSampleClick = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onAnalyze(sampleUrl);
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-center space-y-8 pt-2 sm:pt-6">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-4 py-1.5 text-xs font-semibold text-cyan-300 shadow-sm shadow-cyan-950/50">
        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
        <span>Gerçek Zamanlı Medya İşleme ve Yüksek Kalite</span>
      </div>

      {/* Main Hero Headlines */}
      <div className="space-y-3 px-2">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Videonu dönüştür. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500">
            İstediğin kalitede indir.
          </span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          YouTube videolarını hızlı, güvenli ve yüksek kalitede MP4 veya ses formatına dönüştür.
        </p>
      </div>

      {/* Input Box Area */}
      <div className="relative max-w-3xl mx-auto">
        <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5 p-2 rounded-2xl bg-slate-900/90 border border-slate-800/90 focus-within:border-cyan-500/80 focus-within:ring-4 focus-within:ring-cyan-500/10 shadow-2xl transition-all">
          <div className="flex items-center flex-1 min-w-0 pl-3 pr-2 py-1 gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-950/60 border border-red-900/40 text-red-500 shrink-0">
              <Youtube className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="YouTube video veya Shorts bağlantısını yapıştırın..."
              disabled={isLoading}
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none disabled:opacity-60 font-medium"
            />
            {url && !isLoading && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                title="Temizle"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handlePaste}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700/80 transition-all shrink-0 flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Panodan Yapıştır"
            >
              <Clipboard className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">{pasteSuccess ? 'Yapıştırıldı' : 'Yapıştır'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onAnalyze()}
            disabled={isLoading || !url.trim()}
            className="w-full sm:w-auto px-7 py-3.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-cyan-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-98"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Analiz Ediliyor...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 text-white" />
                <span>Analiz Et</span>
              </>
            )}
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-3.5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-sm text-left flex items-start gap-2.5 animate-in fade-in duration-200 shadow-lg">
            <span className="font-semibold shrink-0 text-red-400">Hata:</span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Quick sample videos */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500 font-medium">Hızlı Test:</span>
          {SAMPLE_VIDEOS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSampleClick(sample.url)}
              disabled={isLoading}
              className="px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-all text-xs font-medium"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Cards & Workflow (Only shown when not actively converting or showing preview) */}
      {!hasActiveResult && (
        <div className="space-y-12 pt-8 sm:pt-12 text-left">
          {/* 3 Modern Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/30 transition-all group space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">⚡ Hızlı</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Gerçek zamanlı medya işleme ve yüksek hızlı indirme altyapısı ile saniyeler içinde hazır.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-blue-500/30 transition-all group space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <Film className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">🎬 Yüksek Kalite</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                1080p Full HD, 2K ve 4K gibi kaynak videonun sunduğu en net ve yüksek kalite seçenekleri.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/30 transition-all group space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">🔒 Güvenli</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Geçici dosya izolasyonu ve otomatik silinen temizlik mekanizması ile tam gizlilik.
              </p>
            </div>
          </div>

          {/* 4-Step "Nasıl Çalışır?" Section */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-slate-800 space-y-6">
            <div className="text-center sm:text-left space-y-1">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Rehber</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Nasıl Çalışır?</h2>
              <p className="text-xs sm:text-sm text-slate-400">4 basit adımda videonuzu cihazınıza kaydedin</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold font-mono">01</span>
                  <Link2 className="h-4 w-4 text-slate-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-200">1. Linki Yapıştır</h4>
                <p className="text-xs text-slate-400 leading-relaxed">YouTube video veya Shorts bağlantısını arama kutusuna ekleyin.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold font-mono">02</span>
                  <Sliders className="h-4 w-4 text-slate-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-200">2. Formatı Seç</h4>
                <p className="text-xs text-slate-400 leading-relaxed">MP4 video (1080p, 4K) veya MP3 ses seçeneklerinden birini belirleyin.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold font-mono">03</span>
                  <PlayCircle className="h-4 w-4 text-slate-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-200">3. Dönüştür</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Gelişmiş motorumuz ses ve görüntüyü yüksek hızda birleştirsin.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold font-mono">04</span>
                  <Download className="h-4 w-4 text-slate-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-200">4. Dosyayı İndir</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Hazırlanan dosyanızı tek tıkla doğrudan telefonunuza veya bilgisayarınıza indirin.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

