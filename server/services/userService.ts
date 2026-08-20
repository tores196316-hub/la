import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type UserRole = 'user' | 'admin';
export type UserPlan = 'free' | 'premium' | 'premium_plus';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  plan: UserPlan;
  premiumActive: boolean;
  premiumStartedAt: number | null;
  premiumExpiresAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface SanitizedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  premiumActive: boolean;
  premiumStartedAt: number | null;
  premiumExpiresAt: number | null;
  remainingDays: number | null;
  remainingFormatted: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserDownloadRecord {
  id: string;
  userId: string;
  jobId: string;
  url: string;
  title: string;
  thumbnail: string;
  format: string;
  quality: string;
  fileSizeBytes?: number;
  status: 'completed' | 'processing' | 'failed';
  timestamp: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'tmp', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_FILE = path.join(DATA_DIR, 'user_history.json');
const JWT_SECRET = process.env.JWT_SECRET || 'imgivo_production_secure_secret_key_2026';

// In-memory token store for fast, revocation-ready sessions
const activeSessions = new Map<string, { userId: string; expiresAt: number }>();

// Ensure data directory exists
function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Veri dizini oluşturulamadı:', err);
  }
}

// Password hashing using Node.js crypto PBKDF2 (100,000 iterations, 64 bytes)
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Format remaining time nicely (e.g. "1 yıl 2 ay kaldı", "24 gün kaldı", "3 gün kaldı", "Süresi doldu")
export function formatRemainingTime(expiresAt: number | null): { days: number | null; formatted: string; isActive: boolean } {
  if (!expiresAt) {
    return { days: null, formatted: 'Süresiz / Free', isActive: false };
  }

  const now = Date.now();
  const diffMs = expiresAt - now;

  if (diffMs <= 0) {
    return { days: 0, formatted: 'Süresi doldu', isActive: false };
  }

  const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const remainingDaysAfterYears = totalDays % 365;
  const months = Math.floor(remainingDaysAfterYears / 30);
  const days = remainingDaysAfterYears % 30;

  let formatted = '';
  if (years > 0) {
    formatted = `${years} yıl ${months > 0 ? `${months} ay ` : ''}kaldı`;
  } else if (months > 0) {
    formatted = `${months} ay ${days > 0 ? `${days} gün ` : ''}kaldı`;
  } else {
    formatted = `${totalDays} gün kaldı`;
  }

  return { days: totalDays, formatted, isActive: true };
}

