import React from 'react';
import { Sparkles, Shield, Heart } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: 'converter' | 'history' | 'admin' | 'faq') => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#06080d] mt-16 py-8 px-4 sm:px-6 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        {/* Brand & Note */}
        <div className="space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-white font-bold">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>IMGIVO</span>
            <span className="text-slate-500 font-normal">| Gerçek Medya Dönüştürücü</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Hızlı, güvenli ve gerçek zamanlı YouTube video & ses dönüştürme servisi.
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-4 text-slate-400">
          <button
            onClick={() => setActiveTab('converter')}
            className="hover:text-cyan-400 transition-colors"
          >
            Dönüştürücü
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className="hover:text-cyan-400 transition-colors"
          >
            Geçmiş
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className="hover:text-cyan-400 transition-colors"
          >
            İstatistikler
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className="hover:text-cyan-400 transition-colors"
          >
            Kullanım Şartları & SSS
          </button>
        </div>

        {/* Copyright */}
        <div className="text-slate-400 text-[11px]">
          © {new Date().getFullYear()} IMGIVO. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
};
