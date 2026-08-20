import React, { useState } from 'react';
import { VideoMetadata, VideoFormatOption } from '../types';
import { Film, Music, Check, ArrowRight, Clock, Eye, Sparkles, User, ShieldCheck, ChevronRight } from 'lucide-react';

interface VideoPreviewCardProps {
  metadata: VideoMetadata;
  onStartConversion: (selectedFormat: VideoFormatOption) => void;
  onReset: () => void;
  isSubmitting: boolean;
}

export const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({
  metadata,
  onStartConversion,
  onReset,
  isSubmitting,
}) => {
  const [activeType, setActiveType] = useState<'video' | 'audio'>('video');
  
  // Filter formats by active type
  const formatsForType = metadata.availableFormats.filter((f) => f.type === activeType);
  
  // Default selected format
  const [selectedFormatId, setSelectedFormatId] = useState<string>(() => {
    const defaultOpt = formatsForType.find((f) => f.isBest) || formatsForType[0];
    return defaultOpt?.id || metadata.availableFormats[0]?.id || '';
  });

  const handleTypeChange = (type: 'video' | 'audio') => {
    setActiveType(type);
    const firstOfNewType = metadata.availableFormats.find((f) => f.type === type && f.isBest) ||
      metadata.availableFormats.find((f) => f.type === type);
    if (firstOfNewType) {
      setSelectedFormatId(firstOfNewType.id);
    }
  };

  const selectedFormat = formatsForType.find((f) => f.id === selectedFormatId) || formatsForType[0] || metadata.availableFormats[0];

  const handleConvertClick = () => {
    if (selectedFormat && !isSubmitting) {
      onStartConversion(selectedFormat);
    }
  };

  // Helper to badge premium resolutions (4K, 2K, 1080p)
  const getQualityBadge = (option: VideoFormatOption) => {
    const q = option.quality.toLowerCase();
    const lbl = option.label.toLowerCase();
    if (q.includes('2160') || q.includes('4k') || lbl.includes('4k')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-sm">
          4K ULTRA HD
        </span>
      );
    }
    if (q.includes('1440') || q.includes('2k') || lbl.includes('2k')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 shadow-sm">
          2K QHD
        </span>
      );
    }
    if (q.includes('1080') || lbl.includes('1080')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 shadow-sm">
          1080p FULL HD
        </span>
      );
    }
    if (option.isBest) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5" />
          Önerilen
        </span>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Video Details Header Row */}
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Thumbnail with duration badge */}
        <div className="relative w-full sm:w-64 aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 group shadow-lg">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Film className="h-8 w-8" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-md bg-black/85 backdrop-blur-sm text-xs font-semibold text-white flex items-center gap-1 border border-white/10 shadow-sm">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span>{metadata.durationFormatted}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2.5 text-left">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-red-950/60 border border-red-800/50 text-[11px] font-bold text-red-400">
              YouTube
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Doğrulandı
            </span>
          </div>

          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white line-clamp-2 leading-snug">
            {metadata.title}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-200 font-medium">
              <User className="h-3.5 w-3.5 text-cyan-400" />
              {metadata.uploader}
            </span>
            {typeof metadata.viewCount === 'number' && (
              <span className="flex items-center gap-1 text-slate-400">
                <Eye className="h-3.5 w-3.5 text-slate-500" />
                {metadata.viewCount.toLocaleString('tr-TR')} görüntüleme
              </span>
            )}
          </div>

          {metadata.descriptionSnippet && (
            <p className="text-xs text-slate-400 line-clamp-2 pt-2 border-t border-slate-800/80 leading-relaxed">
              {metadata.descriptionSnippet}
            </p>
          )}
        </div>
      </div>

      {/* Format Selector Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800/90">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5 text-left">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Format & Kalite Seçimi</span>
              <span className="text-xs font-normal text-slate-400">({formatsForType.length} seçenek mevcut)</span>
            </h3>
            <p className="text-xs text-slate-400">İndirmek istediğiniz medya türünü ve kalitesini seçin</p>
          </div>
          
          {/* Video / Audio Switcher */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800/90 shrink-0 shadow-inner">
            <button
              type="button"
              onClick={() => handleTypeChange('video')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeType === 'video'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Video (MP4)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('audio')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeType === 'audio'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="h-3.5 w-3.5" />
              <span>Ses (MP3/M4A)</span>
            </button>
          </div>
        </div>

        {/* Formats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {formatsForType.map((formatOption) => {
            const isSelected = selectedFormatId === formatOption.id;
            const qualityBadge = getQualityBadge(formatOption);
            return (
              <button
                key={formatOption.id}
                type="button"
                onClick={() => setSelectedFormatId(formatOption.id)}
                className={`relative flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950/50'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="space-y-1.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white tracking-wide">
                      {formatOption.label}
                    </span>
                    {qualityBadge}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <span className="font-mono uppercase text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[11px]">
                      {formatOption.format}
                    </span>
                    {formatOption.filesizeApprox && (
                      <span className="text-slate-400 text-[11px]">• {formatOption.filesizeApprox}</span>
                    )}
                  </div>
                </div>

                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border shrink-0 transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500 text-white shadow-sm'
                      : 'border-slate-700 bg-slate-900/80 text-transparent'
                  }`}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/90">
        <button
          type="button"
          onClick={onReset}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold transition-colors"
        >
          Farklı Video Gir
        </button>

        <button
          type="button"
          onClick={handleConvertClick}
          disabled={!selectedFormat || isSubmitting}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold shadow-xl shadow-cyan-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <span>Dönüştürmeyi Başlat ({selectedFormat?.format.toUpperCase()} • {selectedFormat?.quality})</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

