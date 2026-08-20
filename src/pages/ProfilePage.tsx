import React, { useState } from 'react';
import { useRouter, Link } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  Crown,
  Shield,
  Clock,
  Calendar,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  History,
  ArrowRight,
  LogOut,
  Zap,
} from 'lucide-react';

export function ProfilePage() {
  const { navigate } = useRouter();
  const { user, isPremium, isAdmin, logout, updateProfile } = useAuth();

  const [nameInput, setNameInput] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) {
    navigate('/giris', true);
    return null;
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg(null);
    setIsUpdating(true);

    try {
      const res = await updateProfile({
        name: nameInput,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (res.success) {
        setUpdateMsg({ type: 'success', text: 'Profil bilgileriniz başarıyla güncellendi.' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setUpdateMsg({ type: 'error', text: res.error || 'Güncelleme yapılamadı.' });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return 'Belirtilmedi';
    return new Date(timestamp).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Get initials for avatar
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-8 space-y-6">
      {/* Top Banner / User Hero Card */}
      <div className="rounded-2xl bg-[#0e1017] border border-white/[0.08] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        {/* Ambient subtle backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 sm:gap-5 z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/[0.15] flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-xl shrink-0">
            {initials || 'U'}
          </div>

          <div className="space-y-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">{user.name}</h1>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold tracking-wider uppercase">
                  YÖNETİCİ
                </span>
              )}
              {isPremium ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {user.plan === 'premium_plus' ? 'PREMIUM PLUS' : 'PREMIUM'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-slate-400 text-[11px] font-medium">
                  STANDART HESAP
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-400 font-mono">@{user.username}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto z-10">
          <button
            type="button"
            onClick={logout}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* Modern Membership Status Card */}
      {isPremium ? (
        <div className="rounded-2xl bg-gradient-to-br from-[#12151f] via-[#0d1017] to-[#0a0c11] border border-amber-400/20 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden text-left">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white tracking-wide uppercase">
                  IMGIVO {user.plan === 'premium_plus' ? 'PREMIUM PLUS' : 'PREMIUM'}
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  Aktif
                </span>
              </div>
              <p className="text-xs text-slate-400">
                2K / 4K Ultra HD video indirme ve öncelikli dönüştürme motoru hesabınıza tanımlıdır.
              </p>
            </div>

            <div className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-right">
              <div className="text-[11px] text-slate-400">Kalan Süre</div>
              <div className="text-sm sm:text-base font-bold text-amber-300 font-mono">
                {user.remainingFormatted}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/[0.06]">
            <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-300" />
                <span>Başlangıç Tarihi</span>
              </div>
              <div className="text-xs font-medium text-slate-200">{formatDate(user.premiumStartedAt)}</div>
            </div>

            <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Son Kullanma Tarihi</span>
              </div>
              <div className="text-xs font-medium text-amber-300">{formatDate(user.premiumExpiresAt)}</div>
            </div>

            <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>Maksimum Çözünürlük</span>
              </div>
              <div className="text-xs font-medium text-emerald-400">4K Ultra HD (2160p)</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0e1017] border border-white/[0.08] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-left">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-slate-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">Standart (Free) Üyelik</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              1080p Full HD video ve standart ses indirmelerini kullanabilirsiniz. 2K QHD ve 4K Ultra HD seçeneklerini açmak için Premium pakete geçin.
            </p>
          </div>

          <Link
            to="/premium"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-white/5"
          >
            <Crown className="w-4 h-4 text-amber-600" />
            <span>Premium'a Yükselt</span>
          </Link>
        </div>
      )}

      {/* Account Settings & Quick Navigation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Edit Profile / Password */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0e1017] border border-white/[0.08] p-6 text-left space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
            <KeyRound className="w-4 h-4 text-slate-300" />
            <h3 className="text-sm font-bold text-white">Hesap ve Güvenlik Ayarları</h3>
          </div>

          {updateMsg && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                updateMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {updateMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{updateMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Ad Soyad</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/30"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Mevcut Şifre</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Şifrenizi değiştirmek için girin"
                  className="w-full px-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Yeni Şifre</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full px-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isUpdating ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Quick Links */}
        <div className="rounded-2xl bg-[#0e1017] border border-white/[0.08] p-6 text-left space-y-4">
          <h3 className="text-sm font-bold text-white pb-3 border-b border-white/[0.06]">
            Hızlı İşlemler
          </h3>

          <div className="space-y-2">
            <Link
              to="/"
              className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-medium text-slate-200">Video Dönüştürücü</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            <Link
              to="/gecmis"
              className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-medium text-slate-200">İndirme Geçmişim</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            <Link
              to="/premium"
              className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-amber-300">Premium Planlar</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-300 transition-colors" />
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-medium text-red-300">Yönetici Paneli</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300 transition-colors" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
