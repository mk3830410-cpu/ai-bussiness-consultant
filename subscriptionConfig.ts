import { UserSubscription } from './types';

export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  price: number;
  priceDisplay: string;
  period: string;
  description: string;
  features: string[];
  limits: {
    maxAnalysesPerMonth: number;
    maxAdvisorMessagesPerMonth: number;
    canDeepDive: boolean;
    canVisualSpark: boolean;
    canMarketPulse: boolean;
    canQuickBrainstorm: boolean;
    canFinancialProjections: boolean;
    canExportPdf: boolean;
    canExportCsv: boolean;
    canCompareStrategies: boolean;
    canTeamCollaboration: boolean;
  };
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Starter',
    price: 0,
    priceDisplay: '$0',
    period: '/month',
    description: 'Perfect for validating your first idea.',
    features: [
      '3 Quick Brainstorms per month',
      'Basic Market Pulse',
      'Community Support',
      'Single User',
    ],
    limits: {
      maxAnalysesPerMonth: 3,
      maxAdvisorMessagesPerMonth: 5,
      canDeepDive: false,
      canVisualSpark: false,
      canMarketPulse: true,
      canQuickBrainstorm: true,
      canFinancialProjections: false,
      canExportPdf: false,
      canExportCsv: false,
      canCompareStrategies: false,
      canTeamCollaboration: false,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 0,
    priceDisplay: '$0',
    period: '/month',
    description: 'Perfect for validating your first idea.',
    features: [
      '3 Quick Brainstorms per month',
      'Basic Market Pulse',
      'Community Support',
      'Single User',
    ],
    limits: {
      maxAnalysesPerMonth: 3,
      maxAdvisorMessagesPerMonth: 5,
      canDeepDive: false,
      canVisualSpark: false,
      canMarketPulse: true,
      canQuickBrainstorm: true,
      canFinancialProjections: false,
      canExportPdf: false,
      canExportCsv: false,
      canCompareStrategies: false,
      canTeamCollaboration: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Founder Pro',
    price: 29,
    priceDisplay: '$29',
    period: '/month',
    description: 'For serious founders building their MVP.',
    features: [
      'Unlimited Deep Dive Strategies',
      'Visual Spark Analysis',
      'Export to PDF & CSV',
      'Financial Projections (3 Years)',
      'Priority 24/7 AI Advisor Support',
    ],
    limits: {
      maxAnalysesPerMonth: Infinity,
      maxAdvisorMessagesPerMonth: Infinity,
      canDeepDive: true,
      canVisualSpark: true,
      canMarketPulse: true,
      canQuickBrainstorm: true,
      canFinancialProjections: true,
      canExportPdf: true,
      canExportCsv: true,
      canCompareStrategies: true,
      canTeamCollaboration: false,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Team Scale',
    price: 99,
    priceDisplay: '$99',
    period: '/month',
    description: 'Collaboration tools for growing teams.',
    features: [
      'Everything in Pro',
      'Team Collaboration (Up to 5 seats)',
      'Shared Editing & Comments',
      'White-label Strategy Reports',
      'Dedicated Account Manager',
      'Custom Invoicing & GST Support',
    ],
    limits: {
      maxAnalysesPerMonth: Infinity,
      maxAdvisorMessagesPerMonth: Infinity,
      canDeepDive: true,
      canVisualSpark: true,
      canMarketPulse: true,
      canQuickBrainstorm: true,
      canFinancialProjections: true,
      canExportPdf: true,
      canExportCsv: true,
      canCompareStrategies: true,
      canTeamCollaboration: true,
    },
  },
};

export interface UserUsage {
  periodMonth: string; // "YYYY-MM"
  analysesCount: number;
  advisorMessagesCount: number;
  lastUpdated?: number;
}

export type FeatureKey =
  | 'deep_dive'
  | 'visual_spark'
  | 'quick_brainstorm'
  | 'market_pulse'
  | 'financial_projections'
  | 'csv_export'
  | 'pdf_export'
  | 'strategy_comparison'
  | 'ai_advisor'
  | 'team_collaboration'
  | 'swot'
  | 'idea_vault';

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  limitReached?: boolean;
  currentUsage?: number;
  maxLimit?: number;
  requiredPlan?: 'pro' | 'enterprise';
  featureTitle?: string;
}

/**
 * Returns true ONLY when the user's subscription plan is 'pro' and status is 'active'.
 * In accordance with prompt requirements, Team Scale is not auto-granted unless active.
 */
export function isFounderProActive(subscription?: UserSubscription | null): boolean {
  if (!subscription) return false;
  return subscription.plan === 'pro' && subscription.status === 'active';
}

/**
 * Returns true if the user has an active Team Scale enterprise plan.
 */
export function isTeamScaleActive(subscription?: UserSubscription | null): boolean {
  if (!subscription) return false;
  return subscription.plan === 'enterprise' && subscription.status === 'active';
}

