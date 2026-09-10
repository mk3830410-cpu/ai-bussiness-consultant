import React from 'react';
import { ConceptHistoryItem } from '../types';
import { History, BrainCircuit, Search, Zap, Eye, Clock, CheckCircle, ArrowRight, Trash2 } from 'lucide-react';
import { useToast } from './Toast';

interface ConceptHistoryProps {
  history: ConceptHistoryItem[];
  activeId: string | null;
  onSelectConcept: (item: ConceptHistoryItem) => void;
  onClearHistory: () => void;
}

const modeIcons = {
  deep: BrainCircuit,
  market: Search,
  quick: Zap,
  visual: Eye,
};

const modeLabels = {
  deep: 'Deep Dive',
  market: 'Market Pulse',
  quick: 'Quick Brainstorm',
  visual: 'Visual Spark',
};

export const ConceptHistory: React.FC<ConceptHistoryProps> = ({
  history,
  activeId,
  onSelectConcept,
  onClearHistory,
}) => {
  const { showToast } = useToast();

  if (history.length === 0) {
    return null;
  }

  const formatTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleSelect = (item: ConceptHistoryItem) => {
    onSelectConcept(item);
    showToast(`Switched back to "${item.conceptTitle}"`, 'info');
  };

  const handleClear = () => {
    onClearHistory();
    showToast('Analysis history cleared', 'info');
  };

  return (
    <div id="concept-history-section" className="mt-8 bg-gray-850 bg-gray-800/80 border border-gray-700/80 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
            <History size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Recent Concepts Analyzed
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                {history.length} / 3 saved
              </span>
            </h3>
            <p className="text-xs text-gray-400">Quickly toggle between your last 3 generated startup strategies</p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="text-xs text-gray-400 hover:text-rose-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-gray-700/50 transition-colors"
          title="Clear recent history"
        >
          <Trash2 size={13} />
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {history.map((item, index) => {
          const isActive = item.id === activeId;
          const ModeIcon = modeIcons[item.analysisMode] || BrainCircuit;

          return (
            <div
              key={item.id}
              id={`history-item-${index}`}
              onClick={() => handleSelect(item)}
              className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-indigo-950/40 to-gray-800 border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-lg'
                  : 'bg-gray-900/70 border-gray-700/70 hover:border-gray-600 hover:bg-gray-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                      item.analysisMode === 'deep'
                        ? 'bg-indigo-900/40 border-indigo-700/50 text-indigo-300'
                        : item.analysisMode === 'market'
                        ? 'bg-blue-900/40 border-blue-700/50 text-blue-300'
                        : item.analysisMode === 'quick'
                        ? 'bg-amber-900/40 border-amber-700/50 text-amber-300'
                        : 'bg-purple-900/40 border-purple-700/50 text-purple-300'
                    }`}
                  >
                    <ModeIcon size={12} />
                    {modeLabels[item.analysisMode]}
                  </span>

                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock size={11} />
                    <span>{formatTime(item.timestamp)}</span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {item.conceptTitle}
                  </h4>
                  {isActive && (
                    <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Active
                    </span>
                  )}
                </div>

                {item.subtitle && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.subtitle}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-700/50 flex items-center justify-between text-xs">
                {item.score !== undefined ? (
                  <span className="text-gray-300 text-[11px] font-medium">
                    Validation Score: <span className="font-bold text-indigo-400">{item.score}/10</span>
                  </span>
                ) : (
                  <span className="text-gray-500 text-[11px]">Saved Analysis</span>
                )}

                <div
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-white'
                  }`}
                >
                  <span>{isActive ? 'Viewing' : 'Switch'}</span>
                  <ArrowRight size={13} className="transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
