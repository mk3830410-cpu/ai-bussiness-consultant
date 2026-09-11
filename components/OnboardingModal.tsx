import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Building2, Users, Target, Compass } from 'lucide-react';
import { saveUserOnboardingData, UserOnboardingData } from '../services/firestoreService';

interface OnboardingModalProps {
  userId: string;
  onComplete: (data?: UserOnboardingData) => void;
  onSkip: () => void;
}

const STAGES = [
  { id: 'idea', label: 'Idea Stage', desc: 'Raw spark or concept waiting to be validated' },
  { id: 'mvp', label: 'Prototyping / MVP', desc: 'Building first prototype or proof of concept' },
  { id: 'early-traction', label: 'Early Traction', desc: 'Acquiring initial beta users or early revenue' },
  { id: 'scaling', label: 'Growth & Scaling', desc: 'Product-market fit found, scaling operations' },
];

const INDUSTRIES = [
  'SaaS & AI Software',
  'Fintech & Payments',
  'HealthTech & Biotech',
  'E-Commerce & D2C',
  'Creator Economy & Media',
  'CleanTech & Sustainability',
  'B2B Services & Consulting',
  'Other',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ userId, onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserOnboardingData>({
    businessIdea: '',
    industry: 'SaaS & AI Software',
    targetCustomer: '',
    stage: 'idea',
  });

  const handleFinish = async () => {
    setLoading(true);
    try {
      await saveUserOnboardingData(userId, formData);
      onComplete(formData);
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
      // Allow progression even if network blip
      onComplete(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await saveUserOnboardingData(userId, { stage: 'idea' });
    } catch {}
    setLoading(false);
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
        <button
          onClick={handleSkip}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
          aria-label="Skip onboarding"
        >
          <X size={20} />
        </button>

        {/* Header Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Welcome to StratIQ</h3>
            <p className="text-xs text-slate-400">Step {step} of 2 • Tailor your AI Co-Founder workspace</p>
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                What is your current venture idea?
              </label>
              <textarea
                value={formData.businessIdea}
                onChange={e => setFormData({ ...formData, businessIdea: e.target.value })}
                placeholder="e.g. AI-driven compliance automation for healthcare providers, or a local eco-friendly coffee subscription..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Primary Industry
              </label>
              <select
                value={formData.industry}
                onChange={e => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind} className="bg-slate-900">{ind}</option>
                ))}
              </select>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-slate-400 hover:text-slate-200 transition"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Who is your ideal target customer?
              </label>
              <input
                type="text"
                value={formData.targetCustomer}
                onChange={e => setFormData({ ...formData, targetCustomer: e.target.value })}
                placeholder="e.g. Solo SaaS founders, Mid-market VP of Operations, College students..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                What stage is your venture at?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STAGES.map(s => {
                  const selected = formData.stage === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, stage: s.id })}
                      className={`text-left p-3 rounded-xl border text-xs transition ${
                        selected 
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500' 
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-slate-200 mb-0.5">{s.label}</div>
                      <div className="text-[11px] leading-snug">{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-slate-200 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
              >
                {loading ? 'Initializing...' : 'Launch Workspace'}
                <Sparkles size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
