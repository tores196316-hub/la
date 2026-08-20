import React, { useState } from 'react';
import { useRouter, Link } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, Check, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export function RegisterPage() {
  const { navigate } = useRouter();
  const { register, user } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    navigate('/profil', true);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Lütfen Ad Soyad alanını doldurun (en az 2 karakter).');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Şifreler birbiriyle uyuşmuyor.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        passwordConfirm,
      });

      if (res.success) {
        navigate('/profil');
      } else {
        setError(res.error || 'Kayıt işlemi gerçekleştirilemedi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 sm:py-12">
      <div className="rounded-2xl bg-[#0e1017] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white mb-2">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Yeni Hesap Oluşturun</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sınırsız medya dönüştürme ve hızlı indirme geçmişine sahip olun.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Ad Soyad</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#07080b] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/30 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Kullanıcı Adı</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <span className="text-xs font-mono">@</span>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                placeholder="kullaniciadi"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#07080b] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/30 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">E-Posta Adresi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="adiniz@ornek.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#07080b] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/30 transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Şifre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#07080b] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Şifre Tekrar</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Check className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Şifreyi tekrar edin"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#07080b] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-white text-black font-semibold text-sm hover:bg-slate-200 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/5"
          >
            {isLoading ? (
              <span>Hesap Oluşturuluyor...</span>
            ) : (
              <>
                <span>Kayıt Ol ve Başla</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Benefits mini pill */}
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Kayıt olarak indirme geçmişinizi kaydedebilir ve 1080p Full HD indirmelere hemen başlayabilirsiniz.</span>
        </div>

        {/* Login footer link */}
        <div className="pt-2 text-center text-xs text-slate-400 border-t border-white/[0.06]">
          Zaten bir hesabınız var mı?{' '}
          <Link to="/giris" className="text-white font-medium hover:underline underline-offset-4">
            Giriş Yapın
          </Link>
        </div>
      </div>
    </div>
  );
}
