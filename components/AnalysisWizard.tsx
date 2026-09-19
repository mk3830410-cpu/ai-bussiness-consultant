import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  BrainCircuit, 
  Search, 
  Zap, 
  Eye, 
  Upload, 
  CheckCircle2, 
  Target, 
  Compass, 
  TrendingUp, 
  Coins, 
  Layers, 
  ShieldAlert,
  HelpCircle,
  Clock,
  Building2,
  FileText,
  Mic,
  MicOff,
  Volume2,
  Lock,
  AlertCircle
} from 'lucide-react';
import { AnalysisMode, WizardData, UserSubscription } from '../types';
import { UserUsage, canUseFeature, isFounderProActive, isTeamScaleActive } from '../subscriptionConfig';

interface AnalysisWizardProps {
  onGenerate: (data: WizardData, mode: AnalysisMode, imageFile?: { b64: string; mimeType: string; file: File } | null) => void;
  isLoading: boolean;
  isVerified: boolean;
  initialData?: Partial<WizardData>;
  subscription?: UserSubscription;
  usage?: UserUsage;
  onUpgradePro?: () => void;
}

const INDUSTRIES = [
  'SaaS & Cloud Software',
  'AI & DeepTech',
  'FinTech & Payments',
  'HealthTech & Wellness',
  'E-Commerce & DTC',
  'Marketplace & Platforms',
  'CleanTech & Sustainability',
  'EdTech & Learning',
  'FoodTech & Hospitality',
  'Developer Tools & APIs',
  'Professional & Agency Services',
  'Media, Gaming & Entertainment',
  'Hardware & IoT',
  'Other',
];

const TARGET_CUSTOMERS = [
  'B2B Enterprise (>500 employees)',
  'B2B Small & Medium Businesses (SMBs)',
  'B2C Consumers & Everyday Users',
  'Indie Hackers & Freelancers',
  'Developers & Technical Teams',
  'Creators & Media Publishers',
  'Local Businesses & Service Providers',
];

const BUSINESS_MODELS = [
  'Subscription SaaS (Monthly/Annual)',
  'Marketplace Commission / Take Rate',
  'Direct-to-Consumer (E-commerce)',
  'Usage-Based / API Metered',
  'Freemium with Enterprise Add-ons',
  'Transactional / Payment Fee',
  'Consulting & Professional Services',
];

const PRIMARY_GOALS = [
  'Validate Idea & Market Demand',
  'Build & Launch MVP Fast',
  'Raise Pre-Seed or Seed Capital',
  'Acquire First 100 Paying Customers',
  'Scale Revenue & Optimize Margins',
];

const STAGES = [
  'Concept / Raw Idea',
  'Prototype / Wireframe Complete',
  'MVP Built & Testing with Beta Users',
  'Launched with Early Revenue',
  'Scaling Existing Business',
];

const TIMELINES = [
  'Immediate (< 30 Days)',
  '1 to 3 Months',
  '3 to 6 Months',
  '6 to 12 Months',
];

const BUDGETS = [
  'Bootstrapped (< $5,000)',
  'Lean Capital ($5,000 - $25,000)',
  'Funded ($25,000 - $100,000)',
  'Venture Backed ($100,000+)',
];

