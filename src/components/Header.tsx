import React from 'react';
import { Sparkles, History, BarChart3, HelpCircle, Activity } from 'lucide-react';
import { SystemHealth } from '../types';

interface HeaderProps {
  activeTab: 'converter' | 'history' | 'admin' | 'faq';
  setActiveTab: (tab: 'converter' | 'history' | 'admin' | 'faq') => void;
  systemHealth: SystemHealth | null;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, systemHealth }) => {
  const isHealthy = systemHealth?.dependencies?.ytdlp?.available ?? false;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07090e]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Zone: Exactly single text element */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('converter')}
            className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg p-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-cyan-900/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              IMG<span className="text-cyan-400">IVO</span>
            </span>
          </button>
        </div>

        {/* Nav Links: 4 single-line controls */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('converter')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'converter'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Dönüştürücü
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Geçmiş</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'admin'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>İstatistikler</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'faq'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Yardım</span>
          </button>
        </nav>

        {/* Action Zone: Status indicator pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('admin')}
            className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-xs font-medium text-slate-300 hover:border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 whitespace-nowrap"
            title="Sistem ve sunucu durumu"
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isHealthy ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
              }`}
            />
            <span className="hidden sm:inline">{isHealthy ? 'Sistem Aktif' : 'Hazırlanıyor'}</span>
            <Activity className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden border-t border-slate-800/60 bg-[#0a0d17] px-2 py-1 justify-around text-xs">
        <button
          onClick={() => setActiveTab('converter')}
          className={`py-1.5 px-2 rounded font-medium ${
            activeTab === 'converter' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Dönüştürücü
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-1.5 px-2 rounded font-medium ${
            activeTab === 'history' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Geçmiş
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`py-1.5 px-2 rounded font-medium ${
            activeTab === 'admin' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          İstatistikler
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`py-1.5 px-2 rounded font-medium ${
            activeTab === 'faq' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Yardım
        </button>
      </div>
    </header>
  );
};
