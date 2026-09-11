import localConfig from '../firebase-applet-config.json';

export interface EnvValidationResult {
  isFirebaseConfigured: boolean;
  isAnalyticsConfigured: boolean;
  missingRequired: string[];
  warnings: string[];
}

/**
 * Validates that the required Firebase and Analytics environment variables 
 * or fallback configuration files are properly initialized upon application load.
 * Emits console warnings if critical or recommended variables are missing.
 */
export function validateEnvironment(): EnvValidationResult {
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // 1. Firebase Core Configuration Checks
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId;
  const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || localConfig.firestoreDatabaseId;

  if (!apiKey) {
    missingRequired.push('VITE_FIREBASE_API_KEY (or localConfig.apiKey)');
  }
  if (!authDomain) {
    missingRequired.push('VITE_FIREBASE_AUTH_DOMAIN (or localConfig.authDomain)');
  }
  if (!projectId) {
    missingRequired.push('VITE_FIREBASE_PROJECT_ID (or localConfig.projectId)');
  }
  if (!appId) {
    missingRequired.push('VITE_FIREBASE_APP_ID (or localConfig.appId)');
  }
  if (!firestoreDatabaseId) {
    warnings.push('Firestore database ID is not set. Default database "(default)" will be used.');
  }

  // 2. Analytics Measurement Configuration Checks
  const measurementId = 
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 
    import.meta.env.VITE_GA_MEASUREMENT_ID || 
    localConfig.measurementId;

  const isGtagAvailable = typeof window !== 'undefined' && typeof (window as any).gtag === 'function';

  if (!measurementId || measurementId === 'G-MEASUREMENT_ID') {
    warnings.push(
      'Google Analytics Measurement ID is not configured (missing VITE_FIREBASE_MEASUREMENT_ID / VITE_GA_MEASUREMENT_ID / localConfig.measurementId). Event tracking will operate in fallback console mode.'
    );
  }

  if (typeof window !== 'undefined' && !isGtagAvailable) {
    warnings.push(
      'Google Analytics gtag script is not loaded in window. Verify Google Tag Manager script in index.html.'
    );
  }

  // Log Warnings to Console
  if (missingRequired.length > 0) {
    console.warn(
      `[StratIQ Config Warning] Missing required Firebase configuration:\n- ${missingRequired.join('\n- ')}\nPlease verify your .env or firebase-applet-config.json.`
    );
  }

  if (warnings.length > 0) {
    warnings.forEach((warning) => {
      console.warn(`[StratIQ Config Warning] ${warning}`);
    });
  }

  const isFirebaseConfigured = missingRequired.length === 0;
  const isAnalyticsConfigured = Boolean(measurementId && measurementId !== 'G-MEASUREMENT_ID');

  if (isFirebaseConfigured && isAnalyticsConfigured) {
    console.info(
      `[StratIQ Init] Firebase & Analytics initialized successfully. (Project: ${projectId}, Measurement ID: ${measurementId})`
    );
  }

  return {
    isFirebaseConfigured,
    isAnalyticsConfigured,
    missingRequired,
    warnings,
  };
}
