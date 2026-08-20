import React, { useState, useRef, useEffect } from 'react';
import { useRouter, Link } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import {
  Crown,
  History,
  HelpCircle,
  Shield,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { SystemHealth } from '../types';

interface HeaderProps {
  systemHealth?: SystemHealth | null;
}

export const Header: React.FC<HeaderProps> = () => {
  const { path, navigate } = useRouter();
  const { user, isPremium, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Dönüştürücü', to: '/' },
    { label: 'Premium', to: '/premium', isSpecial: true },
    { label: 'Geçmiş', to: '/gecmis' },
    { label: 'Yardım', to: '/yardim' },
    ...(isAdmin ? [{ label: 'Yönetici', to: '/admin', isAdminOnly: true }] : []),
  ];

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#08090c]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 rounded-lg py-1 transition-opacity hover:opacity-90 shrink-0 cursor-pointer"
        >
          <div className="h-6 w-6 rounded-md bg-white text-black font-black text-xs flex items-center justify-center tracking-tighter">
            IV
          </div>
          <span className="text-base font-bold tracking-tight text-white font-sans">
            IMGIVO
          </span>
        </Link>

        {/* Zone 2: Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 p-0.5 rounded-lg bg-[#111319] border border-white/[0.06]">
          {navLinks.map((link) => {
            const isActive = path === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                } ${link.isSpecial && !isActive ? 'text-amber-300 hover:text-amber-200' : ''} ${
                  link.isAdminOnly && !isActive ? 'text-red-400 hover:text-red-300' : ''
                }`}
              >
                {link.isSpecial && <Crown className="w-3 h-3 text-amber-400" />}
                {link.isAdminOnly && <Shield className="w-3 h-3 text-red-400" />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions (Auth State or Login/Register) */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full bg-[#111319] hover:bg-[#161a24] border border-white/[0.08] text-left transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/20 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-white truncate max-w-[100px]">
                    {user.name.split(' ')[0]}
                  </div>
                </div>
                {isPremium && (
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Premium Üye" />
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0e1017] border border-white/[0.1] p-1.5 shadow-2xl space-y-1 z-50 text-left animate-in fade-in duration-100">
                  <div className="px-3 py-2 border-b border-white/[0.06] space-y-0.5">
                    <div className="text-xs font-bold text-white truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">@{user.username}</div>
                    {isPremium ? (
                      <div className="pt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                        <Crown className="w-3 h-3" />
                        <span>{user.remainingFormatted}</span>
                      </div>
                    ) : (
                      <div className="pt-1 text-[10px] text-slate-500">Standart Hesap</div>
                    )}
                  </div>

                  <Link
                    to="/profil"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Profil & Ayarlar</span>
                  </Link>

                  <Link
                    to="/gecmis"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>İndirme Geçmişim</span>
                  </Link>

                  <Link
                    to="/premium"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-400/10 transition-colors cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Premium Yükselt</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-red-400" />
                      <span>Yönetici Paneli</span>
                    </Link>
                  )}

                  <div className="pt-1 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/giris"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors whitespace-nowrap cursor-pointer"
              >
                Giriş Yap
              </Link>
              <Link
                to="/kayit"
                className="px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer shadow-sm shadow-white/10"
              >
                Kayıt Ol
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu button */}
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
        <div className="md:hidden border-b border-white/[0.08] bg-[#0c0e14] px-4 py-3 space-y-1.5 animate-in slide-in-from-top-1 duration-150 text-left">
          {navLinks.map((link) => {
            const isActive = path === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-slate-300 hover:bg-white/[0.04]'
                } ${link.isSpecial && !isActive ? 'text-amber-300' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {link.isSpecial && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  {link.isAdminOnly && <Shield className="w-3.5 h-3.5 text-red-400" />}
                  <span>{link.label}</span>
                </div>
              </Link>
            );
          })}

          {user ? (
            <div className="pt-2 border-t border-white/[0.06] space-y-1">
              <Link
                to="/profil"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/[0.04]"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Profilim (@{user.username})</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2">
              <Link
                to="/giris"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg bg-white/[0.04] text-center text-xs font-medium text-slate-200"
              >
                Giriş Yap
              </Link>
              <Link
                to="/kayit"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg bg-white text-black text-center text-xs font-semibold"
              >
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
