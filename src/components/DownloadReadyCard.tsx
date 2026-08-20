import React, { useState } from 'react';
import { JobData } from '../types';
import { Download, CheckCircle, RefreshCw, FileText, HardDrive, ShieldCheck, Sparkles } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface DownloadReadyCardProps {
  jobData: JobData;
  onNewConversion: () => void;
}

export const DownloadReadyCard: React.FC<DownloadReadyCardProps> = ({ jobData, onNewConversion }) => {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const downloadUrl = `/api/download/${jobData.jobId}`;
  const isAudio = jobData.format === 'mp3' || jobData.format === 'm4a';

  const handleDownloadClick = () => {
    setDownloadStarted(true);
    // Create direct anchor click
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = jobData.fileName || `imgivo_${jobData.jobId}.${jobData.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 rounded-2xl bg-slate-900/95 border border-cyan-500/40 p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
      {/* Top Success Badge */}
      <div className="flex flex-col items-center space-y-2">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          Dönüştürme tamamlandı ✓
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Medya dosyanız başarıyla hazırlandı ve indirilmeye hazır.
        </p>
      </div>

      {/* Media Details Box */}
      <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 text-left space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 shrink-0 mt-0.5">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Dosya Adı</span>
            <p className="text-sm font-bold text-white truncate" title={jobData.fileName}>
              {jobData.fileName || `${jobData.title}.${jobData.format}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <HardDrive className="h-3.5 w-3.5 text-slate-500" />
            <span>Format: <strong className="text-slate-200 uppercase">{jobData.format}</strong> ({jobData.quality})</span>
          </div>

          {jobData.fileSizeBytes && jobData.fileSizeBytes > 0 && (
            <div className="flex items-center gap-1.5 text-slate-400 justify-end">
              <span>Boyut: <strong className="text-slate-200">{formatBytes(jobData.fileSizeBytes)}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Main Download Button */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleDownloadClick}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-base font-bold shadow-xl shadow-emerald-950/50 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5"
        >
          <Download className="h-5 w-5 stroke-[2.5]" />
          <span>⬇ Dosyayı İndir</span>
        </button>

        {downloadStarted && (
          <p className="text-xs text-emerald-400 flex items-center justify-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>İndirme başlatıldı. Tarayıcınızın indirmeler menüsünü kontrol edin.</span>
          </p>
        )}
      </div>

      {/* Security & Cleanup Notice */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-800">
        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
        <span>Gizlilik ve güvenlik için geçici dosyalar diskten otomatik olarak silinir.</span>
      </div>

      {/* Reset button */}
      <div>
        <button
          type="button"
          onClick={onNewConversion}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Yeni Bir Video Dönüştür</span>
        </button>
      </div>
    </div>
  );
};
