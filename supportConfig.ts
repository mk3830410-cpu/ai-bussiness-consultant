/**
 * Centralized Support & Contact Configuration for StratIQ
 * Official Support Email: stratiq.support@gmail.com
 */

export const SUPPORT_EMAIL = 'stratiq.support@gmail.com';

export type SupportSubjectType = 
  | 'general' 
  | 'login' 
  | 'payment' 
  | 'subscription' 
  | 'ai' 
  | 'feedback' 
  | 'account';

export const SUPPORT_SUBJECTS: Record<SupportSubjectType, string> = {
  general: 'StratIQ Support Request',
  login: 'StratIQ Login Issue',
  payment: 'StratIQ Payment Issue',
  subscription: 'StratIQ Subscription Support',
  ai: 'StratIQ AI Feature Issue',
  feedback: 'StratIQ Product Feedback',
  account: 'StratIQ Support — Account Help',
};

export const SUPPORT_MESSAGES = {
  primary: "Need help? We're here for you.",
  secondary: "Questions about your account, subscription, payments, or StratIQ features? Email us and we'll help you out.",
  paymentFailure: `Payment couldn't be completed. Please try again. If the issue continues, contact: ${SUPPORT_EMAIL}`,
  loginFailure: `Need help signing in? Contact our support team at ${SUPPORT_EMAIL}`,
};

/**
 * Helper to generate contextual mailto links with encoded subjects and optional pre-populated body.
 */
export function createSupportMailto(
  subjectType: SupportSubjectType = 'general',
  customBody?: string
): string {
  const subject = SUPPORT_SUBJECTS[subjectType] || SUPPORT_SUBJECTS.general;
  let mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
  if (customBody) {
    mailto += `&body=${encodeURIComponent(customBody)}`;
  }
  return mailto;
}
