import React, { useState } from 'react';
import { X, Mail, Lock } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onClose: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = mode === 'login' ? 'Welcome Back' : 'Create Your Account';
  const buttonText = mode === 'login' ? 'Log In' : 'Sign Up';
  const subtitle = mode === 'login' 
    ? "Don't have an account?" 
    : "Already have an account?";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setError("Passwords don't match!");
      setLoading(false);
      return;
    }

    try {
        if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else { // signup
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;

            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({ id: data.user.id, full_name: 'New User', role: 'Entrepreneur' });
                if (profileError) throw profileError;
                
                alert('Sign up successful! Please check your email for a confirmation link.');
            }
        }
        onClose();
    } catch (err: any) {
        setError(err.error_description || err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-center text-white mb-2">{title}</h2>
        <p className="text-center text-gray-400 mb-8">to continue to StratIQ</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {mode === 'signup' && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all duration-300 disabled:bg-gray-600"
          >
            {loading ? 'Processing...' : buttonText}
          </button>
        </form>
        
        {error && <p className="text-center text-sm text-red-400 mt-4">{error}</p>}

        <p className="text-center text-sm text-gray-500 mt-6">
          {subtitle} <button className="font-semibold text-indigo-400 hover:underline">
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;