import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: 'converter' | 'history' | 'admin' | 'faq') => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#08090c] mt-16 py-8 px-4 sm:px-6 text-slate-400 text-xs">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
        {/* Brand & Note */}
        <div className="space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-white font-extrabold text-xs tracking-tight">
            <span>IMGIVO</span>
            <span className="text-slate-600 font-normal">/</span>
            <span className="text-slate-400 font-normal text-[11px]">Media Converter</span>
          </div>
          <p className="text-slate-400 text-[11px] max-w-xs leading-relaxed">
            Hızlı, gizli ve yüksek kalitede YouTube video ve ses dönüştürme aracı.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs font-medium text-slate-400">
          <button
            type="button"
            onClick={() => {
              setActiveTab('converter');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Dönüştürücü
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Geçmiş
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            İstatistikler
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('faq');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            SSS
          </button>
        </div>

        {/* Copyright & Security */}
        <div className="text-slate-400 text-[11px] space-y-0.5 flex flex-col md:items-end">
          <div className="flex items-center justify-center md:justify-end gap-1 text-slate-400">
            <ShieldCheck className="h-3 w-3 text-slate-400" />
            <span>Otomatik Temizlenen Güvenli Sunucu</span>
          </div>
          <div>© {new Date().getFullYear()} IMGIVO</div>
        </div>
      </div>
    </footer>
  );
};


