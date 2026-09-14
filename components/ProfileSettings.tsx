import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Lock, 
  Trash2, 
  Mail, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Sparkles,
  Globe,
  Bell,
  Sliders,
  Calendar,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Save
} from 'lucide-react';
import { 
  UserProfileData, 
  FirebaseUser,
  updateProfileDetails, 
  updateUserPassword, 
  deleteUserAccount,
  sendVerificationEmail,
  reloadUserVerification 
} from '../services/authService';
import { 
  fetchUserSettings, 
  saveUserSettings, 
  UserPreferences, 
  DEFAULT_PREFERENCES 
} from '../services/firestoreService';

interface ProfileSettingsProps {
  user: FirebaseUser | null;
  profile: UserProfileData | null;
  onBack: () => void;
  onProfileUpdate: () => void;
  onAccountDeleted?: () => void;
}

const INDUSTRIES = [
  'SaaS & AI Software',
  'Fintech & Payments',
  'HealthTech & Biotech',
  'E-Commerce & D2C',
  'CleanTech & Sustainability',
  'B2B Services & Consulting',
  'EdTech & Learning',
  'Other',
];

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  user, 
  profile, 
  onBack, 
  onProfileUpdate,
  onAccountDeleted 
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  
  // Profile state
  const [name, setName] = useState(user?.displayName || profile?.displayName || '');
  const [role, setRole] = useState(profile?.role || 'Founder & CEO');
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Security state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Email verification state
  const [resendingVerification, setResendingVerification] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmEmailInput, setConfirmEmailInput] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Alerts
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Provider detection
  const providerId = user?.providerData?.[0]?.providerId || (user?.isAnonymous ? 'anonymous' : 'password');
  const isPasswordProvider = providerId === 'password';

  useEffect(() => {
    async function loadSettings() {
      if (!user?.uid) return;
      try {
        const data = await fetchUserSettings(user.uid);
        setPreferences(data);
      } catch (e) {
        console.warn('Error loading settings:', e);
      }
    }
    loadSettings();
  }, [user?.uid]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(prev => prev?.text === text ? null : prev);
    }, 4500);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfileDetails(name.trim(), role.trim());
      showFeedback('success', 'Profile updated successfully in your Firebase workspace!');
      onProfileUpdate();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showFeedback('error', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showFeedback('error', 'New passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await updateUserPassword(newPassword);
      showFeedback('success', 'Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSavingPreferences(true);
    try {
      await saveUserSettings(user.uid, preferences);
      showFeedback('success', 'Workspace preferences saved to Firestore!');
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save preferences.');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleResendEmail = async () => {
    setResendingVerification(true);
    try {
      await sendVerificationEmail();
      showFeedback('success', 'Verification email sent! Please check your inbox.');
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to send verification email.');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmEmailInput.trim() !== (user?.email || '') && !user?.isAnonymous) {
      showFeedback('error', 'Please type your exact email to confirm deletion.');
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteUserAccount();
      if (onAccountDeleted) {
        onAccountDeleted();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete account.');
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const getProviderLabel = () => {
    switch (providerId) {
      case 'google.com': return 'Google Sign-In';
      case 'github.com': return 'GitHub OAuth';
      case 'microsoft.com': return 'Microsoft OAuth';
      case 'apple.com': return 'Apple Sign-In';
      case 'anonymous': return 'Guest Explorer (Anonymous)';
      default: return 'Email & Password';
    }
  };

  const creationTime = user?.metadata?.creationTime;
  const formattedJoinDate = creationTime 
    ? new Date(creationTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recent';

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn text-center py-16">
        <p className="text-slate-400">Please sign in to view account settings.</p>
        <button 
          onClick={onBack} 
          className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div>
        <button 
          onClick={onBack} 
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Account & Settings</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your Firebase profile, security credentials, and AI workspace preferences.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold uppercase tracking-wider">
              {profile?.subscriptionPlan || 'Starter'} Plan
            </span>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 transition-all ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle size={18} className="shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
          )}
          <span className="leading-relaxed">{feedback.text}</span>
        </div>
      )}

      {/* Identity Summary Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              (name || user.email || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white">{name || 'StratIQ Founder'}</h2>
              {user.emailVerified ? (
                <span className="flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-medium">
                  <ShieldCheck size={12} /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-medium">
                  <ShieldAlert size={12} /> Unverified
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user.email || 'Anonymous Guest'}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <Shield size={13} className="text-indigo-400" /> {getProviderLabel()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-slate-500" /> Member since {formattedJoinDate}
              </span>
            </div>
          </div>
        </div>

        {!user.emailVerified && !user.isAnonymous && (
          <button
            onClick={handleResendEmail}
            disabled={resendingVerification}
            className="text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3.5 py-2 rounded-xl transition font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            <Mail size={14} />
            {resendingVerification ? 'Sending Verification...' : 'Resend Email Verification'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'profile' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'preferences' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Workspace Preferences
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'security' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Security & Access
        </button>
      </div>

      {/* Tab 1: Profile Details */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserIcon className="text-indigo-400" size={18} />
              Founder Profile
            </h3>
            <p className="text-xs text-slate-400 mt-1">This information helps the AI advisor calibrate strategic executive responses.</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Elena Rostova"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Founder Role / Title</label>
                <input 
                  type="text" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  placeholder="e.g. Co-Founder & CTO"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Email</label>
              <input 
                type="email" 
                value={user.email || 'guest@stratiq.ai'} 
                disabled 
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed" 
              />
              <p className="text-[11px] text-slate-500 mt-1">Managed securely through Firebase Authentication.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                type="submit" 
                disabled={savingProfile}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
              >
                <Save size={15} />
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Preferences */}
      {activeTab === 'preferences' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="text-indigo-400" size={18} />
              AI Workspace Preferences
            </h3>
            <p className="text-xs text-slate-400 mt-1">Saved automatically to your Firestore user preferences profile.</p>
          </div>

          <form onSubmit={handlePreferencesSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Market Focus</label>
                <input 
                  type="text"
                  value={preferences.defaultMarket}
                  onChange={e => setPreferences({ ...preferences, defaultMarket: e.target.value })}
                  placeholder="e.g. North America, Global, Southeast Asia"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Venture Industry</label>
                <select
                  value={preferences.defaultIndustry}
                  onChange={e => setPreferences({ ...preferences, defaultIndustry: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind} className="bg-slate-900">{ind}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={preferences.notifications}
                  onChange={e => setPreferences({ ...preferences, notifications: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-200">In-App Strategy Status Notifications</div>
                  <div className="text-[11px] text-slate-400">Receive toasts when deep AI market analyses complete</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={preferences.emailNotifications}
                  onChange={e => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Weekly Strategic Digests</div>
                  <div className="text-[11px] text-slate-400">Receive AI summaries of market shifts related to your saved ventures</div>
                </div>
              </label>
            </div>

            <div className="pt-3 flex justify-end">
              <button 
                type="submit" 
                disabled={savingPreferences}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
              >
                <Save size={15} />
                {savingPreferences ? 'Updating...' : 'Save Workspace Preferences'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Security & Access */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password Update Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="text-indigo-400" size={18} />
                Password & Authentication
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isPasswordProvider 
                  ? 'Update your account password. Must be at least 6 characters.' 
                  : `Your account signs in using ${getProviderLabel()}. Password updates are managed through that provider.`}
              </p>
            </div>

            {isPasswordProvider ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      placeholder="At least 6 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      placeholder="Repeat password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={updatingPassword}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    <Lock size={14} />
                    {updatingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                <ShieldCheck size={20} className="text-indigo-400 shrink-0" />
                <div>
                  Signed in via <strong className="text-white">{getProviderLabel()}</strong>. Authentication sessions, multi-factor authentication, and password resets are managed directly through your identity provider.
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone: Account Deletion */}
          <div className="bg-rose-950/20 border border-rose-600/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
                  <Trash2 size={16} /> Danger Zone: Delete Account
                </h3>
                <p className="text-xs text-rose-300/70 mt-1 max-w-xl">
                  Permanently deletes your account and wipes all user-owned data (saved strategies, business ideas, chat history, and preferences) from Firebase Firestore. This cannot be undone.
                </p>
              </div>

              <button 
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition shadow-md shadow-rose-600/20"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/40 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">Confirm Account Deletion</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action is strictly irreversible. All your Firestore collections (saved strategies, ideas vault, advisor messages, and preferences) will be completely wiped from the database.
            </p>

            {!user.isAnonymous && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Type your email <strong className="text-white">{user.email}</strong> to confirm:
                </label>
                <input 
                  type="text" 
                  value={confirmEmailInput} 
                  onChange={e => setConfirmEmailInput(e.target.value)} 
                  placeholder={user.email || ''} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500" 
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={deletingAccount || (!user.isAnonymous && confirmEmailInput.trim() !== user.email)}
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {deletingAccount ? 'Deleting Workspace...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
