import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, testConnection } from '../lib/firebase';
import { 
  fetchUserProfile, 
  syncUserProfile, 
  UserProfileData, 
  reloadUserVerification, 
  logoutUser 
} from './authService';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isAnonymous: boolean;
  isOnline: boolean;
  refreshProfile: () => Promise<void>;
  refreshVerification: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial server test
    testConnection().catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadProfile = useCallback(async (currentUser: FirebaseUser) => {
    try {
      let profile = await fetchUserProfile(currentUser.uid);
      if (!profile) {
        profile = await syncUserProfile(currentUser);
      }
      setUserProfile(profile);
    } catch (err) {
      console.warn('Could not sync user profile immediately:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadProfile]);

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  const refreshVerification = async () => {
    const verified = await reloadUserVerification();
    if (user) {
      setUser({ ...user } as FirebaseUser);
      await refreshProfile();
    }
    return verified;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAuthenticated: !!user,
        isEmailVerified: !!user?.emailVerified,
        isAnonymous: !!user?.isAnonymous,
        isOnline,
        refreshProfile,
        refreshVerification,
        logout,
      }}
    >
      {loading ? (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
              <span className="text-2xl font-black tracking-wider text-white">S</span>
            </div>
            <div className="absolute -inset-2 rounded-2xl border border-indigo-500/30 animate-ping opacity-25"></div>
          </div>
          <h2 className="text-xl font-bold text-slate-200 mb-1">StratIQ</h2>
          <p className="text-sm text-slate-400 font-medium">Connecting to AI Co-Founder Workspace...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
