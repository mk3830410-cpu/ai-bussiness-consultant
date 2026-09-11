import React, { useState } from 'react';
import { SWOT } from '../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  AlertOctagon, 
  Copy, 
  Layers, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { useToast } from './Toast';

interface SWOTQuadrantGridProps {
  swot: SWOT;
  isPrintable?: boolean;
}

type QuadrantKey = 'all' | 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

export const SWOTQuadrantGrid: React.FC<SWOTQuadrantGridProps> = ({ swot, isPrintable = false }) => {
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState<QuadrantKey>('all');

  const strengths = swot?.strengths || [];
  const weaknesses = swot?.weaknesses || [];
  const opportunities = swot?.opportunities || [];
  const threats = swot?.threats || [];

  const copyQuadrant = (title: string, items: string[]) => {
    const text = `${title}:\n${items.map((it, idx) => `${idx + 1}. ${it}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    showToast(`Copied ${title} to clipboard!`, 'success', 'copy');
  };

  const copyEntireSwot = () => {
    const text = [
      '=== SWOT ANALYSIS ===',
      '',
      `STRENGTHS (${strengths.length}):`,
      ...strengths.map((s, i) => `  ${i + 1}. ${s}`),
      '',
      `WEAKNESSES (${weaknesses.length}):`,
      ...weaknesses.map((w, i) => `  ${i + 1}. ${w}`),
      '',
      `OPPORTUNITIES (${opportunities.length}):`,
      ...opportunities.map((o, i) => `  ${i + 1}. ${o}`),
      '',
      `THREATS (${threats.length}):`,
      ...threats.map((t, i) => `  ${i + 1}. ${t}`),
    ].join('\n');

    navigator.clipboard.writeText(text);
    showToast('Copied full SWOT Analysis to clipboard!', 'success', 'copy');
  };

  const quadrantsConfig = [
    {
      key: 'strengths' as const,
      letter: 'S',
      title: 'Strengths',
      subtitle: 'Internal Attributes',
      impact: 'Helpful',
      items: strengths,
      icon: ShieldCheck,
      borderColor: 'border-emerald-500/40 hover:border-emerald-500/70',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
      bgColor: 'bg-emerald-950/25',
      badgeBg: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
      letterColor: 'text-emerald-500/10',
      iconColor: 'text-emerald-400',
      bulletColor: 'bg-emerald-400',
      accentDot: 'bg-emerald-400',
      quadrantTag: 'Top-Left Quadrant',
    },
    {
      key: 'weaknesses' as const,
      letter: 'W',
      title: 'Weaknesses',
      subtitle: 'Internal Challenges',
      impact: 'Harmful',
      items: weaknesses,
      icon: AlertTriangle,
      borderColor: 'border-rose-500/40 hover:border-rose-500/70',
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/20',
      bgColor: 'bg-rose-950/25',
      badgeBg: 'bg-rose-900/50 text-rose-300 border-rose-700/50',
      letterColor: 'text-rose-500/10',
      iconColor: 'text-rose-400',
      bulletColor: 'bg-rose-400',
      accentDot: 'bg-rose-400',
      quadrantTag: 'Top-Right Quadrant',
    },
    {
      key: 'opportunities' as const,
      letter: 'O',
      title: 'Opportunities',
      subtitle: 'External Potential',
      impact: 'Helpful',
      items: opportunities,
      icon: TrendingUp,
      borderColor: 'border-sky-500/40 hover:border-sky-500/70',
      activeBorder: 'border-sky-500 ring-2 ring-sky-500/20',
      bgColor: 'bg-sky-950/25',
      badgeBg: 'bg-sky-900/50 text-sky-300 border-sky-700/50',
      letterColor: 'text-sky-500/10',
      iconColor: 'text-sky-400',
      bulletColor: 'bg-sky-400',
      accentDot: 'bg-sky-400',
      quadrantTag: 'Bottom-Left Quadrant',
    },
    {
      key: 'threats' as const,
      letter: 'T',
      title: 'Threats',
      subtitle: 'External Risks',
      impact: 'Harmful',
      items: threats,
      icon: AlertOctagon,
      borderColor: 'border-amber-500/40 hover:border-amber-500/70',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
      bgColor: 'bg-amber-950/25',
      badgeBg: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
      letterColor: 'text-amber-500/10',
      iconColor: 'text-amber-400',
      bulletColor: 'bg-amber-400',
      accentDot: 'bg-amber-400',
      quadrantTag: 'Bottom-Right Quadrant',
    },
  ];

  const filteredQuadrants = activeFilter === 'all' 
    ? quadrantsConfig 
    : quadrantsConfig.filter(q => q.key === activeFilter);

  return (
    <div id="swot-quadrant-container" className="space-y-4 my-2">
      {/* Header Controls & Filter */}
      {!isPrintable && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Info size={13} className="text-indigo-400" />
              Strategic 2×2 Evaluation Matrix
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View filter pills */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-gray-900 border border-gray-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  activeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All 4
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('strengths')}
                className={`px-2 py-1 rounded-md transition-colors font-medium ${
                  activeFilter === 'strengths'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-emerald-300'
                }`}
              >
                S
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('weaknesses')}
                className={`px-2 py-1 rounded-md transition-colors font-medium ${
                  activeFilter === 'weaknesses'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-rose-300'
                }`}
              >
                W
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('opportunities')}
                className={`px-2 py-1 rounded-md transition-colors font-medium ${
                  activeFilter === 'opportunities'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-sky-300'
                }`}
              >
                O
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('threats')}
                className={`px-2 py-1 rounded-md transition-colors font-medium ${
                  activeFilter === 'threats'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-amber-300'
                }`}
              >
                T
              </button>
            </div>

            <button
              type="button"
              onClick={copyEntireSwot}
              className="inline-flex items-center gap-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 px-2.5 py-1 rounded-lg transition-colors"
              title="Copy all SWOT quadrants to clipboard"
            >
              <Copy size={13} className="text-indigo-400" />
              <span>Copy SWOT</span>
            </button>
          </div>
        </div>
      )}

      {/* Axis Guide (Shown when all quadrants visible) */}
      {activeFilter === 'all' && (
        <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold tracking-wider text-gray-400 uppercase text-center px-2">
          <div className="flex items-center justify-center gap-1.5 py-1 rounded bg-gray-900/50 border border-gray-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            <span>Internal Factors</span>
            <span className="text-[10px] text-gray-500 font-normal lowercase">(organization)</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 py-1 rounded bg-gray-900/50 border border-gray-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>External Factors</span>
            <span className="text-[10px] text-gray-500 font-normal lowercase">(environment)</span>
          </div>
        </div>
      )}

      {/* 2x2 Quadrant Grid */}
      <div 
        id="swot-grid-matrix"
        className={`grid gap-4 ${
          activeFilter === 'all'
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        {filteredQuadrants.map((quadrant) => {
          const IconComponent = quadrant.icon;
          const isHelpful = quadrant.impact === 'Helpful';

          return (
            <div
              key={quadrant.key}
              id={`swot-quadrant-${quadrant.key}`}
              className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 transition-all duration-200 ${quadrant.bgColor} ${quadrant.borderColor} bg-gray-900/80 shadow-md flex flex-col justify-between`}
            >
              {/* Giant Background Letter Watermark */}
              <div 
                aria-hidden="true" 
                className={`absolute -bottom-4 -right-1 font-black text-8xl select-none pointer-events-none ${quadrant.letterColor} leading-none font-mono opacity-80`}
              >
                {quadrant.letter}
              </div>

              <div>
                {/* Quadrant Header */}
                <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-gray-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg bg-gray-900 border border-gray-700/80 ${quadrant.iconColor} shadow-inner`}>
                      <IconComponent size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-base font-bold text-white tracking-tight">
                          {quadrant.title}
                        </h5>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${quadrant.badgeBg}`}>
                          {quadrant.letter}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <span>{quadrant.subtitle}</span>
                        <span className="text-gray-600">•</span>
                        <span className={`font-medium ${isHelpful ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {quadrant.impact}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-gray-400 bg-gray-800/90 px-2 py-0.5 rounded-full border border-gray-700">
                      {quadrant.items.length} {quadrant.items.length === 1 ? 'factor' : 'factors'}
                    </span>
                    {!isPrintable && (
                      <button
                        type="button"
                        onClick={() => copyQuadrant(quadrant.title, quadrant.items)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                        title={`Copy ${quadrant.title} items`}
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 relative z-10">
                  {quadrant.items.length > 0 ? (
                    quadrant.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2 rounded-lg bg-gray-950/40 border border-gray-800/60 hover:border-gray-700/80 transition-colors text-xs text-gray-200 leading-relaxed"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${quadrant.accentDot}`}></span>
                        <span>{item}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 italic py-2">
                      No specific {quadrant.title.toLowerCase()} recorded.
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Quadrant Tag */}
              <div className="mt-3 pt-2 flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-800/40">
                <span className="flex items-center gap-1">
                  {isHelpful ? (
                    <ArrowUpRight size={11} className="text-emerald-400" />
                  ) : (
                    <ArrowDownRight size={11} className="text-rose-400" />
                  )}
                  {isHelpful ? 'Positive Impact' : 'Risk / Mitigation Area'}
                </span>
                <span className="font-mono text-gray-400">{quadrant.quadrantTag}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
