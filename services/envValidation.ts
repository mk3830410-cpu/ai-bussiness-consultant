import localConfig from '../firebase-applet-config.json';

export interface EnvValidationResult {
  isFirebaseConfigured: boolean;
  isAnalyticsConfigured: boolean;
  missingRequired: string[];
  warnings: string[];
}

/**
 * Validates that Firebase and Analytics configuration is properly loaded.
 */
export function validateEnvironment(): EnvValidationResult {
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId;

  if (!apiKey) missingRequired.push('apiKey');
  if (!authDomain) missingRequired.push('authDomain');
  if (!projectId) missingRequired.push('projectId');
  if (!appId) missingRequired.push('appId');

  const isFirebaseConfigured = missingRequired.length === 0;
  const isAnalyticsConfigured = Boolean(localConfig.measurementId);

  if (isFirebaseConfigured) {
    console.info(`[StratIQ] Connected to Firebase project: ${projectId}`);
  } else {
    console.warn('[StratIQ] Missing Firebase configuration parameters:', missingRequired);
  }

  return {
    isFirebaseConfigured,
    isAnalyticsConfigured,
    missingRequired,
    warnings,
  };
}
