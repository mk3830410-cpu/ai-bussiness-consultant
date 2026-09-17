import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, ExternalLink } from 'lucide-react';
import { SUPPORT_EMAIL, createSupportMailto } from '../supportConfig';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How do I create a StratIQ account?",
    answer: "Click 'Get Started' or 'Log In' in the top navigation, select the 'Sign Up' tab, and provide your name, work email, and a secure password. You can also sign in instantly using your Google account. We'll send a quick email verification to keep your workspace safe."
  },
  {
    question: "How does StratIQ analyze my business idea?",
    answer: "Simply enter your startup concept or step through our Analysis Wizard. StratIQ's AI strategy engine evaluates your value proposition, customer personas, market sizing, competitive dynamics, SWOT matrix, and 3-year financial forecasts."
  },
  {
    question: "How do I upgrade to Founder Pro?",
    answer: "Navigate to the 'Pricing' tab or click any Founder Pro prompt across the app, select 'Get Pro' ($29/month), and complete the secure checkout powered by Razorpay. Once verified, your account unlocks unlimited deep-dive analyses, financial models, and PDF exports instantly."
  },
  {
    question: "What happens if my Razorpay payment fails?",
    answer: (
      <span>
        If a payment attempt is interrupted or declined by your bank, your card is not charged, or any temporary authorizations are automatically refunded. Your account remains safely on the Starter plan. You can retry with an alternate card or UPI, or reach out to our team at{' '}
        <a 
          href={createSupportMailto('payment')}
          className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2"
        >
          {SUPPORT_EMAIL}
        </a>{' '}
        for help.
      </span>
    )
  },
  {
    question: "How do I know whether my Pro subscription is active?",
    answer: "Your subscription status is always displayed in real-time on your Command Center dashboard and in Account Settings. As soon as your Razorpay payment verifies, your badge immediately updates to 'Active (Founder Pro)' with all Pro features unlocked."
  },
  {
    question: "How can I contact support?",
    answer: (
      <span>
        Email us at{' '}
        <a 
          href={createSupportMailto('general')}
          className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2"
        >
          {SUPPORT_EMAIL}
        </a>
        . We're here to help with your StratIQ account, subscriptions, payments, business strategies, and product feedback.
      </span>
    )
  }
];

interface FAQSectionProps {
  id?: string;
  className?: string;
  showTitle?: boolean;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ 
  id = "faq", 
  className = "",
  showTitle = true 
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(prev => prev === index ? null : index);
  };

  return (
    <section id={id} className={`py-16 relative ${className}`}>
      <div className="container mx-auto px-4 max-w-4xl">
        {showTitle && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3.5 py-1.5 mb-4 text-xs font-semibold text-indigo-300">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-slate-400 text-sm md:text-base max-w-xl mx-auto">
              Everything you need to know about StratIQ, Founder Pro subscriptions, and our AI strategy engine.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-700"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-expanded={isOpen}
                  id={`faq-toggle-${index}`}
                >
                  <span className="font-semibold text-white text-base md:text-lg">
                    {item.question}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-800/80 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-slate-300 text-sm leading-relaxed border-t border-slate-800/50">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Small contact prompt below FAQ */}
        <div className="mt-10 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/20 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="text-sm font-bold text-white">Still have questions?</h4>
            <p className="text-xs text-slate-400 mt-0.5">We're here to help with your account, billing, and business plans.</p>
          </div>
          <a
            href={createSupportMailto('general')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-600/20 shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Email StratIQ Support"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Support</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
