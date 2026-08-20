import React from 'react';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: 'converter' | 'history' | 'admin' | 'faq') => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 mt-20 py-10 px-4 sm:px-6 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Brand & Note */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center md:justify-start gap-2 text-white font-extrabold text-sm tracking-tight">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 text-white text-[10px] font-black">
              I
            </span>
            <span>IMGIVO</span>
            <span className="text-slate-500 font-normal text-xs">| Premium Medya Dönüştürücü</span>
          </div>
          <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
            Hızlı, güvenli ve 4K/1080p yüksek kalitede YouTube video ve ses dönüştürme platformu.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-5 text-xs font-semibold text-slate-400">
          <button
            type="button"
            onClick={() => {
              setActiveTab('converter');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-cyan-300 transition-colors cursor-pointer"
          >
            Dönüştürücü
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-cyan-300 transition-colors cursor-pointer"
          >
            Geçmiş
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-cyan-300 transition-colors cursor-pointer"
          >
            İstatistikler
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('faq');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-cyan-300 transition-colors cursor-pointer"
          >
            Yardım & SSS
          </button>
        </div>

        {/* Copyright & Security */}
        <div className="text-slate-400 text-[11px] space-y-1 flex flex-col md:items-end">
          <div className="flex items-center justify-center md:justify-end gap-1 text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Güvenli & Otomatik Temizlenen Altyapı</span>
          </div>
          <div>© {new Date().getFullYear()} IMGIVO. Tüm hakları saklıdır.</div>
        </div>
      </div>
    </footer>
  );
};

