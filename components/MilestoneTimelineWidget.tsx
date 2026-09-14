import React, { useState, useMemo } from 'react';
import { 
  Milestone, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flag, 
  Calendar, 
  Target, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Copy, 
  Check, 
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { ActionPlan, StrategyResponse } from '../types';
import { useToast } from './Toast';

interface MilestoneItem {
  id: string;
  timeframe: string;
  phaseName: string;
  category: 'Validation' | 'Product' | 'Go-To-Market' | 'Growth' | 'Operations';
  status: 'completed' | 'in_progress' | 'upcoming';
  objective: string;
  deliverables: { id: string; text: string; completed: boolean }[];
  targetKPI: string;
}

interface MilestoneTimelineWidgetProps {
  stage?: string;
  timeline?: string;
  businessStage?: string;
  timelineGoal?: string;
  actionPlan?: ActionPlan;
  strategy?: StrategyResponse;
  isPrintable?: boolean;
}

export const MilestoneTimelineWidget: React.FC<MilestoneTimelineWidgetProps> = ({
  stage: stageProp,
  timeline: timelineProp,
  businessStage,
  timelineGoal,
  actionPlan,
  strategy,
  isPrintable = false,
}) => {
  const { showToast } = useToast();

  const stage = stageProp || businessStage || (strategy as any)?.inputs?.businessStage || 'Idea / Concept';
  const timeline = timelineProp || timelineGoal || (strategy as any)?.inputs?.timelineGoal || '12 Months';
  const resolvedActionPlan = actionPlan || strategy?.actionPlan;

  // Normalize stage to determine completed / in-progress initial status
  const normalizedStage = (stage || '').toLowerCase();
  const isPrototypeOrHigher = normalizedStage.includes('prototype') || normalizedStage.includes('mvp') || normalizedStage.includes('traction') || normalizedStage.includes('scaling');
  const isTractionOrHigher = normalizedStage.includes('traction') || normalizedStage.includes('scaling') || normalizedStage.includes('growth');

  // Initial milestone templates informed by actionPlan & user inputs
  const initialMilestones: MilestoneItem[] = useMemo(() => {
    const day30Deliverables = resolvedActionPlan?.day30?.slice(0, 3) || [
      'Conduct 20 customer discovery interviews & validate problem statement',
      'Finalize core technical architecture and UX wireframes',
      'Benchmark competitor pricing and draft unique value proposition'
    ];

    const day60Deliverables = resolvedActionPlan?.day60?.slice(0, 3) || [
      'Ship initial functional MVP / Alpha prototype to 15 design partners',
      'Set up conversion tracking, analytics & user feedback telemetry',
      'Draft privacy policy, terms of service and business legal formation'
    ];

    const day90Deliverables = resolvedActionPlan?.day90?.slice(0, 3) || [
      'Public launch on Product Hunt, Hacker News & targeted niche communities',
      'Onboard first 50 active users and convert first 10 paying customers',
      'Iterate on core user onboarding flow to reduce week-1 churn < 5%'
    ];

    return [
      {
        id: 'm1',
        timeframe: 'Days 1 - 30',
        phaseName: 'Phase 1: Hypothesis & Market Validation',
        category: 'Validation',
        status: isPrototypeOrHigher ? 'completed' : 'in_progress',
        objective: 'Prove problem-solution resonance with target buyers before heavy capital commitment.',
        deliverables: day30Deliverables.map((text, i) => ({
          id: `m1_d${i}`,
          text,
          completed: isPrototypeOrHigher,
        })),
        targetKPI: '20+ discovery interviews & 100 landing page signups',
      },
      {
        id: 'm2',
        timeframe: 'Days 31 - 60',
        phaseName: 'Phase 2: MVP Development & Private Alpha',
        category: 'Product',
        status: isTractionOrHigher ? 'completed' : isPrototypeOrHigher ? 'in_progress' : 'upcoming',
        objective: 'Construct and deploy an end-to-end usable product solving the primary customer pain point.',
        deliverables: day60Deliverables.map((text, i) => ({
          id: `m2_d${i}`,
          text,
          completed: isTractionOrHigher,
        })),
        targetKPI: 'Functional MVP with <3s latency and core workflow complete',
      },
      {
        id: 'm3',
        timeframe: 'Days 61 - 90',
        phaseName: 'Phase 3: Public Beta & Commercial Launch',
        category: 'Go-To-Market',
        status: isTractionOrHigher ? 'in_progress' : 'upcoming',
        objective: 'Launch publicly, capture initial organic traffic, and validate willingness to pay.',
        deliverables: day90Deliverables.map((text, i) => ({
          id: `m3_d${i}`,
          text,
          completed: false,
        })),
        targetKPI: 'First 50 active users & first $1,000 in revenue',
      },
      {
        id: 'm4',
        timeframe: 'Months 4 - 6',
        phaseName: 'Phase 4: Growth Loops & Unit Economics',
        category: 'Growth',
        status: 'upcoming',
        objective: 'Optimize marketing acquisition channels, lower CAC, and increase referral rate.',
        deliverables: [
          { id: 'm4_d0', text: 'Implement referral loops and viral product-led invite mechanisms', completed: false },
          { id: 'm4_d1', text: 'Launch targeted paid acquisition campaigns across primary channel', completed: false },
          { id: 'm4_d2', text: 'Establish customer success cadence and collect initial 5 case studies', completed: false },
        ],
        targetKPI: 'LTV:CAC ratio > 3:1 & MoM user growth > 15%',
      },
      {
        id: 'm5',
        timeframe: 'Months 7 - 12',
        phaseName: 'Phase 5: Scalable Expansion & Capital Strategy',
        category: 'Operations',
        status: 'upcoming',
        objective: 'Introduce enterprise tier, expand partner integrations, or raise seed financing.',
        deliverables: [
          { id: 'm5_d0', text: 'Release advanced pro/enterprise tier with security & team features', completed: false },
          { id: 'm5_d1', text: 'Scale customer support and prepare investor pitch updates', completed: false },
          { id: 'm5_d2', text: 'Achieve sustainable positive unit contribution margin', completed: false },
        ],
        targetKPI: '$10,000+ MRR or institutional round closing',
      },
    ];
  }, [actionPlan, isPrototypeOrHigher, isTractionOrHigher]);

  const [milestones, setMilestones] = useState<MilestoneItem[]>(initialMilestones);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneTimeframe, setNewMilestoneTimeframe] = useState('');
  const [newMilestoneDeliverable, setNewMilestoneDeliverable] = useState('');

  // Toggle deliverable checkbox
  const toggleDeliverable = (milestoneId: string, deliverableId: string) => {
    setMilestones(prev => (prev || []).map(m => {
      if (!m || m.id !== milestoneId) return m;
      const updatedDeliverables = (m.deliverables || []).map(d => 
        d && d.id === deliverableId ? { ...d, completed: !d.completed } : d
      );
      // Auto-update status if all completed
      const allDone = updatedDeliverables.every(d => d && d.completed);
      const someDone = updatedDeliverables.some(d => d && d.completed);
      const newStatus: MilestoneItem['status'] = allDone ? 'completed' : someDone ? 'in_progress' : 'upcoming';
      return {
        ...m,
        deliverables: updatedDeliverables,
        status: newStatus,
      };
    }).filter(Boolean));
  };

  // Toggle milestone overall status
  const cycleMilestoneStatus = (milestoneId: string) => {
    const cycleMap: Record<MilestoneItem['status'], MilestoneItem['status']> = {
      upcoming: 'in_progress',
      in_progress: 'completed',
      completed: 'upcoming',
    };

    setMilestones(prev => (prev || []).map(m => {
      if (!m || m.id !== milestoneId) return m;
      const currentStatus = m.status || 'upcoming';
      const nextStatus = cycleMap[currentStatus] || 'upcoming';
      const isCompleted = nextStatus === 'completed';
      return {
        ...m,
        status: nextStatus,
        deliverables: (m.deliverables || []).map(d => ({ ...d, completed: isCompleted })),
      };
    }).filter(Boolean));
  };

  // Overall roadmap progress calculation
  const overallProgress = useMemo(() => {
    let totalItems = 0;
    let completedItems = 0;
    (milestones || []).forEach(m => {
      if (!m) return;
      (m.deliverables || []).forEach(d => {
        if (!d) return;
        totalItems++;
        if (d.completed) completedItems++;
      });
    });
    return totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  }, [milestones]);

  const handleCopyRoadmap = () => {
    const text = [
      `StratIQ Strategic Roadmap & Milestone Timeline`,
      `Current Business Stage: ${stage} | Horizon: ${timeline}`,
      `Overall Completion: ${overallProgress}%`,
      '',
      ...(milestones || []).filter(Boolean).map(m => (
        `[${m.timeframe}] ${m.phaseName} (${(m.status || 'upcoming').toUpperCase()})\n` +
        `Objective: ${m.objective}\n` +
        `KPI: ${m.targetKPI}\n` +
        `Deliverables:\n` +
        (m.deliverables || []).map(d => `  [${d?.completed ? 'X' : ' '}] ${d?.text || ''}`).join('\n')
      )),
    ].join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Roadmap copied to clipboard', 'success', 'copy');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    const newId = `custom_${Date.now()}`;
    const newM: MilestoneItem = {
      id: newId,
      timeframe: newMilestoneTimeframe || 'Next Sprint',
      phaseName: newMilestoneTitle,
      category: 'Product',
      status: 'upcoming',
      objective: 'Custom milestone objective defined by founder.',
      deliverables: newMilestoneDeliverable.trim() 
        ? [{ id: `${newId}_d0`, text: newMilestoneDeliverable.trim(), completed: false }]
        : [{ id: `${newId}_d0`, text: 'Execute initial planned deliverables', completed: false }],
      targetKPI: 'Achieve milestone goals on schedule',
    };

    setMilestones(prev => [...prev, newM]);
    setNewMilestoneTitle('');
    setNewMilestoneTimeframe('');
    setNewMilestoneDeliverable('');
    setShowAddModal(false);
    showToast('Added custom milestone to roadmap', 'success');
  };

  const filteredMilestones = useMemo(() => {
    const valid = (milestones || []).filter((m): m is MilestoneItem => Boolean(m && typeof m === 'object'));
    if (selectedCategory === 'All') return valid;
    return valid.filter(m => m.category === selectedCategory);
  }, [milestones, selectedCategory]);

  const categoryColors: Record<MilestoneItem['category'], { badge: string; border: string }> = {
    'Validation': { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', border: 'border-emerald-500/40' },
    'Product': { badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', border: 'border-indigo-500/40' },
    'Go-To-Market': { badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30', border: 'border-sky-500/40' },
    'Growth': { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', border: 'border-purple-500/40' },
    'Operations': { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', border: 'border-amber-500/40' },
  };

  return (
    <div className="bg-gray-900/90 border border-gray-700/80 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <span>Strategic Milestone Timeline & Roadmap</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Stage: {stage}
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Dynamic execution roadmap calibrated to your {timeline} horizon and {stage} maturity level.
          </p>
        </div>

        {!isPrintable && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddModal(!showAddModal)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-xs font-semibold text-gray-300 hover:text-white border border-gray-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add Objective</span>
            </button>

            <button
              type="button"
              onClick={handleCopyRoadmap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-xs font-semibold text-gray-300 hover:text-white border border-gray-700 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{copied ? 'Copied' : 'Copy Roadmap'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Progress & Stage Stepper */}
      <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2 text-gray-300">
            <span>Overall Roadmap Completion:</span>
            <span className="font-mono font-bold text-indigo-400 text-sm">{overallProgress}%</span>
          </div>
          <div className="text-gray-400 text-[11px]">
            Goal Horizon: <strong className="text-white">{timeline}</strong>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-gray-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Quick Stepper Track */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {(milestones || []).filter(Boolean).slice(0, 5).map((m, idx) => {
            const mStatus = m?.status || 'upcoming';
            return (
              <div 
                key={m.id || idx}
                onClick={() => cycleMilestoneStatus(m.id)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  mStatus === 'completed'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : mStatus === 'in_progress'
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200 shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
                title="Click to cycle status"
              >
                <div className="text-[10px] font-mono uppercase font-bold text-gray-500 mb-0.5">
                  {m.timeframe}
                </div>
                <div className="text-xs font-bold line-clamp-1">
                  {(m.phaseName || '').replace(/^Phase \d+:\s*/, '')}
                </div>
                <div className="mt-1 text-[10px] font-semibold flex items-center justify-center gap-1">
                  {mStatus === 'completed' ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">✓ Done</span>
                  ) : mStatus === 'in_progress' ? (
                    <span className="text-indigo-400 flex items-center gap-0.5 animate-pulse">● Active</span>
                  ) : (
                    <span className="text-gray-500">○ Upcoming</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Objective Form (Toggleable) */}
      {showAddModal && (
        <form onSubmit={handleAddCustomMilestone} className="p-4 bg-gray-950 border border-indigo-500/40 rounded-2xl space-y-3 animate-fadeIn">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Custom Milestone Objective</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <input
                type="text"
                placeholder="Timeframe (e.g. Month 3, Q3 Sprint)"
                value={newMilestoneTimeframe}
                onChange={(e) => setNewMilestoneTimeframe(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-8">
              <input
                type="text"
                placeholder="Phase Title (e.g. Secure First Enterprise Pilot)"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          <div>
            <input
              type="text"
              placeholder="First key deliverable / action step"
              value={newMilestoneDeliverable}
              onChange={(e) => setNewMilestoneDeliverable(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
            >
              Add Milestone
            </button>
          </div>
        </form>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] text-gray-500 font-semibold uppercase flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {['All', 'Validation', 'Product', 'Go-To-Market', 'Growth', 'Operations'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-800/80 text-gray-400 hover:text-white border border-gray-700/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Milestone Cards Stack */}
      <div className="space-y-4">
        {filteredMilestones.map((m, idx) => {
          if (!m) return null;
          const catStyle = categoryColors[m.category] || categoryColors.Product;
          const mStatus = m.status || 'upcoming';
          const isDone = mStatus === 'completed';
          const isActive = mStatus === 'in_progress';

          return (
            <div
              key={m.id || idx}
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                isDone 
                  ? 'bg-emerald-950/15 border-emerald-500/30' 
                  : isActive 
                  ? 'bg-indigo-950/20 border-indigo-500/40 shadow-lg' 
                  : 'bg-gray-950/40 border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Header: Timeframe, Title, Status Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs font-mono font-bold text-gray-200">
                    {m.timeframe}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${catStyle.badge}`}>
                    {m.category}
                  </span>
                  <h4 className="text-sm md:text-base font-bold text-white">
                    {m.phaseName}
                  </h4>
                </div>

                {!isPrintable && (
                  <button
                    type="button"
                    onClick={() => cycleMilestoneStatus(m.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isActive
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
                    }`}
                    title="Click to toggle status"
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Completed</span>
                      </>
                    ) : isActive ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                        <span>In Progress</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-gray-500" />
                        <span>Upcoming</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Core Objective Description */}
              <p className="text-xs text-gray-300 leading-relaxed mb-4">
                {m.objective}
              </p>

              {/* Deliverables Checklist */}
              <div className="space-y-2 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Deliverables & Action Steps ({m.deliverables.filter(d => d.completed).length}/{m.deliverables.length})
                </div>
                {m.deliverables.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => !isPrintable && toggleDeliverable(m.id, d.id)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                      !isPrintable ? 'cursor-pointer hover:bg-gray-800/60' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 focus:outline-none"
                    >
                      {d.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-600 hover:text-gray-400" />
                      )}
                    </button>
                    <span className={`text-xs leading-relaxed ${
                      d.completed ? 'text-gray-400 line-through' : 'text-gray-200'
                    }`}>
                      {d.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom Target KPI */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800/60">
                <div className="flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-gray-300">Success Target (KPI):</span>
                  <span className="text-indigo-200 font-mono">{m.targetKPI}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MilestoneTimelineWidget;
