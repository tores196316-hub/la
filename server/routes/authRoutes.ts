import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService, sanitizeUser, User } from '../services/userService.js';
import { jobManager } from '../services/jobManager.js';

export const authRouter = Router();

// Extend Express request type for authenticated routes
export interface AuthRequest extends Request {
  user?: User;
}

// Authentication middleware
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ success: false, error: 'Oturum açmanız gerekiyor.' });
    return;
  }

  const user = userService.verifyToken(authHeader);
  if (!user) {
    res.status(401).json({ success: false, error: 'Geçersiz veya süresi dolmuş oturum.' });
    return;
  }

  req.user = user;
  next();
}

// Admin only middleware
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Bu alana erişim yetkiniz bulunmuyor (Yönetici yetkisi gerekli).' });
      return;
    }
    next();
  });
}

// Optional Auth middleware (populates req.user if valid token present, otherwise proceeds)
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const user = userService.verifyToken(authHeader);
    if (user) {
      req.user = user;
    }
  }
  next();
}

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır.').max(100),
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır.').max(30).regex(/^[a-zA-Z0-9_.-]+$/, 'Kullanıcı adı sadece harf, rakam, alt çizgi ve nokta içerebilir.'),
  email: z.string().email('Geçerli bir e-posta adresi girin.').max(150),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.').max(100),
  passwordConfirm: z.string().min(6, 'Şifre tekrarı gereklidir.'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Şifreler birbiriyle uyuşmuyor.',
  path: ['passwordConfirm'],
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Lütfen e-posta veya kullanıcı adınızı girin.'),
  password: z.string().min(1, 'Lütfen şifrenizi girin.'),
  rememberMe: z.boolean().optional(),
});

/**
 * POST /api/auth/register
 */
authRouter.post('/auth/register', (req: Request, res: Response): void => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstErr = parseResult.error.issues[0]?.message || 'Lütfen form alanlarını kontrol edin.';
    res.status(400).json({ success: false, error: firstErr });
    return;
  }

  const { name, username, email, password } = parseResult.data;
  const result = userService.register({ name, username, email, password });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    message: 'Kayıt başarılı! Hesabınız oluşturuldu.',
    user: result.user,
    token: result.token,
  });
});

/**
 * POST /api/auth/login
 */
authRouter.post('/auth/login', (req: Request, res: Response): void => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstErr = parseResult.error.issues[0]?.message || 'Lütfen bilgilerinizi eksiksiz girin.';
    res.status(400).json({ success: false, error: firstErr });
    return;
  }

  const { identifier, password, rememberMe } = parseResult.data;
  const result = userService.login(identifier, password, !!rememberMe);

  if (!result.success) {
    res.status(401).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    message: 'Giriş başarılı!',
    user: result.user,
    token: result.token,
  });
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user
 */
authRouter.get('/auth/me', requireAuth, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Oturum bulunamadı.' });
    return;
  }
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

/**
 * POST /api/auth/sync-session
 * Synchronizes user state from Client (Firebase / Google) to backend memory and permanent store
 */
authRouter.post('/api/auth/sync-session', (req: Request, res: Response): void => {
  const { id, email, name, username, role, plan, premiumActive, premiumExpiresAt, premiumStartedAt } = req.body;
  if (!id || !email) {
    res.status(400).json({ success: false, error: 'Geçersiz kullanıcı bilgisi.' });
    return;
  }

  const syncedUser = userService.upsertUserFromClient({
    id,
    email,
    name,
    username,
    role,
    plan,
    premiumActive,
    premiumExpiresAt,
    premiumStartedAt,
  });

  const token = userService.createSession(syncedUser.id, 30 * 24 * 60 * 60 * 1000);

  res.json({
    success: true,
    user: syncedUser,
    token,
  });
});

// Also support /auth/sync-session (without /api prefix inside router)
authRouter.post('/auth/sync-session', (req: Request, res: Response): void => {
  const { id, email, name, username, role, plan, premiumActive, premiumExpiresAt, premiumStartedAt } = req.body;
  if (!id || !email) {
    res.status(400).json({ success: false, error: 'Geçersiz kullanıcı bilgisi.' });
    return;
  }

  const syncedUser = userService.upsertUserFromClient({
    id,
    email,
    name,
    username,
    role,
    plan,
    premiumActive,
    premiumExpiresAt,
    premiumStartedAt,
  });

  const token = userService.createSession(syncedUser.id, 30 * 24 * 60 * 60 * 1000);

  res.json({
    success: true,
    user: syncedUser,
    token,
  });
});

