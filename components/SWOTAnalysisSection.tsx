import React, { useState } from 'react';
import { SWOT, StrategyResponse } from '../types';
import { ShieldCheck, AlertTriangle, TrendingUp, AlertOctagon, Info, Copy, Radar, LayoutGrid } from 'lucide-react';
import { useToast } from './Toast';
import { SWOTRadarChart } from './SWOTRadarChart';

interface SWOTAnalysisSectionProps {
  swot?: SWOT | null;
  strategy?: StrategyResponse | null;
  isPrintable?: boolean;
}

export const SWOTAnalysisSection: React.FC<SWOTAnalysisSectionProps> = ({ 
  swot: directSwot, 
  strategy, 
  isPrintable = false 
}) => {
  const { showToast } = useToast();

  // Extract from direct prop or nested marketAnalysis
  const effectiveSwot: SWOT | null = directSwot || strategy?.marketAnalysis?.swot || null;

  const strengths = effectiveSwot?.strengths || [];
  const weaknesses = effectiveSwot?.weaknesses || [];
  const opportunities = effectiveSwot?.opportunities || [];
  const threats = effectiveSwot?.threats || [];

  const hasData = strengths.length > 0 || weaknesses.length > 0 || opportunities.length > 0 || threats.length > 0;

  const handleCopy = () => {
    if (!hasData) return;
    const text = [
      '=== SWOT ANALYSIS ===',
      '',
      `STRENGTHS:`,
      ...strengths.map((s, i) => `  ${i + 1}. ${s}`),
      '',
      `WEAKNESSES:`,
      ...weaknesses.map((w, i) => `  ${i + 1}. ${w}`),
      '',
      `OPPORTUNITIES:`,
      ...opportunities.map((o, i) => `  ${i + 1}. ${o}`),
      '',
      `THREATS:`,
      ...threats.map((t, i) => `  ${i + 1}. ${t}`),
    ].join('\n');

    navigator.clipboard.writeText(text);
    showToast('SWOT Analysis copied to clipboard', 'success', 'copy');
  };

  if (!hasData) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
        <Info className="w-8 h-8 mx-auto text-slate-500 mb-2" />
        <p className="text-sm font-medium">SWOT insights aren't available for this strategy yet.</p>
        <p className="text-xs text-slate-500 mt-1">Generate a deep-dive market analysis to evaluate strategic quadrants.</p>
      </div>
    );
  }

  const quadrants = [
    {
      title: 'Strengths',
      tag: 'Internal Factors',
      letter: 'S',
      items: strengths,
      icon: ShieldCheck,
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
      bgColor: 'bg-emerald-950/20',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      iconColor: 'text-emerald-400',
      bulletColor: 'bg-emerald-400',
    },
    {
      title: 'Weaknesses',
      tag: 'Internal Challenges',
      letter: 'W',
      items: weaknesses,
      icon: AlertTriangle,
      borderColor: 'border-rose-500/30 hover:border-rose-500/50',
      bgColor: 'bg-rose-950/20',
      badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      iconColor: 'text-rose-400',
      bulletColor: 'bg-rose-400',
    },
    {
      title: 'Opportunities',
      tag: 'External Factors',
      letter: 'O',
      items: opportunities,
      icon: TrendingUp,
      borderColor: 'border-sky-500/30 hover:border-sky-500/50',
      bgColor: 'bg-sky-950/20',
      badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
      iconColor: 'text-sky-400',
      bulletColor: 'bg-sky-400',
    },
    {
      title: 'Threats',
      tag: 'External Risks',
      letter: 'T',
      items: threats,
      icon: AlertOctagon,
      borderColor: 'border-amber-500/30 hover:border-amber-500/50',
      bgColor: 'bg-amber-950/20',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      iconColor: 'text-amber-400',
      bulletColor: 'bg-amber-400',
    },
  ];

  const [activeView, setActiveView] = useState<'both' | 'radar' | 'grid'>('both');

  return (
    <div className="space-y-5">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            A strategic snapshot of internal strengths and weaknesses balanced with external opportunities and threats.
          </p>
        </div>

        {!isPrintable && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* View Selector */}
            <div className="flex items-center p-0.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveView('both')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  activeView === 'both' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Views
              </button>
              <button
                type="button"
                onClick={() => setActiveView('radar')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                  activeView === 'radar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radar className="w-3 h-3" />
                <span>Radar Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('grid')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                  activeView === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Quadrants</span>
              </button>
            </div>

            <button
              onClick={handleCopy}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-all"
              title="Copy SWOT to clipboard"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Copy SWOT</span>
            </button>
          </div>
        )}
      </div>

      {/* D3.js Radar Chart */}
      {(activeView === 'both' || activeView === 'radar') && (
        <SWOTRadarChart swot={effectiveSwot} strategy={strategy} />
      )}

      {/* 2x2 Quadrant Grid */}
      {(activeView === 'both' || activeView === 'grid') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((q, idx) => {
          const Icon = q.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border ${q.borderColor} ${q.bgColor} flex flex-col justify-between transition-all duration-200 shadow-md`}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <Icon className={`w-4 h-4 ${q.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                        <span>{q.title}</span>
                        <span className="text-[10px] font-mono opacity-50 font-bold">({q.letter})</span>
                      </h4>
                      <span className="text-[10px] text-slate-400">{q.tag}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${q.badgeBg}`}>
                    {q.items.length} points
                  </span>
                </div>

                {q.items.length > 0 ? (
                  <ul className="space-y-2.5 mt-2">
                    {q.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-xs text-slate-200 flex items-start gap-2.5 leading-relaxed">
                        <span className={`w-1.5 h-1.5 rounded-full ${q.bulletColor} mt-1.5 shrink-0`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic text-slate-500 mt-2">No specific items identified in this category.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