export const AnalysisWizard: React.FC<AnalysisWizardProps> = ({
  onGenerate,
  isLoading,
  isVerified,
  initialData,
  subscription,
  usage,
  onUpgradePro,
}) => {
  const isPaidActive = isFounderProActive(subscription) || isTeamScaleActive(subscription);
  const analysesUsed = usage?.analysesCount || 0;
  const isStarterLimitReached = !isPaidActive && analysesUsed >= 3;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Default to quick brainstorm for Starter users so they don't immediately hit a locked mode
  const [mode, setMode] = useState<AnalysisMode>(isPaidActive ? 'deep' : 'quick');
  
  // Dedicated userInput state for startup idea and dictation
  const [userInput, setUserInput] = useState<string>(initialData?.businessIdea || '');

  const [formData, setFormData] = useState<WizardData>({
    businessName: initialData?.businessName || '',
    businessIdea: initialData?.businessIdea || '',
    industry: initialData?.industry || INDUSTRIES[0],
    targetCustomer: initialData?.targetCustomer || TARGET_CUSTOMERS[1],
    location: initialData?.location || 'Global / Remote',
    businessModel: initialData?.businessModel || BUSINESS_MODELS[0],
    primaryGoal: initialData?.primaryGoal || PRIMARY_GOALS[0],
    targetRevenue: initialData?.targetRevenue || '$10k - $25k Monthly Recurring Revenue',
    timeline: initialData?.timeline || TIMELINES[1],
    stage: initialData?.stage || STAGES[0],
    budget: initialData?.budget || BUDGETS[0],
  });

  // Sync external initialData if provided
  useEffect(() => {
    if (initialData?.businessIdea && initialData.businessIdea !== userInput) {
      setUserInput(initialData.businessIdea);
      setFormData((prev) => ({ ...prev, businessIdea: initialData.businessIdea || '' }));
    }
  }, [initialData?.businessIdea]);

  const [image, setImage] = useState<{ b64: string; mimeType: string; file: File } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Web Speech API dictation state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      setSpeechError(null);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscripts = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.trim();
            if (transcript) {
              finalTranscripts += (finalTranscripts ? ' ' : '') + transcript;
            }
          }
        }
        if (finalTranscripts) {
          // Update userInput state directly as required
          setUserInput((prev) => {
            const updated = prev ? `${prev} ${finalTranscripts}` : finalTranscripts;
            setFormData((f) => ({ ...f, businessIdea: updated }));
            return updated;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser address bar.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setSpeechError('Could not access microphone.');
      setIsListening(false);
    }
  };

  // Loading animation state ticker
  const [loadingStateIndex, setLoadingStateIndex] = useState(0);
  const loadingStates = [
    'Deconstructing business idea & core value hypothesis...',
    'Synthesizing target customer personas and buying behavior...',
    'Evaluating competitor density & strategic moats...',
    'Constructing 3-year financial model & unit economics...',
    'Formulating 30/60/90 day execution roadmap & action steps...',
    'Generating final investor-ready strategic report...',
  ];

  useEffect(() => {
    let timer: any;
    if (isLoading) {
      setLoadingStateIndex(0);
      timer = setInterval(() => {
        setLoadingStateIndex((prev) => (prev < loadingStates.length - 1 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage({ b64: base64, mimeType: file.type, file });
        setMode('visual');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      const idea = userInput.trim() || formData.businessIdea.trim();
      if (!idea) {
        alert('Please describe your startup or business idea before proceeding.');
        return;
      }
      setFormData((prev) => ({ ...prev, businessIdea: idea }));
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = () => {
    if (!isPaidActive) {
      if (mode === 'deep' || mode === 'visual') {
        onUpgradePro?.();
        return;
      }
      if (analysesUsed >= 3) {
        onUpgradePro?.();
        return;
      }
    }
    const finalData = {
      ...formData,
      businessIdea: userInput.trim() || formData.businessIdea.trim(),
    };
    onGenerate(finalData, mode, image);
  };

  return (
    <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-700 shadow-2xl p-6 md:p-10 relative overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center"></div>
            <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Analyzing with StratIQ AI</h3>
          <p className="text-sm font-mono text-indigo-400 max-w-md h-8 transition-all duration-300">
            {loadingStates[loadingStateIndex]}
          </p>

          <div className="w-64 bg-gray-800 h-2 rounded-full mt-6 overflow-hidden border border-gray-700">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${((loadingStateIndex + 1) / loadingStates.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-4">
            StratIQ Strategy Synthesis Engine • Generates comprehensive 18-section investor-grade strategy
          </p>
        </div>
      )}

      {/* Progress Steps Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-xl mx-auto mb-4">
          {[
            { num: 1, label: 'Business Idea' },
            { num: 2, label: 'Goals & Stage' },
            { num: 3, label: 'Strategy Mode' },
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div 
                key={s.num} 
                onClick={() => !isLoading && s.num < step && setStep(s.num as any)}
                className={`flex items-center gap-2 cursor-pointer ${s.num < step ? 'hover:opacity-80' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    isCompleted
                      ? 'bg-indigo-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-xs md:text-sm font-semibold hidden sm:inline ${
                    isCurrent ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Business Idea */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Step 1: Your Business Concept</h2>
            <p className="text-sm text-gray-400 mt-1">
              Give StratIQ the core details of the problem you are solving and who you are serving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                Business Name <span className="text-gray-500 text-xs font-normal">(Optional / Working Title)</span>
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. ApexFlow, PulseAnalytics, GreenCart"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                Industry & Domain
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-200">
                Business Idea & Value Proposition <span className="text-indigo-400">*</span>
              </label>

              <button
                type="button"
                id="wizard-mic-btn"
                data-testid="wizard-mic-btn"
                onClick={toggleListening}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse shadow-sm shadow-rose-900/40'
                    : 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 hover:text-white border border-indigo-500/30'
                }`}
                title={isListening ? 'Click to stop listening' : 'Dictate your startup idea using your microphone'}
              >
                {isListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping mr-0.5" />
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>Listening... (Stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dictate Idea</span>
                  </>
                )}
              </button>
            </div>

            {isListening && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-950/30 border border-rose-500/30 rounded-xl mb-2.5 animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0"></span>
                <p className="text-xs text-rose-200 font-medium leading-tight">
                  Microphone active. Speak your business idea clearly — speech will transcribe into the box in real-time.
                </p>
              </div>
            )}

            {speechError && (
              <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl mb-2.5 text-xs text-amber-300 flex items-center justify-between">
                <span>{speechError}</span>
                <button
                  type="button"
                  onClick={() => setSpeechError(null)}
                  className="text-amber-400 hover:text-white ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            <textarea
              id="wizard-business-idea-input"
              rows={4}
              value={userInput}
              onChange={(e) => {
                const val = e.target.value;
                setUserInput(val);
                setFormData((prev) => ({ ...prev, businessIdea: val }));
              }}
              placeholder="Describe what your startup does, what problem it solves, what makes it unique, and how it delivers value to users..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
            <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
              <span>Be as specific as possible for more accurate market and financial models.</span>
              <span>{userInput.length} characters</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                Target Customer
              </label>
              <select
                value={formData.targetCustomer}
                onChange={(e) => setFormData({ ...formData, targetCustomer: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TARGET_CUSTOMERS.map((tc) => (
                  <option key={tc} value={tc}>
                    {tc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                Target Geographic Market
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. North America, Global, UK"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                Intended Business Model
              </label>
              <select
                value={formData.businessModel}
                onChange={(e) => setFormData({ ...formData, businessModel: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {BUSINESS_MODELS.map((bm) => (
                  <option key={bm} value={bm}>
                    {bm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-700/60">
            <button
              onClick={handleNext}
              disabled={!formData.businessIdea.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2"
            >
              <span>Next: Goals & Stage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Goals & Stage */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Step 2: Business Goals & Stage</h2>
            <p className="text-sm text-gray-400 mt-1">
              Help StratIQ calibrate unit economics, hiring timelines, and growth expectations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                Primary 12-Month Objective
              </label>
              <select
                value={formData.primaryGoal}
                onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PRIMARY_GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                Current Startup Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                Target Revenue Milestone (Year 1)
              </label>
              <input
                type="text"
                value={formData.targetRevenue}
                onChange={(e) => setFormData({ ...formData, targetRevenue: e.target.value })}
                placeholder="e.g. $25k MRR, $250k Annual Revenue"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                Expected Launch Timeline
              </label>
              <select
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TIMELINES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                Available Launch Capital / Budget
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BUDGETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFormData({ ...formData, budget: b })}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      formData.budget === b
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                        : 'bg-gray-900/80 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-700/60">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2"
            >
              <span>Next: Strategy Mode</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Strategy Mode & Confirmation */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Step 3: Select Strategy Focus</h2>
              <p className="text-sm text-gray-400 mt-1">
                Choose the depth and output orientation for your AI analysis.
              </p>
            </div>

            {/* Plan Usage Pill */}
            <div className="shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isPaidActive 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                  : isStarterLimitReached 
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
              }`}>
                {isPaidActive ? (
                  <>
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Founder Pro • Unlimited Analyses</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-indigo-400" />
                    <span>Starter Plan: {Math.max(0, 3 - analysesUsed)} / 3 Brainstorms remaining</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Starter Plan Limit Reached Banner (Exact prompt wording) */}
          {isStarterLimitReached && (
            <div className="p-4 md:p-5 bg-amber-950/40 border border-amber-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-amber-200">
                    Your Starter plan limit has been reached.
                  </h4>
                  <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                    You have utilized all 3 Quick Brainstorms included in your monthly Starter plan. Upgrade to Founder Pro to unlock unlimited Deep Dive strategies, financial projections, and 24/7 AI venture advising.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onUpgradePro}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-colors shrink-0 shadow-lg shadow-amber-950/30 flex items-center gap-1.5 transform hover:scale-105"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Upgrade to Pro</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'deep',
                name: 'Deep Dive Strategy',
                icon: BrainCircuit,
                badge: isPaidActive ? 'Recommended' : 'Founder Pro',
                isProLocked: !isPaidActive,
                desc: '18 comprehensive sections: SWOT, 3-yr financials, branding, pricing, 90-day plan.',
              },
              {
                id: 'market',
                name: 'Market Pulse',
                icon: Search,
                badge: 'Live Search',
                isProLocked: false,
                desc: 'Real-time market trends, competitive positioning, and search citations.',
              },
              {
                id: 'quick',
                name: 'Quick Brainstorm',
                icon: Zap,
                badge: 'Starter (Free)',
                isProLocked: false,
                desc: 'Instant high-level feasibility score, key names, and initial validation.',
              },
              {
                id: 'visual',
                name: 'Visual Spark',
                icon: Eye,
                badge: isPaidActive ? 'Multimodal' : 'Founder Pro',
                isProLocked: !isPaidActive,
                desc: 'Upload a logo, UI mockup, or product image for design analysis.',
              },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id as AnalysisMode)}
                  className={`p-4 rounded-xl text-left border-2 transition-all relative ${
                    isSelected
                      ? 'bg-indigo-600/25 border-indigo-500 shadow-xl'
                      : 'bg-gray-900/70 border-gray-700 hover:border-gray-600'
                  } ${m.isProLocked ? 'opacity-95' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-gray-400'}`} />
                      {m.isProLocked && (
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      m.isProLocked 
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                        : 'bg-gray-800 text-indigo-300 border-gray-700'
                    }`}>
                      {m.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1 flex items-center justify-between">
                    <span>{m.name}</span>
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{m.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Inline Pro Teaser Notice if a locked mode is selected */}
          {!isPaidActive && (mode === 'deep' || mode === 'visual') && (
            <div className="p-4 bg-indigo-950/40 border border-indigo-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {mode === 'deep' ? 'Deep Dive Strategies are available with Founder Pro' : 'Visual Spark Analysis is available with Founder Pro'}
                  </h4>
                  <p className="text-xs text-indigo-200/80 mt-0.5">
                    {mode === 'deep' 
                      ? 'Unlock 18 in-depth sections, 3-year financial models, revenue projections, and full export capabilities.'
                      : 'Upload and analyze product mockups, wireframes, and branding assets with multimodal AI.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onUpgradePro}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-md flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Upgrade to Pro — $29/mo</span>
              </button>
            </div>
          )}

          {/* If visual mode is selected, show upload box */}
          {mode === 'visual' && (
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-700 border-dashed text-center">
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              {image ? (
                <div className="flex items-center justify-center gap-3">
                  <Eye className="w-6 h-6 text-emerald-400" />
                  <span className="text-sm text-gray-200">{image.file.name}</span>
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="cursor-pointer py-4"
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-200">
                    Click to upload a logo, wireframe, or product mockup
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Supports PNG, JPG, WebP</p>
                </div>
              )}
            </div>
          )}

          {/* Strategy Generation Summary Card */}
          <div className="bg-gray-900/90 rounded-xl p-4 border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Strategy Ready to Build
              </span>
              <h4 className="text-base font-bold text-white">
                {formData.businessName || 'Your Business Idea'} • {formData.industry}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xl">
                {formData.businessIdea}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-gray-400 block">Estimated Generation Time</span>
              <span className="text-sm font-mono font-bold text-emerald-400">~15 - 25 seconds</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-700/60">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={isLoading || (mode === 'visual' && !image && isPaidActive)}
              className={`px-8 py-3.5 text-white font-extrabold rounded-full text-base transition-all duration-300 shadow-xl flex items-center gap-2.5 transform hover:scale-105 disabled:scale-100 disabled:opacity-60 ${
                isStarterLimitReached || (!isPaidActive && (mode === 'deep' || mode === 'visual'))
                  ? 'bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 shadow-amber-950/30'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/30'
              }`}
            >
              {isStarterLimitReached ? (
                <>
                  <Zap className="w-5 h-5 text-amber-300" />
                  <span>Limit Reached — Upgrade to Pro</span>
                </>
              ) : !isPaidActive && (mode === 'deep' || mode === 'visual') ? (
                <>
                  <Lock className="w-5 h-5 text-amber-300" />
                  <span>Unlock with Founder Pro — $29/mo</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-indigo-200" />
                  <span>Generate AI Business Blueprint</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisWizard;
