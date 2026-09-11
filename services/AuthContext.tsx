import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  AuthUser as FirebaseUser,
  auth, 
  testConnection,
  fetchUserProfile, 
  syncUserProfile, 
  UserProfileData, 
  reloadUserVerification, 
  logoutUser 
} from './authService';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfileData | null;
  authLoading: boolean;
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
  const [authLoading, setAuthLoading] = useState(true);
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
    setAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
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
        authLoading,
        loading: authLoading,
        isAuthenticated: !!user && !authLoading,
        isEmailVerified: !!user?.emailVerified,
        isAnonymous: !!user?.isAnonymous,
        isOnline,
        refreshProfile,
        refreshVerification,
        logout,
      }}
    >
      {authLoading ? (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <span className="text-xl font-black tracking-wider text-white">S</span>
            </div>
            <div className="text-center">
              <div className="text-sm font-black tracking-widest text-white uppercase">
                STRAT<span className="text-indigo-400">IQ</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">Checking your session...</p>
            </div>
          </div>
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
