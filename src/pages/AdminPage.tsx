import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { User, AdminDashboardData, UserRole, UserPlan, PricingSettings, DEFAULT_PRICING, SpeedSettings, DEFAULT_SPEED_SETTINGS } from '../types';
import {
  Shield,
  Users,
  Crown,
  Activity,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  UserCheck,
  UserX,
  Plus,
  RefreshCw,
  AlertTriangle,
  HardDrive,
  ShieldAlert,
  Radio,
  Zap,
  Tag,
  Save,
  Sparkles,
  Percent,
  TrendingDown,
  Gauge,
  Sliders,
  DownloadCloud,
  Cpu,
  FastForward,
} from 'lucide-react';
import {
  subscribeToAllUsers,
  saveUserToFirestore,
  subscribeToPricingSettings,
  updatePricingSettingsInFirestore,
  subscribeToSpeedSettings,
  updateSpeedSettingsInFirestore,
} from '../firebase/firebase';

export function AdminPage() {
  const { navigate } = useRouter();
  const { user, isAdmin, authFetch, adminSetPremium, adminSetRole, adminDeleteUser } = useAuth();

  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'premium' | 'admin'>('all');

  // Pricing State
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [premiumMonthlyInput, setPremiumMonthlyInput] = useState<number>(DEFAULT_PRICING.premiumMonthly);
  const [premiumDiscountInput, setPremiumDiscountInput] = useState<number>(DEFAULT_PRICING.premiumDiscountPercent);
  const [plusMonthlyInput, setPlusMonthlyInput] = useState<number>(DEFAULT_PRICING.premiumPlusMonthly);
  const [plusDiscountInput, setPlusDiscountInput] = useState<number>(DEFAULT_PRICING.premiumPlusDiscountPercent);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingSavedToast, setPricingSavedToast] = useState(false);

  // Download Speed & Queue State
  const [speedSettings, setSpeedSettings] = useState<SpeedSettings>(DEFAULT_SPEED_SETTINGS);
  const [freeSpeedInput, setFreeSpeedInput] = useState<number>(DEFAULT_SPEED_SETTINGS.freeSpeedLimitKbps);
  const [freeQueueDelayInput, setFreeQueueDelayInput] = useState<number>(DEFAULT_SPEED_SETTINGS.freeQueueDelaySeconds);
  const [premiumSpeedInput, setPremiumSpeedInput] = useState<number>(DEFAULT_SPEED_SETTINGS.premiumSpeedLimitKbps);
  const [premiumFragmentsInput, setPremiumFragmentsInput] = useState<number>(DEFAULT_SPEED_SETTINGS.premiumConcurrentFragments);
  const [plusSpeedInput, setPlusSpeedInput] = useState<number>(DEFAULT_SPEED_SETTINGS.premiumPlusSpeedLimitKbps);
  const [plusFragmentsInput, setPlusFragmentsInput] = useState<number>(DEFAULT_SPEED_SETTINGS.premiumPlusConcurrentFragments);
  const [isSavingSpeed, setIsSavingSpeed] = useState(false);
  const [speedSavedToast, setSpeedSavedToast] = useState(false);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string>('1_month');
  const [customDays, setCustomDays] = useState<number>(30);
  const [actionLoading, setActionLoading] = useState(false);

  // New User Modal State
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const [newUserPlan, setNewUserPlan] = useState<UserPlan>('free');

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || (!isAdmin && user.role !== 'admin'))) {
      navigate('/', true);
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Real-time Firestore user subscription & Pricing subscription
  useEffect(() => {
    if (!isAdmin) return;

    setIsLoading(true);
    const unsubscribeUsers = subscribeToAllUsers(
      (liveUsers) => {
        setUsers(liveUsers);
        setIsLiveConnected(true);
        setIsLoading(false);
      },
      (err) => {
        console.error('Firestore Real-time subscription error:', err);
        setIsLiveConnected(false);
        setIsLoading(false);
      }
    );

    const unsubscribePricing = subscribeToPricingSettings((livePricing) => {
      setPricing(livePricing);
      setPremiumMonthlyInput(livePricing.premiumMonthly);
      setPremiumDiscountInput(livePricing.premiumDiscountPercent);
      setPlusMonthlyInput(livePricing.premiumPlusMonthly);
      setPlusDiscountInput(livePricing.premiumPlusDiscountPercent);
    });

    const unsubscribeSpeed = subscribeToSpeedSettings((liveSpeeds) => {
      setSpeedSettings(liveSpeeds);
      setFreeSpeedInput(liveSpeeds.freeSpeedLimitKbps);
      setFreeQueueDelayInput(liveSpeeds.freeQueueDelaySeconds);
      setPremiumSpeedInput(liveSpeeds.premiumSpeedLimitKbps);
      setPremiumFragmentsInput(liveSpeeds.premiumConcurrentFragments);
      setPlusSpeedInput(liveSpeeds.premiumPlusSpeedLimitKbps);
      setPlusFragmentsInput(liveSpeeds.premiumPlusConcurrentFragments);
    });

    // Also fetch backend stats (FFmpeg, yt-dlp, conversion logs, speeds, pricing)
    const fetchBackendStats = async () => {
      try {
        const res = await authFetch('/api/admin/dashboard');
        if (res.ok) {
          const dData = await res.json();
          if (dData.success) setDashboardData(dData.data);
        }

        const pricingRes = await authFetch('/api/pricing-settings');
        if (pricingRes.ok) {
          const pData = await pricingRes.json();
          if (pData.success && pData.data) {
            setPricing(pData.data);
            setPremiumMonthlyInput(pData.data.premiumMonthly || 69);
            setPremiumDiscountInput(pData.data.premiumDiscountPercent || 30);
            setPlusMonthlyInput(pData.data.premiumPlusMonthly || 119);
            setPlusDiscountInput(pData.data.premiumPlusDiscountPercent || 25);
          }
        }

        const speedRes = await authFetch('/api/admin/speed-settings');
        if (speedRes.ok) {
          const sData = await speedRes.json();
          if (sData.success && sData.data) {
            setSpeedSettings(sData.data);
            setFreeSpeedInput(sData.data.freeSpeedLimitKbps);
            setFreeQueueDelayInput(sData.data.freeQueueDelaySeconds);
            setPremiumSpeedInput(sData.data.premiumSpeedLimitKbps);
            setPremiumFragmentsInput(sData.data.premiumConcurrentFragments);
            setPlusSpeedInput(sData.data.premiumPlusSpeedLimitKbps);
            setPlusFragmentsInput(sData.data.premiumPlusConcurrentFragments);
          }
        }
      } catch (err) {
        console.error('Backend stats error:', err);
      }
    };

    fetchBackendStats();

    return () => {
      unsubscribeUsers();
      unsubscribePricing();
      unsubscribeSpeed();
    };
  }, [isAdmin, authFetch]);

  // Dynamic calculations for yearly pricing with discount
  const calculatedPremiumYearlyPerMonth = Math.round(
    premiumMonthlyInput * (1 - premiumDiscountInput / 100)
  );
  const calculatedPremiumYearlyTotal = calculatedPremiumYearlyPerMonth * 12;

  const calculatedPlusYearlyPerMonth = Math.round(
    plusMonthlyInput * (1 - plusDiscountInput / 100)
  );
  const calculatedPlusYearlyTotal = calculatedPlusYearlyPerMonth * 12;

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPricing(true);
    const pricingPayload = {
      premiumMonthly: Number(premiumMonthlyInput) || 69,
      premiumDiscountPercent: Number(premiumDiscountInput) || 30,
      premiumPlusMonthly: Number(plusMonthlyInput) || 119,
      premiumPlusDiscountPercent: Number(plusDiscountInput) || 25,
    };

    try {
      // 1. Save to Backend Permanent Storage
      const backendPromise = authFetch('/api/admin/pricing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingPayload),
      }).catch((err) => console.warn('Backend pricing save warn:', err));

      // 2. Save to Firebase Firestore
      const firestorePromise = updatePricingSettingsInFirestore(pricingPayload).catch((err) =>
        console.warn('Firestore pricing save warn:', err)
      );

      await Promise.allSettled([backendPromise, firestorePromise]);

      setPricing(pricingPayload);
      setPricingSavedToast(true);
      setTimeout(() => setPricingSavedToast(false), 3500);
    } catch (err: any) {
      console.error('Fiyat kaydetme hatası:', err);
      setPricing(pricingPayload);
      setPricingSavedToast(true);
      setTimeout(() => setPricingSavedToast(false), 3500);
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleSaveSpeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSpeed(true);
    const speedPayload = {
      freeSpeedLimitKbps: Number(freeSpeedInput) || 0,
      freeQueueDelaySeconds: Number(freeQueueDelayInput) || 0,
      premiumSpeedLimitKbps: Number(premiumSpeedInput) || 0,
      premiumConcurrentFragments: Number(premiumFragmentsInput) || 4,
      premiumPlusSpeedLimitKbps: Number(plusSpeedInput) || 0,
      premiumPlusConcurrentFragments: Number(plusFragmentsInput) || 8,
    };

    try {
      // 1. Save to Backend Express Server & yt-dlp config
      const backendPromise = authFetch('/api/admin/speed-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(speedPayload),
      }).catch((err) => console.warn('Backend speed save warn:', err));

      // 2. Save to Firebase Firestore
      const firestorePromise = updateSpeedSettingsInFirestore(speedPayload).catch((err) =>
        console.warn('Firestore speed save warn:', err)
      );

      await Promise.allSettled([backendPromise, firestorePromise]);

      setSpeedSettings(speedPayload);
      setSpeedSavedToast(true);
      setTimeout(() => setSpeedSavedToast(false), 3500);
    } catch (err: any) {
      console.error('Hız ayarları kaydetme hatası:', err);
      setSpeedSettings(speedPayload);
      setSpeedSavedToast(true);
      setTimeout(() => setSpeedSavedToast(false), 3500);
    } finally {
      setIsSavingSpeed(false);
    }
  };

  if (!user || (!isAdmin && user.role !== 'admin')) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Yetkisiz Erişim</h2>
        <p className="text-xs text-slate-400">Bu sayfayı görüntülemek için yönetici yetkisine sahip olmalısınız.</p>
      </div>
    );
  }

  // Handle Premium Extension / Setup in Real-time Firestore
  const handleApplyPremium = async () => {
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      let months: number | undefined;
      let years: number | undefined;
      let days: number | undefined;

      if (selectedDuration === '1_month') months = 1;
      else if (selectedDuration === '3_months') months = 3;
      else if (selectedDuration === '6_months') months = 6;
      else if (selectedDuration === '1_year') years = 1;
      else if (selectedDuration === '2_years') years = 2;
      else if (selectedDuration === 'custom') days = customDays;

      await adminSetPremium(selectedUser.id, {
        plan: 'premium',
        months,
        years,
        days,
      });

      setPremiumModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'İşlem başarısız oldu.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Premium
  const handleCancelPremium = (targetUser: User) => {
    setConfirmModal({
      open: true,
      title: 'Premium Üyeliği İptal Et',
      description: `@${targetUser.username} kullanıcısının Premium üyeliği iptal edilecek ve anında Standart (Free) plana düşürülecektir. Onaylıyor musunuz?`,
      onConfirm: async () => {
        await adminSetPremium(targetUser.id, { cancel: true });
      },
    });
  };

  // Handle Toggle Admin Role
  const handleToggleRole = (targetUser: User) => {
    const newRole: UserRole = targetUser.role === 'admin' ? 'user' : 'admin';
    setConfirmModal({
      open: true,
      title: newRole === 'admin' ? 'Yönetici Yetkisi Ver' : 'Yönetici Yetkisini Kaldır',
      description: `@${targetUser.username} kullanıcısının rolü anında "${newRole.toUpperCase()}" olarak değiştirilecektir. Onaylıyor musunuz?`,
      onConfirm: async () => {
        await adminSetRole(targetUser.id, newRole);
      },
    });
  };

  // Handle Delete User
  const handleDeleteUser = (targetUser: User) => {
    setConfirmModal({
      open: true,
      title: 'Kullanıcıyı Sil',
      description: `@${targetUser.username} (${targetUser.email}) hesabı Firestore'dan kalıcı olarak silinecektir. Bu işlem geri alınamaz!`,
      onConfirm: async () => {
        await adminDeleteUser(targetUser.id);
      },
    });
  };

  // Handle Create User manually into Firestore
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    setActionLoading(true);
    try {
      const generatedId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = Date.now();
      const expiresAt =
        newUserPlan !== 'free' ? now + 30 * 24 * 60 * 60 * 1000 : null;

      await saveUserToFirestore(generatedId, {
        id: generatedId,
        name: newUserName.trim() || newUserEmail.split('@')[0],
        username: newUserEmail.split('@')[0].toLowerCase(),
        email: newUserEmail.trim().toLowerCase(),
        role: newUserRole,
        plan: newUserPlan,
        premiumActive: newUserPlan !== 'free',
        premiumStartedAt: newUserPlan !== 'free' ? now : null,
        premiumExpiresAt: expiresAt,
        createdAt: now,
        updatedAt: now,
      });

      setCreateUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('user');
      setNewUserPlan('free');
    } catch (err: any) {
      alert(err.message || 'Kullanıcı oluşturulamadı.');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate stats dynamically from live users list
  const totalUsersCount = users.length;
  const activePremiumCount = users.filter((u) => u.premiumActive && u.plan !== 'free').length;
  const expiredPremiumCount = users.filter((u) => !u.premiumActive && u.premiumExpiresAt && u.premiumExpiresAt < Date.now()).length;
  const todayUsersCount = users.filter((u) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return u.createdAt >= today.getTime();
  }).length;

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterPlan === 'free') return u.plan === 'free' || !u.premiumActive;
    if (filterPlan === 'premium') return u.plan !== 'free' && u.premiumActive;
    if (filterPlan === 'admin') return u.role === 'admin';
    return true;
  });

  const formatDate = (timestamp?: number | null) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-8 space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">IMGIVO Yönetici Paneli</h1>
              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-bold text-[10px] uppercase">
                ADMIN
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>Canlı Firestore Senkronizasyonu</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Yaptığınız tüm değişiklikler kullanıcılara ve sisteme anlık olarak yansıtılır.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateUserModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kullanıcı Ekle</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0e1017] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Toplam Kullanıcı</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            {totalUsersCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Bugün: <span className="text-emerald-400 font-mono">+{todayUsersCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1017] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Aktif Premium</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">
            {activePremiumCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Süresi Dolan: <span className="text-slate-400 font-mono">{expiredPremiumCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1017] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Toplam İndirme</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            {dashboardData?.conversions.total || 0}
          </div>
          <div className="text-[11px] text-slate-500">
            Bugün: <span className="text-blue-400 font-mono">+{dashboardData?.conversions.today || 0}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1017] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Dönüşüm Başarısı</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
            {dashboardData && dashboardData.conversions.total > 0
              ? `${Math.round(
                  (dashboardData.conversions.successful / dashboardData.conversions.total) * 100
                )}%`
              : '100%'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {dashboardData?.conversions.successful || 0} Başarılı / {dashboardData?.conversions.failed || 0} Hata
          </div>
        </div>
      </div>

      {/* Dynamic Package Pricing Management Card */}
      <div className="rounded-2xl bg-[#0e1017] border border-amber-400/30 p-5 sm:p-6 space-y-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Premium Paket Fiyatlandırma Yönetimi</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  OTOMATİK YILLIK HESAPLAMA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Aylık fiyatı değiştirdiğinizde, yıllık indirimli fiyat ve toplam ücret otomatik olarak hesaplanır ve canlıya yansır.
              </p>
            </div>
          </div>

          {pricingSavedToast && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Fiyatlar Güncellendi ve Yayında!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSavePricing} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Standard Premium Tier Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#07080b] border border-amber-400/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">IMGIVO Premium Paketi</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-300">
                  2K / 4K / 320k HQ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Aylık Fiyat (₺)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₺</span>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={premiumMonthlyInput}
                      onChange={(e) => setPremiumMonthlyInput(Math.max(1, parseInt(e.target.value, 10) || 0))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Yıllık İndirim (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={premiumDiscountInput}
                      onChange={(e) => setPremiumDiscountInput(Math.min(90, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                      className="w-full pl-3 pr-7 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">%</span>
                  </div>
                </div>
              </div>

              {/* Live Calculated Yearly Preview */}
              <div className="p-3 rounded-lg bg-amber-400/[0.06] border border-amber-400/20 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Otomatik Yıllık Aylık Eşdeğeri:</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-400">₺{calculatedPremiumYearlyPerMonth} / ay</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Kullanıcının Ödeyeceği Yıllık Toplam:</span>
                  <span className="font-mono font-semibold text-white">₺{calculatedPremiumYearlyTotal} / yıl</span>
                </div>
              </div>
            </div>

            {/* Premium Plus Tier Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#07080b] border border-purple-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-white">Premium Plus (VIP) Paketi</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300">
                  4K 60FPS / Ultra Turbo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Aylık Fiyat (₺)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₺</span>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={plusMonthlyInput}
                      onChange={(e) => setPlusMonthlyInput(Math.max(1, parseInt(e.target.value, 10) || 0))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Yıllık İndirim (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={plusDiscountInput}
                      onChange={(e) => setPlusDiscountInput(Math.min(90, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                      className="w-full pl-3 pr-7 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-400"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">%</span>
                  </div>
                </div>
              </div>

              {/* Live Calculated Yearly Preview */}
              <div className="p-3 rounded-lg bg-purple-500/[0.06] border border-purple-500/20 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-purple-400" />
                    <span>Otomatik Yıllık Aylık Eşdeğeri:</span>
                  </span>
                  <span className="font-mono font-bold text-purple-300">₺{calculatedPlusYearlyPerMonth} / ay</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Kullanıcının Ödeyeceği Yıllık Toplam:</span>
                  <span className="font-mono font-semibold text-white">₺{calculatedPlusYearlyTotal} / yıl</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Kaydettiğiniz an Premium sayfasındaki tüm fiyatlar ve indirim etiketleri canlı güncellenir.</span>
            </div>

            <button
              type="submit"
              disabled={isSavingPricing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingPricing ? 'Kaydediliyor...' : 'Fiyat Değişikliklerini Canlıya Al'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Dynamic Speed Limits & Queue Management Card */}
      <div className="rounded-2xl bg-[#0e1017] border border-cyan-500/30 p-5 sm:p-6 space-y-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">İndirme Hızları & Kuyruk Yönetimi</h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                  CANLI YT-DLP VE SUNUCU KONTROLÜ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Free kullanıcıların indirme hızını, kuyruk bekleme süresini ve Premium / VIP Turbo hız parametrelerini canlı ayarlayın.
              </p>
            </div>
          </div>

          {speedSavedToast && (
            <div className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Hız Ayarları Başarıyla Güncellendi!</span>
            </div>
          )}
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Hızlı Şablonlar:
          </span>

          <button
            type="button"
            onClick={() => {
              setFreeSpeedInput(0);
              setFreeQueueDelayInput(0);
              setPremiumSpeedInput(0);
              setPremiumFragmentsInput(6);
              setPlusSpeedInput(0);
              setPlusFragmentsInput(12);
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[11px] font-medium text-emerald-300 transition-colors"
          >
            ⚡ Herkese Maksimum Hız (Sınırsız & 0s Kuyruk)
          </button>

          <button
            type="button"
            onClick={() => {
              setFreeSpeedInput(3500);
              setFreeQueueDelayInput(1);
              setPremiumSpeedInput(0);
              setPremiumFragmentsInput(4);
              setPlusSpeedInput(0);
              setPlusFragmentsInput(8);
            }}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-[11px] font-medium text-cyan-300 transition-colors"
          >
            ⚖️ Dengeli Hızlı Mod (Free 3.5 MB/s, 1s Kuyruk - Önerilen)
          </button>

          <button
            type="button"
            onClick={() => {
              setFreeSpeedInput(1500);
              setFreeQueueDelayInput(3);
              setPremiumSpeedInput(0);
              setPremiumFragmentsInput(4);
              setPlusSpeedInput(0);
              setPlusFragmentsInput(10);
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-[11px] font-medium text-amber-300 transition-colors"
          >
            👑 Premium Teşvik Modu (Free 1.5 MB/s, 3s Kuyruk)
          </button>
        </div>

        <form onSubmit={handleSaveSpeed} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Free Tier Speed Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#07080b] border border-slate-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-white">Standart Free (Ücretsiz)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Temel Üyeler
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">Hız Limiti (KB/s)</label>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {freeSpeedInput === 0 ? 'Sınırsız (Tam Hız)' : `${(freeSpeedInput / 1000).toFixed(1)} MB/s`}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      step={250}
                      value={freeSpeedInput}
                      onChange={(e) => setFreeSpeedInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full pl-3 pr-12 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">KB/s</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setFreeSpeedInput(0)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${freeSpeedInput === 0 ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-white/[0.05] text-slate-400 hover:text-white'}`}
                    >
                      Sınırsız (0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFreeSpeedInput(5000)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${freeSpeedInput === 5000 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'bg-white/[0.05] text-slate-400 hover:text-white'}`}
                    >
                      5 MB/s
                    </button>
                    <button
                      type="button"
                      onClick={() => setFreeSpeedInput(3500)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${freeSpeedInput === 3500 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'bg-white/[0.05] text-slate-400 hover:text-white'}`}
                    >
                      3.5 MB/s
                    </button>
                    <button
                      type="button"
                      onClick={() => setFreeSpeedInput(2000)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${freeSpeedInput === 2000 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'bg-white/[0.05] text-slate-400 hover:text-white'}`}
                    >
                      2 MB/s
                    </button>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">Kuyruk Bekleme Süresi</label>
                    <span className="text-[10px] text-amber-300 font-mono">
                      {freeQueueDelayInput === 0 ? '0 sn (Anında)' : `${freeQueueDelayInput} saniye`}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={freeQueueDelayInput}
                      onChange={(e) => setFreeQueueDelayInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full pl-3 pr-14 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">Saniye</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    0 saniye yaparsanız free kullanıcılar hiç beklemeden anında indirmeye başlar.
                  </p>
                </div>
              </div>
            </div>

            {/* Standard Premium Tier Speed Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#07080b] border border-amber-400/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">IMGIVO Premium</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-300">
                  VIP Hızlı Hat
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">Hız Limiti (KB/s)</label>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {premiumSpeedInput === 0 ? 'Sınırsız (Maksimum)' : `${(premiumSpeedInput / 1000).toFixed(1)} MB/s`}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      step={500}
                      value={premiumSpeedInput}
                      onChange={(e) => setPremiumSpeedInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full pl-3 pr-12 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">KB/s</span>
                  </div>
                  <p className="text-[10px] text-slate-500">0 bırakırsanız bant genişliği sınırı konmaz.</p>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">Eşzamanlı Parça (Fragments)</label>
                    <span className="text-[10px] text-amber-300 font-mono">{premiumFragmentsInput}x Paralel</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={premiumFragmentsInput}
                      onChange={(e) => setPremiumFragmentsInput(Math.max(1, Math.min(16, parseInt(e.target.value, 10) || 1)))}
                      className="w-full pl-3 pr-12 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">Parça</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Aynı anda çoklu bağlantı açarak videoyu parçalar halinde çok daha hızlı çeker.
                  </p>
                </div>
              </div>
            </div>

            {/* Premium Plus (VIP) Speed Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#07080b] border border-purple-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-white">Premium Plus (VIP)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300">
                  Ultra Turbo 4K
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">Hız Limiti (KB/s)</label>
                    <span className="text-[10px] text-purple-300 font-mono">
                      {plusSpeedInput === 0 ? 'Sınırsız Ultra Turbo' : `${(plusSpeedInput / 1000).toFixed(1)} MB/s`}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      step={500}
                      value={plusSpeedInput}
                      onChange={(e) => setPlusSpeedInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full pl-3 pr-12 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">KB/s</span>
                  </div>
                  <p className="text-[10px] text-slate-500">0 = Maksimum donanımsal bant genişliği.</p>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">Eşzamanlı Parça (Fragments)</label>
                    <span className="text-[10px] text-purple-300 font-mono">{plusFragmentsInput}x Ultra Turbo</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={32}
                      value={plusFragmentsInput}
                      onChange={(e) => setPlusFragmentsInput(Math.max(1, Math.min(32, parseInt(e.target.value, 10) || 1)))}
                      className="w-full pl-3 pr-12 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">Parça</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Özellikle 4K ve 2K videoları ışık hızında indirmek için çoklu akış kanalı açar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <FastForward className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ayarları kaydettiğiniz an tüm yeni indirmelerde bu hız ve kuyruk parametreleri doğrudan devreye girer.</span>
            </div>

            <button
              type="submit"
              disabled={isSavingSpeed}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-bold text-xs transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSpeed ? 'Kaydediliyor...' : 'Hız Ayarlarını Canlıya Al'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* User Management Section */}
      <div className="rounded-2xl bg-[#0e1017] border border-white/[0.08] p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Kayıtlı Kullanıcılar (Canlı)</h2>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Anlık Senkronize
              </span>
            </div>
            <p className="text-xs text-slate-400">Üyelik sürelerini yönetin, yetki atayın veya anında düzenleyin.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="İsim, kullanıcı adı veya e-posta..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs">
              <button
                type="button"
                onClick={() => setFilterPlan('all')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterPlan === 'all' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setFilterPlan('premium')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterPlan === 'premium' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Premium
              </button>
              <button
                type="button"
                onClick={() => setFilterPlan('admin')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterPlan === 'admin' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-xs text-left">
            <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400 font-medium">
              <tr>
                <th className="p-3">Kullanıcı</th>
                <th className="p-3">E-Posta</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Premium Süresi</th>
                <th className="p-3">Kayıt Tarihi</th>
                <th className="p-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {isLoading ? 'Firestore verileri yükleniyor...' : 'Kullanıcı bulunamadı.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* User */}
                    <td className="p-3">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">@{u.username}</div>
                    </td>

                    {/* Email */}
                    <td className="p-3 font-mono text-slate-400">{u.email}</td>

                    {/* Role */}
                    <td className="p-3">
                      {u.role === 'admin' ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-[10px]">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 text-[10px]">
                          USER
                        </span>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="p-3">
                      {u.plan === 'premium_plus' ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold text-[10px]">
                          PREMIUM PLUS
                        </span>
                      ) : u.plan === 'premium' && u.premiumActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 font-semibold text-[10px]">
                          PREMIUM
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 text-[10px]">
                          FREE
                        </span>
                      )}
                    </td>

                    {/* Premium Duration */}
                    <td className="p-3">
                      {u.premiumActive && u.premiumExpiresAt ? (
                        <div>
                          <div className="font-mono text-amber-300 text-[11px] font-semibold">
                            {u.remainingFormatted}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Bitiş: {formatDate(u.premiumExpiresAt)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="p-3 text-slate-400">{formatDate(u.createdAt)}</td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Add / Extend Premium button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setPremiumModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Premium Süresi Ekle / Uzat"
                        >
                          <Crown className="w-3 h-3" />
                          <span>Süre Tanımla</span>
                        </button>

                        {/* Cancel Premium button */}
                        {u.premiumActive && (
                          <button
                            type="button"
                            onClick={() => handleCancelPremium(u)}
                            className="p-1 rounded bg-white/[0.04] hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Premium İptal Et"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Toggle Admin role */}
                        {u.username !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleRole(u)}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              u.role === 'admin'
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                : 'bg-white/[0.04] text-slate-400 hover:text-white'
                            }`}
                            title={u.role === 'admin' ? 'Admin Yetkisini Al' : 'Admin Yap'}
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete User */}
                        {u.username !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 rounded bg-white/[0.04] hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Kullanıcıyı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New User Modal */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#0e1017] border border-white/[0.1] p-6 text-left space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/[0.06] text-white">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Yeni Kullanıcı Ekle</h3>
                <p className="text-xs text-slate-400">Doğrudan Firestore veritabanına kullanıcı kaydı ekleyin.</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Ad Soyad</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">E-Posta</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="kullanici@mail.com"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Rol</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200 cursor-pointer"
                  >
                    <option value="user">Standart (User)</option>
                    <option value="admin">Yönetici (Admin)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Başlangıç Planı</label>
                  <select
                    value={newUserPlan}
                    onChange={(e) => setNewUserPlan(e.target.value as UserPlan)}
                    className="w-full px-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200 cursor-pointer"
                  >
                    <option value="free">Free (Standart)</option>
                    <option value="premium">Premium (+1 Ay)</option>
                    <option value="premium_plus">Premium Plus (+1 Ay)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setCreateUserModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {actionLoading ? 'Ekleniyor...' : 'Kullanıcıyı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Duration Setup Modal */}
      {premiumModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#0e1017] border border-amber-400/30 p-6 text-left space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Premium Süre Tanımlama</h3>
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-200">@{selectedUser.username}</strong> kullanıcısına anında süre ekleyin
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-medium text-slate-300">Eklenecek Süre Seçin:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedDuration('1_month')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                    selectedDuration === '1_month'
                      ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                      : 'bg-[#07080b] border-white/[0.08] text-slate-300 hover:border-white/20'
                  }`}
                >
                  +1 Ay Premium
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDuration('3_months')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                    selectedDuration === '3_months'
                      ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                      : 'bg-[#07080b] border-white/[0.08] text-slate-300 hover:border-white/20'
                  }`}
                >
                  +3 Ay Premium
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDuration('6_months')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                    selectedDuration === '6_months'
                      ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                      : 'bg-[#07080b] border-white/[0.08] text-slate-300 hover:border-white/20'
                  }`}
                >
                  +6 Ay Premium
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDuration('1_year')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                    selectedDuration === '1_year'
                      ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                      : 'bg-[#07080b] border-white/[0.08] text-slate-300 hover:border-white/20'
                  }`}
                >
                  +1 Yıl (365 Gün)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDuration('2_years')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                    selectedDuration === '2_years'
                      ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                      : 'bg-[#07080b] border-white/[0.08] text-slate-300 hover:border-white/20'
                  }`}
                >
                  +2 Yıl Premium
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDuration('custom')}
                  className={`p-2.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                    selectedDuration === 'custom'
                      ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                      : 'bg-[#07080b] border-white/[0.08] text-slate-300 hover:border-white/20'
                  }`}
                >
                  Özel Gün Sayısı
                </button>
              </div>

              {selectedDuration === 'custom' && (
                <div className="pt-2">
                  <label className="text-xs text-slate-400">Eklenecek Gün Sayısı:</label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={customDays}
                    onChange={(e) => setCustomDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setPremiumModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApplyPremium}
                className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {actionLoading ? 'Uygulanıyor...' : 'Süreyi Anında Tanımla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl bg-[#0e1017] border border-white/[0.1] p-6 text-left space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>{confirmModal.title}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.description}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={async () => {
                  await confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-500 cursor-pointer"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
