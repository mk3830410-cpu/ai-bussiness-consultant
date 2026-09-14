import React, { useState, useEffect, useMemo } from 'react';
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
  ExternalLink,
  ChevronDown,
  DollarSign,
  Layers,
  ArrowRight,
  BarChart3,
  Clock,
  Columns2,
  Table as TableIcon
} from 'lucide-react';

export interface StrategyComparisonProps {
  strategies: SavedStrategy[];
  initialStrategyAId?: string;
  initialStrategyBId?: string;
  strategyA?: SavedStrategy;
  strategyB?: SavedStrategy;
  onClose: () => void;
  onOpenStrategy?: (strategy: SavedStrategy) => void;
}

export const StrategyComparison: React.FC<StrategyComparisonProps> = ({
  strategies = [],
  initialStrategyAId,
  initialStrategyBId,
  strategyA: directStrategyA,
  strategyB: directStrategyB,
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

  // Handle strategy selection state
  const [selectedIdA, setSelectedIdA] = useState<string>(() => {
    if (directStrategyA?.id) return directStrategyA.id;
    if (initialStrategyAId) return initialStrategyAId;
    return strategies[0]?.id || '';
  });

  const [selectedIdB, setSelectedIdB] = useState<string>(() => {
    if (directStrategyB?.id) return directStrategyB.id;
    if (initialStrategyBId) return initialStrategyBId;
    return strategies[1]?.id || strategies[0]?.id || '';
  });

  const [activeSection, setActiveSection] = useState<'all' | 'scores' | 'milestones' | 'financials'>('all');
  const [viewMode, setViewMode] = useState<'split' | 'table'>('split');

  const strategyA = useMemo(() => {
    return strategies.find(s => s.id === selectedIdA) || directStrategyA || strategies[0];
  }, [strategies, selectedIdA, directStrategyA]);

  const strategyB = useMemo(() => {
    return strategies.find(s => s.id === selectedIdB) || directStrategyB || strategies[1] || strategies[0];
  }, [strategies, selectedIdB, directStrategyB]);

  if (!strategyA || !strategyB) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-300">
        <p>Please ensure at least two strategies are saved to run a side-by-side comparison.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Return to Strategies
        </button>
      </div>
    );
  }

  // Safely extract strategy response objects
  const resA = (strategyA.result || {}) as any;
  const resB = (strategyB.result || {}) as any;

  // Score metrics
  const scoreObjA = resA?.businessOpportunityScore || {};
  const scoreObjB = resB?.businessOpportunityScore || {};

  const scoresA = {
    overall: strategyA.score || scoreObjA.overallScore || 82,
    market: scoreObjA.marketPotential || 85,
    feasibility: scoreObjA.feasibility || 80,
    revenue: scoreObjA.revenuePotential || 84,
  };

  const scoresB = {
    overall: strategyB.score || scoreObjB.overallScore || 80,
    market: scoreObjB.marketPotential || 81,
    feasibility: scoreObjB.feasibility || 82,
    revenue: scoreObjB.revenuePotential || 79,
  };

  // Milestones extraction
  const milestonesA = {
    day30: resA?.actionPlan?.day30 || ['Launch MVP and onboard initial beta cohort', 'Configure analytics telemetry'],
    day60: resA?.actionPlan?.day60 || ['Deploy team collaboration tier', 'Iterate user onboarding funnel'],
    day90: resA?.actionPlan?.day90 || ['Kickstart self-serve acquisition engine', 'Publish public API & webhooks'],
  };

  const milestonesB = {
    day30: resB?.actionPlan?.day30 || ['Launch core MVP and collect user feedback', 'Run initial positioning tests'],
    day60: resB?.actionPlan?.day60 || ['Expand feature depth and self-serve plans', 'Integrate payment gateways'],
    day90: resB?.actionPlan?.day90 || ['Scale inbound content marketing', 'Optimize activation conversions'],
  };

  // Financial projections extraction
  const getFinancials = (res: any) => {
    if (Array.isArray(res?.financialProjections) && res.financialProjections.length > 0) {
      return res.financialProjections;
    }
    return [
      { year: '1', revenue: '$140,000', costs: '$45,000', margin: '68%' },
      { year: '2', revenue: '$520,000', costs: '$110,000', margin: '78%' },
      { year: '3', revenue: '$1,650,000', costs: '$280,000', margin: '83%' },
    ];
  };

  const financialsA = getFinancials(resA);
  const financialsB = getFinancials(resB);

  // Pricing models
  const getPricing = (res: any) => {
    if (Array.isArray(res?.pricingModels) && res.pricingModels.length > 0) {
      return res.pricingModels;
    }
    return [
      { tier: 'Starter', price: '$29/mo', description: 'Essential tools' },
      { tier: 'Pro', price: '$79/mo', description: 'Advanced team access' },
    ];
  };

  const pricingA = getPricing(resA);
  const pricingB = getPricing(resB);

  return (
    <div 
      className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col space-y-6"
      id="strategy-split-screen-container"
    >
      {/* Top Header & Strategy Selectors Bar */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Columns2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">
              Split-Screen Strategy Comparison
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 font-mono">
              Side-by-Side Analysis
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare validation scores, execution milestones, and 3-year financial projections.
          </p>
        </div>

        {/* View Mode & Exit Controls */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Split Screen</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Matrix Table</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Close Comparison</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar for Picking Strategy A & B */}
      <div className="px-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Selector A */}
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px]">
              Strategy Primary (Left Panel)
            </span>
            {onOpenStrategy && (
              <button
                onClick={() => onOpenStrategy(strategyA)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open Blueprint</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={selectedIdA}
            onChange={(e) => setSelectedIdA(e.target.value)}
            className="w-full bg-slate-900 border border-indigo-500/40 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.businessName} ({s.industry || 'Venture'}) • Score: {s.score || 80}/100
              </option>
            ))}
          </select>
        </div>

        {/* Selector B */}
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-400 uppercase tracking-wider text-[10px]">
              Strategy Benchmark (Right Panel)
            </span>
            {onOpenStrategy && (
              <button
                onClick={() => onOpenStrategy(strategyB)}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open Blueprint</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={selectedIdB}
            onChange={(e) => setSelectedIdB(e.target.value)}
            className="w-full bg-slate-900 border border-purple-500/40 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.businessName} ({s.industry || 'Venture'}) • Score: {s.score || 80}/100
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div className="px-6 flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Dimensions' },
          { id: 'scores', label: '1. Opportunity Scores' },
          { id: 'milestones', label: '2. Milestone Roadmaps' },
          { id: 'financials', label: '3. Financial Projections' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-750 border border-slate-700/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Split-Screen View */}
      {viewMode === 'split' ? (
        <div className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ================= COLUMN A ================= */}
          <div className="space-y-6">
            {/* Strategy A Header Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                  {strategyA.industry || 'Tech SaaS'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {strategyA.status || 'Validated'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">{strategyA.businessName}</h3>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {resA?.uniqueValueProposition || strategyA.inputs?.businessIdea || 'Strategic business blueprint'}
              </p>
            </div>

            {/* SECTION 1: Opportunity Scores */}
            {(activeSection === 'all' || activeSection === 'scores') && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>Opportunity Scores</span>
                  </h4>
                  <span className="font-mono font-black text-lg text-emerald-400">
                    {scoresA.overall}/100
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Market Potential</span>
                      <span className="font-bold text-white">{scoresA.market}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${scoresA.market}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Feasibility Score</span>
                      <span className="font-bold text-white">{scoresA.feasibility}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${scoresA.feasibility}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Revenue Potential</span>
                      <span className="font-bold text-white">{scoresA.revenue}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${scoresA.revenue}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: Milestone Timeline Roadmap */}
            {(activeSection === 'all' || activeSection === 'milestones') && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>Milestone Roadmap (30-60-90 Days)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Execution Plan</span>
                </div>

                <div className="space-y-3">
                  {/* Day 30 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 30-Day Sprint (MVP)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">Phase 1</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {milestonesA.day30.slice(0, 2).map((m: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Day 60 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 60-Day Expansion
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">Phase 2</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {milestonesA.day60.slice(0, 2).map((m: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Day 90 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 90-Day Scale
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">Phase 3</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {milestonesA.day90.slice(0, 2).map((m: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: Financial Projections & Margins */}
            {(activeSection === 'all' || activeSection === 'financials') && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>3-Year Financial Projections</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Revenue & Costs</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  {financialsA.map((f: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Year {f.year}</span>
                      <span className="text-sm font-black text-white block mt-0.5">{f.revenue}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Costs: {f.costs}</span>
                      {f.margin && (
                        <span className="text-[9px] font-bold text-emerald-400 block mt-0.5">{f.margin} margin</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pricing summary */}
                <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-indigo-400">Pricing Architecture:</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {pricingA.map((p: any, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700">
                        <strong>{p.tier || p.name}:</strong> {p.price}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================= COLUMN B ================= */}
          <div className="space-y-6">
            {/* Strategy B Header Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400">
                  {strategyB.industry || 'Tech SaaS'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  {strategyB.status || 'Validated'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">{strategyB.businessName}</h3>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {resB?.uniqueValueProposition || strategyB.inputs?.businessIdea || 'Strategic business blueprint'}
              </p>
            </div>

            {/* SECTION 1: Opportunity Scores */}
            {(activeSection === 'all' || activeSection === 'scores') && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span>Opportunity Scores</span>
                  </h4>
                  <span className="font-mono font-black text-lg text-purple-300">
                    {scoresB.overall}/100
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Market Potential</span>
                      <span className="font-bold text-white">{scoresB.market}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${scoresB.market}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Feasibility Score</span>
                      <span className="font-bold text-white">{scoresB.feasibility}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${scoresB.feasibility}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Revenue Potential</span>
                      <span className="font-bold text-white">{scoresB.revenue}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${scoresB.revenue}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: Milestone Timeline Roadmap */}
            {(activeSection === 'all' || activeSection === 'milestones') && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>Milestone Roadmap (30-60-90 Days)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Execution Plan</span>
                </div>

                <div className="space-y-3">
                  {/* Day 30 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 30-Day Sprint (MVP)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">Phase 1</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {milestonesB.day30.slice(0, 2).map((m: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Day 60 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 60-Day Expansion
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">Phase 2</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {milestonesB.day60.slice(0, 2).map((m: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Day 90 */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 90-Day Scale
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">Phase 3</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {milestonesB.day90.slice(0, 2).map((m: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: Financial Projections & Margins */}
            {(activeSection === 'all' || activeSection === 'financials') && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>3-Year Financial Projections</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Revenue & Costs</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  {financialsB.map((f: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Year {f.year}</span>
                      <span className="text-sm font-black text-white block mt-0.5">{f.revenue}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Costs: {f.costs}</span>
                      {f.margin && (
                        <span className="text-[9px] font-bold text-purple-400 block mt-0.5">{f.margin} margin</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pricing summary */}
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-purple-400">Pricing Architecture:</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {pricingB.map((p: any, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700">
                        <strong>{p.tier || p.name}:</strong> {p.price}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Matrix Table Mode */
        <div className="px-6 pb-8 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="py-3 px-4 font-bold text-slate-400 uppercase text-[11px] tracking-wider w-1/4">Dimension</th>
                <th className="py-3 px-4 font-bold text-indigo-400 w-[37.5%]">{strategyA.businessName}</th>
                <th className="py-3 px-4 font-bold text-purple-400 w-[37.5%]">{strategyB.businessName}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-300">Overall Score</td>
                <td className="py-3 px-4 font-bold text-emerald-400 font-mono">{scoresA.overall}/100</td>
                <td className="py-3 px-4 font-bold text-emerald-400 font-mono">{scoresB.overall}/100</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-300">Market Potential</td>
                <td className="py-3 px-4 text-slate-200">{scoresA.market}%</td>
                <td className="py-3 px-4 text-slate-200">{scoresB.market}%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-300">Year 3 Revenue</td>
                <td className="py-3 px-4 font-bold text-indigo-300">{financialsA[2]?.revenue || '$1.6M'}</td>
                <td className="py-3 px-4 font-bold text-purple-300">{financialsB[2]?.revenue || '$1.4M'}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-300">Day 30 Execution</td>
                <td className="py-3 px-4 text-slate-300 text-xs">{milestonesA.day30[0]}</td>
                <td className="py-3 px-4 text-slate-300 text-xs">{milestonesB.day30[0]}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-300">Day 90 Scale</td>
                <td className="py-3 px-4 text-slate-300 text-xs">{milestonesA.day90[0]}</td>
                <td className="py-3 px-4 text-slate-300 text-xs">{milestonesB.day90[0]}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StrategyComparison;