/**
 * Resolves the effective plan tier based on real active status.
 */
export function getEffectivePlan(subscription?: UserSubscription | null): PlanTier {
  if (isTeamScaleActive(subscription)) return 'enterprise';
  if (isFounderProActive(subscription)) return 'pro';
  return 'starter';
}

/**
 * Centralized Entitlement Check
 * Validates feature access and enforces Starter limits.
 */
export function canUseFeature(
  feature: FeatureKey,
  subscription?: UserSubscription | null,
  usage?: UserUsage | null
): EntitlementCheckResult {
  const effectiveTier = getEffectivePlan(subscription);
  const planConfig = PLAN_CONFIGS[effectiveTier];
  const isPaid = effectiveTier === 'pro' || effectiveTier === 'enterprise';

  switch (feature) {
    case 'deep_dive': {
      if (!isPaid) {
        return {
          allowed: false,
          requiredPlan: 'pro',
          featureTitle: 'Deep Dive Strategies',
          reason: 'Deep Dive Strategies are available with Founder Pro. Unlock 18 in-depth sections, financial models, and full roadmaps.',
        };
      }
      return { allowed: true };
    }

    case 'visual_spark': {
      if (!isPaid) {
        return {
          allowed: false,
          requiredPlan: 'pro',
          featureTitle: 'Visual Spark Analysis',
          reason: 'Visual Spark Analysis is available with Founder Pro. Upload wireframes, logos, and UI designs for multimodal analysis.',
        };
      }
      return { allowed: true };
    }

    case 'financial_projections': {
      if (!isPaid) {
        return {
          allowed: false,
          requiredPlan: 'pro',
          featureTitle: 'Financial Projections (3 Years)',
          reason: 'Financial Projections (3 Years) are available with Founder Pro. Access annual revenue forecasts, cost modeling, and gross margin analysis.',
        };
      }
      return { allowed: true };
    }

    case 'pdf_export': {
      if (!isPaid) {
        return {
          allowed: false,
          requiredPlan: 'pro',
          featureTitle: 'Export to PDF',
          reason: 'Export to PDF is available with Founder Pro. Download presentation-grade strategy documents.',
        };
      }
      return { allowed: true };
    }

    case 'csv_export': {
      if (!isPaid) {
        return {
          allowed: false,
          requiredPlan: 'pro',
          featureTitle: 'Export to CSV',
          reason: 'Export to CSV is available with Founder Pro. Export your 3-year financial models directly to spreadsheets.',
        };
      }
      return { allowed: true };
    }

    case 'strategy_comparison': {
      if (!isPaid) {
        return {
          allowed: false,
          requiredPlan: 'pro',
          featureTitle: 'Strategy Comparison',
          reason: 'Strategy comparison is available with Founder Pro. Compare ventures side-by-side in split-screen.',
        };
      }
      return { allowed: true };
    }

    case 'team_collaboration': {
      if (effectiveTier !== 'enterprise') {
        return {
          allowed: false,
          requiredPlan: 'enterprise',
          featureTitle: 'Team Collaboration',
          reason: 'Team Collaboration (up to 5 seats) is available on Team Scale. Collaborate with co-founders in real-time.',
        };
      }
      return { allowed: true };
    }

    case 'quick_brainstorm':
    case 'market_pulse': {
      const analysesUsed = usage?.analysesCount || 0;
      const maxAnalyses = planConfig.limits.maxAnalysesPerMonth;

      if (!isPaid && analysesUsed >= maxAnalyses) {
        return {
          allowed: false,
          limitReached: true,
          currentUsage: analysesUsed,
          maxLimit: maxAnalyses,
          requiredPlan: 'pro',
          featureTitle: 'Monthly Analysis Limit',
          reason: 'Your Starter plan limit has been reached (3 Quick Brainstorms used this month). Upgrade to Founder Pro for unlimited analyses.',
        };
      }

      return {
        allowed: true,
        currentUsage: analysesUsed,
        maxLimit: maxAnalyses,
      };
    }

    case 'ai_advisor': {
      const messagesUsed = usage?.advisorMessagesCount || 0;
      const maxMessages = planConfig.limits.maxAdvisorMessagesPerMonth;

      if (!isPaid && messagesUsed >= maxMessages) {
        return {
          allowed: false,
          limitReached: true,
          currentUsage: messagesUsed,
          maxLimit: maxMessages,
          requiredPlan: 'pro',
          featureTitle: 'AI Advisor Message Limit',
          reason: 'You have reached your 5 free AI Advisor questions for this month. Upgrade to Founder Pro for Priority 24/7 AI Advisor Support.',
        };
      }

      return {
        allowed: true,
        currentUsage: messagesUsed,
        maxLimit: maxMessages,
      };
    }

    case 'swot':
    case 'idea_vault':
    default:
      return { allowed: true };
  }
}