/**
 * PUT /api/auth/profile
 * Update name or password
 */
authRouter.put('/auth/profile', requireAuth, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Oturum bulunamadı.' });
    return;
  }

  const { name, currentPassword, newPassword } = req.body;
  const result = userService.updateProfile(req.user.id, { name, currentPassword, newPassword });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    message: 'Profil başarıyla güncellendi.',
    user: result.user,
  });
});

/**
 * GET /api/user/history
 * Returns the authenticated user's private download history
 */
authRouter.get('/user/history', requireAuth, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Yetkisiz erişim.' });
    return;
  }

  const history = userService.getUserHistory(req.user.id);
  res.json({
    success: true,
    data: history,
  });
});

/**
 * POST /api/user/history
 * Saves a completed/in-progress job to user history
 */
authRouter.post('/user/history', requireAuth, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Yetkisiz erişim.' });
    return;
  }

  const { jobId, url, title, thumbnail, format, quality, fileSizeBytes, status } = req.body;
  if (!jobId || !url || !title) {
    res.status(400).json({ success: false, error: 'Eksik kayıt parametreleri.' });
    return;
  }

  const record = userService.addHistoryItem({
    userId: req.user.id,
    jobId,
    url,
    title,
    thumbnail: thumbnail || '',
    format: format || 'mp4',
    quality: quality || '1080p',
    fileSizeBytes,
    status: status || 'completed',
  });

  res.json({
    success: true,
    data: record,
  });
});

/**
 * DELETE /api/user/history
 * Clears private history
 */
authRouter.delete('/user/history', requireAuth, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Yetkisiz erişim.' });
    return;
  }

  userService.clearUserHistory(req.user.id);
  res.json({
    success: true,
    message: 'Geçmişiniz temizlendi.',
  });
});

/**
 * GET /api/admin/dashboard
 * Full analytics dashboard for admins
 */
authRouter.get('/admin/dashboard', requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  const userStats = userService.getAdminDashboardStats();
  const conversionStats = await jobManager.getAdminStats();

  res.json({
    success: true,
    data: {
      users: userStats,
      conversions: {
        total: conversionStats.totalConversions,
        successful: conversionStats.successfulConversions,
        failed: conversionStats.failedConversions,
        today: conversionStats.todayConversions,
        activeJobs: conversionStats.activeJobs,
        formatPopularity: conversionStats.formatPopularity,
      },
      system: conversionStats.system,
    },
  });
});

/**
 * GET /api/admin/users
 * Returns list of all registered users
 */
authRouter.get('/admin/users', requireAdmin, (_req: AuthRequest, res: Response): void => {
  const users = userService.getAllUsers();
  res.json({
    success: true,
    data: users,
  });
});

/**
 * POST /api/admin/users/:userId/premium
 * Set, extend, shorten, or cancel user's Premium membership
 */
authRouter.post('/admin/users/:userId/premium', requireAdmin, (req: AuthRequest, res: Response): void => {
  const { userId } = req.params;
  const { plan, months, years, days, customExpiryTimestamp, cancel } = req.body;

  const result = userService.setPremiumDuration(userId, {
    plan,
    months: months ? Number(months) : undefined,
    years: years ? Number(years) : undefined,
    days: days ? Number(days) : undefined,
    customExpiryTimestamp: customExpiryTimestamp ? Number(customExpiryTimestamp) : undefined,
    cancel: Boolean(cancel),
  });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    message: cancel ? 'Kullanıcının premium üyeliği iptal edildi.' : 'Premium üyelik süresi başarıyla güncellendi.',
    user: result.user,
  });
});

/**
 * POST /api/admin/users/:userId/role
 * Change user role (user/admin)
 */
authRouter.post('/admin/users/:userId/role', requireAdmin, (req: AuthRequest, res: Response): void => {
  const { userId } = req.params;
  const { role } = req.body;

  if (role !== 'user' && role !== 'admin') {
    res.status(400).json({ success: false, error: 'Geçersiz rol.' });
    return;
  }

  const result = userService.setUserRole(userId, role);
  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    message: `Kullanıcı rolü "${role}" olarak güncellendi.`,
    user: result.user,
  });
});

/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
authRouter.delete('/admin/users/:userId', requireAdmin, (req: AuthRequest, res: Response): void => {
  const { userId } = req.params;
  const result = userService.deleteUser(userId);

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    message: 'Kullanıcı hesabı başarıyla silindi.',
  });
});
