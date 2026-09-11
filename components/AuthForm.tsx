import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle, 
  loginWithGithub,
  loginWithMicrosoft,
  loginWithApple,
  loginAnonymously,
  sendPasswordReset 
} from '../services/authService';

interface AuthFormProps {
  mode: 'login' | 'signup' | 'forgot';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode: initialMode, onClose, onSuccess }) => {
  const [currentMode, setCurrentMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  
  // Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // States
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Field validation
  const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const isPasswordStrong = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!isEmailValid(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (currentMode === 'signup') {
      if (!fullName.trim()) {
        setError('Please provide your full name or co-founder title.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-type your password.');
        return;
      }
    }

    if (currentMode === 'login' && !password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      if (currentMode === 'login') {
        await loginWithEmail(email, password);
        if (onSuccess) onSuccess();
        onClose();
      } else if (currentMode === 'signup') {
        await registerWithEmail(fullName, email, password);
        setSuccessNotice('Account created successfully! Please check your inbox for a verification email.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else if (currentMode === 'forgot') {
        await sendPasswordReset(email);
        setSuccessNotice('If an account exists with this email, a password reset link has been dispatched to your inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    setError(null);
    try {
      await loginWithGoogle();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in could not be completed.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleOAuthSignIn = async (provider: 'github' | 'microsoft' | 'apple') => {
    setSocialLoading(provider);
    setError(null);
    try {
      if (provider === 'github') await loginWithGithub();
      else if (provider === 'microsoft') await loginWithMicrosoft();
      else if (provider === 'apple') await loginWithApple();
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || `${provider} sign-in failed.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGuestSignIn = async () => {
    setSocialLoading('guest');
    setError(null);
    try {
      await loginAnonymously();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Guest login failed.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative text-slate-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Brand Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 mb-3 shadow-lg shadow-indigo-500/20">
            <span className="text-xl font-black text-white">S</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {currentMode === 'login' && 'Welcome back'}
            {currentMode === 'signup' && 'Start Building with StratIQ'}
            {currentMode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {currentMode === 'login' && 'Your AI Business Co-Founder is ready'}
            {currentMode === 'signup' && 'Create your co-founder account in seconds'}
            {currentMode === 'forgot' && "Enter your email to receive recovery instructions"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Success Alert */}
        {successNotice && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle size={16} className="shrink-0 text-emerald-400 mt-0.5" />
            <div className="leading-relaxed">{successNotice}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentMode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name / Founder Title</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text"
                  placeholder="e.g. Alex Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email"
                placeholder="founder@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {currentMode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                {currentMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessNotice(null);
                      setCurrentMode('forgot');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder={currentMode === 'signup' ? "At least 6 characters" : "Enter password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {currentMode === 'signup' && password.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                  <div className={`h-1 flex-1 rounded-full ${password.length >= 6 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className={password.length >= 6 ? 'text-emerald-400' : 'text-slate-400'}>
                    {password.length >= 6 ? 'Password requirement met' : 'Min 6 characters'}
                  </span>
                </div>
              )}
            </div>
          )}

          {currentMode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {currentMode === 'login' && 'Log In'}
            {currentMode === 'signup' && 'Create Free Account'}
            {currentMode === 'forgot' && 'Send Reset Link'}
          </button>
        </form>

        {currentMode !== 'forgot' && (
          <>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-3 text-slate-500">Or continue with</span>
              </div>
            </div>

            {/* Social Authentication */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={!!socialLoading || loading}
                className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50"
              >
                {socialLoading === 'google' ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.54 0 2.94.55 4.04 1.46l3.03-3.03C17.21 1.7 14.76 1 12 1 7.42 1 3.54 3.59 1.67 7.37l3.71 2.88C6.27 7.21 8.88 5 12 5z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.16-1.99 3.42-4.93 3.42-8.7z" />
                    <path fill="#FBBC05" d="M5.38 14.75c-.24-.71-.38-1.47-.38-2.25s.14-1.54.38-2.25L1.67 7.37C.61 9.47 0 11.66 0 12s.61 2.53 1.67 4.63l3.71-2.88z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.07.72-2.45 1.16-4.22 1.16-3.12 0-5.73-2.21-6.62-5.25L1.67 16.63C3.54 20.41 7.42 23 12 23z" />
                  </svg>
                )}
                Continue with Google
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={!!socialLoading || loading}
                  className="py-2 px-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  GitHub
                </button>

                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  disabled={!!socialLoading || loading}
                  className="py-2 px-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <UserCheck size={14} className="text-indigo-400" />
                  Try Guest Mode
                </button>
              </div>
            </div>
          </>
        )}

        {/* Footer switcher */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          {currentMode === 'login' && (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessNotice(null);
                  setCurrentMode('signup');
                }}
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                Sign up free
              </button>
            </p>
          )}

          {currentMode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessNotice(null);
                  setCurrentMode('login');
                }}
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                Log in
              </button>
            </p>
          )}

          {currentMode === 'forgot' && (
            <p>
              Remembered your credentials?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessNotice(null);
                  setCurrentMode('login');
                }}
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                Back to Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
