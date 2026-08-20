import React, { useState } from 'react';
import { Sparkles, History, BarChart3, HelpCircle, Activity, Menu, X, CheckCircle2 } from 'lucide-react';
import { SystemHealth } from '../types';

interface HeaderProps {
  activeTab: 'converter' | 'history' | 'admin' | 'faq';
  setActiveTab: (tab: 'converter' | 'history' | 'admin' | 'faq') => void;
  systemHealth: SystemHealth | null;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, systemHealth }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHealthy = systemHealth?.dependencies?.ytdlp?.available ?? true;

  const handleNavClick = (tab: 'converter' | 'history' | 'admin' | 'faq') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#050811]/90 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick('converter')}
            className="group flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl p-1 transition-transform active:scale-95 cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 shadow-md shadow-cyan-500/25 group-hover:shadow-cyan-500/50 transition-all">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              IMG<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">IVO</span>
            </span>
          </button>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-inner">
          <button
            onClick={() => handleNavClick('converter')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'converter'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            Dönüştürücü
          </button>

          <button
            onClick={() => handleNavClick('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Geçmiş</span>
          </button>

          <button
            onClick={() => handleNavClick('admin')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>İstatistikler</span>
          </button>

          <button
            onClick={() => handleNavClick('faq')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Yardım</span>
          </button>
        </nav>

        {/* Action Zone: Status indicator & Mobile Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleNavClick('admin')}
            className="flex items-center gap-2 rounded-full border border-slate-800/90 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-500/40 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 whitespace-nowrap cursor-pointer"
            title="Sistem ve sunucu durumu"
          >
            <span className="relative flex h-2 w-2">
              {isHealthy && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </span>
            <span className="hidden sm:inline font-semibold">{isHealthy ? 'Sistem Aktif' : 'Hazırlanıyor'}</span>
            <Activity className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
            aria-label="Menüyü Aç"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#070b16] px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          <button
            onClick={() => handleNavClick('converter')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold cursor-pointer ${
              activeTab === 'converter'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <span>Dönüştürücü</span>
            {activeTab === 'converter' && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => handleNavClick('history')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold cursor-pointer ${
              activeTab === 'history'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <History className="h-4 w-4 text-cyan-400" />
              <span>Geçmiş</span>
            </div>
            {activeTab === 'history' && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => handleNavClick('admin')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span>İstatistikler & Durum</span>
            </div>
            {activeTab === 'admin' && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => handleNavClick('faq')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="h-4 w-4 text-cyan-400" />
              <span>Yardım & SSS</span>
            </div>
            {activeTab === 'faq' && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
          </button>
        </div>
      )}
    </header>
  );
};


