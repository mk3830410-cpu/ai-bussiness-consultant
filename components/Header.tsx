
import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, LogOut, User, Settings } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface HeaderProps {
    onShowSettings?: () => void;
    avatarUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({ onShowSettings, avatarUrl }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        await supabase.auth.signOut();
    }

    return (
        <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BrainCircuit className="h-8 w-8 text-indigo-500" />
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            Strat<span className="text-indigo-500">IQ</span>
                        </h1>
                    </div>
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="h-10 w-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 overflow-hidden"
                        >
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="User Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-5 w-5 text-gray-300" />
                            )}
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-20">
                                <button
                                    onClick={() => {
                                        onShowSettings?.();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                >
                                    <Settings size={16} />
                                    <span>Settings</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span>Log Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
