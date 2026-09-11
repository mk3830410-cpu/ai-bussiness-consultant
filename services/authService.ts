import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signInAnonymously,
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  updatePassword,
  updateProfile,
  deleteUser,
  User as FirebaseUser,
  AuthProvider
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleProvider, 
  githubProvider, 
  microsoftProvider, 
  appleProvider,
  handleFirestoreError,
  OperationType 
} from '../lib/firebase';

export interface UserProfileData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  provider: string;
  subscriptionPlan: 'starter' | 'pro' | 'enterprise';
  role: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export function formatAuthError(error: any): string {
  if (!error) return 'An unexpected authentication error occurred.';
  const code = error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Please log in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long and contain numbers or symbols.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Authentication request cancelled.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes before trying again.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/requires-recent-login':
      return 'This sensitive operation requires recent login. Please sign out and sign back in to continue.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'This sign-in provider is not yet enabled in the Firebase Console. Please use Email/Password or Google.';
    default:
      if (message.includes('offline') || message.includes('network')) {
        return 'Network error: you appear to be offline.';
      }
      return message || 'Authentication failed. Please try again.';
  }
}

/**
 * Creates or synchronizes user profile in Firestore users/{uid}
 */
export async function syncUserProfile(user: FirebaseUser, additionalData: Partial<UserProfileData> = {}): Promise<UserProfileData> {
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  
  try {
    const snap = await getDoc(userRef);
    const providerId = user.providerData?.[0]?.providerId || (user.isAnonymous ? 'anonymous' : 'password');
    const nowIso = new Date().toISOString();

    if (snap.exists()) {
      const existing = snap.data() as UserProfileData;
      const updatedFields = {
        displayName: user.displayName || existing.displayName || 'Entrepreneur',
        photoURL: user.photoURL || existing.photoURL || null,
        emailVerified: user.emailVerified,
        lastLoginAt: nowIso,
        updatedAt: nowIso,
        ...additionalData
      };
      await updateDoc(userRef, updatedFields);
      return { ...existing, ...updatedFields };
    } else {
      const newProfile: UserProfileData = {
        uid: user.uid,
        displayName: user.displayName || additionalData.displayName || 'Entrepreneur',
        email: user.email || (user.isAnonymous ? 'guest@stratiq.ai' : ''),
        photoURL: user.photoURL || null,
        emailVerified: user.emailVerified,
        provider: providerId,
        subscriptionPlan: additionalData.subscriptionPlan || 'starter',
        role: additionalData.role || 'Founder & CEO',
        onboardingCompleted: additionalData.onboardingCompleted || false,
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso,
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Fetch profile data for authenticated user
 */
export async function fetchUserProfile(uid: string): Promise<UserProfileData | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

/**
 * Register with Email and Password
 */
export async function registerWithEmail(fullName: string, email: string, pass: string): Promise<FirebaseUser> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const user = credential.user;

    // Set display name in Auth
    if (fullName) {
      await updateProfile(user, { displayName: fullName.trim() });
    }

    // Attempt to send verification email
    try {
      await sendEmailVerification(user);
    } catch (e) {
      console.warn('Email verification send issue:', e);
    }

    // Initialize user profile in Firestore
    await syncUserProfile(user, { displayName: fullName.trim() });
    return user;
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
}

/**
 * Login with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await syncUserProfile(credential.user);
    return credential.user;
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
}

/**
 * Sign In with Google Popup
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(credential.user);
    return credential.user;
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
}

/**
 * Helper for OAuth providers (GitHub, Microsoft, Apple)
 */
async function loginWithOAuth(provider: AuthProvider, providerName: string): Promise<FirebaseUser> {
  try {
    const credential = await signInWithPopup(auth, provider);
    await syncUserProfile(credential.user);
    return credential.user;
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
      throw new Error(`${providerName} login is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method, or use Google/Email.`);
    }
    throw new Error(formatAuthError(error));
  }
}

export async function loginWithGithub(): Promise<FirebaseUser> {
  return loginWithOAuth(githubProvider, 'GitHub');
}

export async function loginWithMicrosoft(): Promise<FirebaseUser> {
  return loginWithOAuth(microsoftProvider, 'Microsoft');
}

export async function loginWithApple(): Promise<FirebaseUser> {
  return loginWithOAuth(appleProvider, 'Apple');
}

/**
 * Anonymous guest sign-in
 */
export async function loginAnonymously(): Promise<FirebaseUser> {
  try {
    const credential = await signInAnonymously(auth);
    await syncUserProfile(credential.user, {
      displayName: 'Guest Entrepreneur',
      role: 'Guest Explorer',
      onboardingCompleted: true,
    });
    return credential.user;
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
}

/**
 * Forgot password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
}

/**
 * Resend verification email to current user
 */
export async function sendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in.');
  }
  try {
    await sendEmailVerification(auth.currentUser);
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
}

/**
 * Reload current user and check verification status
 */
export async function reloadUserVerification(): Promise<boolean> {
  if (!auth.currentUser) return false;
  await auth.currentUser.reload();
  const verified = auth.currentUser.emailVerified;
  
  if (verified) {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await updateDoc(userRef, { emailVerified: true, updatedAt: new Date().toISOString() });
    } catch {}
  }
  return verified;
}

/**
 * Update password for current user
 */
export async function updateUserPassword(newPass: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in.');
  }
  try {
    await updatePassword(auth.currentUser, newPass);
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
}

/**
 * Update general user profile fields
 */
export async function updateUserProfile(uid: string, data: Partial<UserProfileData>): Promise<void> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Update display profile details
 */
export async function updateProfileDetails(displayName: string, role?: string): Promise<void> {
  if (!auth.currentUser) throw new Error('No user is currently signed in.');
  
  try {
    await updateProfile(auth.currentUser, { displayName });
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      displayName,
      ...(role ? { role } : {}),
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
}

/**
 * Delete entire user account and their user-owned subcollections
 */
export async function deleteUserAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user is currently signed in.');

  const uid = user.uid;

  // Helper to delete all documents in a subcollection
  const deleteSubcollection = async (subcolName: string) => {
    try {
      const colRef = collection(db, 'users', uid, subcolName);
      const snapshot = await getDocs(colRef);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (e) {
      console.warn(`Error cleaning up subcollection ${subcolName}:`, e);
    }
  };

  // Clean subcollections
  await deleteSubcollection('strategies');
  await deleteSubcollection('analyses');
  await deleteSubcollection('ideas');
  await deleteSubcollection('settings');

  // Delete main profile document
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (e) {
    console.warn('Error deleting user profile document:', e);
  }

  // Delete Firebase auth user
  try {
    await deleteUser(user);
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
}
