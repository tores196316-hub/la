import React, { useState } from 'react';
import { Search, Youtube, Clipboard, X, Loader2, Sparkles } from 'lucide-react';

interface UrlInputSectionProps {
  url: string;
  setUrl: (url: string) => void;
  onAnalyze: (urlToAnalyze?: string) => void;
  isLoading: boolean;
  error?: string | null;
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
    <div className="w-full max-w-3xl mx-auto text-center space-y-6 pt-4 sm:pt-8">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-medium text-cyan-300">
        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
        <span>Gerçek Zamanlı Medya İşleme ve Yüksek Kalite</span>
      </div>

      {/* Main Headlines */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Videonu dönüştür. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
            İstediğin formatta indir.
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          Bağlantını yapıştır, formatını seç ve dönüştürmeye başla.
        </p>
      </div>

      {/* Input Box Area */}
      <div className="relative mt-8">
        <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-500/20 shadow-xl transition-all">
          <div className="flex items-center w-full pl-3 pr-1 py-1 gap-2">
            <Youtube className="h-5 w-5 text-red-500 shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={isLoading}
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none disabled:opacity-60"
            />
            {url && !isLoading && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                title="Temizle"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handlePaste}
              disabled={isLoading}
              className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors shrink-0 flex items-center gap-1"
              title="Panodan Yapıştır"
            >
              <Clipboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{pasteSuccess ? 'Yapıştırıldı' : 'Yapıştır'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onAnalyze()}
            disabled={isLoading || !url.trim()}
            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
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
          <div className="mt-3 p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-sm text-left flex items-start gap-2 animate-in fade-in duration-200">
            <span className="font-semibold shrink-0">Hata:</span>
            <span>{error}</span>
          </div>
        )}

        {/* Quick sample videos */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500">Hızlı Test:</span>
          {SAMPLE_VIDEOS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSampleClick(sample.url)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-md bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
