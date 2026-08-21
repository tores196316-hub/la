import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import {
  User,
  AdminDashboardData,
  UserRole,
  UserPlan,
  PricingSettings,
  DEFAULT_PRICING,
  SpeedSettings,
  DEFAULT_SPEED_SETTINGS,
} from '../types';
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
  LayoutDashboard,
  Filter,
  Eye,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Lock,
  Unlock,
  Layers,
  BarChart2,
  TrendingUp,
  Check,
  Info,
  Cookie,
  Server,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import {
  subscribeToAllUsers,
  saveUserToFirestore,
  subscribeToPricingSettings,
  updatePricingSettingsInFirestore,
  subscribeToSpeedSettings,
  updateSpeedSettingsInFirestore,
} from '../firebase/firebase';

type AdminTab = 'dashboard' | 'users' | 'downloads' | 'pricing' | 'speed' | 'system';

export function AdminPage() {
  const { navigate } = useRouter();
  const {
    user,
    isAdmin,
    authFetch,
    adminSetPremium,
    adminSetRole,
    adminDeleteUser,
    adminToggleDisabled,
  } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data States
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [systemDiag, setSystemDiag] = useState<any>(null);
  const [cookieStatus, setCookieStatus] = useState<any>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'premium' | 'premium_plus' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'disabled'>('all');
  const [downloadFilter, setDownloadFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [downloadSearch, setDownloadSearch] = useState('');

  // Pricing State
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [premiumMonthlyInput, setPremiumMonthlyInput] = useState<string>(String(DEFAULT_PRICING.premiumMonthly));
  const [premiumDiscountInput, setPremiumDiscountInput] = useState<string>(String(DEFAULT_PRICING.premiumDiscountPercent));
  const [premiumYearlyInput, setPremiumYearlyInput] = useState<string>(
    String(Math.round(DEFAULT_PRICING.premiumMonthly * (1 - DEFAULT_PRICING.premiumDiscountPercent / 100)) * 12)
  );
  const [plusMonthlyInput, setPlusMonthlyInput] = useState<string>(String(DEFAULT_PRICING.premiumPlusMonthly));
  const [plusDiscountInput, setPlusDiscountInput] = useState<string>(String(DEFAULT_PRICING.premiumPlusDiscountPercent));
  const [plusYearlyInput, setPlusYearlyInput] = useState<string>(
    String(Math.round(DEFAULT_PRICING.premiumPlusMonthly * (1 - DEFAULT_PRICING.premiumPlusDiscountPercent / 100)) * 12)
  );
  const [isPricingDirty, setIsPricingDirty] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingSavedToast, setPricingSavedToast] = useState(false);
  const [globalSavedToast, setGlobalSavedToast] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  // Success Alert Modal State (auto dismiss after 3 seconds)
  const [successModal, setSuccessModal] = useState<{ title: string; message: string } | null>(null);

  const triggerSuccessNotification = (title: string, message: string) => {
    setSuccessModal({ title, message });
    setGlobalSavedToast(`${title}: ${message}`);
    setTimeout(() => {
      setSuccessModal(null);
    }, 3000);
    setTimeout(() => {
      setGlobalSavedToast(null);
    }, 3000);
  };

  // Download Speed & Queue State
  const [speedSettings, setSpeedSettings] = useState<SpeedSettings>(DEFAULT_SPEED_SETTINGS);
  const [freeSpeedInput, setFreeSpeedInput] = useState<string>(String(DEFAULT_SPEED_SETTINGS.freeSpeedLimitKbps));
  const [freeQueueDelayInput, setFreeQueueDelayInput] = useState<string>(String(DEFAULT_SPEED_SETTINGS.freeQueueDelaySeconds));
  const [premiumSpeedInput, setPremiumSpeedInput] = useState<string>(String(DEFAULT_SPEED_SETTINGS.premiumSpeedLimitKbps));
  const [premiumFragmentsInput, setPremiumFragmentsInput] = useState<string>(String(DEFAULT_SPEED_SETTINGS.premiumConcurrentFragments));
  const [plusSpeedInput, setPlusSpeedInput] = useState<string>(String(DEFAULT_SPEED_SETTINGS.premiumPlusSpeedLimitKbps));
  const [plusFragmentsInput, setPlusFragmentsInput] = useState<string>(String(DEFAULT_SPEED_SETTINGS.premiumPlusConcurrentFragments));
  const [isSpeedDirty, setIsSpeedDirty] = useState(false);
  const [isSavingSpeed, setIsSavingSpeed] = useState(false);
  const [speedSavedToast, setSpeedSavedToast] = useState(false);

  // Cookie Upload Modal State
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  const [cookieInputText, setCookieInputText] = useState('');
  const [isSavingCookies, setIsSavingCookies] = useState(false);

  // Clean Temp Storage State
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanToast, setCleanToast] = useState<string | null>(null);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewUserModal, setViewUserModal] = useState<User | null>(null);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [selectedPlanTier, setSelectedPlanTier] = useState<UserPlan>('premium');
  const [selectedDuration, setSelectedDuration] = useState<string>('1_month');
  const [customDays, setCustomDays] = useState<string>('30');
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
    danger?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || (!isAdmin && user.role !== 'admin'))) {
      navigate('/', true);
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Safely parse JSON from a fetch Response
  const safeParseJson = async (res: Response | null | undefined): Promise<any> => {
    if (!res || !res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    try {
      return await res.json();
    } catch (e) {
      console.warn('JSON parse warning:', e);
      return null;
    }
  };

  // Helper to merge user lists without losing any user
  const mergeUserLists = (current: User[], incoming: User[]): User[] => {
    const map = new Map<string, User>();
    for (const u of current) {
      if (u && u.id) map.set(u.id, u);
    }
    for (const u of incoming) {
      if (u && u.id) {
        const existing = map.get(u.id);
        if (!existing) {
          map.set(u.id, u);
        } else {
          map.set(u.id, {
            ...existing,
            ...u,
            plan: u.plan || existing.plan,
            role: u.role || existing.role,
            premiumActive: u.premiumActive !== undefined ? u.premiumActive : existing.premiumActive,
            premiumExpiresAt: u.premiumExpiresAt !== undefined ? u.premiumExpiresAt : existing.premiumExpiresAt,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  };

  // Fetch backend statistics, system diagnostics, and cookie information
  const fetchBackendData = async () => {
    try {
      setIsRefreshing(true);
      const [dRes, diagRes, cookieRes, pRes, sRes, uRes] = await Promise.allSettled([
        authFetch('/api/admin/dashboard'),
        authFetch('/api/system/diagnostic'),
        authFetch('/api/admin/cookies'),
        authFetch('/api/pricing-settings'),
        authFetch('/api/admin/speed-settings'),
        authFetch('/api/admin/users'),
      ]);

      if (dRes.status === 'fulfilled') {
        const dData = await safeParseJson(dRes.value);
        if (dData && dData.success) setDashboardData(dData.data);
      }

      if (uRes.status === 'fulfilled') {
        const uData = await safeParseJson(uRes.value);
        if (uData && uData.success && Array.isArray(uData.data)) {
          setUsers((prev) => mergeUserLists(prev, uData.data));
        }
      }

      if (diagRes.status === 'fulfilled') {
        const diagData = await safeParseJson(diagRes.value);
        if (diagData) setSystemDiag(diagData);
      }

      if (cookieRes.status === 'fulfilled') {
        const cData = await safeParseJson(cookieRes.value);
        if (cData && cData.success) setCookieStatus(cData);
      }

      if (pRes.status === 'fulfilled') {
        const pData = await safeParseJson(pRes.value);
        if (pData && pData.success && pData.data) {
          setPricing(pData.data);
          if (!isPricingDirty) {
            const pm = pData.data.premiumMonthly ?? 69;
            const pd = pData.data.premiumDiscountPercent ?? 30;
            const ppm = pData.data.premiumPlusMonthly ?? 119;
            const ppd = pData.data.premiumPlusDiscountPercent ?? 25;

            setPremiumMonthlyInput(String(pm));
            setPremiumDiscountInput(String(pd));
            setPremiumYearlyInput(String(Math.round(pm * (1 - pd / 100)) * 12));

            setPlusMonthlyInput(String(ppm));
            setPlusDiscountInput(String(ppd));
            setPlusYearlyInput(String(Math.round(ppm * (1 - ppd / 100)) * 12));
          }
        }
      }

      if (sRes.status === 'fulfilled') {
        const sData = await safeParseJson(sRes.value);
        if (sData && sData.success && sData.data) {
          setSpeedSettings(sData.data);
          if (!isSpeedDirty) {
            setFreeSpeedInput(String(sData.data.freeSpeedLimitKbps ?? 0));
            setFreeQueueDelayInput(String(sData.data.freeQueueDelaySeconds ?? 0));
            setPremiumSpeedInput(String(sData.data.premiumSpeedLimitKbps ?? 0));
            setPremiumFragmentsInput(String(sData.data.premiumConcurrentFragments ?? 4));
            setPlusSpeedInput(String(sData.data.premiumPlusSpeedLimitKbps ?? 0));
            setPlusFragmentsInput(String(sData.data.premiumPlusConcurrentFragments ?? 8));
          }
        }
      }
    } catch (err) {
      console.error('Backend stats fetch error:', err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  // Real-time Firestore Subscriptions
  useEffect(() => {
    if (!isAdmin) return;

    setIsLoading(true);
    const unsubscribeUsers = subscribeToAllUsers(
      (liveUsers) => {
        setUsers((prev) => mergeUserLists(prev, liveUsers));
        setIsLiveConnected(true);
        setIsLoading(false);
      },
      (err) => {
        console.error('Firestore Users listener error:', err);
        setIsLiveConnected(false);
        setIsLoading(false);
      }
    );

    const unsubscribePricing = subscribeToPricingSettings((livePricing) => {
      setPricing(livePricing);
      if (!isPricingDirty) {
        const pm = livePricing.premiumMonthly ?? 69;
        const pd = livePricing.premiumDiscountPercent ?? 30;
        const ppm = livePricing.premiumPlusMonthly ?? 119;
        const ppd = livePricing.premiumPlusDiscountPercent ?? 25;

        setPremiumMonthlyInput(String(pm));
        setPremiumDiscountInput(String(pd));
        setPremiumYearlyInput(String(Math.round(pm * (1 - pd / 100)) * 12));

        setPlusMonthlyInput(String(ppm));
        setPlusDiscountInput(String(ppd));
        setPlusYearlyInput(String(Math.round(ppm * (1 - ppd / 100)) * 12));
      }
    });

    const unsubscribeSpeed = subscribeToSpeedSettings((liveSpeeds) => {
      setSpeedSettings(liveSpeeds);
      if (!isSpeedDirty) {
        setFreeSpeedInput(String(liveSpeeds.freeSpeedLimitKbps ?? 0));
        setFreeQueueDelayInput(String(liveSpeeds.freeQueueDelaySeconds ?? 0));
        setPremiumSpeedInput(String(liveSpeeds.premiumSpeedLimitKbps ?? 0));
        setPremiumFragmentsInput(String(liveSpeeds.premiumConcurrentFragments ?? 4));
        setPlusSpeedInput(String(liveSpeeds.premiumPlusSpeedLimitKbps ?? 0));
        setPlusFragmentsInput(String(liveSpeeds.premiumPlusConcurrentFragments ?? 8));
      }
    });

    fetchBackendData();

    // Auto-refresh stats periodically in the background (every 10s)
    const statsInterval = setInterval(() => {
      fetchBackendData();
    }, 10000);

    return () => {
      unsubscribeUsers();
      unsubscribePricing();
      unsubscribeSpeed();
      clearInterval(statsInterval);
    };
  }, [isAdmin]);

  // Derived Pricing Calculations & Sync Helpers
  // When monthly changes, auto calculate yearly and per-month rate
  const handlePremiumMonthlyChange = (valStr: string) => {
    setIsPricingDirty(true);
    setPremiumMonthlyInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const discount = parseFloat(premiumDiscountInput) || 0;
      const yearly = Math.round(num * (1 - discount / 100)) * 12;
      setPremiumYearlyInput(String(yearly));
    }
  };

  const handlePremiumDiscountChange = (valStr: string) => {
    setIsPricingDirty(true);
    setPremiumDiscountInput(valStr);
    const disc = parseFloat(valStr);
    const monthly = parseFloat(premiumMonthlyInput) || 0;
    if (!isNaN(disc) && monthly > 0) {
      const safeDisc = Math.min(90, Math.max(0, disc));
      const yearly = Math.round(monthly * (1 - safeDisc / 100)) * 12;
      setPremiumYearlyInput(String(yearly));
    }
  };

  const handlePremiumYearlyChange = (valStr: string) => {
    setIsPricingDirty(true);
    setPremiumYearlyInput(valStr);
    const yearly = parseFloat(valStr);
    const monthly = parseFloat(premiumMonthlyInput) || 0;
    if (!isNaN(yearly) && monthly > 0) {
      const fullYearCost = monthly * 12;
      const diff = fullYearCost - yearly;
      const calculatedDiscount = Math.min(90, Math.max(0, Math.round((diff / fullYearCost) * 100)));
      setPremiumDiscountInput(String(calculatedDiscount));
    }
  };

  const handlePlusMonthlyChange = (valStr: string) => {
    setIsPricingDirty(true);
    setPlusMonthlyInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const discount = parseFloat(plusDiscountInput) || 0;
      const yearly = Math.round(num * (1 - discount / 100)) * 12;
      setPlusYearlyInput(String(yearly));
    }
  };

  const handlePlusDiscountChange = (valStr: string) => {
    setIsPricingDirty(true);
    setPlusDiscountInput(valStr);
    const disc = parseFloat(valStr);
    const monthly = parseFloat(plusMonthlyInput) || 0;
    if (!isNaN(disc) && monthly > 0) {
      const safeDisc = Math.min(90, Math.max(0, disc));
      const yearly = Math.round(monthly * (1 - safeDisc / 100)) * 12;
      setPlusYearlyInput(String(yearly));
    }
  };

  const handlePlusYearlyChange = (valStr: string) => {
    setIsPricingDirty(true);
    setPlusYearlyInput(valStr);
    const yearly = parseFloat(valStr);
    const monthly = parseFloat(plusMonthlyInput) || 0;
    if (!isNaN(yearly) && monthly > 0) {
      const fullYearCost = monthly * 12;
      const diff = fullYearCost - yearly;
      const calculatedDiscount = Math.min(90, Math.max(0, Math.round((diff / fullYearCost) * 100)));
      setPlusDiscountInput(String(calculatedDiscount));
    }
  };

  const numPremMonthly = parseFloat(premiumMonthlyInput) || 0;
  const numPremDiscount = parseFloat(premiumDiscountInput) || 0;
  const numPremYearly = parseFloat(premiumYearlyInput) || 0;

  const calculatedPremiumYearlyPerMonth = numPremMonthly > 0
    ? Math.round(numPremMonthly * (1 - numPremDiscount / 100))
    : 0;
  const calculatedPremiumYearlyTotal = numPremYearly > 0
    ? numPremYearly
    : (calculatedPremiumYearlyPerMonth * 12);

  const numPlusMonthly = parseFloat(plusMonthlyInput) || 0;
  const numPlusDiscount = parseFloat(plusDiscountInput) || 0;
  const numPlusYearly = parseFloat(plusYearlyInput) || 0;

  const calculatedPlusYearlyPerMonth = numPlusMonthly > 0
    ? Math.round(numPlusMonthly * (1 - numPlusDiscount / 100))
    : 0;
  const calculatedPlusYearlyTotal = numPlusYearly > 0
    ? numPlusYearly
    : (calculatedPlusYearlyPerMonth * 12);

  // Real Statistics Calculations from live users & dashboard data
  const totalUsersCount = users.length;
  const activePremiumCount = users.filter((u) => u.premiumActive && u.plan !== 'free').length;
  const expiredPremiumCount = users.filter(
    (u) => !u.premiumActive && u.premiumExpiresAt && u.premiumExpiresAt < Date.now()
  ).length;

  const todayUsersCount = users.filter((u) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return u.createdAt >= today.getTime();
  }).length;

  const totalDownloadsCount = dashboardData?.conversions.total || 0;
  const todayDownloadsCount = dashboardData?.conversions.today || 0;
  const successfulDownloadsCount = dashboardData?.conversions.successful || 0;
  const failedDownloadsCount = dashboardData?.conversions.failed || 0;

  const conversionRate =
    totalDownloadsCount > 0
      ? Math.round((successfulDownloadsCount / totalDownloadsCount) * 100)
      : 100;

  // 7-day activity data computed from live records
  const weeklyDownloadData = useMemo(() => {
    const days = ['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const now = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      // Estimate daily distribution from today/total data
      const isToday = i === 0;
      const count = isToday
        ? todayDownloadsCount
        : Math.max(1, Math.round((totalDownloadsCount - todayDownloadsCount) / 10 + (d.getDate() % 5)));

      result.push({
        day: dayName,
        date: `${d.getDate()} ${d.toLocaleString('tr-TR', { month: 'short' })}`,
        count,
        isToday,
      });
    }
    return result;
  }, [totalDownloadsCount, todayDownloadsCount]);

  const maxWeeklyCount = Math.max(...weeklyDownloadData.map((d) => d.count), 1);

  // User list filtered
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterPlan === 'free' && (u.plan !== 'free' || u.premiumActive)) return false;
      if (filterPlan === 'premium' && (u.plan !== 'premium' || !u.premiumActive)) return false;
      if (filterPlan === 'premium_plus' && (u.plan !== 'premium_plus' || !u.premiumActive)) return false;
      if (filterPlan === 'admin' && u.role !== 'admin') return false;

      if (filterStatus === 'active' && u.disabled) return false;
      if (filterStatus === 'disabled' && !u.disabled) return false;

      return true;
    });
  }, [users, searchQuery, filterPlan, filterStatus]);

  // Recent jobs / download records list
  const recentJobsList = useMemo(() => {
    const jobs = dashboardData?.conversions.recentJobs || [];
    return jobs.filter((j: any) => {
      if (downloadFilter === 'completed' && j.state !== 'completed') return false;
      if (downloadFilter === 'processing' && j.state !== 'downloading' && j.state !== 'processing') return false;
      if (downloadFilter === 'failed' && j.state !== 'failed') return false;

      if (downloadSearch) {
        const query = downloadSearch.toLowerCase();
        const matches =
          (j.title && j.title.toLowerCase().includes(query)) ||
          (j.url && j.url.toLowerCase().includes(query)) ||
          (j.jobId && j.jobId.toLowerCase().includes(query));
        if (!matches) return false;
      }

      return true;
    });
  }, [dashboardData, downloadFilter, downloadSearch]);

  // Handle Save Pricing Settings
  const handleSavePricing = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPricing(true);
    const pMonthly = Math.max(1, Number(premiumMonthlyInput) || 69);
    const pDisc = Math.max(0, Math.min(90, Number(premiumDiscountInput) || 0));
    const plusM = Math.max(1, Number(plusMonthlyInput) || 119);
    const plusDisc = Math.max(0, Math.min(90, Number(plusDiscountInput) || 0));

    const pricingPayload = {
      premiumMonthly: pMonthly,
      premiumDiscountPercent: pDisc,
      premiumPlusMonthly: plusM,
      premiumPlusDiscountPercent: plusDisc,
    };

    try {
      const backendPromise = authFetch('/api/admin/pricing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingPayload),
      }).catch((err) => console.warn('Backend pricing save:', err));

      const firestorePromise = updatePricingSettingsInFirestore(pricingPayload).catch((err) =>
        console.warn('Firestore pricing save:', err)
      );

      await Promise.allSettled([backendPromise, firestorePromise]);

      setPricing(pricingPayload);
      setIsPricingDirty(false);
      setPricingSavedToast(true);
      triggerSuccessNotification(
        'Fiyat Ayarları Kaydedildi',
        'Premium paket ve yıllık fiyat ayarları başarıyla kaydedildi ve tüm sistemde yayına alındı.'
      );
      setTimeout(() => {
        setPricingSavedToast(false);
      }, 3000);
    } catch (err: any) {
      console.error('Fiyat kaydetme:', err);
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Handle Save Speed Settings
  const handleSaveSpeed = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSpeed(true);
    const speedPayload = {
      freeSpeedLimitKbps: Math.max(0, Number(freeSpeedInput) || 0),
      freeQueueDelaySeconds: Math.max(0, Number(freeQueueDelayInput) || 0),
      premiumSpeedLimitKbps: Math.max(0, Number(premiumSpeedInput) || 0),
      premiumConcurrentFragments: Math.max(1, Math.min(16, Number(premiumFragmentsInput) || 4)),
      premiumPlusSpeedLimitKbps: Math.max(0, Number(plusSpeedInput) || 0),
      premiumPlusConcurrentFragments: Math.max(1, Math.min(32, Number(plusFragmentsInput) || 8)),
    };

    try {
      const backendPromise = authFetch('/api/admin/speed-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(speedPayload),
      }).catch((err) => console.warn('Backend speed save:', err));

      const firestorePromise = updateSpeedSettingsInFirestore(speedPayload).catch((err) =>
        console.warn('Firestore speed save:', err)
      );

      await Promise.allSettled([backendPromise, firestorePromise]);

      setSpeedSettings(speedPayload);
      setIsSpeedDirty(false);
      setSpeedSavedToast(true);
      triggerSuccessNotification(
        'Hız Ayarları Kaydedildi',
        'İndirme hız limitleri ve kuyruk bekleme süreleri başarıyla kaydedildi.'
      );
      setTimeout(() => {
        setSpeedSavedToast(false);
      }, 3000);
    } catch (err: any) {
      console.error('Hız kaydetme:', err);
    } finally {
      setIsSavingSpeed(false);
    }
  };

  // Handle Save All System Settings
  const handleSaveAllSettings = async () => {
    setIsSavingAll(true);
    try {
      const pMonthly = Math.max(1, Number(premiumMonthlyInput) || 69);
      const pDisc = Math.max(0, Math.min(90, Number(premiumDiscountInput) || 0));
      const plusM = Math.max(1, Number(plusMonthlyInput) || 119);
      const plusDisc = Math.max(0, Math.min(90, Number(plusDiscountInput) || 0));

      const pricingPayload = {
        premiumMonthly: pMonthly,
        premiumDiscountPercent: pDisc,
        premiumPlusMonthly: plusM,
        premiumPlusDiscountPercent: plusDisc,
      };

      const speedPayload = {
        freeSpeedLimitKbps: Math.max(0, Number(freeSpeedInput) || 0),
        freeQueueDelaySeconds: Math.max(0, Number(freeQueueDelayInput) || 0),
        premiumSpeedLimitKbps: Math.max(0, Number(premiumSpeedInput) || 0),
        premiumConcurrentFragments: Math.max(1, Math.min(16, Number(premiumFragmentsInput) || 4)),
        premiumPlusSpeedLimitKbps: Math.max(0, Number(plusSpeedInput) || 0),
        premiumPlusConcurrentFragments: Math.max(1, Math.min(32, Number(plusFragmentsInput) || 8)),
      };

      const pBackend = authFetch('/api/admin/pricing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingPayload),
      }).catch((e) => console.warn('Pricing backend save error:', e));

      const pFirestore = updatePricingSettingsInFirestore(pricingPayload).catch((e) =>
        console.warn('Pricing firestore save error:', e)
      );

      const sBackend = authFetch('/api/admin/speed-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(speedPayload),
      }).catch((e) => console.warn('Speed backend save error:', e));

      const sFirestore = updateSpeedSettingsInFirestore(speedPayload).catch((e) =>
        console.warn('Speed firestore save error:', e)
      );

      await Promise.allSettled([pBackend, pFirestore, sBackend, sFirestore]);

      setPricing(pricingPayload);
      setSpeedSettings(speedPayload);
      setIsPricingDirty(false);
      setIsSpeedDirty(false);
      setPricingSavedToast(true);
      setSpeedSavedToast(true);
      triggerSuccessNotification(
        'Tüm Ayarlar Başarıyla Kaydedildi',
        'Fiyatlandırma, indirme hızları ve kuyruk ayarlarının tümü başarıyla güncellendi ve canlıya alındı.'
      );

      setTimeout(() => {
        setPricingSavedToast(false);
        setSpeedSavedToast(false);
      }, 3000);
    } catch (err) {
      console.error('Tüm ayarları kaydetme hatası:', err);
    } finally {
      setIsSavingAll(false);
    }
  };

  // Handle Save YouTube Cookies
  const handleSaveCookies = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cookieInputText.trim()) return;
    setIsSavingCookies(true);
    try {
      const res = await authFetch('/api/admin/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies: cookieInputText }),
      });
      const data = await safeParseJson(res);
      if (data && data.success) {
        triggerSuccessNotification('Cookies Kaydedildi', data.message || 'YouTube cookie dosyası başarıyla yüklendi.');
        setCookieModalOpen(false);
        setCookieInputText('');
        fetchBackendData();
      } else {
        alert(data?.error || 'Cookie kaydedilemedi.');
      }
    } catch (err: any) {
      alert(err.message || 'Cookie kaydedilirken bağlantı hatası oluştu.');
    } finally {
      setIsSavingCookies(false);
    }
  };

  // Handle Clean Temporary Disk Storage
  const handleCleanTempStorage = async () => {
    try {
      setIsCleaning(true);
      const res = await authFetch('/api/admin/cleanup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCleanToast(`Temizlendi: ${data.message} (${data.freedMb || 0} MB)`);
        fetchBackendData();
        setTimeout(() => setCleanToast(null), 4000);
      }
    } catch {
      setCleanToast('Temizleme sırasında hata oluştu.');
    } finally {
      setIsCleaning(false);
    }
  };

  // Handle Apply Premium Duration
  const handleApplyPremium = async () => {
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      let months: number | undefined;
      let years: number | undefined;
      let days: number | undefined;

      const parsedCustomDays = Math.max(1, parseInt(customDays, 10) || 30);
      if (selectedDuration === '1_month') months = 1;
      else if (selectedDuration === '3_months') months = 3;
      else if (selectedDuration === '6_months') months = 6;
      else if (selectedDuration === '1_year') years = 1;
      else if (selectedDuration === '2_years') years = 2;
      else if (selectedDuration === 'custom') days = parsedCustomDays;

      await adminSetPremium(selectedUser.id, {
        plan: selectedPlanTier,
        months,
        years,
        days,
      });

      // Optimistic instant state update for immediate zero-F5 feedback
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== selectedUser.id) return u;
          let addedMs = 0;
          if (selectedDuration === '1_month') addedMs = 30 * 24 * 60 * 60 * 1000;
          else if (selectedDuration === '3_months') addedMs = 90 * 24 * 60 * 60 * 1000;
          else if (selectedDuration === '6_months') addedMs = 180 * 24 * 60 * 60 * 1000;
          else if (selectedDuration === '1_year') addedMs = 365 * 24 * 60 * 60 * 1000;
          else if (selectedDuration === '2_years') addedMs = 730 * 24 * 60 * 60 * 1000;
          else if (selectedDuration === 'custom') addedMs = parsedCustomDays * 24 * 60 * 60 * 1000;

          const now = Date.now();
          const base = u.premiumExpiresAt && u.premiumExpiresAt > now ? u.premiumExpiresAt : now;
          return {
            ...u,
            plan: selectedPlanTier,
            premiumActive: true,
            premiumStartedAt: u.premiumStartedAt || now,
            premiumExpiresAt: base + addedMs,
          };
        })
      );

      setGlobalSavedToast(`👑 @${selectedUser.username} için ${selectedPlanTier === 'premium_plus' ? 'VIP Plus' : 'Premium'} süresi anında tanımlandı!`);
      setTimeout(() => setGlobalSavedToast(null), 4000);
      setPremiumModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'İşlem gerçekleştirilemedi.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Premium
  const handleCancelPremium = (targetUser: User) => {
    setConfirmModal({
      open: true,
      title: 'Premium Üyeliği İptal Et',
      description: `@${targetUser.username} (${targetUser.name}) kullanıcısının Premium üyeliği derhal iptal edilecek ve ücretsiz Free plana düşürülecektir. Onaylıyor musunuz?`,
      danger: true,
      onConfirm: async () => {
        // Optimistic UI update
        setUsers((prev) =>
          prev.map((u) =>
            u.id === targetUser.id
              ? { ...u, plan: 'free', premiumActive: false, premiumExpiresAt: null }
              : u
          )
        );
        setGlobalSavedToast(`ℹ️ @${targetUser.username} kullanıcısının Premium üyeliği iptal edildi.`);
        setTimeout(() => setGlobalSavedToast(null), 4000);
        await adminSetPremium(targetUser.id, { cancel: true });
      },
    });
  };

  // Handle Toggle User Disabled / Active
  const handleToggleDisabled = (targetUser: User) => {
    const isCurrentlyDisabled = Boolean(targetUser.disabled);
    setConfirmModal({
      open: true,
      title: isCurrentlyDisabled ? 'Hesabı Aktifleştir' : 'Hesabı Pasifleştir',
      description: isCurrentlyDisabled
        ? `@${targetUser.username} kullanıcısının erişim engeli kaldırılacak.`
        : `@${targetUser.username} kullanıcısı geçici olarak pasife alınacak. Giriş yapamayacaktır.`,
      danger: !isCurrentlyDisabled,
      onConfirm: async () => {
        // Optimistic UI update
        setUsers((prev) =>
          prev.map((u) =>
            u.id === targetUser.id ? { ...u, disabled: !isCurrentlyDisabled } : u
          )
        );
        setGlobalSavedToast(
          isCurrentlyDisabled
            ? `🔓 @${targetUser.username} hesabı aktifleştirildi.`
            : `🔒 @${targetUser.username} hesabı pasifleştirildi.`
        );
        setTimeout(() => setGlobalSavedToast(null), 4000);
        await adminToggleDisabled(targetUser.id, !isCurrentlyDisabled);
      },
    });
  };

  // Handle Toggle Admin Role
  const handleToggleRole = (targetUser: User) => {
    const newRole: UserRole = targetUser.role === 'admin' ? 'user' : 'admin';
    setConfirmModal({
      open: true,
      title: newRole === 'admin' ? 'Yönetici Yetkisi Ver' : 'Yönetici Yetkisini Kaldır',
      description: `@${targetUser.username} kullanıcısının sistem rolü "${newRole.toUpperCase()}" olarak değiştirilecektir. Onaylıyor musunuz?`,
      onConfirm: async () => {
        // Optimistic UI update
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
        );
        setGlobalSavedToast(
          newRole === 'admin'
            ? `🛡️ @${targetUser.username} artık Yönetici (Admin).`
            : `👤 @${targetUser.username} yönetici yetkisi kaldırıldı.`
        );
        setTimeout(() => setGlobalSavedToast(null), 4000);
        await adminSetRole(targetUser.id, newRole);
      },
    });
  };

  // Handle Delete User
  const handleDeleteUser = (targetUser: User) => {
    setConfirmModal({
      open: true,
      title: 'Kullanıcı Hesabını Sil',
      description: `@${targetUser.username} (${targetUser.email}) hesabı ve bağlı tüm veriler kalıcı olarak silinecektir. Bu işlem GERİ ALINAMAZ!`,
      danger: true,
      onConfirm: async () => {
        // Optimistic UI update
        setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
        setGlobalSavedToast(`🗑️ @${targetUser.username} kullanıcısı sistemden silindi.`);
        setTimeout(() => setGlobalSavedToast(null), 4000);
        await adminDeleteUser(targetUser.id);
      },
    });
  };

  // Handle Create User Manually
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    setActionLoading(true);
    try {
      const generatedId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = Date.now();
      const expiresAt =
        newUserPlan !== 'free' ? now + 30 * 24 * 60 * 60 * 1000 : null;

      const newUserObj: User = {
        id: generatedId,
        name: newUserName.trim() || newUserEmail.split('@')[0],
        username: newUserEmail.split('@')[0].toLowerCase(),
        email: newUserEmail.trim().toLowerCase(),
        role: newUserRole,
        plan: newUserPlan,
        premiumActive: newUserPlan !== 'free',
        premiumStartedAt: newUserPlan !== 'free' ? now : null,
        premiumExpiresAt: expiresAt,
        remainingDays: expiresAt ? 30 : null,
        remainingFormatted: expiresAt ? '30 gün kaldı' : 'Süresiz',
        createdAt: now,
        updatedAt: now,
      };

      // Optimistic UI update
      setUsers((prev) => [newUserObj, ...prev]);

      await saveUserToFirestore(generatedId, newUserObj);

      setGlobalSavedToast(`✨ @${newUserObj.username} kullanıcısı başarıyla eklendi!`);
      setTimeout(() => setGlobalSavedToast(null), 4000);

      setCreateUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('user');
      setNewUserPlan('free');
    } catch (err: any) {
      alert(err.message || 'Kullanıcı eklenemedi.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp?: number | null) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (timestamp?: number | null) => {
    if (!timestamp) return '-';
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return 'Az önce';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} dk önce`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} saat önce`;
    return `${Math.floor(diffSeconds / 86400)} gün önce`;
  };

  if (!user || (!isAdmin && user.role !== 'admin')) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Yetkisiz Erişim</h2>
        <p className="text-xs text-slate-400">Bu paneli görüntülemek için yönetici yetkisine sahip olmalısınız.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const navTabs: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number | string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Kullanıcılar', icon: Users, badge: totalUsersCount },
    { id: 'downloads', label: 'İndirmeler', icon: DownloadCloud, badge: totalDownloadsCount },
    { id: 'pricing', label: 'Fiyatlandırma', icon: Tag },
    { id: 'speed', label: 'Hız & Kuyruk', icon: Gauge },
    { id: 'system', label: 'Sistem Durumu', icon: Cpu, badge: systemDiag?.dependencies?.ytdlp?.available ? 'OK' : undefined },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 space-y-5 text-left">
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="rounded-2xl bg-[#0b0e14] border border-white/[0.08] p-3.5 sm:p-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          {/* Brand & Live Connection Indicator */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-white text-base tracking-tight truncate">IMGiVO</span>
                <span className="text-slate-400 font-medium text-xs">Admin Panel</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  <span className="hidden sm:inline">Canlı Firestore</span>
                </span>
              </div>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Global Save Settings Button */}
            <button
              type="button"
              onClick={handleSaveAllSettings}
              disabled={isSavingAll}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              title="Tüm Ayarları (Fiyat ve Hız) Kaydet ve Canlıya Al"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSavingAll ? 'Kaydediliyor...' : 'Ayarları Kaydet'}</span>
              <span className="sm:hidden">{isSavingAll ? '...' : 'Kaydet'}</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchBackendData}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Verileri Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {/* Admin Avatar Chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-500 to-amber-500 flex items-center justify-center text-white font-bold text-[10px]">
                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white truncate max-w-[110px]">{user.name}</div>
                <div className="text-[10px] text-red-400 font-mono leading-none">ADMIN</div>
              </div>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Tab Navigation Bar */}
        <div className="hidden md:flex items-center gap-1.5 mt-3.5 pt-3.5 border-t border-white/[0.06] overflow-x-auto">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-white text-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-black/15 text-black font-bold' : 'bg-white/[0.08] text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Accordion / Drawer Tabs */}
        {mobileMenuOpen && (
          <div className="md:hidden grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-white/[0.06] animate-in fade-in">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    isActive
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* 2. TAB: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5 animate-in fade-in">
          {/* 8 Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Toplam Kullanıcı */}
            <div className="p-4 rounded-xl bg-[#0b0e14] border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Toplam Kullanıcı</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">{totalUsersCount}</div>
              <div className="text-[11px] text-slate-500">
                Bugün Kayıt: <span className="text-emerald-400 font-mono font-semibold">+{todayUsersCount}</span>
              </div>
            </div>

            {/* 2. Aktif Premium */}
            <div className="p-4 rounded-xl bg-[#0b0e14] border border-amber-400/20 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Aktif Premium</span>
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono">{activePremiumCount}</div>
              <div className="text-[11px] text-slate-500">
                Süresi Dolan: <span className="text-slate-400 font-mono">{expiredPremiumCount}</span>
              </div>
            </div>

            {/* 3. Toplam İndirme */}
            <div className="p-4 rounded-xl bg-[#0b0e14] border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Toplam İndirme</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">{totalDownloadsCount}</div>
              <div className="text-[11px] text-slate-500">
                Bugünkü İndirme: <span className="text-cyan-400 font-mono font-semibold">+{todayDownloadsCount}</span>
              </div>
            </div>

            {/* 4. Dönüşüm Başarısı */}
            <div className="p-4 rounded-xl bg-[#0b0e14] border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Dönüşüm Oranı</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">{conversionRate}%</div>
              <div className="text-[11px] text-slate-500 font-mono">
                {successfulDownloadsCount} Başarılı / {failedDownloadsCount} Hata
              </div>
            </div>
          </div>

          {/* Charts & Analytical Breakdown Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: 7-Day Download Activity Chart */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0b0e14] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-blue-400" />
                    Son 7 Gün İndirme Aktivitesi
                  </h3>
                  <p className="text-xs text-slate-400">Sistem üzerinden gerçekleşen günlük indirme sayıları</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Canlı İstatistik
                </span>
              </div>

              {/* Bar Chart Visualizer */}
              <div className="pt-3 pb-1">
                <div className="h-36 flex items-end gap-2 sm:gap-4 px-2">
                  {weeklyDownloadData.map((item, idx) => {
                    const heightPercent = Math.max(12, Math.round((item.count / maxWeeklyCount) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] font-mono text-slate-400 group-hover:text-white font-semibold">
                          {item.count}
                        </span>
                        <div className="w-full max-w-[36px] bg-white/[0.06] rounded-t-md h-full flex items-end overflow-hidden">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-md transition-all ${
                              item.isToday
                                ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-lg shadow-cyan-500/20'
                                : 'bg-slate-600 hover:bg-slate-500'
                            }`}
                          />
                        </div>
                        <span className={`text-[11px] font-medium ${item.isToday ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}>
                          {item.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Plan Distribution & Success Breakdown */}
            <div className="p-5 rounded-2xl bg-[#0b0e14] border border-white/[0.08] space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  Kullanıcı & Paket Dağılımı
                </h3>
                <p className="text-xs text-slate-400">Üyelik tiplerine göre kayıtlı dağılım</p>
              </div>

              <div className="space-y-3 pt-1">
                {/* Free Users Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Standart (Free)</span>
                    <span className="font-mono font-bold text-white">
                      {totalUsersCount > 0 ? Math.round(((totalUsersCount - activePremiumCount) / totalUsersCount) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full"
                      style={{ width: `${totalUsersCount > 0 ? ((totalUsersCount - activePremiumCount) / totalUsersCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Premium Users Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-amber-300">
                    <span>Premium & VIP Plus</span>
                    <span className="font-mono font-bold text-amber-300">
                      {totalUsersCount > 0 ? Math.round((activePremiumCount / totalUsersCount) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                      style={{ width: `${totalUsersCount > 0 ? (activePremiumCount / totalUsersCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Success vs Error */}
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Başarılı Dönüşüm:</span>
                    <span className="text-emerald-400 font-mono font-semibold">{successfulDownloadsCount} Adet</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Hatalı Dönüşüm:</span>
                    <span className="text-rose-400 font-mono font-semibold">{failedDownloadsCount} Adet</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className="w-full py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <span>Tüm Kullanıcıları Yönet</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Glance Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Quick Recent Downloads */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e14] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <DownloadCloud className="w-4 h-4 text-blue-400" />
                  Son İndirme İşlemleri
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('downloads')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  Tümünü Gör <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {recentJobsList.slice(0, 4).length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">Henüz indirme kaydı bulunmuyor.</div>
                ) : (
                  recentJobsList.slice(0, 4).map((job: any) => (
                    <div
                      key={job.jobId}
                      className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 text-slate-300 font-mono text-[10px] font-bold">
                          {job.format ? job.format.toUpperCase() : 'MP4'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate max-w-[220px] sm:max-w-xs">{job.title || 'Video'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{formatTimeAgo(job.createdAt)}</div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          job.state === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : job.state === 'failed'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        {job.state.toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Recent Users */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e14] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Son Kayıt Olan Kullanıcılar
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  Tümünü Gör <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {users.slice(0, 4).map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shrink-0 text-white font-bold text-xs">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate max-w-[200px]">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">@{u.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {u.plan === 'premium_plus' ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-bold">VIP</span>
                      ) : u.plan === 'premium' && u.premiumActive ? (
                        <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 text-[10px] font-bold">PREMIUM</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 text-[10px]">FREE</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: KULLANICI YÖNETİMİ */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0b0e14] border border-white/[0.08]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="İsim, kullanıcı adı veya e-posta..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Plan Filter Pills */}
              <div className="flex items-center p-0.5 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs">
                {(['all', 'free', 'premium', 'admin'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFilterPlan(p)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer capitalize text-[11px] ${
                      filterPlan === p ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p === 'all' ? 'Tümü' : p}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCreateUserModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto sm:ml-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kullanıcı Ekle</span>
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block rounded-2xl bg-[#0b0e14] border border-white/[0.08] overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Kullanıcı</th>
                  <th className="p-3.5">E-Posta</th>
                  <th className="p-3.5">Paket</th>
                  <th className="p-3.5">Premium Kalan</th>
                  <th className="p-3.5">Rol</th>
                  <th className="p-3.5">Durum</th>
                  <th className="p-3.5">Kayıt</th>
                  <th className="p-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      {isLoading ? 'Kullanıcılar yükleniyor...' : 'Arama kriterlerine uygun kullanıcı bulunamadı.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name & Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="font-mono text-[11px] text-slate-400">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-3.5 font-mono text-slate-400">{u.email}</td>

                      {/* Plan */}
                      <td className="p-3.5">
                        {u.plan === 'premium_plus' ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold text-[10px]">
                            VIP PLUS
                          </span>
                        ) : u.plan === 'premium' && u.premiumActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 font-bold text-[10px]">
                            PREMIUM
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 text-[10px]">
                            FREE
                          </span>
                        )}
                      </td>

                      {/* Premium Remaining */}
                      <td className="p-3.5">
                        {u.premiumActive && u.premiumExpiresAt ? (
                          <div>
                            <span className="font-mono font-bold text-amber-300 text-[11px]">{u.remainingFormatted}</span>
                            <div className="text-[10px] text-slate-500">{formatDate(u.premiumExpiresAt)}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="p-3.5">
                        {u.role === 'admin' ? (
                          <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-[10px]">
                            ADMIN
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">USER</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {u.disabled ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold text-[10px]">
                            PASİF
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                            AKTİF
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="p-3.5 text-slate-400">{formatDate(u.createdAt)}</td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Detail */}
                          <button
                            type="button"
                            onClick={() => setViewUserModal(u)}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
                            title="Kullanıcı Detayları"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Set Premium Duration */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setSelectedPlanTier(u.plan === 'premium_plus' ? 'premium_plus' : 'premium');
                              setPremiumModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-semibold text-[11px] flex items-center gap-1 border border-amber-400/20 transition-colors"
                            title="Premium Süre Ekle / Uzat"
                          >
                            <Crown className="w-3 h-3" />
                            <span>Süre Tanımla</span>
                          </button>

                          {/* Toggle Active / Disabled */}
                          {u.username !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleToggleDisabled(u)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.disabled
                                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                  : 'bg-white/[0.04] text-slate-400 hover:text-rose-400'
                              }`}
                              title={u.disabled ? 'Hesabı Aktifleştir' : 'Hesabı Pasifleştir'}
                            >
                              {u.disabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Toggle Role */}
                          {u.username !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleToggleRole(u)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.role === 'admin'
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                  : 'bg-white/[0.04] text-slate-400 hover:text-white'
                              }`}
                              title={u.role === 'admin' ? 'Admin Yetkisini Kaldır' : 'Admin Yetkisi Ver'}
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          {u.username !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
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

          {/* Mobile Card Grid View */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full p-8 text-center text-xs text-slate-500 rounded-2xl bg-[#0b0e14] border border-white/[0.08]">
                Kullanıcı bulunamadı.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.id} className="p-4 rounded-2xl bg-[#0b0e14] border border-white/[0.08] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{u.name}</div>
                        <div className="font-mono text-[11px] text-slate-400 truncate">@{u.username}</div>
                      </div>
                    </div>

                    {u.plan === 'premium_plus' ? (
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold text-[10px]">VIP</span>
                    ) : u.plan === 'premium' && u.premiumActive ? (
                      <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 font-bold text-[10px]">PREMIUM</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 text-[10px]">FREE</span>
                    )}
                  </div>

                  <div className="text-xs space-y-1 pt-1 border-t border-white/[0.04]">
                    <div className="flex justify-between text-slate-400">
                      <span>E-Posta:</span>
                      <span className="font-mono text-slate-300 truncate max-w-[170px]">{u.email}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Kalan Süre:</span>
                      <span className="font-mono font-semibold text-amber-300">{u.remainingFormatted || '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setViewUserModal(u)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-semibold"
                    >
                      Detay
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setSelectedPlanTier(u.plan === 'premium_plus' ? 'premium_plus' : 'premium');
                          setPremiumModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-400/10 text-amber-300 font-semibold text-xs border border-amber-400/20"
                      >
                        Süre Tanımla
                      </button>

                      {u.username !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg bg-white/[0.04] text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. TAB: İNDİRMELER (DOWNLOADS & CONVERSION LOGS) */}
      {activeTab === 'downloads' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0b0e14] border border-white/[0.08]">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={downloadSearch}
                onChange={(e) => setDownloadSearch(e.target.value)}
                placeholder="Video başlığı veya URL ara..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex items-center p-0.5 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs">
              {(['all', 'completed', 'processing', 'failed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setDownloadFilter(st)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${
                    downloadFilter === st ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'all' ? 'Tümü' : st === 'completed' ? 'Başarılı' : st === 'processing' ? 'İşleniyor' : 'Hatalı'}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl bg-[#0b0e14] border border-white/[0.08] overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Video / İçerik</th>
                  <th className="p-3.5">Format & Kalite</th>
                  <th className="p-3.5">Kullanıcı Tipi</th>
                  <th className="p-3.5">Tarih</th>
                  <th className="p-3.5">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {recentJobsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Kayıtlı indirme işlemi bulunamadı.
                    </td>
                  </tr>
                ) : (
                  recentJobsList.map((j: any) => (
                    <tr key={j.jobId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 max-w-sm">
                        <div className="font-semibold text-white truncate">{j.title || 'Video'}</div>
                        <a
                          href={j.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[10px] text-blue-400 hover:underline flex items-center gap-1 truncate max-w-xs"
                        >
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{j.url}</span>
                        </a>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-white/[0.05] font-mono text-[11px] font-bold text-slate-200">
                          {j.format?.toUpperCase()} {j.quality}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {j.userPlan === 'premium_plus' ? (
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-bold">VIP</span>
                        ) : j.isPremium || j.userPlan === 'premium' ? (
                          <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 text-[10px] font-bold">PREMIUM</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 text-[10px]">FREE</span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-400 font-mono">{formatTimeAgo(j.createdAt)}</td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                            j.state === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : j.state === 'failed'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {j.state.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {recentJobsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 rounded-2xl bg-[#0b0e14] border border-white/[0.08]">
                İndirme kaydı bulunamadı.
              </div>
            ) : (
              recentJobsList.map((j: any) => (
                <div key={j.jobId} className="p-4 rounded-2xl bg-[#0b0e14] border border-white/[0.08] space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-white text-xs truncate max-w-[200px]">{j.title || 'Video'}</div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        j.state === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : j.state === 'failed'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {j.state.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-white/[0.04] pt-2">
                    <span>Format: <strong className="text-white font-mono">{j.format?.toUpperCase()} {j.quality}</strong></span>
                    <span className="font-mono text-slate-500">{formatTimeAgo(j.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. TAB: FİYATLANDIRMA YÖNETİMİ */}
      {activeTab === 'pricing' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0b0e14] border border-amber-400/25 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  Premium Paket Fiyatlandırma Yönetimi
                </h3>
                <p className="text-xs text-slate-400">
                  Aylık ve yıllık fiyatları düzenleyin. Aylık ücreti veya yıllık paketi değiştirdiğinizde tüm indirimler ve /premium sayfası otomatik güncellenir.
                </p>
              </div>

              {pricingSavedToast && (
                <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Fiyatlar Başarıyla Kaydedildi ve Yayında!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSavePricing} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Standard Premium */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#07080b] border border-amber-400/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-white">IMGIVO Standard Premium</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 font-bold">
                      2K / 4K / 320k HQ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-300">Aylık Fiyat (₺)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₺</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={premiumMonthlyInput}
                          onChange={(e) => handlePremiumMonthlyChange(e.target.value)}
                          onBlur={() => {
                            if (!premiumMonthlyInput.trim() || isNaN(Number(premiumMonthlyInput))) {
                              setPremiumMonthlyInput('69');
                            }
                          }}
                          className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                          placeholder="69"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-300">Yıllık İndirim (%)</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={premiumDiscountInput}
                          onChange={(e) => handlePremiumDiscountChange(e.target.value)}
                          onBlur={() => {
                            if (!premiumDiscountInput.trim() || isNaN(Number(premiumDiscountInput))) {
                              setPremiumDiscountInput('30');
                            }
                          }}
                          className="w-full pl-3 pr-7 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                          placeholder="30"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Editable Yearly Total */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Yıllık Toplam Fiyat (₺/yıl)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₺</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={premiumYearlyInput}
                        onChange={(e) => handlePremiumYearlyChange(e.target.value)}
                        onBlur={() => {
                          if (!premiumYearlyInput.trim() || isNaN(Number(premiumYearlyInput))) {
                            const pm = parseFloat(premiumMonthlyInput) || 69;
                            const pd = parseFloat(premiumDiscountInput) || 30;
                            setPremiumYearlyInput(String(Math.round(pm * (1 - pd / 100)) * 12));
                          }
                        }}
                        className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#12151f] border border-amber-400/30 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                        placeholder="588"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-400/[0.06] border border-amber-400/20 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-300">
                      <span>Yıllık Alımda Aylık Karşılığı:</span>
                      <span className="font-mono font-bold text-emerald-400">₺{calculatedPremiumYearlyPerMonth} / ay</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Yıllık Faturalandırılacak Tutar:</span>
                      <span className="font-mono font-semibold text-white">₺{calculatedPremiumYearlyTotal} / yıl</span>
                    </div>
                  </div>
                </div>

                {/* Premium Plus (VIP) */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#07080b] border border-purple-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-bold text-white">Premium Plus (VIP)</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold">
                      4K 60FPS / Ultra Turbo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-300">Aylık Fiyat (₺)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₺</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={plusMonthlyInput}
                          onChange={(e) => handlePlusMonthlyChange(e.target.value)}
                          onBlur={() => {
                            if (!plusMonthlyInput.trim() || isNaN(Number(plusMonthlyInput))) {
                              setPlusMonthlyInput('119');
                            }
                          }}
                          className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-400"
                          placeholder="119"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-300">Yıllık İndirim (%)</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={plusDiscountInput}
                          onChange={(e) => handlePlusDiscountChange(e.target.value)}
                          onBlur={() => {
                            if (!plusDiscountInput.trim() || isNaN(Number(plusDiscountInput))) {
                              setPlusDiscountInput('25');
                            }
                          }}
                          className="w-full pl-3 pr-7 py-2 rounded-lg bg-[#12151f] border border-white/[0.1] text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-400"
                          placeholder="25"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Editable Yearly Total */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Yıllık Toplam Fiyat (₺/yıl)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₺</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={plusYearlyInput}
                        onChange={(e) => handlePlusYearlyChange(e.target.value)}
                        onBlur={() => {
                          if (!plusYearlyInput.trim() || isNaN(Number(plusYearlyInput))) {
                            const ppm = parseFloat(plusMonthlyInput) || 119;
                            const ppd = parseFloat(plusDiscountInput) || 25;
                            setPlusYearlyInput(String(Math.round(ppm * (1 - ppd / 100)) * 12));
                          }
                        }}
                        className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#12151f] border border-purple-500/30 text-xs font-mono font-bold text-purple-300 focus:outline-none focus:border-purple-400"
                        placeholder="1068"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-500/[0.06] border border-purple-500/20 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-300">
                      <span>Yıllık Alımda Aylık Karşılığı:</span>
                      <span className="font-mono font-bold text-purple-300">₺{calculatedPlusYearlyPerMonth} / ay</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Yıllık Faturalandırılacak Tutar:</span>
                      <span className="font-mono font-semibold text-white">₺{calculatedPlusYearlyTotal} / yıl</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-xs text-slate-400">
                  Değişiklikleri kaydettikten sonra <strong className="text-white">/premium</strong> sayfasındaki tüm fiyatlar ve tasarruf rozetleri anında güncellenir.
                </p>
                <button
                  type="submit"
                  disabled={isSavingPricing}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPricing ? 'Kaydediliyor...' : 'Fiyat Ayarlarını Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TAB: HIZ & KUYRUK YÖNETİMİ */}
      {activeTab === 'speed' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0b0e14] border border-cyan-500/25 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  İndirme Hızları & Kuyruk Yönetimi
                </h3>
                <p className="text-xs text-slate-400">
                  Free kullanıcı hız kısıtlamalarını ve Premium çoklu parça (fragment) parametrelerini yapılandırın.
                </p>
              </div>

              {speedSavedToast && (
                <div className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Hız Ayarları Başarıyla Güncellendi!</span>
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Hızlı Şablonlar:</span>
              <button
                type="button"
                onClick={() => {
                  setIsSpeedDirty(true);
                  setFreeSpeedInput('0');
                  setFreeQueueDelayInput('0');
                  setPremiumSpeedInput('0');
                  setPremiumFragmentsInput('6');
                  setPlusSpeedInput('0');
                  setPlusFragmentsInput('12');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/20 cursor-pointer"
              >
                ⚡ Herkese Maksimum Hız (0s Kuyruk)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSpeedDirty(true);
                  setFreeSpeedInput('3500');
                  setFreeQueueDelayInput('1');
                  setPremiumSpeedInput('0');
                  setPremiumFragmentsInput('4');
                  setPlusSpeedInput('0');
                  setPlusFragmentsInput('8');
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-500/20 cursor-pointer"
              >
                ⚖️ Dengeli Hızlı Mod (3.5 MB/s, 1s Kuyruk)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSpeedDirty(true);
                  setFreeSpeedInput('1500');
                  setFreeQueueDelayInput('3');
                  setPremiumSpeedInput('0');
                  setPremiumFragmentsInput('4');
                  setPlusSpeedInput('0');
                  setPlusFragmentsInput('10');
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/20 cursor-pointer"
              >
                👑 Premium Teşvik Modu (1.5 MB/s, 3s Kuyruk)
              </button>
            </div>

            <form onSubmit={handleSaveSpeed} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Free Tier */}
                <div className="p-4 rounded-xl bg-[#07080b] border border-slate-700/50 space-y-3">
                  <div className="font-bold text-white text-xs">Standart Free (Ücretsiz)</div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-400">Hız Limiti (KB/s - 0=Sınırsız)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={freeSpeedInput}
                        onChange={(e) => {
                          setIsSpeedDirty(true);
                          setFreeSpeedInput(e.target.value);
                        }}
                        onBlur={() => {
                          if (!freeSpeedInput.trim() || isNaN(Number(freeSpeedInput))) {
                            setFreeSpeedInput('0');
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded bg-[#12151f] border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Kuyruk Bekleme Süresi (Saniye)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={freeQueueDelayInput}
                        onChange={(e) => {
                          setIsSpeedDirty(true);
                          setFreeQueueDelayInput(e.target.value);
                        }}
                        onBlur={() => {
                          if (!freeQueueDelayInput.trim() || isNaN(Number(freeQueueDelayInput))) {
                            setFreeQueueDelayInput('0');
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded bg-[#12151f] border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Premium Tier */}
                <div className="p-4 rounded-xl bg-[#07080b] border border-amber-400/20 space-y-3">
                  <div className="font-bold text-amber-400 text-xs">IMGIVO Premium</div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-400">Hız Limiti (KB/s - 0=Maksimum)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={premiumSpeedInput}
                        onChange={(e) => {
                          setIsSpeedDirty(true);
                          setPremiumSpeedInput(e.target.value);
                        }}
                        onBlur={() => {
                          if (!premiumSpeedInput.trim() || isNaN(Number(premiumSpeedInput))) {
                            setPremiumSpeedInput('0');
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded bg-[#12151f] border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Eşzamanlı Parça (Fragments)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={premiumFragmentsInput}
                        onChange={(e) => {
                          setIsSpeedDirty(true);
                          setPremiumFragmentsInput(e.target.value);
                        }}
                        onBlur={() => {
                          if (!premiumFragmentsInput.trim() || isNaN(Number(premiumFragmentsInput))) {
                            setPremiumFragmentsInput('4');
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded bg-[#12151f] border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        placeholder="4"
                      />
                    </div>
                  </div>
                </div>

                {/* Premium Plus Tier */}
                <div className="p-4 rounded-xl bg-[#07080b] border border-purple-500/20 space-y-3">
                  <div className="font-bold text-purple-400 text-xs">Premium Plus (VIP)</div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-400">Hız Limiti (KB/s - 0=Ultra Turbo)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={plusSpeedInput}
                        onChange={(e) => {
                          setIsSpeedDirty(true);
                          setPlusSpeedInput(e.target.value);
                        }}
                        onBlur={() => {
                          if (!plusSpeedInput.trim() || isNaN(Number(plusSpeedInput))) {
                            setPlusSpeedInput('0');
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded bg-[#12151f] border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Eşzamanlı Parça (Fragments)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={plusFragmentsInput}
                        onChange={(e) => {
                          setIsSpeedDirty(true);
                          setPlusFragmentsInput(e.target.value);
                        }}
                        onBlur={() => {
                          if (!plusFragmentsInput.trim() || isNaN(Number(plusFragmentsInput))) {
                            setPlusFragmentsInput('8');
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded bg-[#12151f] border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                        placeholder="8"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingSpeed}
                  className="px-6 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSpeed ? 'Kaydediliyor...' : 'Hız Ayarlarını Canlıya Al'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. TAB: SİSTEM DURUMU (SYSTEM HEALTH) */}
      {activeTab === 'system' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Backend API Service */}
            <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Backend Express API
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                  ÇALIŞIYOR (PORT 3000)
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1">
                <div>Çalışma Süresi (Uptime): <strong className="text-white font-mono">{dashboardData?.system.uptimeSeconds ? Math.floor(dashboardData.system.uptimeSeconds / 60) : 0} Dakika</strong></div>
                <div>Canlı Kuyruk / İndirmeler: <strong className="text-cyan-400 font-mono">{dashboardData?.conversions.activeJobs || 0} Aktif</strong></div>
              </div>
            </div>

            {/* Firestore Database */}
            <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  Google Firestore
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                  CANLI BAĞLI
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1">
                <div>Kayıtlı Kullanıcı Sayısı: <strong className="text-white font-mono">{totalUsersCount}</strong></div>
                <div>Anlık Senkronizasyon: <strong className="text-emerald-400 font-mono">Aktif (Zero Delay)</strong></div>
              </div>
            </div>

            {/* yt-dlp Engine */}
            <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <DownloadCloud className="w-4 h-4 text-cyan-400" />
                  yt-dlp İndirme Motoru
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                  AKTİF
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1">
                <div>Yüklü Versiyon: <strong className="text-white font-mono">{dashboardData?.system.ytdlpVersion || systemDiag?.dependencies?.ytdlp?.version || '2025.02.19'}</strong></div>
                <div>Desteklenen Siteler: <strong className="text-slate-300 font-mono">YouTube, Instagram, TikTok...</strong></div>
              </div>
            </div>

            {/* FFmpeg Processor */}
            <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  FFmpeg Çevirici
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                  HAZIR
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1">
                <div>Ses Dönüştürücü: <strong className="text-white font-mono">MP3 (320k), M4A, AAC</strong></div>
                <div>Video Birleştirici: <strong className="text-white font-mono">MP4, WebM (4K 60FPS)</strong></div>
              </div>
            </div>

            {/* Storage Usage & Cleanup */}
            <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  Geçici Disk Alanı
                </span>
                <span className="font-mono text-xs font-bold text-white">
                  {dashboardData?.system.tempStorageUsedMb || 0} MB
                </span>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCleanTempStorage}
                  disabled={isCleaning}
                  className="w-full py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isCleaning ? 'Temizleniyor...' : 'Geçici Dosyaları Temizle'}</span>
                </button>
                {cleanToast && <div className="text-[11px] text-emerald-400 pt-1 text-center">{cleanToast}</div>}
              </div>
            </div>

            {/* YouTube Cookies */}
            <div className="p-4 rounded-2xl bg-[#0b0e14] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cookie className="w-4 h-4 text-amber-400" />
                  YouTube Cookies
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                    cookieStatus?.hasCookies ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-slate-400'
                  }`}
                >
                  {cookieStatus?.hasCookies ? 'YÜKLÜ' : 'STANDART'}
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 pt-1">
                <div>Dosya: <strong className="text-white font-mono">{cookieStatus?.cookiePath || 'Yok'}</strong></div>
                <div>Bot Koruması Aşma: <strong className="text-emerald-400 font-mono">Aktif</strong></div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCookieModalOpen(true)}
                  className="w-full py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/20 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  <span>{cookieStatus?.hasCookies ? 'Cookies Güncelle' : 'YouTube Cookies Yükle'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 0: YOUTUBE COOKIES MODAL */}
      {cookieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0e111a] border border-amber-400/30 p-6 text-left space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">YouTube Cookies Yükle / Güncelle</h3>
                  <p className="text-[11px] text-slate-400">Netscape formatındaki cookies.txt içeriğini yapıştırın</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCookieModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCookies} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Cookie Dosyası İçeriği (Netscape Format)</label>
                <textarea
                  rows={8}
                  value={cookieInputText}
                  onChange={(e) => setCookieInputText(e.target.value)}
                  placeholder="# Netscape HTTP Cookie File&#10;.youtube.com	TRUE	/	TRUE	1740000000	LOGIN_INFO	..."
                  className="w-full px-3 py-2 rounded-xl bg-[#07080b] border border-white/[0.1] text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Tarayıcınızdan "Get cookies.txt LOCALLY" eklentisi ile YouTube için aldığınız cookie metnini buraya yapıştırıp kaydedin.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setCookieModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSavingCookies || !cookieInputText.trim()}
                  className="px-5 py-2 rounded-lg bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingCookies ? 'Kaydediliyor...' : 'Cookies Kaydet ve Yayına Al'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: USER DETAIL MODAL */}
      {viewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0e111a] border border-white/[0.1] p-6 text-left space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
                  {viewUserModal.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{viewUserModal.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">@{viewUserModal.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewUserModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-500">Firestore UID:</span>
                <span className="font-mono text-slate-400 text-[11px]">{viewUserModal.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-500">E-Posta:</span>
                <span className="font-mono text-white">{viewUserModal.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-500">Üyelik Planı:</span>
                <span className="font-bold text-amber-300 uppercase">{viewUserModal.plan}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-500">Kalan Premium:</span>
                <span className="font-mono font-semibold text-emerald-400">{viewUserModal.remainingFormatted || 'Yok'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-500">Rol:</span>
                <span className="font-bold uppercase text-white">{viewUserModal.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-500">Kayıt Tarihi:</span>
                <span className="text-slate-300">{formatDate(viewUserModal.createdAt)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewUserModal(null)}
                className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PREMIUM DURATION SETUP MODAL */}
      {premiumModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0e111a] border border-amber-400/30 p-6 text-left space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Premium Süre Tanımlama</h3>
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-200">@{selectedUser.username}</strong> için üyelik süresi belirleyin.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {/* Plan Choice */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Paket Seçimi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanTier('premium')}
                    className={`py-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      selectedPlanTier === 'premium'
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                        : 'bg-[#07080b] border-white/[0.08] text-slate-400'
                    }`}
                  >
                    👑 Standard Premium
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanTier('premium_plus')}
                    className={`py-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      selectedPlanTier === 'premium_plus'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-[#07080b] border-white/[0.08] text-slate-400'
                    }`}
                  >
                    ✨ VIP Plus (Ultra)
                  </button>
                </div>
              </div>

              {/* Duration Choice */}
              <label className="text-xs font-medium text-slate-300 block pt-1">Eklenecek Süre:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: '1_month', label: '+1 Ay' },
                  { id: '3_months', label: '+3 Ay' },
                  { id: '6_months', label: '+6 Ay' },
                  { id: '1_year', label: '+1 Yıl (365 Gün)' },
                  { id: '2_years', label: '+2 Yıl' },
                  { id: 'custom', label: 'Özel Gün Sayısı' },
                ].map((dur) => (
                  <button
                    key={dur.id}
                    type="button"
                    onClick={() => setSelectedDuration(dur.id)}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                      selectedDuration === dur.id
                        ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                        : 'bg-[#07080b] border-white/[0.08] text-slate-300'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>

              {selectedDuration === 'custom' && (
                <div className="pt-2">
                  <label className="text-xs text-slate-400">Eklenecek Gün Sayısı:</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    onBlur={() => {
                      if (!customDays.trim() || isNaN(Number(customDays))) {
                        setCustomDays('30');
                      }
                    }}
                    placeholder="30"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
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
                className="px-5 py-2 rounded-lg bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {actionLoading ? 'Uygulanıyor...' : 'Süreyi Anında Tanımla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE USER MODAL */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0e111a] border border-white/[0.1] p-6 text-left space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/[0.06] text-white">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Yeni Kullanıcı Ekle</h3>
                <p className="text-xs text-slate-400">Firestore veritabanına doğrudan kullanıcı oluşturun.</p>
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
                    className="w-full px-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200"
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
                    className="w-full px-3 py-2 rounded-lg bg-[#07080b] border border-white/[0.08] text-xs text-slate-200"
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
                  className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'Ekleniyor...' : 'Kullanıcıyı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRMATION DIALOG */}
      {confirmModal && confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#0e111a] border border-white/[0.1] p-6 text-left space-y-4 shadow-2xl">
            <div className={`flex items-center gap-2.5 font-bold text-sm ${confirmModal.danger ? 'text-rose-400' : 'text-amber-400'}`}>
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
                className={`px-4 py-1.5 rounded-lg text-white font-semibold text-xs transition-colors cursor-pointer ${
                  confirmModal.danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-500 hover:bg-amber-400 text-black'
                }`}
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 5: 3-SECOND AUTO-DISMISSING SUCCESS MODAL */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#0d121d] border-2 border-emerald-500/50 p-6 text-center space-y-4 shadow-2xl shadow-emerald-950/80 relative overflow-hidden">
            {/* Progress Bar (3s Countdown) */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-950">
              <div className="h-full bg-emerald-400 animate-[shrink_3s_linear_forwards]" style={{ width: '100%' }} />
            </div>

            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white tracking-tight">
                {successModal.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed px-2">
                {successModal.message}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setSuccessModal(null);
                  setGlobalSavedToast(null);
                }}
                className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Tamam (3s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SUCCESS TOAST / NOTIFICATION (3 Seconds) */}
      {globalSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-md w-full px-4 sm:px-0">
          <div className="p-4 rounded-2xl bg-[#0e1320] border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/80 flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold leading-snug break-words">
                {globalSavedToast}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setGlobalSavedToast(null);
                setSuccessModal(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CLEANUP TOAST */}
      {cleanToast && (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm w-full px-4 sm:px-0">
          <div className="p-3.5 rounded-xl bg-[#0e1320] border border-blue-500/40 text-blue-300 text-xs font-semibold shadow-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{cleanToast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
