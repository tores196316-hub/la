import React, { useState } from 'react';
import { JobData } from '../types';
import { Download, CheckCircle2, RefreshCw, FileText, HardDrive, ShieldCheck, Check } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface DownloadReadyCardProps {
  jobData: JobData;
  onNewConversion: () => void;
}

export const DownloadReadyCard: React.FC<DownloadReadyCardProps> = ({ jobData, onNewConversion }) => {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const downloadUrl = `/api/download/${jobData.jobId}`;

  // Helper for resolution badge
  const is4K = jobData.quality.includes('4k') || jobData.quality.includes('2160');
  const is2K = jobData.quality.includes('2k') || jobData.quality.includes('1440');
  const is1080p = jobData.quality.includes('1080');

  return (
    <div className="w-full max-w-3xl mx-auto mt-4 rounded-2xl bg-slate-900/95 border border-cyan-500/40 p-6 sm:p-9 shadow-2xl shadow-cyan-950/40 space-y-7 text-center animate-in fade-in zoom-in-95 duration-300">
      {/* Top Success Badge */}
      <div className="flex flex-col items-center space-y-3">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-950/60 ring-4 ring-emerald-500/20">
          <CheckCircle2 className="h-9 w-9 text-white" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Dönüştürme tamamlandı ✓
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Medya dosyanız başarıyla hazırlandı ve indirilmeye hazır.
          </p>
        </div>
      </div>

      {/* Media Details Box */}
      <div className="rounded-2xl bg-slate-950/90 border border-slate-800/90 p-5 text-left space-y-4 shadow-inner">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400 shrink-0 mt-0.5">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Hazır Dosya</span>
              {is4K && (
                <span className="px-2 py-0.2 rounded bg-purple-950 border border-purple-500/40 text-[10px] font-extrabold text-purple-300">
                  4K
                </span>
              )}
              {is2K && (
                <span className="px-2 py-0.2 rounded bg-indigo-950 border border-indigo-500/40 text-[10px] font-extrabold text-indigo-300">
                  2K
                </span>
              )}
              {is1080p && (
                <span className="px-2 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-[10px] font-extrabold text-cyan-300">
                  1080p
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base font-bold text-white truncate" title={jobData.fileName || jobData.title}>
              {jobData.fileName || `${jobData.title}.${jobData.format}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-slate-800/90 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <HardDrive className="h-4 w-4 text-cyan-400" />
            <span>Format: <strong className="text-slate-200 uppercase font-bold">{jobData.format}</strong> ({jobData.quality})</span>
          </div>

          {jobData.fileSizeBytes && jobData.fileSizeBytes > 0 && (
            <div className="flex items-center gap-2 text-slate-400 justify-end">
              <span>Boyut: <strong className="text-emerald-400 font-mono font-bold">{formatBytes(jobData.fileSizeBytes)}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Main Download Button */}
      <div className="space-y-3 pt-1">
        <a
          href={downloadUrl}
          download={jobData.fileName || `imgivo_${jobData.jobId}.${jobData.format}`}
          onClick={() => setDownloadStarted(true)}
          className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-base sm:text-lg font-extrabold shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-98 no-underline"
        >
          <Download className="h-6 w-6 stroke-[2.5]" />
          <span>↓ Dosyayı İndir</span>
        </a>

        {downloadStarted && (
          <p className="text-xs sm:text-sm text-emerald-400 font-medium flex items-center justify-center gap-1.5 animate-in fade-in duration-200">
            <Check className="h-4 w-4" />
            <span>İndirme başlatıldı. Tarayıcınızın indirmeler listesini kontrol edin.</span>
          </p>
        )}
      </div>

      {/* Security & Cleanup Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/90">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span>Gizlilik ve güvenlik için geçici dosyalar diskten otomatik olarak silinir.</span>
      </div>

      {/* Reset button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onNewConversion}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-cyan-300 transition-colors p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 text-cyan-400" />
          <span>Yeni Bir Video Dönüştür</span>
        </button>
      </div>
    </div>
  );
};


