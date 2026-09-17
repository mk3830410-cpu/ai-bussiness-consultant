import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from './authService';
import { UserUsage } from '../subscriptionConfig';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://ai-bussiness-consultant.onrender.com';

export function getCurrentPeriodMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

const DEFAULT_USAGE: UserUsage = {
  periodMonth: getCurrentPeriodMonth(),
  analysesCount: 0,
  advisorMessagesCount: 0,
  lastUpdated: Date.now(),
};

function getLocalUsageKey(uid: string): string {
  return `stratiq_usage_${uid}`;
}

/**
 * Loads usage from local storage or returns fresh default.
 */
export function getCachedUsage(uid: string): UserUsage {
  try {
    const raw = localStorage.getItem(getLocalUsageKey(uid));
    if (raw) {
      const parsed: UserUsage = JSON.parse(raw);
      const currentPeriod = getCurrentPeriodMonth();
      if (parsed.periodMonth === currentPeriod) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[UsageService] Failed to read local usage cache:', err);
  }
  return {
    periodMonth: getCurrentPeriodMonth(),
    analysesCount: 0,
    advisorMessagesCount: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Saves usage to local cache.
 */
export function setCachedUsage(uid: string, usage: UserUsage): void {
  try {
    localStorage.setItem(getLocalUsageKey(uid), JSON.stringify(usage));
  } catch {}
}

/**
 * Fetches the user's monthly usage from Firestore or backend.
 */
export async function fetchUserUsage(uid: string): Promise<UserUsage> {
  if (!uid) return DEFAULT_USAGE;
  const currentPeriod = getCurrentPeriodMonth();

  try {
    const usageDocRef = doc(db, 'users', uid, 'usage', 'current');
    const snap = await getDoc(usageDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserUsage;
      if (data.periodMonth === currentPeriod) {
        setCachedUsage(uid, data);
        return data;
      }
    }
  } catch (err) {
    console.warn('[UsageService] Firestore usage fetch failed, trying backend API:', err);
  }

  // Fallback: Backend API
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch(`${API_BASE_URL}/api/usage/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.usage) {
          setCachedUsage(uid, json.usage);
          return json.usage;
        }
      }
    }
  } catch (backendErr) {
    console.warn('[UsageService] Backend usage fetch error:', backendErr);
  }

  return getCachedUsage(uid);
}

/**
 * Real-time listener for user usage in Firestore.
 */
export function subscribeToUserUsage(uid: string, onUpdate: (usage: UserUsage) => void): () => void {
  if (!uid) {
    onUpdate(DEFAULT_USAGE);
    return () => {};
  }

  const currentPeriod = getCurrentPeriodMonth();
  try {
    const usageDocRef = doc(db, 'users', uid, 'usage', 'current');
    return onSnapshot(
      usageDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserUsage;
          if (data.periodMonth === currentPeriod) {
            setCachedUsage(uid, data);
            onUpdate(data);
            return;
          }
        }
        onUpdate(getCachedUsage(uid));
      },
      (err) => {
        console.warn('[UsageService] Real-time usage snapshot error:', err);
        onUpdate(getCachedUsage(uid));
      }
    );
  } catch (e) {
    console.warn('[UsageService] Failed to bind Firestore snapshot:', e);
    onUpdate(getCachedUsage(uid));
    return () => {};
  }
}

/**
 * Records an analysis run on the backend and increments Firestore count.
 * Backend verifies token and subscription tier before authorizing.
 */
export async function recordAnalysisRun(mode: string): Promise<UserUsage> {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required to generate analysis.');

  const token = await user.getIdToken();
  const currentPeriod = getCurrentPeriodMonth();

  // 1. Authoritative Backend verification and recording
  let updatedUsage: UserUsage | null = null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/usage/record-analysis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode,
        periodMonth: currentPeriod,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 403) {
        const error: any = new Error(errData.message || 'Your Starter plan limit has been reached.');
        error.code = errData.code || 'LIMIT_REACHED';
        error.requiredPlan = errData.requiredPlan || 'pro';
        throw error;
      }
      throw new Error(errData.message || `Server verification failed (${response.status})`);
    }

    const data = await response.json();
    if (data.usage) {
      updatedUsage = data.usage;
    }
  } catch (apiError: any) {
    if (apiError.code === 'LIMIT_REACHED' || apiError.message?.includes('limit has been reached')) {
      throw apiError;
    }
    console.warn('[UsageService] Backend record-analysis call had network issue, updating Firestore directly:', apiError);
  }

  // 2. Synchronize Firestore usage document
  try {
    const current = updatedUsage || getCachedUsage(user.uid);
    const newCount = updatedUsage ? updatedUsage.analysesCount : current.analysesCount + 1;
    const finalUsage: UserUsage = {
      periodMonth: currentPeriod,
      analysesCount: newCount,
      advisorMessagesCount: current.advisorMessagesCount,
      lastUpdated: Date.now(),
    };

    const usageDocRef = doc(db, 'users', user.uid, 'usage', 'current');
    await setDoc(usageDocRef, finalUsage, { merge: true });
    setCachedUsage(user.uid, finalUsage);
    return finalUsage;
  } catch (firestoreErr) {
    console.warn('[UsageService] Failed to sync usage to Firestore:', firestoreErr);
    return updatedUsage || getCachedUsage(user.uid);
  }
}

/**
 * Records an AI Advisor message sent on the backend and increments Firestore count.
 */
export async function recordAdvisorMessage(): Promise<UserUsage> {
  const user = auth.currentUser;
  if (!user) return DEFAULT_USAGE;

  const token = await user.getIdToken();
  const currentPeriod = getCurrentPeriodMonth();

  try {
    const response = await fetch(`${API_BASE_URL}/api/usage/record-advisor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        periodMonth: currentPeriod,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.usage) {
        setCachedUsage(user.uid, data.usage);
        return data.usage;
      }
    }
  } catch (err) {
    console.warn('[UsageService] Failed to record advisor message on backend:', err);
  }

  // Client-side backup sync
  const current = getCachedUsage(user.uid);
  const finalUsage: UserUsage = {
    periodMonth: currentPeriod,
    analysesCount: current.analysesCount,
    advisorMessagesCount: current.advisorMessagesCount + 1,
    lastUpdated: Date.now(),
  };

  try {
    const usageDocRef = doc(db, 'users', user.uid, 'usage', 'current');
    await setDoc(usageDocRef, finalUsage, { merge: true });
  } catch {}

  setCachedUsage(user.uid, finalUsage);
  return finalUsage;
}
