import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, HistoryItem, UserRole, UserPlan } from '../types';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { onAuthStateChanged };

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection on boot
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase bağlantısı offline modda.');
    }
  }
})();

// Firestore Error Handler helper conforming to standards
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Format remaining subscription time into Turkish friendly string
 */
export function formatRemainingTime(expiresAt?: number | null): {
  isActive: boolean;
  remainingDays: number;
  formatted: string;
} {
  if (!expiresAt) {
    return { isActive: false, remainingDays: 0, formatted: 'Ücretsiz Plan' };
  }

  const now = Date.now();
  const diffMs = expiresAt - now;

  if (diffMs <= 0) {
    return { isActive: false, remainingDays: 0, formatted: 'Süresi doldu' };
  }

  const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const remainingAfterYears = totalDays % 365;
  const months = Math.floor(remainingAfterYears / 30);
  const days = remainingAfterYears % 30;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yıl`);
  if (months > 0) parts.push(`${months} ay`);
  if (days > 0 && years === 0) parts.push(`${days} gün`);

  const formatted = parts.length > 0 ? `${parts.join(' ')} kaldı` : '1 günden az kaldı';

  return {
    isActive: true,
    remainingDays: totalDays,
    formatted,
  };
}

/**
 * Transform Firestore document data into standard application User object
 */
export function mapFirestoreDocToUser(docData: any, docId: string): User {
  const expiresAt = docData.premiumExpiresAt || null;
  const calc = formatRemainingTime(expiresAt);
  const role: UserRole = docData.role === 'admin' ? 'admin' : 'user';
  const plan: UserPlan = docData.plan || 'free';
  const premiumActive = Boolean(docData.premiumActive && calc.isActive);

  return {
    id: docId,
    name: docData.name || 'IMGIVO Kullanıcısı',
    username: docData.username || docData.email?.split('@')[0] || docId.slice(0, 8),
    email: docData.email || '',
    role,
    plan,
    premiumActive,
    premiumStartedAt: docData.premiumStartedAt || null,
    premiumExpiresAt: expiresAt,
    remainingDays: calc.remainingDays,
    remainingFormatted: calc.formatted,
    createdAt: docData.createdAt || Date.now(),
    updatedAt: docData.updatedAt || Date.now(),
  };
}

/**
 * Real-time Listener on current user's profile document in Firestore
 * This triggers INSTANTLY when an admin updates duration or role in Admin panel!
 */
export function subscribeToUserDoc(
  uid: string,
  onUserUpdate: (user: User | null) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const mapped = mapFirestoreDocToUser(docSnap.data(), docSnap.id);
        onUserUpdate(mapped);
      } else {
        onUserUpdate(null);
      }
    },
    (err) => {
      console.error('User subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time Listener on all users collection for Admin Panel
 * Any modification instantly renders across all admin views with zero reload!
 */
export function subscribeToAllUsers(
  onUsersUpdate: (users: User[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const usersRef = collection(db, 'users');
  return onSnapshot(
    usersRef,
    (querySnap) => {
      const list: User[] = [];
      querySnap.forEach((d) => {
        list.push(mapFirestoreDocToUser(d.data(), d.id));
      });
      // Sort by creation date descending
      list.sort((a, b) => b.createdAt - a.createdAt);
      onUsersUpdate(list);
    },
    (err) => {
      console.error('All users subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener on user download history subcollection
 */
export function subscribeToUserHistory(
  userId: string,
  onHistoryUpdate: (items: HistoryItem[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const historyRef = collection(db, 'users', userId, 'history');
  const q = query(historyRef, orderBy('timestamp', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: HistoryItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          jobId: d.jobId || docSnap.id,
          url: d.url || '',
          title: d.title || 'İsimsiz Video',
          thumbnail: d.thumbnail || '',
          format: d.format || 'mp4',
          quality: d.quality || '720p',
          timestamp: d.timestamp || Date.now(),
          fileSizeBytes: d.fileSizeBytes,
          status: d.status || 'completed',
        });
      });
      onHistoryUpdate(items);
    },
    (err) => {
      console.error('History subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save / Update User in Firestore
 */
export async function saveUserToFirestore(
  uid: string,
  userData: Partial<User> & { email: string }
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const now = Date.now();

  const dataToSave = {
    ...userData,
    id: uid,
    updatedAt: now,
  };

  try {
    await setDoc(userRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

/**
 * Admin: Apply or Extend Premium duration for a user
 * Real-time updates propagate automatically via onSnapshot!
 */
export async function adminSetUserPremiumInFirestore(
  targetUserId: string,
  options: {
    plan?: UserPlan;
    months?: number;
    years?: number;
    days?: number;
    cancel?: boolean;
  }
): Promise<void> {
  const userRef = doc(db, 'users', targetUserId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('Kullanıcı bulunamadı.');
  }

  const currentData = userSnap.data();

  if (options.cancel) {
    await updateDoc(userRef, {
      plan: 'free',
      premiumActive: false,
      premiumExpiresAt: null,
      updatedAt: Date.now(),
    });
    return;
  }

  const now = Date.now();
  const currentExpiry = currentData.premiumExpiresAt;
  const baseTime = currentExpiry && currentExpiry > now ? currentExpiry : now;

  let addedMs = 0;
  if (options.years) addedMs += options.years * 365 * 24 * 60 * 60 * 1000;
  if (options.months) addedMs += options.months * 30 * 24 * 60 * 60 * 1000;
  if (options.days) addedMs += options.days * 24 * 60 * 60 * 1000;

  if (addedMs <= 0) addedMs = 30 * 24 * 60 * 60 * 1000; // default 1 month

  const newExpiry = baseTime + addedMs;
  const plan = options.plan || 'premium';

  await updateDoc(userRef, {
    plan,
    premiumActive: true,
    premiumStartedAt: currentData.premiumStartedAt || now,
    premiumExpiresAt: newExpiry,
    updatedAt: now,
  });
}

/**
 * Admin: Change User Role (user / admin)
 */
export async function adminSetUserRoleInFirestore(
  targetUserId: string,
  role: UserRole
): Promise<void> {
  const userRef = doc(db, 'users', targetUserId);
  await updateDoc(userRef, {
    role,
    updatedAt: Date.now(),
  });
}

/**
 * Admin: Delete User
 */
export async function adminDeleteUserInFirestore(targetUserId: string): Promise<void> {
  const userRef = doc(db, 'users', targetUserId);
  await deleteDoc(userRef);
}

/**
 * Add history record to user subcollection
 */
export async function addHistoryRecordToFirestore(
  userId: string,
  item: Omit<HistoryItem, 'id'>
): Promise<void> {
  try {
    const historyRef = collection(db, 'users', userId, 'history');
    const newDoc = doc(historyRef);
    await setDoc(newDoc, {
      ...item,
      id: newDoc.id,
      timestamp: item.timestamp || Date.now(),
    });
  } catch (error) {
    console.error('History record save error:', error);
  }
}

/**
 * Clear user history subcollection
 */
export async function clearUserHistoryInFirestore(userId: string): Promise<void> {
  try {
    const historyRef = collection(db, 'users', userId, 'history');
    const snap = await getDocs(historyRef);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Clear history error:', error);
  }
}

/**
 * Google Sign-In with popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  const userRef = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(userRef);

  let mappedUser: User;
  const now = Date.now();

  const isBootstrapAdmin =
    fbUser.email === 'admin@imgivo.com' || fbUser.email === 'tores196316@gmail.com';

  if (!snap.exists()) {
    // Create new profile in Firestore
    const newUserData = {
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
    await setDoc(userRef, newUserData);
    mappedUser = mapFirestoreDocToUser(newUserData, fbUser.uid);
  } else {
    const existing = snap.data();
    mappedUser = mapFirestoreDocToUser(existing, fbUser.uid);
  }

  return mappedUser;
}

/**
 * Email/Password Sign-In
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));

  if (userDoc.exists()) {
    return mapFirestoreDocToUser(userDoc.data(), cred.user.uid);
  }

  // If no doc exists yet, generate fallback
  const isBootstrapAdmin =
    cred.user.email === 'admin@imgivo.com' || cred.user.email === 'tores196316@gmail.com';
  const now = Date.now();
  const fallback = {
    id: cred.user.uid,
    name: cred.user.displayName || email.split('@')[0],
    username: email.split('@')[0],
    email: email,
    role: (isBootstrapAdmin ? 'admin' : 'user') as UserRole,
    plan: (isBootstrapAdmin ? 'premium_plus' : 'free') as UserPlan,
    premiumActive: isBootstrapAdmin,
    premiumStartedAt: isBootstrapAdmin ? now : null,
    premiumExpiresAt: isBootstrapAdmin ? now + 365 * 24 * 60 * 60 * 1000 : null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'users', cred.user.uid), fallback);
  return mapFirestoreDocToUser(fallback, cred.user.uid);
}

/**
 * Email/Password Registration
 */
export async function signUpWithEmail(
  name: string,
  username: string,
  email: string,
  pass: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const now = Date.now();
  const isBootstrapAdmin =
    email === 'admin@imgivo.com' || email === 'tores196316@gmail.com';

  const newUserData = {
    id: cred.user.uid,
    name: name.trim(),
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    role: (isBootstrapAdmin ? 'admin' : 'user') as UserRole,
    plan: (isBootstrapAdmin ? 'premium_plus' : 'free') as UserPlan,
    premiumActive: isBootstrapAdmin,
    premiumStartedAt: isBootstrapAdmin ? now : null,
    premiumExpiresAt: isBootstrapAdmin ? now + 365 * 24 * 60 * 60 * 1000 : null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'users', cred.user.uid), newUserData);
  return mapFirestoreDocToUser(newUserData, cred.user.uid);
}

/**
 * Logout
 */
export async function logoutFromFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Reset password email
 */
export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Real-time subscription to Pricing Settings
 */
export function subscribeToPricingSettings(
  onUpdate: (pricing: {
    premiumMonthly: number;
    premiumDiscountPercent: number;
    premiumPlusMonthly: number;
    premiumPlusDiscountPercent: number;
    updatedAt?: number;
  }) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const settingsDocRef = doc(db, 'settings', 'pricing');
  return onSnapshot(
    settingsDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          premiumMonthly: typeof data.premiumMonthly === 'number' ? data.premiumMonthly : 69,
          premiumDiscountPercent:
            typeof data.premiumDiscountPercent === 'number' ? data.premiumDiscountPercent : 30,
          premiumPlusMonthly:
            typeof data.premiumPlusMonthly === 'number' ? data.premiumPlusMonthly : 119,
          premiumPlusDiscountPercent:
            typeof data.premiumPlusDiscountPercent === 'number' ? data.premiumPlusDiscountPercent : 25,
          updatedAt: data.updatedAt,
        });
      } else {
        // Fallback default
        onUpdate({
          premiumMonthly: 69,
          premiumDiscountPercent: 30,
          premiumPlusMonthly: 119,
          premiumPlusDiscountPercent: 25,
        });
      }
    },
    (err) => {
      console.error('Pricing subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Update pricing settings in Firestore (Admin only)
 */
export async function updatePricingSettingsInFirestore(pricing: {
  premiumMonthly: number;
  premiumDiscountPercent: number;
  premiumPlusMonthly: number;
  premiumPlusDiscountPercent: number;
}): Promise<void> {
  const settingsDocRef = doc(db, 'settings', 'pricing');
  await setDoc(
    settingsDocRef,
    {
      ...pricing,
      id: 'pricing',
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

/**
 * Real-time subscription to Speed & Queue Settings
 */
export function subscribeToSpeedSettings(
  onUpdate: (speeds: {
    freeSpeedLimitKbps: number;
    freeQueueDelaySeconds: number;
    premiumSpeedLimitKbps: number;
    premiumConcurrentFragments: number;
    premiumPlusSpeedLimitKbps: number;
    premiumPlusConcurrentFragments: number;
    updatedAt?: number;
  }) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const settingsDocRef = doc(db, 'settings', 'speed');
  return onSnapshot(
    settingsDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          freeSpeedLimitKbps: typeof data.freeSpeedLimitKbps === 'number' ? data.freeSpeedLimitKbps : 3500,
          freeQueueDelaySeconds: typeof data.freeQueueDelaySeconds === 'number' ? data.freeQueueDelaySeconds : 1,
          premiumSpeedLimitKbps: typeof data.premiumSpeedLimitKbps === 'number' ? data.premiumSpeedLimitKbps : 0,
          premiumConcurrentFragments: typeof data.premiumConcurrentFragments === 'number' ? data.premiumConcurrentFragments : 4,
          premiumPlusSpeedLimitKbps: typeof data.premiumPlusSpeedLimitKbps === 'number' ? data.premiumPlusSpeedLimitKbps : 0,
          premiumPlusConcurrentFragments: typeof data.premiumPlusConcurrentFragments === 'number' ? data.premiumPlusConcurrentFragments : 8,
          updatedAt: data.updatedAt,
        });
      } else {
        onUpdate({
          freeSpeedLimitKbps: 3500,
          freeQueueDelaySeconds: 1,
          premiumSpeedLimitKbps: 0,
          premiumConcurrentFragments: 4,
          premiumPlusSpeedLimitKbps: 0,
          premiumPlusConcurrentFragments: 8,
        });
      }
    },
    (err) => {
      console.error('Speed settings subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Update speed settings in Firestore (Admin only)
 */
export async function updateSpeedSettingsInFirestore(speeds: {
  freeSpeedLimitKbps: number;
  freeQueueDelaySeconds: number;
  premiumSpeedLimitKbps: number;
  premiumConcurrentFragments: number;
  premiumPlusSpeedLimitKbps: number;
  premiumPlusConcurrentFragments: number;
}): Promise<void> {
  const settingsDocRef = doc(db, 'settings', 'speed');
  await setDoc(
    settingsDocRef,
    {
      ...speeds,
      id: 'speed',
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

