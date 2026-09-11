import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  LogOut, 
  Settings, 
  LayoutDashboard, 
  Sparkles, 
  FolderGit2, 
  Lightbulb, 
  Bot, 
  Menu, 
  X, 
  CreditCard, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';

export type AppNavTab = 'dashboard' | 'new_analysis' | 'saved_strategies' | 'ideas_vault' | 'advisor' | 'pricing' | 'settings';

export interface HeaderProps {
  currentTab?: AppNavTab;
  onSelectTab?: (tab: AppNavTab) => void;
  onShowSettings?: () => void;
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
  onLogout?: () => void;
  avatarUrl?: string | null;
  userEmail?: string | null;
  displayName?: string | null;
  isVerified?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentTab = 'dashboard', 
  onSelectTab, 
  onOpenLogin,
  onOpenSignup,
  onLogout,
  avatarUrl,
  userEmail,
  displayName,
  isVerified,
}) => {
  const { user, authLoading, logout, isEmailVerified } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsMobileNavOpen(false);
    await logout();
    if (onLogout) {
      onLogout();
    }
  };

  const scrollToSection = (sectionId: string) => {
    setIsMobileNavOpen(false);
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const effectiveAvatar = avatarUrl !== undefined ? avatarUrl : user?.photoURL;
  const effectiveEmail = userEmail !== undefined ? userEmail : user?.email;
  const effectiveName = displayName !== undefined ? displayName : user?.displayName;
  const effectiveVerified = isVerified !== undefined ? isVerified : isEmailVerified;

  // 1. AUTH LOADING STATE: Minimal skeleton header (no auth tabs, no avatar)
  if (authLoading) {
    return (
      <header className="bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight leading-none">
                  Strat<span className="text-indigo-400">IQ</span>
                </h1>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                  AI Co-Founder
                </span>
              </div>
            </div>
            <div className="h-8 w-24 bg-slate-800/60 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  // 2. AUTHENTICATED STATE: Command Center, New Analysis, Saved Strategies, Idea Vault, AI Advisor, User Avatar
  if (user) {
    const authNavItems: { id: AppNavTab; label: string; icon: React.ElementType }[] = [
      { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
      { id: 'new_analysis', label: 'New Analysis', icon: Sparkles },
      { id: 'saved_strategies', label: 'Saved Strategies', icon: FolderGit2 },
      { id: 'ideas_vault', label: 'Idea Vault', icon: Lightbulb },
      { id: 'advisor', label: 'AI Advisor', icon: Bot },
    ];

    const initial = effectiveName 
      ? effectiveName.charAt(0).toUpperCase() 
      : (effectiveEmail ? effectiveEmail.charAt(0).toUpperCase() : 'U');

    return (
      <header className="bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Brand */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => onSelectTab?.('dashboard')}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight leading-none">
                  Strat<span className="text-indigo-400">IQ</span>
                </h1>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                  AI Co-Founder
                </span>
              </div>
            </div>

            {/* Desktop Authenticated Nav Items */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              {authNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab?.(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Profile Avatar & Mobile Hamburger */}
            <div className="flex items-center gap-3">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label="User profile menu"
                  className="h-9 w-9 flex items-center justify-center bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 overflow-hidden"
                >
                  {effectiveAvatar ? (
                    <img src={effectiveAvatar} alt="User Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-indigo-300">
                      {initial}
                    </span>
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-40 animate-scaleUp">
                    <div className="px-4 py-2.5 border-b border-slate-700 text-xs">
                      <div className="font-semibold text-white truncate">{effectiveName || 'Founder Workspace'}</div>
                      <div className="text-slate-400 truncate mt-0.5">{effectiveEmail || 'Authenticated User'}</div>
                      {effectiveVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-1">
                          <ShieldCheck size={11} /> Verified Account
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold mt-1">
                          <ShieldAlert size={11} /> Verification Pending
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        onSelectTab?.('settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700/70 transition-colors"
                    >
                      <Settings size={15} className="text-slate-400" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectTab?.('pricing');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700/70 transition-colors"
                    >
                      <CreditCard size={15} className="text-slate-400" />
                      <span>Subscription Plan</span>
                    </button>
                    <div className="my-1 border-t border-slate-700" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger for Authenticated */}
              <button
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                aria-label="Toggle navigation menu"
                className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown for Authenticated User */}
          {isMobileNavOpen && (
            <div className="md:hidden pt-3 pb-2 border-t border-slate-800 mt-3 space-y-1">
              {authNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab?.(item.id);
                      setIsMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => {
                  onSelectTab?.('settings');
                  setIsMobileNavOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => {
                  onSelectTab?.('pricing');
                  setIsMobileNavOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800"
              >
                <CreditCard className="w-4 h-4" />
                <span>Subscription Plan</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </header>
    );
  }

  // 3. PUBLIC STATE: Home, Features, How It Works, Pricing | Log In, Get Started
  // DO NOT show: Command Center, New Analysis, Saved Strategies, Idea Vault, AI Advisor, Profile avatar
  const publicNavItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'pricing', label: 'Pricing' },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => scrollToSection('home')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-none">
                Strat<span className="text-indigo-400">IQ</span>
              </h1>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                AI Co-Founder
              </span>
            </div>
          </div>

          {/* Desktop Public Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            {publicNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Side: Log In & Get Started */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
            >
              Log In
            </button>
            <button
              onClick={onOpenSignup}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Mobile Hamburger for Public */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown for Public Visitor */}
        {isMobileNavOpen && (
          <div className="md:hidden pt-3 pb-3 border-t border-slate-800 mt-3 space-y-2">
            {publicNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  onOpenLogin?.();
                }}
                className="w-full py-2.5 text-center text-sm font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  onOpenSignup?.();
                }}
                className="w-full py-2.5 text-center text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/25"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
