import React from 'react';
import { ShieldCheck, Crown } from 'lucide-react';
import { Link } from '../context/RouterContext';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#08090c] mt-16 py-8 px-4 sm:px-6 text-slate-400 text-xs">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
        {/* Brand & Note */}
        <div className="space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-white font-extrabold text-xs tracking-tight">
            <span>IMGIVO</span>
            <span className="text-slate-600 font-normal">/</span>
            <span className="text-slate-400 font-normal text-[11px]">SaaS Media Suite</span>
          </div>
          <p className="text-slate-400 text-[11px] max-w-xs leading-relaxed">
            Hızlı, gizli ve yüksek kalitede YouTube video ve ses dönüştürme platformu.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs font-medium text-slate-400">
          <Link to="/" className="hover:text-white transition-colors cursor-pointer">
            Dönüştürücü
          </Link>
          <Link to="/premium" className="hover:text-amber-300 text-amber-400/80 transition-colors flex items-center gap-1 cursor-pointer">
            <Crown className="w-3 h-3" />
            <span>Premium</span>
          </Link>
          <Link to="/gecmis" className="hover:text-white transition-colors cursor-pointer">
            Geçmiş
          </Link>
          <Link to="/yardim" className="hover:text-white transition-colors cursor-pointer">
            Yardım & SSS
          </Link>
          <Link to="/giris" className="hover:text-white transition-colors cursor-pointer">
            Giriş
          </Link>
          <Link to="/kayit" className="hover:text-white transition-colors cursor-pointer">
            Kayıt Ol
          </Link>
        </div>

        {/* Copyright & Security */}
        <div className="text-slate-400 text-[11px] space-y-0.5 flex flex-col md:items-end">
          <div className="flex items-center justify-center md:justify-end gap-1 text-slate-400">
            <ShieldCheck className="h-3 w-3 text-slate-400" />
            <span>2K / 4K Destekli Güvenli Altyapı</span>
          </div>
          <div>© {new Date().getFullYear()} IMGIVO. Tüm hakları saklıdır.</div>
        </div>
      </div>
    </footer>
  );
};
