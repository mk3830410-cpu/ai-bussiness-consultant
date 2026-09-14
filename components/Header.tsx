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
  ArrowRight,
  Bell,
  Check,
  Zap,
  TrendingUp,
  Clock,
  ChevronDown
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

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'strategy' | 'market' | 'milestone';
  read: boolean;
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Mock initial strategic notifications for executive dashboard feel
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Competitor Landscape Updated',
      message: 'New pricing benchmarks identified for AI automation SaaS.',
      time: '12m ago',
      type: 'market',
      read: false,
    },
    {
      id: '2',
      title: 'Milestone Timeline Alert',
      message: '30-Day MVP launch sprint is on track for completion.',
      time: '1h ago',
      type: 'milestone',
      read: false,
    },
    {
      id: '3',
      title: 'Valuation & Margins Refreshed',
      message: 'Year 2 gross profit trajectory recalculated at 82% margin.',
      time: '3h ago',
      type: 'strategy',
      read: false,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markItemAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, read: true }) : n));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
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

  // 1. AUTH LOADING SKELETON
  if (authLoading) {
    return (
      <header className="bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="h-5 w-32 bg-slate-800/60 rounded-md animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-slate-800/60 rounded-lg animate-pulse" />
        </div>
      </header>
    );
  }

  // 2. AUTHENTICATED USER HEADER
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
      : (effectiveEmail ? effectiveEmail.charAt(0).toUpperCase() : 'P');

    return (
      <header className="bg-slate-950/85 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Left: Brand Identity & Logo with generous breathing room */}
            <div 
              className="flex items-center gap-3 cursor-pointer group shrink-0"
              onClick={() => onSelectTab?.('dashboard')}
              id="header-brand-logo"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:shadow-indigo-500/40 transition-all duration-300 ring-1 ring-white/20">
                <BrainCircuit className="h-5 w-5 transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-xl font-black text-white tracking-tight leading-none">
                  Strat<span className="text-indigo-400">IQ</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                  AI Co-Founder
                </span>
              </div>
            </div>

            {/* Center: Sleek, Light, Modern SaaS Navigation */}
            <nav className="hidden lg:flex items-center gap-1.5" id="header-nav-center">
              {authNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => onSelectTab?.(item.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'text-indigo-300 bg-indigo-500/10 font-semibold border border-indigo-500/25 shadow-sm shadow-indigo-950/40'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-400 rounded-full shadow-sm shadow-indigo-400" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right: Balanced Controls (Notifications, Settings, User Profile) */}
            <div className="flex items-center gap-2 sm:gap-3" id="header-right-actions">
              
              {/* Notifications Popover */}
              <div className="relative" ref={notificationsRef}>
                <button
                  id="notifications-button"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  aria-label="View notifications"
                  className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/70 border border-slate-800/80 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  title="Strategic Alerts & Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-slate-950 animate-pulse" />
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <Bell className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Intelligence Stream</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => markItemAsRead(item.id)}
                          className={`p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                            item.read
                              ? 'bg-slate-900/60 border-slate-800/60 text-slate-400'
                              : 'bg-indigo-950/20 border-indigo-500/20 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              {item.type === 'market' && <TrendingUp className="w-3 h-3 text-sky-400" />}
                              {item.type === 'milestone' && <Clock className="w-3 h-3 text-amber-400" />}
                              {item.type === 'strategy' && <Zap className="w-3 h-3 text-indigo-400" />}
                              {item.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed text-[11px]">{item.message}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 text-center">
                      <button
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          onSelectTab?.('dashboard');
                        }}
                        className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        View all executive signals in Command Center →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Settings Shortcut */}
              <button
                id="header-settings-button"
                onClick={() => onSelectTab?.('settings')}
                aria-label="Settings"
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/70 border border-slate-800/80 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                title="Account Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* User Profile Avatar with Online Indicator */}
              <div className="relative" ref={menuRef}>
                <button
                  id="user-profile-button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label="User profile menu"
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors border border-slate-800/90 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <div className="relative">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden ring-1 ring-slate-700">
                      {effectiveAvatar ? (
                        <img src={effectiveAvatar} alt="User Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    {/* Status dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                  </div>

                  <span className="hidden md:inline text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                    {effectiveName || 'Founder'}
                  </span>
                  <ChevronDown className="hidden md:inline w-3 h-3 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-slate-800 text-xs">
                      <div className="font-bold text-white truncate">{effectiveName || 'Founder Workspace'}</div>
                      <div className="text-slate-400 truncate mt-0.5 text-[11px]">{effectiveEmail || 'Authenticated User'}</div>
                      {effectiveVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-1.5">
                          <ShieldCheck size={11} /> Verified Account
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold mt-1.5">
                          <ShieldAlert size={11} /> Verification Pending
                        </span>
                      )}
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onSelectTab?.('settings');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
                      >
                        <Settings size={14} className="text-slate-400" />
                        <span>Account Settings</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          onSelectTab?.('pricing');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
                      >
                        <CreditCard size={14} className="text-slate-400" />
                        <span>Subscription Plan</span>
                      </button>
                    </div>

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                aria-label="Toggle navigation menu"
                className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 border border-slate-800/80 transition-colors cursor-pointer"
              >
                {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown for Authenticated User */}
          {isMobileNavOpen && (
            <div className="lg:hidden py-3 border-t border-slate-800 space-y-1">
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
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              
              <div className="my-2 border-t border-slate-800" />
              
              <button
                onClick={() => {
                  onSelectTab?.('settings');
                  setIsMobileNavOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Account Settings</span>
              </button>
              
              <button
                onClick={() => {
                  onSelectTab?.('pricing');
                  setIsMobileNavOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>Subscription Plan</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 cursor-pointer"
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

  // 3. PUBLIC VISITOR HEADER
  const publicNavItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'pricing', label: 'Pricing' },
  ];

  return (
    <header className="bg-slate-950/85 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => scrollToSection('home')}
            id="public-header-brand"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:shadow-indigo-500/40 transition-all duration-300 ring-1 ring-white/20">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl font-black text-white tracking-tight leading-none">
                Strat<span className="text-indigo-400">IQ</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                AI Co-Founder
              </span>
            </div>
          </div>

          {/* Desktop Public Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
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
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer"
            >
              Log In
            </button>
            <button
              onClick={onOpenSignup}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Mobile Hamburger for Public */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Dropdown for Public Visitor */}
        {isMobileNavOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 space-y-2">
            {publicNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg cursor-pointer"
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
                className="w-full py-2.5 text-center text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  onOpenSignup?.();
                }}
                className="w-full py-2.5 text-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/25 cursor-pointer"
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
