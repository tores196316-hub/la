import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { User, UserRole, UserPlan } from '../types';
import {
  auth,
  onAuthStateChanged,
  subscribeToUserDoc,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  logoutFromFirebase,
  adminSetUserPremiumInFirestore,
  adminSetUserRoleInFirestore,
  adminDeleteUserInFirestore,
  saveUserToFirestore,
  formatRemainingTime,
  mapFirestoreDocToUser,
} from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const USER_CACHE_KEY = 'imgivo_user_cache_v2';
const TOKEN_KEY = 'imgivo_auth_token_v2';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginGoogle: () => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; username: string; email: string; password: string; passwordConfirm: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; currentPassword?: string; newPassword?: string }) => Promise<{ success: boolean; error?: string }>;
  adminSetPremium: (userId: string, options: { plan?: UserPlan; months?: number; years?: number; days?: number; cancel?: boolean }) => Promise<void>;
  adminSetRole: (userId: string, role: UserRole) => Promise<void>;
  adminDeleteUser: (userId: string) => Promise<void>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      // recalculate dynamic remaining time
      const calc = formatRemainingTime(parsed.premiumExpiresAt);
      return {
        ...parsed,
        remainingDays: calc.remainingDays,
        remainingFormatted: calc.formatted,
        premiumActive: Boolean(parsed.premiumActive && calc.isActive),
      };
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const unsubscribeSnapshotRef = useRef<(() => void) | null>(null);

  // Stop real-time listener
  const stopSnapshotListener = () => {
    if (unsubscribeSnapshotRef.current) {
      unsubscribeSnapshotRef.current();
      unsubscribeSnapshotRef.current = null;
    }
  };

  // Attach real-time Firestore listener on user document
  const attachUserRealtimeListener = useCallback((uid: string) => {
    stopSnapshotListener();
    unsubscribeSnapshotRef.current = subscribeToUserDoc(uid, (updatedUser) => {
      if (updatedUser) {
        setUser(updatedUser);
        try {
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
        } catch {}
      } else {
        // Document deleted or user logged out
        setUser(null);
        try {
          localStorage.removeItem(USER_CACHE_KEY);
        } catch {}
      }
    });
  }, []);

  // Firebase Auth state listener on boot
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          localStorage.setItem(TOKEN_KEY, idToken);

          // Get user doc from Firestore
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);

          let appUser: User;
          const isBootstrapAdmin =
            fbUser.email === 'admin@imgivo.com' || fbUser.email === 'tores196316@gmail.com';
          const now = Date.now();

          if (snap.exists()) {
            appUser = mapFirestoreDocToUser(snap.data(), fbUser.uid);
          } else {
            // Auto create doc if missing
            const initialDoc = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Kullanıcı',
              username: (fbUser.email?.split('@')[0] || 'user') + '_' + fbUser.uid.slice(0, 4),
              email: fbUser.email || '',
              role: (isBootstrapAdmin ? 'admin' : 'user') as UserRole,
              plan: (isBootstrapAdmin ? 'premium_plus' : 'free') as UserPlan,
              premiumActive: isBootstrapAdmin,
              premiumStartedAt: isBootstrapAdmin ? now : null,
              premiumExpiresAt: isBootstrapAdmin ? now + 365 * 24 * 60 * 60 * 1000 : null,
              createdAt: now,
              updatedAt: now,
            };
            await saveUserToFirestore(fbUser.uid, initialDoc);
            appUser = mapFirestoreDocToUser(initialDoc, fbUser.uid);
          }

          setUser(appUser);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(appUser));

          // Start live Firestore real-time onSnapshot synchronization
          attachUserRealtimeListener(fbUser.uid);
        } catch (err) {
          console.error('Firebase user fetch error:', err);
        }
      } else {
        stopSnapshotListener();
        // If no firebase user, check if we have custom fallback or empty
        if (!localStorage.getItem(TOKEN_KEY)) {
          setUser(null);
          setToken(null);
          localStorage.removeItem(USER_CACHE_KEY);
        }
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      stopSnapshotListener();
    };
  }, [attachUserRealtimeListener]);

  // Authenticated fetch helper
  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers || {});
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return fetch(input, {
        ...init,
        headers,
      });
    },
    [token]
  );

  // Google Sign-In
  const loginGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const appUser = await signInWithGoogle();
      setUser(appUser);
      attachUserRealtimeListener(appUser.id);
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      return {
        success: false,
        error: err?.message?.includes('popup-closed-by-user')
          ? 'Giriş penceresi kapatıldı.'
          : 'Google ile giriş başarısız oldu.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Email or Username
  const login = async (
    identifier: string,
    password: string,
    rememberMe = false
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const email = identifier.includes('@')
        ? identifier.trim().toLowerCase()
        : `${identifier.trim().toLowerCase()}@imgivo.com`;

      // 1. Try Firebase Auth
      try {
        const appUser = await signInWithEmail(email, password);
        setUser(appUser);
        attachUserRealtimeListener(appUser.id);
        return { success: true };
      } catch (fbErr: any) {
        // Fallback to Express backend if demo credentials (e.g. admin@imgivo.com / admin123)
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password, rememberMe }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setUser(data.user);
          setToken(data.token);
          try {
            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
          } catch {}

          // Also create/sync to Firestore in background
          saveUserToFirestore(data.user.id, {
            id: data.user.id,
            name: data.user.name,
            username: data.user.username,
            email: data.user.email,
            role: data.user.role,
            plan: data.user.plan,
            premiumActive: data.user.premiumActive,
            premiumStartedAt: data.user.premiumStartedAt,
            premiumExpiresAt: data.user.premiumExpiresAt,
            createdAt: data.user.createdAt,
            updatedAt: Date.now(),
          }).catch(() => {});

          attachUserRealtimeListener(data.user.id);
          return { success: true };
        }

        return {
          success: false,
          error:
            fbErr?.code === 'auth/wrong-password' || fbErr?.code === 'auth/user-not-found' || fbErr?.code === 'auth/invalid-credential'
              ? 'E-posta veya şifre hatalı.'
              : (data.error || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.'),
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Giriş yapılamadı.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    passwordConfirm: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (data.password !== data.passwordConfirm) {
      return { success: false, error: 'Şifreler birbiriyle eşleşmiyor.' };
    }

    try {
      setIsLoading(true);

      // 1. Try Firebase Auth
      try {
        const appUser = await signUpWithEmail(data.name, data.username, data.email, data.password);
        setUser(appUser);
        attachUserRealtimeListener(appUser.id);
        return { success: true };
      } catch (fbErr: any) {
        // Fallback to Express backend if Firebase fails or blocked
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const resData = await res.json();
        if (res.ok && resData.success && resData.user) {
          setUser(resData.user);
          setToken(resData.token);
          localStorage.setItem(TOKEN_KEY, resData.token);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(resData.user));

          // Save to Firestore as well
          saveUserToFirestore(resData.user.id, resData.user).catch(() => {});
          attachUserRealtimeListener(resData.user.id);

          return { success: true };
        }

        return {
          success: false,
          error:
            fbErr?.code === 'auth/email-already-in-use'
              ? 'Bu e-posta adresi ile zaten kayıtlı bir hesap var.'
              : (resData.error || fbErr.message || 'Kayıt işlemi başarısız oldu.'),
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Kayıt sırasında bir hata oluştu.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    stopSnapshotListener();
    try {
      await logoutFromFirebase();
    } catch {}
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
    } catch {}
  };

  // Refresh User
  const refreshUser = async () => {
    if (user?.id) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const updated = mapFirestoreDocToUser(snap.data(), user.id);
          setUser(updated);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
        }
      } catch {}
    }
  };

  // Update Profile
  const updateProfile = async (updates: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Oturum açmanız gerekiyor.' };

    try {
      if (updates.name && updates.name !== user.name) {
        await saveUserToFirestore(user.id, {
          name: updates.name,
          email: user.email,
        });
      }

      // If backend token exists, trigger backend endpoint too
      if (token) {
        await authFetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }).catch(() => {});
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Profil güncellenemedi.' };
    }
  };

  // Admin: Set or Extend Premium in Firestore
  const adminSetPremium = async (
    targetUserId: string,
    options: {
      plan?: UserPlan;
      months?: number;
      years?: number;
      days?: number;
      cancel?: boolean;
    }
  ) => {
    await adminSetUserPremiumInFirestore(targetUserId, options);
    // Also trigger backend proxy if active
    if (token) {
      authFetch(`/api/admin/users/${targetUserId}/premium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      }).catch(() => {});
    }
  };

  // Admin: Set Role in Firestore
  const adminSetRole = async (targetUserId: string, role: UserRole) => {
    await adminSetUserRoleInFirestore(targetUserId, role);
    if (token) {
      authFetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      }).catch(() => {});
    }
  };

  // Admin: Delete User in Firestore
  const adminDeleteUser = async (targetUserId: string) => {
    await adminDeleteUserInFirestore(targetUserId);
    if (token) {
      authFetch(`/api/admin/users/${targetUserId}`, {
        method: 'DELETE',
      }).catch(() => {});
    }
  };

  const isPremium = Boolean(user && user.plan !== 'free' && user.premiumActive);
  const isAdmin = Boolean(user && (user.role === 'admin' || user.email === 'tores196316@gmail.com' || user.email === 'admin@imgivo.com'));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isPremium,
        isAdmin,
        login,
        loginGoogle,
        register,
        logout,
        refreshUser,
        updateProfile,
        adminSetPremium,
        adminSetRole,
        adminDeleteUser,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
