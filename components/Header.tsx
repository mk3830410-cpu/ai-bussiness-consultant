import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  LogOut, 
  User, 
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
  ShieldAlert
} from 'lucide-react';
import { logoutUser } from '../services/authService';

export type AppNavTab = 'dashboard' | 'new_analysis' | 'saved_strategies' | 'ideas_vault' | 'advisor' | 'pricing' | 'settings';

interface HeaderProps {
  currentTab: AppNavTab;
  onSelectTab: (tab: AppNavTab) => void;
  onShowSettings?: () => void;
  avatarUrl?: string | null;
  userEmail?: string | null;
  displayName?: string | null;
  isVerified?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentTab, 
  onSelectTab, 
  avatarUrl,
  userEmail,
  displayName,
  isVerified,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logoutUser();
  };

  const navItems: { id: AppNavTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'new_analysis', label: 'New Analysis', icon: Sparkles },
    { id: 'saved_strategies', label: 'Saved Strategies', icon: FolderGit2 },
    { id: 'ideas_vault', label: 'Idea Vault', icon: Lightbulb },
    { id: 'advisor', label: 'AI Advisor', icon: Bot },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onSelectTab('dashboard')}
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

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
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

          {/* User Menu & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="h-9 w-9 flex items-center justify-center bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 overflow-hidden"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-indigo-300">
                    {displayName ? displayName.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : 'U')}
                  </span>
                )}
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-40 animate-scaleUp">
                  <div className="px-4 py-2.5 border-b border-slate-700 text-xs">
                    <div className="font-semibold text-white truncate">{displayName || 'Founder Workspace'}</div>
                    <div className="text-slate-400 truncate mt-0.5">{userEmail || 'Guest Mode'}</div>
                    {isVerified ? (
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
                      onSelectTab('settings');
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700/70 transition-colors"
                  >
                    <Settings size={15} className="text-slate-400" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectTab('pricing');
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700/70 transition-colors"
                  >
                    <CreditCard size={15} className="text-slate-400" />
                    <span>Subscription Plan</span>
                  </button>
                  <div className="my-1 border-t border-slate-700"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Nav Button */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {isMobileNavOpen && (
          <div className="md:hidden pt-3 pb-2 border-t border-slate-800 mt-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
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
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
