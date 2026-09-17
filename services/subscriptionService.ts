import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { UserSubscription } from '../types';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Get Backend API URL from environment variables
 * Configured in Vercel/local as VITE_API_URL
 */
export function getBackendApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.replace(/\/+$/, '');
  }
  // In local development fallback to standard backend port 10000
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:10000';
  }
  // Production fallback if VITE_API_URL is missing
  return '';
}

/**
 * Dynamically load Razorpay Checkout script if not already present
 */
export async function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[StratIQ] Failed to load Razorpay Checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Fetch current subscription status from backend API
 */
export async function fetchCurrentSubscription(): Promise<UserSubscription | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  try {
    const idToken = await currentUser.getIdToken();
    const apiUrl = getBackendApiUrl();

    if (apiUrl) {
      const response = await fetch(`${apiUrl}/api/subscription/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.subscription) {
          return data.subscription as UserSubscription;
        }
      }
    }
  } catch (err) {
    console.warn('[StratIQ] Could not fetch subscription from backend API, falling back to Firestore:', err);
  }

  // Fallback: Read directly from Firestore users/{uid}
  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.subscription) {
        return data.subscription as UserSubscription;
      }
      if (data.subscriptionPlan === 'pro') {
        return { plan: 'pro', status: 'active' };
      }
    }
  } catch (firestoreErr) {
    console.warn('[StratIQ] Error reading subscription from Firestore:', firestoreErr);
  }

  return { plan: 'starter', status: 'inactive' };
}

/**
 * Subscribe to real-time subscription changes from Firestore
 */
export function subscribeToUserSubscription(
  uid: string,
  onUpdate: (sub: UserSubscription) => void
): () => void {
  try {
    const userDocRef = doc(db, 'users', uid);
    return onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.subscription) {
            onUpdate(data.subscription as UserSubscription);
            return;
          }
          if (data.subscriptionPlan === 'pro') {
            onUpdate({ plan: 'pro', status: 'active' });
            return;
          }
        }
        onUpdate({ plan: 'starter', status: 'inactive' });
      },
      (error) => {
        console.warn('[StratIQ] Firestore subscription listener error:', error);
      }
    );
  } catch (err) {
    console.warn('[StratIQ] Failed to initialize subscription listener:', err);
    return () => {};
  }
}

/**
 * Call backend to create Razorpay subscription (pro $29/mo or enterprise $99/mo)
 */
export async function createProSubscription(planType: 'pro' | 'enterprise' = 'pro'): Promise<{
  success: boolean;
  subscriptionId?: string;
  keyId?: string;
  planType?: string;
  code?: string;
  message?: string;
}> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, message: 'Authentication required. Please log in first.' };
  }

  const apiUrl = getBackendApiUrl();
  if (!apiUrl) {
    return { 
      success: false, 
      message: 'Backend API URL (VITE_API_URL) is not configured. Please deploy the Render backend and set VITE_API_URL.' 
    };
  }

  const idToken = await currentUser.getIdToken(true);
  const response = await fetch(`${apiUrl}/api/razorpay/create-subscription`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ planType })
  });

  const data = await response.json();
  return data;
}

export const createSubscription = createProSubscription;

/**
 * Verify payment on backend after Razorpay checkout returns payment IDs
 */
export async function verifySubscriptionPayment(payload: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
  planType?: 'pro' | 'enterprise';
}): Promise<{ success: boolean; message: string; planType?: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, message: 'Authentication required.' };
  }

  const apiUrl = getBackendApiUrl();
  if (!apiUrl) {
    return { success: false, message: 'Backend API URL not configured.' };
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch(`${apiUrl}/api/razorpay/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return data;
}