// Sanitize user before returning to client (strip hash & salt, add dynamic remaining time)
export function sanitizeUser(user: User): SanitizedUser {
  const { days, formatted, isActive } = formatRemainingTime(user.premiumExpiresAt);
  const isActualPremium = user.plan !== 'free' && (user.premiumExpiresAt ? isActive : user.premiumActive);

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    plan: isActualPremium ? user.plan : 'free',
    premiumActive: isActualPremium,
    premiumStartedAt: user.premiumStartedAt,
    premiumExpiresAt: user.premiumExpiresAt,
    remainingDays: isActualPremium ? days : null,
    remainingFormatted: isActualPremium ? formatted : 'Standart (Free)',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

class UserService {
  private users: Map<string, User> = new Map();
  private userHistory: Map<string, UserDownloadRecord[]> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.initialized) return;
    ensureDataDir();
    this.loadUsers();
    this.loadHistory();
    this.seedDefaultAdmin();
    this.initialized = true;
  }

  private loadUsers(): void {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const data: User[] = JSON.parse(raw);
        this.users.clear();
        for (const u of data) {
          this.users.set(u.id, u);
        }
      }
    } catch (err) {
      console.error('Kullanıcı veritabanı okunamadı, boş başlatılıyor:', err);
    }
  }

  private saveUsers(): void {
    try {
      ensureDataDir();
      const list = Array.from(this.users.values());
      fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Kullanıcılar diske kaydedilemedi:', err);
    }
  }

  private loadHistory(): void {
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
        const data: UserDownloadRecord[] = JSON.parse(raw);
        this.userHistory.clear();
        for (const item of data) {
          const list = this.userHistory.get(item.userId) || [];
          list.push(item);
          this.userHistory.set(item.userId, list);
        }
      }
    } catch (err) {
      console.error('Kullanıcı geçmişi okunamadı:', err);
    }
  }

  private saveHistory(): void {
    try {
      ensureDataDir();
      const flatList: UserDownloadRecord[] = [];
      for (const list of this.userHistory.values()) {
        flatList.push(...list);
      }
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(flatList, null, 2), 'utf-8');
    } catch (err) {
      console.error('Kullanıcı geçmişi diske kaydedilemedi:', err);
    }
  }

  // Seed default Admin user if none exists
  private seedDefaultAdmin(): void {
    const adminExists = Array.from(this.users.values()).some((u) => u.role === 'admin');
    if (!adminExists) {
      const salt = generateSalt();
      const adminId = 'admin_' + crypto.randomBytes(6).toString('hex');
      const oneYearExpiry = Date.now() + 365 * 24 * 60 * 60 * 1000;

      const adminUser: User = {
        id: adminId,
        name: 'IMGIVO Yönetici',
        username: 'admin',
        email: 'admin@imgivo.com',
        salt,
        passwordHash: hashPassword('admin123', salt),
        role: 'admin',
        plan: 'premium_plus',
        premiumActive: true,
        premiumStartedAt: Date.now(),
        premiumExpiresAt: oneYearExpiry,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      this.users.set(adminId, adminUser);
      this.saveUsers();
      console.log('👑 Varsayılan Admin hesabı oluşturuldu: admin@imgivo.com / admin123');
    }
  }

  // Register a new user
  public register(data: {
    name: string;
    username: string;
    email: string;
    password: string;
  }): { success: boolean; user?: SanitizedUser; token?: string; error?: string } {
    this.init();

    const name = data.name.trim();
    const username = data.username.trim().toLowerCase();
    const email = data.email.trim().toLowerCase();
    const password = data.password;

    if (!name || name.length < 2) {
      return { success: false, error: 'Lütfen geçerli bir Ad Soyad girin (en az 2 karakter).' };
    }
    if (!username || username.length < 3 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return { success: false, error: 'Kullanıcı adı en az 3 karakter olmalı ve yalnızca harf, rakam, alt çizgi içerebilir.' };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Lütfen geçerli bir e-posta adresi girin.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Şifre en az 6 karakter olmalıdır.' };
    }

    // Check unique email and username
    for (const u of this.users.values()) {
      if (u.email === email) {
        return { success: false, error: 'Bu e-posta adresi ile kayıtlı bir hesap zaten var.' };
      }
      if (u.username === username) {
        return { success: false, error: 'Bu kullanıcı adı zaten alınmış.' };
      }
    }

    const salt = generateSalt();
    const id = 'usr_' + crypto.randomBytes(8).toString('hex');
    const now = Date.now();

    const newUser: User = {
      id,
      name,
      username,
      email,
      salt,
      passwordHash: hashPassword(password, salt),
      role: 'user',
      plan: 'free',
      premiumActive: false,
      premiumStartedAt: null,
      premiumExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, newUser);
    this.saveUsers();

    const token = this.createSession(id);
    return { success: true, user: sanitizeUser(newUser), token };
  }

  // Login with email or username
  public login(
    identifier: string,
    password: string,
    rememberMe = false
  ): { success: boolean; user?: SanitizedUser; token?: string; error?: string } {
    this.init();
    const term = identifier.trim().toLowerCase();

    let targetUser: User | undefined;
    for (const u of this.users.values()) {
      if (u.email === term || u.username === term) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      return { success: false, error: 'E-posta/kullanıcı adı veya şifre hatalı.' };
    }

    const inputHash = hashPassword(password, targetUser.salt);
    if (!crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(targetUser.passwordHash))) {
      return { success: false, error: 'E-posta/kullanıcı adı veya şifre hatalı.' };
    }

    const token = this.createSession(targetUser.id, rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
    return { success: true, user: sanitizeUser(targetUser), token };
  }

  // Session Token management
  public createSession(userId: string, durationMs = 7 * 24 * 60 * 60 * 1000): string {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${userId}:${rawToken}`).digest('hex');
    const token = `${userId}.${rawToken}.${signature}`;
    
    activeSessions.set(token, {
      userId,
      expiresAt: Date.now() + durationMs,
    });

    return token;
  }

  public verifyToken(token: string | undefined | null): User | null {
    if (!token) return null;
    this.init();

    // Check header format "Bearer <token>"
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    if (!cleanToken) return null;

    const parts = cleanToken.split('.');
    if (parts.length !== 3) return null;

    const [userId, rawToken, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${userId}:${rawToken}`).digest('hex');
    
    try {
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return null;
      }
    } catch {
      return null;
    }

    // Check expiration in session map or decode
    const session = activeSessions.get(cleanToken);
    if (session && session.expiresAt < Date.now()) {
      activeSessions.delete(cleanToken);
      return null;
    }

    const user = this.users.get(userId);
    if (!user) return null;

    return user;
  }

  public getUserById(userId: string): User | null {
    this.init();
    return this.users.get(userId) || null;
  }

  public getAllUsers(): SanitizedUser[] {
    this.init();
    return Array.from(this.users.values())
      .map(sanitizeUser)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Update user profile
  public updateProfile(
    userId: string,
    updates: { name?: string; currentPassword?: string; newPassword?: string }
  ): { success: boolean; user?: SanitizedUser; error?: string } {
    this.init();
    const user = this.users.get(userId);
    if (!user) return { success: false, error: 'Kullanıcı bulunamadı.' };

    if (updates.name && updates.name.trim().length >= 2) {
      user.name = updates.name.trim();
    }

    if (updates.newPassword) {
      if (!updates.currentPassword) {
        return { success: false, error: 'Şifrenizi değiştirmek için mevcut şifrenizi girmelisiniz.' };
      }
      const currentHash = hashPassword(updates.currentPassword, user.salt);
      if (!crypto.timingSafeEqual(Buffer.from(currentHash), Buffer.from(user.passwordHash))) {
        return { success: false, error: 'Mevcut şifreniz yanlış.' };
      }
      if (updates.newPassword.length < 6) {
        return { success: false, error: 'Yeni şifre en az 6 karakter olmalıdır.' };
      }
      const newSalt = generateSalt();
      user.salt = newSalt;
      user.passwordHash = hashPassword(updates.newPassword, newSalt);
    }

    user.updatedAt = Date.now();
    this.saveUsers();

    return { success: true, user: sanitizeUser(user) };
  }

  // Admin: Update user role
  public setUserRole(userId: string, role: UserRole): { success: boolean; error?: string; user?: SanitizedUser } {
    this.init();
    const user = this.users.get(userId);
    if (!user) return { success: false, error: 'Kullanıcı bulunamadı.' };

    user.role = role;
    user.updatedAt = Date.now();
    this.saveUsers();
    return { success: true, user: sanitizeUser(user) };
  }

  // Admin: Update or extend user Premium duration
  public setPremiumDuration(
    userId: string,
    options: {
      plan?: UserPlan;
      months?: number;
      years?: number;
      days?: number;
      customExpiryTimestamp?: number;
      cancel?: boolean;
    }
  ): { success: boolean; error?: string; user?: SanitizedUser } {
    this.init();
    const user = this.users.get(userId);
    if (!user) return { success: false, error: 'Kullanıcı bulunamadı.' };

    const now = Date.now();

    if (options.cancel) {
      user.plan = 'free';
      user.premiumActive = false;
      user.premiumExpiresAt = now - 1000;
      user.updatedAt = now;
      this.saveUsers();
      return { success: true, user: sanitizeUser(user) };
    }

    const plan = options.plan || (user.plan === 'free' ? 'premium' : user.plan);
    let baseTime = now;

    // If user currently has active premium, add onto existing expiry
    if (user.premiumExpiresAt && user.premiumExpiresAt > now) {
      baseTime = user.premiumExpiresAt;
    }

    let durationMs = 0;
    if (options.customExpiryTimestamp) {
      user.premiumExpiresAt = options.customExpiryTimestamp;
    } else {
      if (options.years) durationMs += options.years * 365 * 24 * 60 * 60 * 1000;
      if (options.months) durationMs += options.months * 30 * 24 * 60 * 60 * 1000;
      if (options.days) durationMs += options.days * 24 * 60 * 60 * 1000;

      if (durationMs <= 0) {
        durationMs = 30 * 24 * 60 * 60 * 1000; // Default 1 month
      }

      user.premiumExpiresAt = baseTime + durationMs;
    }

    user.plan = plan;
    user.premiumActive = true;
    if (!user.premiumStartedAt) {
      user.premiumStartedAt = now;
    }
    user.updatedAt = now;

    this.saveUsers();
    return { success: true, user: sanitizeUser(user) };
  }

  // Admin: Delete user
  public deleteUser(userId: string): { success: boolean; error?: string } {
    this.init();
    const user = this.users.get(userId);
    if (!user) return { success: false, error: 'Kullanıcı bulunamadı.' };
    if (user.username === 'admin') {
      return { success: false, error: 'Ana yönetici hesabı silinemez.' };
    }

    this.users.delete(userId);
    this.userHistory.delete(userId);
    this.saveUsers();
    this.saveHistory();
    return { success: true };
  }

  // User History
  public addHistoryItem(item: Omit<UserDownloadRecord, 'id' | 'timestamp'>): UserDownloadRecord {
    this.init();
    const record: UserDownloadRecord = {
      ...item,
      id: `${item.jobId}_${Date.now()}`,
      timestamp: Date.now(),
    };

    const list = this.userHistory.get(item.userId) || [];
    // Remove if already exists with same jobId
    const filtered = list.filter((i) => i.jobId !== item.jobId);
    filtered.unshift(record);
    // Keep max 50 items per user
    this.userHistory.set(item.userId, filtered.slice(0, 50));
    this.saveHistory();
    return record;
  }

  public getUserHistory(userId: string): UserDownloadRecord[] {
    this.init();
    return this.userHistory.get(userId) || [];
  }

  public clearUserHistory(userId: string): void {
    this.init();
    this.userHistory.delete(userId);
    this.saveHistory();
  }

  // Admin dashboard metrics
  public getAdminDashboardStats() {
    this.init();
    const allUsers = Array.from(this.users.values());
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    let activePremium = 0;
    let expiredPremium = 0;
    let todayUsers = 0;

    for (const u of allUsers) {
      if (u.createdAt >= oneDayAgo) {
        todayUsers++;
      }
      if (u.plan !== 'free') {
        if (u.premiumExpiresAt && u.premiumExpiresAt > now) {
          activePremium++;
        } else {
          expiredPremium++;
        }
      }
    }

    return {
      totalUsers: allUsers.length,
      activePremiumUsers: activePremium,
      expiredPremiumUsers: expiredPremium,
      todayUsers,
    };
  }
}

export const userService = new UserService();
