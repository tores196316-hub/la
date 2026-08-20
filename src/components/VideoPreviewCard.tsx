import React, { useState } from 'react';
import { VideoMetadata, VideoFormatOption } from '../types';
import { Film, Music, Check, ArrowRight, Play, User, Clock, Eye, Sparkles } from 'lucide-react';

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

  const selectedFormat = metadata.availableFormats.find((f) => f.id === selectedFormatId) || formatsForType[0];

  const handleConvertClick = () => {
    if (selectedFormat && !isSubmitting) {
      onStartConversion(selectedFormat);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6">
      {/* Video Details Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Thumbnail with duration badge */}
        <div className="relative w-full sm:w-56 aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 group">
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
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[11px] font-semibold text-white flex items-center gap-1">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span>{metadata.durationFormatted}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2 text-left">
          <h2 className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug">
            {metadata.title}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <User className="h-3.5 w-3.5 text-cyan-400" />
              {metadata.uploader}
            </span>
            {typeof metadata.viewCount === 'number' && (
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-slate-500" />
                {metadata.viewCount.toLocaleString('tr-TR')} görüntüleme
              </span>
            )}
          </div>

          {metadata.descriptionSnippet && (
            <p className="text-xs text-slate-400 line-clamp-2 pt-1 border-t border-slate-800/80">
              {metadata.descriptionSnippet}
            </p>
          )}
        </div>
      </div>

      {/* Format Selector Section */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Format & Kalite Seçimi</h3>
          
          {/* Video / Audio Switcher */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('video')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeType === 'video'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Video (MP4)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('audio')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeType === 'audio'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="h-3.5 w-3.5" />
              <span>Ses (MP3)</span>
            </button>
          </div>
        </div>

        {/* Formats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {formatsForType.map((formatOption) => {
            const isSelected = selectedFormatId === formatOption.id;
            return (
              <button
                key={formatOption.id}
                type="button"
                onClick={() => setSelectedFormatId(formatOption.id)}
                className={`relative flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/50 shadow-md'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {formatOption.label}
                    </span>
                    {formatOption.isBest && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 border border-emerald-700/60 text-emerald-400 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        Tavsiye
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono uppercase text-slate-300">
                      {formatOption.format}
                    </span>
                    {formatOption.filesizeApprox && (
                      <span>• {formatOption.filesizeApprox}</span>
                    )}
                  </div>
                </div>

                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500 text-white'
                      : 'border-slate-700 bg-slate-900 text-transparent'
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onReset}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
        >
          Farklı Video Gir
        </button>

        <button
          type="button"
          onClick={handleConvertClick}
          disabled={!selectedFormat || isSubmitting}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-cyan-900/40 transition-all flex items-center justify-center gap-2"
        >
          <span>Dönüştürmeyi Başlat ({selectedFormat?.format.toUpperCase()} {selectedFormat?.quality})</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
