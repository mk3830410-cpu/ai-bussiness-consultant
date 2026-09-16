import React from 'react';
import { Check, Rocket, Zap, Building, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { SubscriptionTier, UserSubscription } from '../types';

interface PricingPageProps {
  onSelectPlan: (tier: SubscriptionTier) => void;
  subscription?: UserSubscription;
  isProcessing?: boolean;
  onGetPro?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ 
  onSelectPlan, 
  subscription,
  isProcessing = false,
  onGetPro
}) => {
  const isProActive = subscription?.plan === 'pro' && subscription?.status === 'active';
  const isProPending = subscription?.plan === 'pro' && subscription?.status === 'pending';
  const isHalted = subscription?.status === 'halted';
  const isCancelled = subscription?.status === 'cancelled';

  // Determine button state for Founder Pro based on real backend / Firestore subscription data
  let proButtonText = 'Get Pro';
  let isProDisabled = false;

  if (isProcessing || isProPending) {
    proButtonText = 'Processing...';
    isProDisabled = true;
  } else if (isProActive) {
    proButtonText = 'Current Plan';
    isProDisabled = true;
  } else if (isCancelled) {
    proButtonText = 'Manage Subscription';
  } else if (isHalted) {
    proButtonText = 'Fix Payment';
  }

  const plans = [
    {
      id: 'free',
      name: 'Starter',
      price: '$0',
      period: '/month',
      icon: Rocket,
      description: 'Perfect for validating your first idea.',
      features: [
        '3 Quick Brainstorms per month',
        'Basic Market Pulse',
        'Community Support',
        'Single User'
      ],
      buttonText: !isProActive ? 'Current Plan' : 'Free Tier',
      disabled: !isProActive,
      popular: false,
      tier: 'free' as SubscriptionTier
    },
    {
      id: 'pro',
      name: 'Founder Pro',
      price: '$29',
      period: '/month',
      icon: Zap,
      description: 'For serious founders building their MVP.',
      features: [
        'Unlimited Deep Dive Strategies',
        'Visual Spark Analysis',
        'Export to PDF & CSV',
        'Financial Projections (3 Years)',
        'Priority 24/7 AI Advisor Support'
      ],
      buttonText: proButtonText,
      disabled: isProDisabled,
      popular: true,
      tier: 'pro' as SubscriptionTier
    },
    {
      id: 'enterprise',
      name: 'Team Scale',
      price: '$99',
      period: '/month',
      icon: Building,
      description: 'Collaboration tools for growing teams.',
      features: [
        'Everything in Pro',
        'Team Collaboration (Up to 5)',
        'Shared Editing & Comments',
        'White-label Reports',
        'Dedicated Account Manager'
      ],
      buttonText: 'Contact Sales',
      disabled: false,
      popular: false,
      tier: 'enterprise' as SubscriptionTier
    }
  ];

  const handlePlanClick = (plan: typeof plans[0]) => {
    if (plan.id === 'pro') {
      if (onGetPro) {
        onGetPro();
      } else {
        onSelectPlan('pro');
      }
    } else if (plan.id === 'enterprise') {
      // Team Scale: keeps "Contact Sales"
      window.open('mailto:sales@stratiq.ai?subject=StratIQ%20Team%20Scale%20Inquiry', '_blank');
    } else {
      onSelectPlan(plan.tier);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-indigo-400 font-semibold tracking-wide uppercase text-sm">Pricing Plans</h2>
        <h1 className="mt-2 text-4xl font-extrabold text-white sm:text-5xl">
          Choose Your Strategy
        </h1>
        <p className="mt-4 text-xl text-gray-400">
          Unlock the full power of StratIQ to accelerate your business journey.
        </p>

        {isProActive && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>You currently have an active Founder Pro subscription</span>
          </div>
        )}

        {isProPending && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 animate-pulse" />
            <span>Payment confirmation pending. Please wait a moment while your subscription activates.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-7xl w-full">
        {plans.map((plan) => {
          const isProCard = plan.id === 'pro';
          return (
            <div 
              key={plan.id} 
              className={`relative flex flex-col rounded-2xl border ${
                plan.popular 
                  ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 bg-gray-800' 
                  : 'border-gray-700 bg-gray-800/50'
              } p-8 transition-transform hover:scale-105`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 sm:translate-x-0">
                  <span className="inline-flex rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <plan.icon className={`h-10 w-10 ${plan.popular ? 'text-indigo-400' : 'text-gray-400'} mb-4`} />
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="mt-2 text-gray-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>

              <ul className="mb-8 space-y-4 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 shrink-0 mr-3" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                id={`plan-button-${plan.id}`}
                onClick={() => handlePlanClick(plan)}
                disabled={plan.disabled}
                className={`w-full rounded-lg px-4 py-3 text-center text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  plan.disabled
                    ? 'bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed opacity-80'
                    : isProCard
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {isProCard && (isProcessing || isProPending) && (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                )}
                <span>{plan.buttonText}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PricingPage;
