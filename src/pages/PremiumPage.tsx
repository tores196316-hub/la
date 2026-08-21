import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { PricingSettings, DEFAULT_PRICING } from '../types';
import {
  Crown,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Sliders,
  Film,
  Music,
  ArrowRight,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { saveUserToFirestore, subscribeToPricingSettings } from '../firebase/firebase';

export function PremiumPage() {
  const { navigate } = useRouter();
  const { user, isPremium, refreshUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'premium_plus'>('premium');
  const [isActivating, setIsActivating] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  // Dynamic Live Pricing from Firestore & Backend API
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);

  useEffect(() => {
    // Initial fetch from backend
    fetch('/api/pricing-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPricing(data.data);
        }
      })
      .catch(() => {});

    // Real-time Firestore sync
    const unsubscribe = subscribeToPricingSettings((livePricing) => {
      setPricing(livePricing);
    });
    return () => unsubscribe();
  }, []);

  // Calculate pricing values
  const premiumMonthly = pricing.premiumMonthly;
  const premiumDiscount = pricing.premiumDiscountPercent;
  const premiumYearlyPerMonth = Math.round(premiumMonthly * (1 - premiumDiscount / 100));

  const plusMonthly = pricing.premiumPlusMonthly;
  const plusDiscount = pricing.premiumPlusDiscountPercent;
  const plusYearlyPerMonth = Math.round(plusMonthly * (1 - plusDiscount / 100));

  const handleOpenDemoModal = (plan: 'premium' | 'premium_plus') => {
    if (!user) {
      navigate('/giris');
      return;
    }
    setSelectedPlan(plan);
    setDemoModalOpen(true);
    setDemoSuccess(false);
  };

  const handleSimulateUpgrade = async () => {
    if (!user) return;
    setIsActivating(true);

    try {
      const now = Date.now();
      const addedMs =
        billingCycle === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      const baseTime =
        user.premiumExpiresAt && user.premiumExpiresAt > now ? user.premiumExpiresAt : now;
      const newExpiry = baseTime + addedMs;

      // Update in Firestore
      await saveUserToFirestore(user.id, {
        plan: selectedPlan,
        premiumActive: true,
        premiumStartedAt: user.premiumStartedAt || now,
        premiumExpiresAt: newExpiry,
        email: user.email,
      });

      // Also trigger backend proxy if available
      fetch(`/api/admin/users/${user.id}/premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('imgivo_auth_token_v2') || ''}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          months: billingCycle === 'yearly' ? 12 : 1,
        }),
      }).catch(() => {});

      setDemoSuccess(true);
      setTimeout(() => {
        setDemoModalOpen(false);
        navigate('/profil');
      }, 1500);
    } catch {
      setDemoSuccess(true);
      setTimeout(() => {
        setDemoModalOpen(false);
        navigate('/profil');
      }, 1500);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 sm:py-12 space-y-12 text-center">
      {/* Hero Header */}
      <div className="space-y-4 max-w-2xl mx-auto px-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold">
          <Crown className="w-3.5 h-3.5" />
          <span>IMGIVO PREMIUM PLANLARI</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          2K ve 4K Ultra HD Kalitesinde Sınırsız İndirin
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          YouTube videolarını en yüksek çözünürlükte (1440p QHD & 2160p 4K) ve kristal netliğinde 320 kbps ses formatında indirin.
        </p>

        {/* Billing toggle */}
        <div className="pt-2 inline-flex items-center p-1 rounded-xl bg-[#0e1017] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white text-black font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Aylık Ödeme
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              billingCycle === 'yearly'
                ? 'bg-white text-black font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Yıllık Plan</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              %{premiumDiscount} Tasarruf
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 text-left">
        {/* FREE PLAN */}
        <div className="rounded-2xl bg-[#0e1017] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between space-y-6 hover:border-white/20 transition-all">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Standart Free</h3>
              <p className="text-xs text-slate-400">Temel indirme ve dönüştürme ihtiyaçları için.</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white font-mono">₺0</span>
              <span className="text-xs text-slate-500">/süresiz</span>
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
              <div className="text-xs font-semibold text-slate-300">Dahil Olan Özellikler:</div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>1080p Full HD'ye kadar video</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>128k - 192k standart MP3 ses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>Standart dönüştürme sırası</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>Temel indirme geçmişi</span>
                </li>
              </ul>
            </div>
          </div>

          <Link
            to="/"
            className="w-full py-2.5 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold transition-colors text-center block cursor-pointer"
          >
            Ücretsiz Kullan
          </Link>
        </div>

        {/* PREMIUM (FEATURED) */}
        <div className="rounded-2xl bg-gradient-to-b from-[#161a26] to-[#0e1017] border-2 border-amber-400/40 p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-2xl relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold uppercase tracking-wider shadow-md">
            EN POPÜLER
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">IMGIVO Premium</h3>
              </div>
              <p className="text-xs text-slate-400">Maksimum kalite ve hız isteyen içerik severler için.</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white font-mono">
                {billingCycle === 'yearly' ? `₺${premiumYearlyPerMonth}` : `₺${premiumMonthly}`}
              </span>
              <span className="text-xs text-slate-400">/ay</span>
              {billingCycle === 'yearly' && (
                <span className="ml-2 text-[10px] text-amber-300 font-medium">
                  Yıllık faturalandırılır (₺{premiumYearlyPerMonth * 12}/yıl)
                </span>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
              <div className="text-xs font-semibold text-amber-300">Tüm Free Özellikleri ve:</div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <strong className="text-white font-semibold">2K QHD (1440p)</strong> video desteği
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <strong className="text-white font-semibold">4K Ultra HD (2160p)</strong> desteği
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <strong className="text-white font-semibold">320 kbps Yüksek Kalite Ses</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Öncelikli dönüştürme kuyruğu</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Sınırsız bulut indirme geçmişi</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Özel Premium profil rozeti</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenDemoModal('premium')}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Crown className="w-4 h-4" />
            <span>{isPremium ? 'Mevcut Paketiniz' : 'Premium Satın Al'}</span>
          </button>
        </div>

        {/* PREMIUM PLUS */}
        <div className="rounded-2xl bg-[#0e1017] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between space-y-6 hover:border-white/20 transition-all">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">Premium Plus</h3>
              </div>
              <p className="text-xs text-slate-400">Arşivciler ve profesyonel editörler için en üst seviye.</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white font-mono">
                {billingCycle === 'yearly' ? `₺${plusYearlyPerMonth}` : `₺${plusMonthly}`}
              </span>
              <span className="text-xs text-slate-400">/ay</span>
              {billingCycle === 'yearly' && (
                <span className="ml-2 text-[10px] text-purple-300 font-medium">
                  Yıllık faturalandırılır (₺{plusYearlyPerMonth * 12}/yıl)
                </span>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
              <div className="text-xs font-semibold text-purple-300">Tüm Premium Özellikleri ve:</div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>En Yüksek VIP İşlem Önceliği</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>4K 60 FPS ve HDR Desteği</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Özel VIP Altın Rozet</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>7/24 Öncelikli Teknik Destek</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenDemoModal('premium_plus')}
            className="w-full py-2.5 px-4 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Plus Paketine Geç
          </button>
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="px-4 max-w-4xl mx-auto space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white text-left">Özellik Karşılaştırma Tablosu</h2>
        <div className="rounded-xl bg-[#0e1017] border border-white/[0.08] overflow-x-auto text-left text-xs">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                <th className="p-3.5 font-semibold text-slate-300">Özellik</th>
                <th className="p-3.5 font-semibold text-slate-400 text-center">Free</th>
                <th className="p-3.5 font-semibold text-amber-300 text-center bg-amber-400/[0.03]">Premium</th>
                <th className="p-3.5 font-semibold text-purple-300 text-center">Premium Plus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              <tr>
                <td className="p-3.5 font-medium">Maksimum Video Çözünürlüğü</td>
                <td className="p-3.5 text-center text-slate-400">1080p (Full HD)</td>
                <td className="p-3.5 text-center text-amber-300 font-semibold bg-amber-400/[0.03]">4K (2160p) & 2K</td>
                <td className="p-3.5 text-center text-purple-300 font-semibold">4K HDR & 60 FPS</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium">Maksimum Ses Bitrate</td>
                <td className="p-3.5 text-center text-slate-400">192 kbps</td>
                <td className="p-3.5 text-center text-emerald-400 font-semibold bg-amber-400/[0.03]">320 kbps (HQ)</td>
                <td className="p-3.5 text-center text-emerald-400 font-semibold">320 kbps (HQ)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium">İşlem Sırası & Hız</td>
                <td className="p-3.5 text-center text-slate-400">Standart</td>
                <td className="p-3.5 text-center text-amber-300 bg-amber-400/[0.03]">Öncelikli Hızlı</td>
                <td className="p-3.5 text-center text-purple-300 font-semibold">VIP Ultra Öncelikli</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium">Geçmiş Depolama</td>
                <td className="p-3.5 text-center text-slate-400">20 Kayıt</td>
                <td className="p-3.5 text-center text-emerald-400 bg-amber-400/[0.03]">Sınırsız Bulut</td>
                <td className="p-3.5 text-center text-emerald-400">Sınırsız Bulut</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Demo Activation Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#0e1017] border border-amber-400/30 p-6 sm:p-7 text-left space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedPlan === 'premium_plus' ? 'Premium Plus' : 'IMGIVO Premium'} Paketi
                </h3>
                <p className="text-xs text-slate-400">
                  {billingCycle === 'yearly' ? '1 Yıllık Üyelik' : '1 Aylık Üyelik'}
                </p>
              </div>
            </div>

            {demoSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 shrink-0" />
                <div>
                  <div className="font-bold text-sm">Üyeliğiniz Başarıyla Tanımlandı!</div>
                  <p className="text-slate-300">Profilinize yönlendiriliyorsunuz...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bu sürümde demo amaçlı simülasyon aktiftir. Butona tıkladığınızda hesabınıza anında{' '}
                  <strong className="text-white font-semibold">{billingCycle === 'yearly' ? '1 Yıl' : '1 Ay'}</strong>{' '}
                  Premium süresi tanımlanır ve 2K/4K indirme kilidi açılır.
                </p>

                <div className="p-3 rounded-lg bg-black/30 border border-white/[0.06] text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Hesap:</span>
                    <span className="text-slate-200 font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Seçilen Paket:</span>
                    <span className="text-amber-300 font-semibold uppercase">{selectedPlan}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDemoModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    disabled={isActivating}
                    onClick={handleSimulateUpgrade}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs transition-colors cursor-pointer"
                  >
                    {isActivating ? 'Tanımlanıyor...' : 'Demo Üyeliği Başlat'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
