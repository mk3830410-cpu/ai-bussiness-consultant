import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface VerificationBannerProps {
  onResend: () => void;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ onResend }) => {
  return (
    <div className="bg-yellow-900/30 border-b border-yellow-700/50 text-yellow-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} className="text-yellow-500 flex-shrink-0" />
          <span className="font-medium text-sm sm:text-base">Please verify your email address to unlock all features.</span>
        </div>
        <button 
          onClick={onResend}
          className="text-sm bg-yellow-800/50 hover:bg-yellow-800 text-yellow-100 py-1.5 px-4 rounded-lg border border-yellow-700 transition-colors whitespace-nowrap"
        >
          Resend Email
        </button>
      </div>
    </div>
  );
};

export default VerificationBanner;