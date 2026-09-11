import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, Send, CheckCircle, WifiOff } from 'lucide-react';
import { sendVerificationEmail } from '../services/authService';

interface VerificationBannerProps {
  email?: string | null;
  onRefresh: () => Promise<boolean>;
  isOnline?: boolean;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ email, onRefresh, isOnline = true }) => {
  const [resending, setResending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResend = async () => {
    setResending(true);
    setMessage(null);
    try {
      await sendVerificationEmail();
      setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox and spam folder.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Could not send verification email.' });
    } finally {
      setResending(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage(null);
    try {
      const verified = await onRefresh();
      if (verified) {
        setMessage({ type: 'success', text: 'Email verified successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Email not verified yet. Please click the link in your email first.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Unable to check verification status.' });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="bg-amber-950/60 border-b border-amber-600/30 text-amber-200 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          {!isOnline ? (
            <WifiOff size={18} className="text-rose-400 shrink-0 animate-pulse" />
          ) : (
            <ShieldAlert size={18} className="text-amber-400 shrink-0" />
          )}
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-amber-100">Email Verification Required:</span>{' '}
            <span className="text-amber-200/90">
              Please verify {email ? <strong className="text-amber-100">{email}</strong> : 'your email'} to secure your venture data.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {message && (
            <span className={`text-xs px-2.5 py-1 rounded-md ${
              message.type === 'success' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' : 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
            }`}>
              {message.text}
            </span>
          )}

          <button
            onClick={handleResend}
            disabled={resending}
            className="flex items-center gap-1.5 bg-amber-900/50 hover:bg-amber-800/80 text-amber-100 px-3 py-1.5 rounded-lg border border-amber-600/40 transition disabled:opacity-50 font-medium"
          >
            <Send size={13} className={resending ? 'animate-bounce' : ''} />
            {resending ? 'Sending...' : 'Resend Email'}
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-indigo-900/40 hover:bg-indigo-800/70 text-indigo-200 px-3 py-1.5 rounded-lg border border-indigo-500/40 transition disabled:opacity-50 font-medium"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Checking...' : "I've Verified"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationBanner;
