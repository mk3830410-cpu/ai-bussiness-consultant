import React from 'react';
import { Award, TrendingUp, ShieldCheck, Target, DollarSign, Zap, AlertCircle } from 'lucide-react';
import { BusinessScoreBreakdown } from '../types';

interface BusinessScoreCardProps {
  scoreData?: BusinessScoreBreakdown;
  fallbackScore?: number;
  fallbackJustification?: string;
}

export const BusinessScoreCard: React.FC<BusinessScoreCardProps> = ({
  scoreData,
  fallbackScore = 8,
  fallbackJustification,
}) => {
  // Normalize score to 0-100
  const overall = scoreData?.overallScore 
    ? Math.min(100, Math.max(0, scoreData.overallScore))
    : Math.min(100, Math.max(0, fallbackScore * 10));

  const market = scoreData?.marketPotential || Math.min(100, overall + 4);
  const feasibility = scoreData?.feasibility || Math.min(100, overall - 2);
  const competition = scoreData?.competitionScore || Math.min(100, Math.max(40, overall - 12));
  const revenue = scoreData?.revenuePotential || Math.min(100, overall + 2);
  const growth = scoreData?.growthPotential || Math.min(100, overall + 3);

  const getScoreRating = (val: number) => {
    if (val >= 85) return { label: 'High Opportunity', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (val >= 70) return { label: 'Strong Viability', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' };
    if (val >= 55) return { label: 'Moderate / Needs Refinement', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { label: 'High Execution Risk', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
  };

  const rating = getScoreRating(overall);

  const dimensions = [
    { name: 'Market Potential', val: market, icon: Target, desc: 'Addressable customer demand & industry tailwinds' },
    { name: 'Feasibility & Execution', val: feasibility, icon: ShieldCheck, desc: 'Technical & operational complexity to ship MVP' },
    { name: 'Competitive Moat', val: competition, icon: Zap, desc: 'Defensibility against existing alternatives' },
    { name: 'Revenue Potential', val: revenue, icon: DollarSign, desc: 'Willingness to pay & unit margin sustainability' },
    { name: 'Growth & Scalability', val: growth, icon: TrendingUp, desc: 'Viral expansion & market replication capability' },
  ];

  // SVG circle calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall / 100) * circumference;

  return (
    <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-700/80 p-6 md:p-8 shadow-xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-gray-700/60">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Award className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              StratIQ Opportunity Index
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">Business Opportunity Score</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-xl">
            Multivariate venture viability assessment calibrated across product-market fit indicators, competitive density, and monetization strength.
          </p>
        </div>

        {/* Rating Badge */}
        <div className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 shrink-0 ${rating.bg} ${rating.color}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
          <span>{rating.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-6">
        {/* Left: Overall Gauge */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-gray-900/60 rounded-xl border border-gray-700/50">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r={radius}
                className="stroke-gray-800"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="70"
                cy="70"
                r={radius}
                className="stroke-indigo-500 transition-all duration-1000 ease-out"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-white tracking-tight">{overall}</span>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">out of 100</span>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm font-semibold text-gray-200">
              {overall >= 80 ? 'Top 15% of Evaluated Concepts' : overall >= 65 ? 'Competitive with Strong Promise' : 'Requires Strategic Pivots'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Based on comparative startup benchmarks
            </p>
          </div>
        </div>

        {/* Right: Dimension Bars */}
        <div className="lg:col-span-8 space-y-4">
          {dimensions.map((dim) => {
            const DimIcon = dim.icon;
            const barColor = 
              dim.val >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
              dim.val >= 65 ? 'bg-gradient-to-r from-indigo-500 to-indigo-400' :
              'bg-gradient-to-r from-amber-500 to-amber-400';

            return (
              <div key={dim.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <DimIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-200">{dim.name}</span>
                  </div>
                  <span className="font-bold text-white text-sm">{dim.val}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-700/40">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${dim.val}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 leading-tight">{dim.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Justification summary */}
      {(scoreData?.justification || fallbackJustification) && (
        <div className="mt-6 p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-sm text-gray-300 leading-relaxed">
          <span className="font-semibold text-indigo-300 block mb-1">Strategic Score Rationale:</span>
          {scoreData?.justification || fallbackJustification}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 pt-3 border-t border-gray-700/40">
        <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span>
          AI-generated strategic heuristics derived from market modeling. Intended for directional planning, not guaranteed investment returns.
        </span>
      </div>
    </div>
  );
};

export default BusinessScoreCard;
