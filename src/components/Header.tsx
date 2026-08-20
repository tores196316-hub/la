import React, { useState } from 'react';
import { History, BarChart3, HelpCircle, Menu, X, CheckCircle2 } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#08090c]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick('converter')}
            className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 rounded-lg py-1 transition-opacity hover:opacity-90 active:scale-98 cursor-pointer"
          >
            <div className="h-6 w-6 rounded-md bg-white text-black font-black text-xs flex items-center justify-center tracking-tighter">
              IV
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              IMGIVO
            </span>
          </button>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 p-0.5 rounded-lg bg-[#111319] border border-white/[0.06]">
          <button
            onClick={() => handleNavClick('converter')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'converter'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            Dönüştürücü
          </button>

          <button
            onClick={() => handleNavClick('history')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <History className="h-3 w-3" />
            <span>Geçmiş</span>
          </button>

          <button
            onClick={() => handleNavClick('admin')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <BarChart3 className="h-3 w-3" />
            <span>İstatistikler</span>
          </button>

          <button
            onClick={() => handleNavClick('faq')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <HelpCircle className="h-3 w-3" />
            <span>Yardım</span>
          </button>
        </nav>

        {/* Action Zone: Status indicator & Mobile Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavClick('admin')}
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#111319] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-white/20 hover:text-white transition-all cursor-pointer"
            title="Sistem durumu"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="hidden sm:inline">{isHealthy ? 'Sistem Aktif' : 'Hazırlanıyor'}</span>
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg bg-[#111319] border border-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
            aria-label="Menüyü Aç"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0c0e14] px-4 py-3 space-y-1 animate-in slide-in-from-top-1 duration-150">
          <button
            onClick={() => handleNavClick('converter')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
              activeTab === 'converter'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-300 hover:bg-white/[0.04]'
            }`}
          >
            <span>Dönüştürücü</span>
            {activeTab === 'converter' && <CheckCircle2 className="h-3.5 w-3.5 text-slate-300" />}
          </button>

          <button
            onClick={() => handleNavClick('history')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-300 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="h-3.5 w-3.5 text-slate-400" />
              <span>Geçmiş</span>
            </div>
            {activeTab === 'history' && <CheckCircle2 className="h-3.5 w-3.5 text-slate-300" />}
          </button>

          <button
            onClick={() => handleNavClick('admin')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-300 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
              <span>İstatistikler & Durum</span>
            </div>
            {activeTab === 'admin' && <CheckCircle2 className="h-3.5 w-3.5 text-slate-300" />}
          </button>

          <button
            onClick={() => handleNavClick('faq')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-slate-300 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              <span>Yardım & SSS</span>
            </div>
            {activeTab === 'faq' && <CheckCircle2 className="h-3.5 w-3.5 text-slate-300" />}
          </button>
        </div>
      )}
    </header>
  );
};



