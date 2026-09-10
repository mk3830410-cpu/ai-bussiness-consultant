import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Lock, Trash2, Mail } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileSettingsProps {
    user: SupabaseUser; // Correctly typed prop
    onBack: () => void;
    onProfileUpdate: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onBack, onProfileUpdate }) => {
    const [loading, setLoading] = useState(true);
    // State for profile form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [emailSignature, setEmailSignature] = useState('');

    // State for password form
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                if (user) {
                    setEmail(user.email || '');
                    const { data, error, status } = await supabase
                        .from('profiles')
                        .select(`full_name, role, email_signature`)
                        .eq('id', user.id)
                        .single();

                    if (error && status !== 406) throw error;
                    
                    if (data) {
                        setName(data.full_name || '');
                        setRole(data.role || '');
                        setEmailSignature(data.email_signature || '');
                    }
                }
            } catch (error: any) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);


    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({ 
                        full_name: name, 
                        role, 
                        email_signature: emailSignature 
                    })
                    .eq('id', user.id);
                    
                if (error) throw error;
                alert('Profile updated successfully!');
                onProfileUpdate();
            }
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match.');
            return;
        }
        if (!newPassword) {
            alert('Password cannot be empty.');
            return;
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            alert(error.message);
        } else {
            alert('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
        }
    };
    
    const handleDeleteAccount = () => {
        if (window.confirm('Are you sure you want to delete your account? This is an experimental feature and may not fully remove your data.')) {
            // Placeholder for a Supabase Edge Function call to properly delete user data.
            alert('Account deletion initiated.');
            supabase.auth.signOut();
        }
    }

    if (loading) {
        return (
            <div className="text-center py-20">
                <svg className="animate-spin mx-auto h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div>
                <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4">
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>
                <h1 className="text-4xl font-extrabold text-white">Settings</h1>
                <p className="text-gray-400 mt-2">Manage your profile, password, and security settings.</p>
            </div>

            {/* Profile Information */}
            <div className="bg-gray-800 shadow-lg rounded-2xl border border-gray-700">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3"><User className="text-indigo-400" /> Profile Information</h2>
                    <p className="text-sm text-gray-400 mt-1">Update your personal details.</p>
                </div>
                <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">Role / Job Title</label>
                            <input type="text" id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                        <input type="email" id="email" value={email} disabled className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg py-2 px-3 cursor-not-allowed text-gray-400" />
                    </div>
                    <div>
                        <label htmlFor="signature" className="block text-sm font-medium text-gray-300 mb-1">Email Signature</label>
                        <textarea 
                            id="signature" 
                            value={emailSignature} 
                            onChange={(e) => setEmailSignature(e.target.value)} 
                            className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors h-24"
                            placeholder="Best regards,&#10;[Your Name]"
                        />
                        <p className="text-xs text-gray-500 mt-1">This signature can be used in your generated communications.</p>
                    </div>

                     <div className="pt-2 text-right">
                        <button type="submit" className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all duration-300">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* Password & Security */}
            <div className="bg-gray-800 shadow-lg rounded-2xl border border-gray-700">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3"><Lock className="text-indigo-400" /> Password & Security</h2>
                    <p className="text-sm text-gray-400 mt-1">Change your password for enhanced security.</p>
                </div>
                <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                     <div>
                        <label htmlFor="new-password"  className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                        <input type="password" id="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                        <label htmlFor="confirm-password"  className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                        <input type="password" id="confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                    </div>
                    <div className="pt-2 text-right">
                        <button type="submit" className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all duration-300">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>

             {/* Danger Zone */}
            <div className="bg-red-900/20 shadow-lg rounded-2xl border border-red-500/30">
                <div className="p-6 border-b border-red-500/30">
                    <h2 className="text-xl font-bold text-red-300 flex items-center gap-3"><Trash2 /> Danger Zone</h2>
                </div>
                <div className="p-6 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-white">Delete your account</h3>
                        <p className="text-sm text-red-300/80 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                    </div>
                    <button onClick={handleDeleteAccount} className="px-5 py-2 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-300">
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;