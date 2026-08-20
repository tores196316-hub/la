import React, { useState } from 'react';
import { VideoMetadata, VideoFormatOption } from '../types';
import { Film, Music, Check, ArrowRight, Clock, Eye, User, Loader2 } from 'lucide-react';

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
  
  // Filter formats strictly from backend availableFormats
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

  // Helper to badge resolutions cleanly
  const getQualityBadge = (option: VideoFormatOption) => {
    const q = option.quality.toLowerCase();
    const lbl = option.label.toLowerCase();
    if (q.includes('2160') || q.includes('4k') || lbl.includes('4k')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-white">
          4K
        </span>
      );
    }
    if (q.includes('1440') || q.includes('2k') || lbl.includes('2k')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-white">
          2K
        </span>
      );
    }
    if (q.includes('1080') || lbl.includes('1080')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-white">
          1080p
        </span>
      );
    }
    if (option.isBest) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-slate-300">
          Önerilen
        </span>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-xl bg-[#0e1017] border border-white/[0.08] p-4 sm:p-6 shadow-xl space-y-5 animate-in fade-in duration-150">
      {/* Video Details Header Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Thumbnail */}
        <div className="relative w-full sm:w-56 aspect-video rounded-lg overflow-hidden bg-black border border-white/[0.08] shrink-0">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Film className="h-6 w-6" />
            </div>
          )}
          <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[11px] font-mono text-white flex items-center gap-1 border border-white/10">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{metadata.durationFormatted}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-[10px] font-bold text-red-400">
              YouTube
            </span>
          </div>

          <h2 className="text-sm sm:text-base font-bold text-white line-clamp-2 leading-snug">
            {metadata.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <User className="h-3 w-3 text-slate-400" />
              {metadata.uploader}
            </span>
            {typeof metadata.viewCount === 'number' && (
              <span className="flex items-center gap-1 text-slate-400">
                <Eye className="h-3 w-3 text-slate-500" />
                {metadata.viewCount.toLocaleString('tr-TR')} izlenme
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Format Selector Section */}
      <div className="space-y-3.5 pt-3.5 border-t border-white/[0.07]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="text-left">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Format & Kalite Seçimi
            </h3>
          </div>
          
          {/* Segmented Control (Video | Ses) */}
          <div className="flex rounded-lg bg-[#111319] p-0.5 border border-white/[0.08] shrink-0">
            <button
              type="button"
              onClick={() => handleTypeChange('video')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeType === 'video'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="h-3 w-3" />
              <span>Video (MP4)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('audio')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeType === 'audio'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="h-3 w-3" />
              <span>Ses (MP3/M4A)</span>
            </button>
          </div>
        </div>

        {/* Formats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {formatsForType.map((formatOption) => {
            const isSelected = selectedFormatId === formatOption.id;
            const qualityBadge = getQualityBadge(formatOption);
            return (
              <button
                key={formatOption.id}
                type="button"
                onClick={() => setSelectedFormatId(formatOption.id)}
                className={`relative flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-white/40 bg-white/[0.06]'
                    : 'border-white/[0.06] bg-[#111319] hover:border-white/[0.15]'
                }`}
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white">
                      {formatOption.label}
                    </span>
                    {qualityBadge}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="font-mono uppercase text-slate-300">
                      {formatOption.format}
                    </span>
                    {formatOption.filesizeApprox && (
                      <span className="text-slate-400">• {formatOption.filesizeApprox}</span>
                    )}
                  </div>
                </div>

                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border shrink-0 transition-all ${
                    isSelected
                      ? 'border-white bg-white text-black'
                      : 'border-white/20 text-transparent'
                  }`}
                >
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3.5 border-t border-white/[0.07]">
        <button
          type="button"
          onClick={onReset}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-4 py-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
        >
          Farklı Video Gir
        </button>

        <button
          type="button"
          onClick={handleConvertClick}
          disabled={!selectedFormat || isSubmitting}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white hover:bg-slate-200 text-black text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
              <span>Hazırlanıyor...</span>
            </>
          ) : (
            <>
              <span>Dönüştürmeyi Başlat</span>
              <span className="text-[11px] font-normal text-slate-700">({selectedFormat?.format.toUpperCase()} • {selectedFormat?.quality})</span>
              <ArrowRight className="h-3.5 w-3.5 text-black" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};



