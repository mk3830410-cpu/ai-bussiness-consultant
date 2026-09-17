import React from 'react';
import { 
  Mail, 
  ArrowLeft, 
  ShieldCheck, 
  User, 
  Key, 
  CreditCard, 
  Sparkles, 
  Database, 
  MessageSquare, 
  HelpCircle,
  ExternalLink,
  LifeBuoy
} from 'lucide-react';
import { SUPPORT_EMAIL, createSupportMailto, SUPPORT_MESSAGES } from '../supportConfig';
import { FAQSection } from './FAQSection';

interface SupportPageProps {
  onBack?: () => void;
  onOpenLogin?: () => void;
}

const SUPPORT_TOPICS = [
  {
    icon: User,
    title: 'Account issues',
    description: 'Profile settings, workspace credentials, and account recovery.',
    subjectType: 'account' as const
  },
  {
    icon: Key,
    title: 'Login problems',
    description: 'Password reset links, session verification, and credentials.',
    subjectType: 'login' as const
  },
  {
    icon: ShieldCheck,
    title: 'Google sign-in',
    description: 'OAuth domain verification, authorization issues, or Google account link.',
    subjectType: 'login' as const
  },
  {
    icon: CreditCard,
    title: 'Subscription & Razorpay payments',
    description: 'Billing inquiries, payment receipt confirmation, and renewals.',
    subjectType: 'payment' as const
  },
  {
    icon: Sparkles,
    title: 'Plan access',
    description: 'Founder Pro and Team Scale entitlement and feature activation.',
    subjectType: 'subscription' as const
  },
  {
    icon: LifeBuoy,
    title: 'Business analysis problems',
    description: 'Issues with strategy generation, market pulse, or financial forecasting.',
    subjectType: 'general' as const
  },
  {
    icon: MessageSquare,
    title: 'AI Advisor issues',
    description: 'Chat responses, context retention, or co-founder guidance queries.',
    subjectType: 'ai' as const
  },
  {
    icon: Database,
    title: 'Data-related questions',
    description: 'Cloud Firestore syncing, offline cache, and strategy exports.',
    subjectType: 'general' as const
  },
  {
    icon: HelpCircle,
    title: 'Product feedback',
    description: 'Feature requests, usability suggestions, and partner inquiries.',
    subjectType: 'feedback' as const
  }
];

export const SupportPage: React.FC<SupportPageProps> = ({ onBack, onOpenLogin }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb / Nav */}
      <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 transition"
          >
            <ArrowLeft size={14} />
            <span>Back to StratIQ</span>
          </button>
        ) : (
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </a>
        )}

        {onOpenLogin && (
          <button
            onClick={onOpenLogin}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 transition"
          >
            Sign In to Account
          </button>
        )}
      </div>

      <main className="max-w-5xl mx-auto space-y-12">
        {/* Main Hero Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
            <LifeBuoy className="w-4 h-4 text-indigo-400" />
            <span>StratIQ Official Support</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            StratIQ Support
          </h1>
          
          <p className="mt-4 text-lg text-slate-300">
            {SUPPORT_MESSAGES.primary}
          </p>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
            {SUPPORT_MESSAGES.secondary}
          </p>

          {/* Primary CTA Card */}
          <div className="mt-8 p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Direct Assistance</span>
                <h3 className="text-xl font-bold text-white mt-1">Need help with StratIQ?</h3>
                <p className="text-sm text-slate-300 mt-1">Contact us at:</p>
                <div className="mt-2 inline-flex items-center gap-2 text-lg sm:text-xl font-mono font-bold text-indigo-300 bg-slate-950/60 border border-slate-800 px-3.5 py-1.5 rounded-xl">
                  <Mail className="w-5 h-5 text-indigo-400" />
                  <span>{SUPPORT_EMAIL}</span>
                </div>
              </div>

              <a
                href={createSupportMailto('general')}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-sm transition-all duration-200 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 shrink-0 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
                aria-label="Email StratIQ Support"
              >
                <Mail className="w-4 h-4" />
                <span>Email StratIQ Support</span>
              </a>
            </div>
          </div>
        </div>

        {/* We Can Help With Section */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-white">We can help with:</h2>
            <p className="text-xs text-slate-400 mt-1">Select any topic to open a pre-formatted email to our support team</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SUPPORT_TOPICS.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <a
                  key={index}
                  href={createSupportMailto(topic.subjectType)}
                  className="group p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all duration-200 flex flex-col justify-between"
                  aria-label={`Contact support about ${topic.title}`}
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-1 text-[11px] font-semibold text-indigo-400">
                    <span>Contact team</span>
                    <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Embedded Compact FAQ */}
        <FAQSection className="pt-8 pb-4" />
      </main>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} StratIQ. Official Support: {SUPPORT_EMAIL}</p>
          <a
            href={createSupportMailto('general')}
            className="text-slate-400 hover:text-white transition underline underline-offset-2"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </footer>
    </div>
  );
};

export default SupportPage;
