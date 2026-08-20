import React from 'react';
import { useRouter, Link } from '../context/RouterContext';
import { ArrowLeft, Home, FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  const { goBack } = useRouter();

  return (
    <div className="w-full max-w-md mx-auto py-16 sm:py-24 text-center space-y-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-slate-400">
        <FileQuestion className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="text-4xl font-extrabold text-white font-mono tracking-tight">404</div>
        <h1 className="text-xl font-bold text-white">Sayfa Bulunamadı</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={goBack}
          className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Geri Git</span>
        </button>

        <Link
          to="/"
          className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-white/5"
        >
          <Home className="w-4 h-4" />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>
    </div>
  );
}
