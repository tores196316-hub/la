import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';

const TOKEN_KEY = 'imgivo_auth_token_v1';
const USER_CACHE_KEY = 'imgivo_user_cache_v1';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; username: string; email: string; password: string; passwordConfirm: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; currentPassword?: string; newPassword?: string }) => Promise<{ success: boolean; error?: string }>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Authenticated fetch helper that injects Bearer token
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

  // Fetch current user details with token
  const fetchMe = useCallback(
    async (authToken: string) => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            try {
              localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
            } catch {}
            return;
          }
        }
        // Token invalid or expired
        setToken(null);
        setUser(null);
        try {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_CACHE_KEY);
        } catch {}
      } catch (err) {
        // Network error - keep cached user for offline viewing if present
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setIsLoading(false);
    }
  }, [token, fetchMe]);

  const login = async (identifier: string, password: string, rememberMe = false): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Giriş yapılamadı.' };
      }

      setToken(data.token);
      setUser(data.user);
      try {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Sunucuya bağlanırken bir hata oluştu.' };
    }
  };

  const register = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    passwordConfirm: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || 'Kayıt oluşturulamadı.' };
      }

      setToken(resData.token);
      setUser(resData.user);
      try {
        localStorage.setItem(TOKEN_KEY, resData.token);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(resData.user));
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Sunucuya bağlanırken bir hata oluştu.' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
    } catch {}
  };

  const refreshUser = async () => {
    if (token) {
      await fetchMe(token);
    }
  };

  const updateProfile = async (updates: { name?: string; currentPassword?: string; newPassword?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Oturum açmanız gerekiyor.' };

    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Profil güncellenemedi.' };
      }

      setUser(data.user);
      try {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Sunucu hatası oluştu.' };
    }
  };

  const isPremium = Boolean(user && user.plan !== 'free' && user.premiumActive);
  const isAdmin = Boolean(user && user.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isPremium,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
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
