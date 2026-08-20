import React, { useState } from 'react';
import { JobData } from '../types';
import { Download, Check, RefreshCw, FileText, HardDrive, ShieldCheck } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface DownloadReadyCardProps {
  jobData: JobData;
  onNewConversion: () => void;
}

export const DownloadReadyCard: React.FC<DownloadReadyCardProps> = ({ jobData, onNewConversion }) => {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const downloadUrl = `/api/download/${jobData.jobId}`;

  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl bg-[#0e1017] border border-white/[0.08] p-5 sm:p-7 shadow-xl space-y-5 text-center animate-in fade-in duration-150">
      {/* Top Success Badge */}
      <div className="flex flex-col items-center space-y-2">
        <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Check className="h-5 w-5 stroke-[2.5]" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Dönüştürme tamamlandı ✓
          </h2>
          <p className="text-xs text-slate-400">
            Medya dosyanız başarıyla hazırlandı ve indirilmeye hazır.
          </p>
        </div>
      </div>

      {/* Media Details Box */}
      <div className="rounded-lg bg-[#111319] border border-white/[0.06] p-4 text-left space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-white/[0.06] text-slate-300 shrink-0 mt-0.5">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Hazır Dosya</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white truncate" title={jobData.fileName || jobData.title}>
              {jobData.fileName || `${jobData.title}.${jobData.format}`}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <HardDrive className="h-3.5 w-3.5 text-slate-400" />
            <span>Format: <strong className="text-slate-200 uppercase font-mono">{jobData.format}</strong> ({jobData.quality})</span>
          </div>

          {jobData.fileSizeBytes && jobData.fileSizeBytes > 0 && (
            <div className="text-slate-400">
              <span>Boyut: <strong className="text-slate-200 font-mono">{formatBytes(jobData.fileSizeBytes)}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Main Download Button */}
      <div className="space-y-2.5 pt-1">
        <a
          href={downloadUrl}
          download={jobData.fileName || `imgivo_${jobData.jobId}.${jobData.format}`}
          onClick={() => setDownloadStarted(true)}
          className="w-full py-3 px-5 rounded-lg bg-white hover:bg-slate-200 text-black text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 no-underline"
        >
          <Download className="h-4 w-4 stroke-[2.5]" />
          <span>Dosyayı İndir</span>
        </a>

        {downloadStarted && (
          <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
            <Check className="h-3.5 w-3.5" />
            <span>İndirme başlatıldı. Tarayıcınızın indirmeler listesini kontrol edin.</span>
          </p>
        )}
      </div>

      {/* Security & Cleanup Notice */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-white/[0.06]">
        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
        <span>Gizlilik ve güvenlik için geçici dosyalar diskten otomatik olarak silinir.</span>
      </div>

      {/* Reset button */}
      <div>
        <button
          type="button"
          onClick={onNewConversion}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors p-1.5 rounded cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
          <span>Yeni Bir Video Dönüştür</span>
        </button>
      </div>
    </div>
  );
};



