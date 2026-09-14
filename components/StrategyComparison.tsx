import React, { useEffect } from 'react';
import { SavedStrategy, StrategyResponse } from '../types';
import { 
  X, 
  ArrowLeftRight, 
  Award, 
  Building, 
  Lightbulb, 
  Target, 
  Coins, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Calendar,
  ExternalLink
} from 'lucide-react';

interface StrategyComparisonProps {
  strategyA: SavedStrategy;
  strategyB: SavedStrategy;
  onClose: () => void;
  onOpenStrategy?: (strategy: SavedStrategy) => void;
}

export const StrategyComparison: React.FC<StrategyComparisonProps> = ({
  strategyA,
  strategyB,
  onClose,
  onOpenStrategy,
}) => {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Safely extract strategy response objects
  const resA = strategyA.result as any;
  const resB = strategyB.result as any;

  // Extract comparable fields safely from existing schema
  const getCompetitors = (res: any) => {
    const comps = res?.marketAnalysis?.competitors;
    if (Array.isArray(comps) && comps.length > 0) {
      return comps.map((c: any) => c.name || c).join(', ');
    }
    return 'Direct & indirect market alternatives';
  };

  const getRisks = (res: any) => {
    if (Array.isArray(res?.risksAndChallenges) && res.risksAndChallenges.length > 0) {
      return res.risksAndChallenges.map((r: any) => `${r.risk || r} (${r.impact || 'Medium'})`).slice(0, 3);
    }
    if (Array.isArray(res?.marketAnalysis?.swot?.threats) && res.marketAnalysis.swot.threats.length > 0) {
      return res.marketAnalysis.swot.threats.slice(0, 3);
    }
    return null;
  };

  const getOpportunities = (res: any) => {
    if (Array.isArray(res?.marketAnalysis?.swot?.opportunities) && res.marketAnalysis.swot.opportunities.length > 0) {
      return res.marketAnalysis.swot.opportunities.slice(0, 3);
    }
    return null;
  };

  const getActionPlan = (res: any) => {
    if (res?.actionPlan) {
      const d30 = res.actionPlan.day30?.[0] || '';
      const d60 = res.actionPlan.day60?.[0] || '';
      const d90 = res.actionPlan.day90?.[0] || '';
      const items = [d30 && `Day 30: ${d30}`, d60 && `Day 60: ${d60}`, d90 && `Day 90: ${d90}`].filter(Boolean);
      return items.length > 0 ? items : null;
    }
    return null;
  };

  const comparisonRows = [
    {
      label: 'Business Name',
      icon: Building,
      valA: strategyA.businessName,
      valB: strategyB.businessName,
      isHighlight: false,
    },
    {
      label: 'Business Idea',
      icon: Lightbulb,
      valA: strategyA.inputs?.businessIdea || strategyA.inputs?.userInput || 'AI Venture Concept',
      valB: strategyB.inputs?.businessIdea || strategyB.inputs?.userInput || 'AI Venture Concept',
      isHighlight: false,
    },
    {
      label: 'Overall Business Score',
      icon: Award,
      valA: `${strategyA.score || 80}/100`,
      valB: `${strategyB.score || 80}/100`,
      isScore: true,
      scoreA: strategyA.score || 80,
      scoreB: strategyB.score || 80,
    },
    {
      label: 'Market Opportunity',
      icon: TrendingUp,
      valA: resA?.marketAnalysis?.uniqueSellingProposition || resA?.uniqueValueProposition || 'High growth emerging sector',
      valB: resB?.marketAnalysis?.uniqueSellingProposition || resB?.uniqueValueProposition || 'High growth emerging sector',
    },
    {
      label: 'Target Customer',
      icon: Target,
      valA: resA?.marketAnalysis?.targetAudience || resA?.targetAudienceDetails?.idealCustomer || strategyA.inputs?.targetCustomer || 'B2B and prosumers',
      valB: resB?.marketAnalysis?.targetAudience || resB?.targetAudienceDetails?.idealCustomer || strategyB.inputs?.targetCustomer || 'B2B and prosumers',
    },
    {
      label: 'Business Model',
      icon: Sparkles,
      valA: resA?.businessModelOverview || strategyA.inputs?.businessModel || 'Direct Subscription & Services',
      valB: resB?.businessModelOverview || strategyB.inputs?.businessModel || 'Direct Subscription & Services',
    },
    {
      label: 'Revenue Model',
      icon: Coins,
      valA: Array.isArray(resA?.revenueStreamsOverview) ? resA.revenueStreamsOverview.join(', ') : (resA?.monetizationPlan?.[0]?.name || 'Tiered Subscription'),
      valB: Array.isArray(resB?.revenueStreamsOverview) ? resB.revenueStreamsOverview.join(', ') : (resB?.monetizationPlan?.[0]?.name || 'Tiered Subscription'),
    },
    {
      label: 'Pricing Strategy',
      icon: Coins,
      valA: resA?.pricingStrategyOverview || resA?.pricingModels?.[0]?.name || 'Value-based tiered pricing',
      valB: resB?.pricingStrategyOverview || resB?.pricingModels?.[0]?.name || 'Value-based tiered pricing',
    },
    {
      label: 'Competitive Advantage',
      icon: Sparkles,
      valA: resA?.uniqueValueProposition || resA?.marketAnalysis?.uniqueSellingProposition || 'Proprietary workflows and AI speed',
      valB: resB?.uniqueValueProposition || resB?.marketAnalysis?.uniqueSellingProposition || 'Proprietary workflows and AI speed',
    },
    {
      label: 'Competition',
      icon: Target,
      valA: getCompetitors(resA),
      valB: getCompetitors(resB),
    },
    {
      label: 'Go-To-Market Strategy',
      icon: TrendingUp,
      valA: resA?.goToMarketStrategy || resA?.marketingStrategy || 'Inbound content, developer community, and direct outreach',
      valB: resB?.goToMarketStrategy || resB?.marketingStrategy || 'Inbound content, developer community, and direct outreach',
    },
    {
      label: 'Growth Strategy',
      icon: TrendingUp,
      valA: resA?.growthStrategy || resA?.growthHackingTips?.[0] || 'Organic referral loops and strategic partnerships',
      valB: resB?.growthStrategy || resB?.growthHackingTips?.[0] || 'Organic referral loops and strategic partnerships',
    },
    {
      label: 'Key Risks',
      icon: ShieldAlert,
      listA: getRisks(resA),
      listB: getRisks(resB),
    },
    {
      label: 'Market Opportunities',
      icon: TrendingUp,
      listA: getOpportunities(resA),
      listB: getOpportunities(resB),
    },
    {
      label: 'Recommended Next Steps',
      icon: CheckCircle2,
      listA: Array.isArray(resA?.nextSteps) ? resA.nextSteps.slice(0, 3) : (resA?.keyRecommendations?.slice(0, 3) || ['Validate MVP with 20 users', 'Launch landing page waitlist']),
      listB: Array.isArray(resB?.nextSteps) ? resB.nextSteps.slice(0, 3) : (resB?.keyRecommendations?.slice(0, 3) || ['Validate MVP with 20 users', 'Launch landing page waitlist']),
    },
    {
      label: '90-Day Plan',
      icon: Calendar,
      listA: getActionPlan(resA),
      listB: getActionPlan(resB),
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
    >
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 id="comparison-title" className="text-lg sm:text-xl font-black text-white tracking-tight">
                Strategy Comparison
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Side-by-side strategic breakdown of {strategyA.businessName} vs {strategyB.businessName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            aria-label="Close comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-3 px-4 font-bold text-slate-400 uppercase text-[11px] tracking-wider w-1/4">
                    Dimension
                  </th>
                  <th className="py-3 px-4 w-[37.5%]">
                    <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/30">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-white text-sm truncate">{strategyA.businessName}</span>
                        {onOpenStrategy && (
                          <button
                            onClick={() => onOpenStrategy(strategyA)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 shrink-0"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <span className="text-[11px] text-indigo-300/80 block mt-0.5">{strategyA.industry}</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 w-[37.5%]">
                    <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/30">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-white text-sm truncate">{strategyB.businessName}</span>
                        {onOpenStrategy && (
                          <button
                            onClick={() => onOpenStrategy(strategyB)}
                            className="text-[10px] text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-1 shrink-0"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <span className="text-[11px] text-purple-300/80 block mt-0.5">{strategyB.industry}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {comparisonRows.map((row, idx) => {
                  const Icon = row.icon;
                  const isScoreRow = (row as any).isScore;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-300 align-top">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{row.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 align-top leading-relaxed bg-indigo-950/10">
                        {isScoreRow ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-emerald-400 text-base">{row.valA}</span>
                            {(row as any).scoreA > (row as any).scoreB && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                                Higher
                              </span>
                            )}
                          </div>
                        ) : row.listA ? (
                          <ul className="space-y-1">
                            {row.listA.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span>{row.valA || '—'}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 align-top leading-relaxed bg-purple-950/10">
                        {isScoreRow ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-emerald-400 text-base">{row.valB}</span>
                            {(row as any).scoreB > (row as any).scoreA && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                                Higher
                              </span>
                            )}
                          </div>
                        ) : row.listB ? (
                          <ul className="space-y-1">
                            {row.listB.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span>{row.valB || '—'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>Comparative insights generated from persisted Firestore records.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
