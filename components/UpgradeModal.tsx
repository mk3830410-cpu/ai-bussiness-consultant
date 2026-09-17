import React from 'react';
import { 
  Zap, 
  X, 
  Check, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  FileDown, 
  TrendingUp, 
  Layers 
} from 'lucide-react';
import { PLAN_CONFIGS } from '../subscriptionConfig';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title?: string;
  description?: string;
  featureKey?: string;
  featureTitle?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  title,
  description,
  featureTitle,
}) => {
  if (!isOpen) return null;

  const proConfig = PLAN_CONFIGS.pro;

  const modalTitle = title || (featureTitle ? `${featureTitle} is a Pro Feature` : 'Upgrade to Founder Pro');
  const modalDescription = description || 
    'Unlock investor-grade startup tools, unlimited strategy generations, financial forecasts, and comprehensive export capabilities.';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Founder Pro Entitlement
            </span>
            <h3 className="text-xl font-extrabold text-white leading-tight">
              {modalTitle}
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          {modalDescription}
        </p>

        {/* Founder Pro Value Highlight Box */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 mb-6">
          <div className="flex items-baseline justify-between mb-3 border-b border-slate-700/60 pb-3">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Founder Pro</span>
              </h4>
              <span className="text-xs text-slate-400">Everything needed to launch and scale</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white">$29</span>
              <span className="text-xs text-slate-400">/month</span>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-200">
            {proConfig.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span className="font-medium">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onUpgrade();
            }}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            <span>Upgrade to Founder Pro — $29/mo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
