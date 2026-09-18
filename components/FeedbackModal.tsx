import React, { useState, useEffect } from 'react';
import { X, MessageSquareHeart, Star, Send, Copy, Check, Sparkles, Mail } from 'lucide-react';
import { SUPPORT_EMAIL, createSupportMailto } from '../supportConfig';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategyName?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  strategyName = '',
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('strategy_quality');
  const [businessName, setBusinessName] = useState<string>(strategyName);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (strategyName) {
      setBusinessName(strategyName);
    }
  }, [strategyName]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [
    { id: 'strategy_quality', label: 'Strategy Quality' },
    { id: 'financial_projections', label: 'Financial Projections' },
    { id: 'swot_analysis', label: 'SWOT Analysis' },
    { id: 'market_competition', label: 'Market & Competition' },
    { id: 'ai_advisor', label: 'AI Advisor Chat' },
    { id: 'feature_request', label: 'Feature Request' },
    { id: 'other', label: 'General Experience' },
  ];

  const buildFeedbackBody = () => {
    const selectedCategoryLabel = categories.find((c) => c.id === category)?.label || category;
    return `StratIQ Feedback Report
----------------------------------------
Rating: ${rating} / 5 Stars
Category: ${selectedCategoryLabel}
${businessName ? `Strategy / Business: ${businessName}` : ''}

User Feedback:
${feedbackText || '(No additional comments)'}
----------------------------------------
Submitted via StratIQ App`;
  };

  const handleSendViaEmail = () => {
    const body = buildFeedbackBody();
    const mailto = createSupportMailto('feedback', body);
    window.location.href = mailto;
    setIsSubmitted(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildFeedbackBody());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-100 animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <MessageSquareHeart size={20} />
            </div>
            <div>
              <h3 id="feedback-modal-title" className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Send Feedback
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Direct Support
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Help us improve StratIQ. Your comments go straight to our team at{' '}
                <span className="text-indigo-400 font-medium">{SUPPORT_EMAIL}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close feedback modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Check size={28} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Thank You for Your Feedback!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                Your email client was opened to send your feedback directly to {SUPPORT_EMAIL}. We carefully review all suggestions to make your AI Co-Founder better.
              </p>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/30"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendViaEmail();
            }}
            className="space-y-4"
          >
            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                How would you rate your strategy quality?
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating ?? rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 rounded-md text-slate-600 hover:text-amber-400 transition-colors focus:outline-none focus:ring-1 focus:ring-amber-400"
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={22}
                        className={active ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                      />
                    </button>
                  );
                })}
                <span className="text-xs text-slate-400 ml-2 font-medium">
                  {rating === 5 && 'Outstanding'}
                  {rating === 4 && 'Very Good'}
                  {rating === 3 && 'Decent / Needs Tuning'}
                  {rating === 2 && 'Below Expectations'}
                  {rating === 1 && 'Needs Significant Work'}
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="feedback-category" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Feedback Focus Area
              </label>
              <select
                id="feedback-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Business/Strategy Context */}
            <div>
              <label htmlFor="feedback-business-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Strategy / Business Name (Optional)
              </label>
              <input
                id="feedback-business-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., NovaAI CRM, EcoClean Delivery"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Qualitative Feedback Text */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="feedback-comments" className="text-xs font-semibold text-slate-300">
                  What was helpful or what could be improved?
                </label>
                <span className="text-[10px] text-slate-500">{feedbackText.length}/800</span>
              </div>
              <textarea
                id="feedback-comments"
                rows={4}
                maxLength={800}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your thoughts on the depth of the analysis, market insights, financial calculations, or suggest a new tool..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
                title="Copy feedback to clipboard"
              >
                {isCopied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Mail size={14} />
                  <span>Send via Email</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
