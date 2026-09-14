import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Clock, RefreshCw, LogOut, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../services/AuthContext';
import { useToast } from './Toast';

interface SessionExpiryModalProps {
  onSignOut: () => void;
}

export const SessionExpiryModal: React.FC<SessionExpiryModalProps> = ({ onSignOut }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isRenewing, setIsRenewing] = useState(false);

  // Check token expiration period periodically
  const checkTokenExpiry = useCallback(async () => {
    if (!auth.currentUser || !user) {
      setIsOpen(false);
      return;
    }

    try {
      const tokenResult = await auth.currentUser.getIdTokenResult(false);
      if (!tokenResult || !tokenResult.expirationTime) return;

      const expirationTimestamp = new Date(tokenResult.expirationTime).getTime();
      const now = Date.now();
      const diffSeconds = Math.floor((expirationTimestamp - now) / 1000);

      // Trigger warning when 5 minutes (300s) or less remain
      if (diffSeconds > 0 && diffSeconds <= 300) {
        setSecondsRemaining(diffSeconds);
        setIsOpen(true);
      } else if (diffSeconds <= 0) {
        // Session fully expired
        setIsOpen(false);
        showToast('Your session has expired. Please sign in again.', 'info');
        onSignOut();
      } else {
        // More than 5 minutes remain
        setIsOpen(false);
      }
    } catch (err) {
      console.warn('Could not inspect token expiration:', err);
    }
  }, [user, onSignOut, showToast]);

  // Interval check every 30 seconds
  useEffect(() => {
    if (!user) {
      setIsOpen(false);
      return;
    }

    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 30000);
    return () => clearInterval(interval);
  }, [user, checkTokenExpiry]);

  // Active 1-second countdown when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsOpen(false);
          showToast('Your session has expired. Please sign in again.', 'info');
          onSignOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onSignOut, showToast]);

  // Listen for ESC key to dismiss modal without locking the screen
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Renew session using Firebase Auth's native token refresh
  const handleStaySignedIn = async () => {
    if (!auth.currentUser) return;
    setIsRenewing(true);
    try {
      // Force refresh the token using Firebase SDK
      await auth.currentUser.getIdToken(true);
      // Verify refreshed token result
      const freshToken = await auth.currentUser.getIdTokenResult(true);
      const newExpiration = new Date(freshToken.expirationTime).getTime();
      const newDiff = Math.floor((newExpiration - Date.now()) / 1000);

      setSecondsRemaining(newDiff);
      setIsOpen(false);
      showToast('Session extended successfully.', 'success');
    } catch (err: any) {
      console.error('Session extension failed:', err);
      showToast('Your session could not be extended. Please sign in again.', 'error');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleSignOutClick = () => {
    setIsOpen(false);
    onSignOut();
  };

  // Only render for authenticated users
  if (!user || !isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
    >
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button to prevent trapping */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
          aria-label="Dismiss warning"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="flex-1 pr-4">
            <h2 id="session-warning-title" className="text-lg font-bold text-white">
              Your session is about to expire
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              For your security, your session is about to expire. Would you like to stay signed in?
            </p>
          </div>
        </div>

        {/* Countdown Visual Indicator */}
        <div className="mt-5 p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Time remaining:</span>
          </div>
          <div className="font-mono text-base font-extrabold text-amber-400 tracking-wider">
            {formattedCountdown}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            onClick={handleSignOutClick}
            type="button"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-600"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>

          <button
            onClick={handleStaySignedIn}
            disabled={isRenewing}
            type="button"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {isRenewing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Renewing...</span>
              </>
            ) : (
              <span>Stay signed in</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
