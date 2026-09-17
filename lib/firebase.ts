import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import localConfig from '../firebase-applet-config.json';

// Canonical Firebase project auth domain: ai-bussiness-consultant-9e923.firebaseapp.com
const FIREBASE_PROJECT_AUTH_DOMAIN = localConfig.authDomain || `${localConfig.projectId}.firebaseapp.com`;

// Requirement 3: Do NOT set authDomain to the Vercel URL unless the project is intentionally configured to use a Firebase custom auth domain.
const resolveAuthDomain = (): string => {
  const envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  if (envAuthDomain && typeof envAuthDomain === 'string') {
    const trimmed = envAuthDomain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    // Filter out accidental Vercel/host URLs and fallback to Firebase project domain
    if (!trimmed.includes('vercel.app') && !trimmed.includes('localhost') && !trimmed.includes('run.app') && trimmed.includes('.')) {
      return trimmed;
    }
  }
  return FIREBASE_PROJECT_AUTH_DOMAIN;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: resolveAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || localConfig.measurementId,
};

export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);

const databaseId = localConfig.firestoreDatabaseId || '(default)';

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  }, databaseId);
} catch {
  firestoreDb = getFirestore(app, databaseId);
}

export const db: Firestore = firestoreDb;
