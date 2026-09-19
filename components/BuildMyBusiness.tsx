import React, { useState, useEffect, useMemo, FC } from 'react';
import { 
  BuildMyBusinessRoadmap, 
  BuildStageId, 
  BuildStageStatus, 
  StrategyResponse, 
  WizardData,
  ValidationStageData,
  CustomerStageData,
  BusinessModelStageData,
  PricingStageData,
  BrandStageData,
  MarketingStageData,
  OperationsStageData,
  LaunchStageData,
  CustomersStageData,
  GrowthStageData
} from '../types';
import { 
  BUILD_STAGES, 
  createInitialRoadmap, 
  saveRoadmap, 
  loadRoadmap, 
  generateStageOutput,
  exportEntireRoadmapMarkdown 
} from '../services/buildBusinessService';
import { useAuth } from '../services/AuthContext';
import { useToast } from './Toast';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  ArrowLeft, 
  ArrowRight, 
  Flame, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  DollarSign, 
  Palette, 
  Megaphone, 
  Settings, 
  Rocket, 
  UserCheck, 
  TrendingUp, 
  RefreshCw, 
  Edit3, 
  Plus, 
  Trash2, 
  Layers, 
  FileText,
  HelpCircle,
  ExternalLink,
  Milestone
} from 'lucide-react';
import { ProjectRoadmapTracker } from './ProjectRoadmapTracker';

interface BuildMyBusinessProps {
  strategy?: StrategyResponse | null;
  wizardData?: Partial<WizardData> | null;
  onNavigateTab?: (tab: any) => void;
}

export const BuildMyBusiness: FC<BuildMyBusinessProps> = ({
  strategy,
  wizardData,
  onNavigateTab
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const userId = user?.uid || 'anonymous';

  // Roadmap State
  const [roadmap, setRoadmap] = useState<BuildMyBusinessRoadmap>(() => {
    return createInitialRoadmap({
      userId,
      strategy,
      wizardData
    });
  });

  const [activeStageId, setActiveStageId] = useState<BuildStageId>('validation');
  const [activeViewMode, setActiveViewMode] = useState<'interactive' | 'output'>('interactive');
  const [copiedStageOutput, setCopiedStageOutput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRoadmapTracker, setShowRoadmapTracker] = useState(true);

  // Load from local/remote on mount
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const saved = await loadRoadmap(userId);
      if (saved && mounted) {
        setRoadmap(saved);
        setActiveStageId(saved.activeStageId || 'validation');
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Sync with strategy if user explicitly requests
  const handleSyncFromStrategy = () => {
    if (!strategy && !wizardData) {
      showToast('No active Strategy Blueprint found to sync from.', 'info');
      return;
    }
    const fresh = createInitialRoadmap({
      userId,
      strategy,
      wizardData,
      ventureName: roadmap.ventureName
    });
    setRoadmap(fresh);
    saveRoadmap(fresh, userId);
    showToast('Roadmap updated with data from your Strategy Blueprint!', 'success');
  };

  // Save changes
  const persistChanges = (updated: BuildMyBusinessRoadmap) => {
    setRoadmap(updated);
    setIsSaving(true);
    saveRoadmap(updated, userId).then(() => {
      setIsSaving(false);
    });
  };

  // Stage status update
  const handleToggleStageStatus = (stageId: BuildStageId, newStatus: BuildStageStatus) => {
    const isCompleted = newStatus === 'completed';
    const completedSet = new Set(roadmap.completedStages);

    if (isCompleted) {
      completedSet.add(stageId);
    } else {
      completedSet.delete(stageId);
    }

    const updated: BuildMyBusinessRoadmap = {
      ...roadmap,
      completedStages: Array.from(completedSet),
      stages: {
        ...roadmap.stages,
        [stageId]: {
          ...roadmap.stages[stageId],
          status: newStatus,
          generatedOutput: generateStageOutput(stageId, {
            ...roadmap,
            stages: {
              ...roadmap.stages,
              [stageId]: { ...roadmap.stages[stageId], status: newStatus }
            }
          })
        }
      }
    };
    persistChanges(updated);
    showToast(`Stage marked as ${newStatus.replace('_', ' ')}!`, 'success');
  };

  // Stage Switcher
  const handleSelectStage = (stageId: BuildStageId) => {
    setActiveStageId(stageId);
    persistChanges({
      ...roadmap,
      activeStageId: stageId
    });
  };

  // Copy Stage Output
  const handleCopyStageOutput = () => {
    const output = roadmap.stages[activeStageId].generatedOutput || generateStageOutput(activeStageId, roadmap);
    navigator.clipboard.writeText(output);
    setCopiedStageOutput(true);
    showToast('Stage output copied to clipboard!', 'success');
    setTimeout(() => setCopiedStageOutput(false), 2000);
  };

  // Download entire roadmap
  const handleExportFullBlueprint = () => {
    const markdown = exportEntireRoadmapMarkdown(roadmap);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StratIQ_BuildMyBusiness_${roadmap.ventureName.replace(/\s+/g, '_')}_Master_Plan.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Master Execution Blueprint exported as Markdown!', 'success');
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Active Stage metadata
  const currentStageDef = useMemo(() => {
    return BUILD_STAGES.find(s => s.id === activeStageId) || BUILD_STAGES[0];
  }, [activeStageId]);

  const currentStageData = roadmap.stages[activeStageId];

  // Stage completion percentage
  const completionPercent = Math.round((roadmap.completedStages.length / BUILD_STAGES.length) * 100);

  // Icon map for the 10 stages
  const stageIcons: Record<BuildStageId, React.ElementType> = {
    validation: ShieldCheck,
    customer: Users,
    business_model: Briefcase,
    pricing: DollarSign,
    brand: Palette,
    marketing: Megaphone,
    operations: Settings,
    launch: Rocket,
    customers: UserCheck,
    growth: TrendingUp
  };

  const CurrentStageIcon = stageIcons[activeStageId] || Flame;

  // Next and previous stage pointers
  const currentStageIndex = BUILD_STAGES.findIndex(s => s.id === activeStageId);
  const prevStage = currentStageIndex > 0 ? BUILD_STAGES[currentStageIndex - 1] : null;
  const nextStage = currentStageIndex < BUILD_STAGES.length - 1 ? BUILD_STAGES[currentStageIndex + 1] : null;

  return (
    <div className="space-y-8 animate-fadeIn pb-16" id="build-my-business-view">
      {/* 1. Header Banner & Progress Bar */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Venture Execution Engine</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Build My Business
              </h1>
              <span className="text-sm px-3 py-1 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold">
                {roadmap.ventureName}
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Transition from analysis into concrete venture execution. Complete all 10 sequential operational milestones to launch and scale with confidence.
            </p>
          </div>

          {/* Quick Actions & Export */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {strategy && (
              <button
                onClick={handleSyncFromStrategy}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Refresh with latest strategy analysis"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sync Strategy</span>
              </button>
            )}

            <button
              onClick={() => setShowRoadmapTracker(!showRoadmapTracker)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showRoadmapTracker
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Toggle Project Roadmap & Milestone Tracker"
            >
              <Milestone className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showRoadmapTracker ? 'Hide Roadmap Chart' : 'Milestone Roadmap'}</span>
            </button>

            <button
              onClick={handleExportFullBlueprint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5"
              title="Download full 10-stage execution blueprint as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Blueprint</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title="Print execution roadmap"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Execution Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Execution Progress
            </span>
            <span className="text-white font-bold">
              {roadmap.completedStages.length} of {BUILD_STAGES.length} Stages Completed ({completionPercent}%)
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm shadow-indigo-500/50"
              style={{ width: `${Math.max(completionPercent, 5)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Horizontal 10-Stage Navigation Stepper */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 sm:p-3 overflow-x-auto shadow-lg" id="build-stages-stepper">
        <div className="flex items-center gap-2 min-w-max">
          {BUILD_STAGES.map((s, idx) => {
            const Icon = stageIcons[s.id];
            const isActive = activeStageId === s.id;
            const isCompleted = roadmap.completedStages.includes(s.id);
            const status = roadmap.stages[s.id].status;

            return (
              <button
                key={s.id}
                id={`stage-nav-${s.id}`}
                onClick={() => handleSelectStage(s.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40 ring-1 ring-indigo-400'
                    : isCompleted
                    ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-950/50'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive 
                    ? 'bg-white text-indigo-700' 
                    : isCompleted 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.stageNumber}
                </div>

                <div className="text-left">
                  <span className="block leading-none font-semibold truncate">{s.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recharts Project Roadmap & Milestone Progression Tracker */}
      {showRoadmapTracker && (
        <ProjectRoadmapTracker
          roadmap={roadmap}
          activeStageId={activeStageId}
          onSelectStage={handleSelectStage}
          onToggleStatus={handleToggleStageStatus}
        />
      )}

      {/* 3. Stage Content Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl">
        {/* Stage Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-600/10">
              <CurrentStageIcon className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                <span>Stage {currentStageDef.stageNumber}</span>
                <span>•</span>
                <span>{currentStageDef.category} Milestone</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                {currentStageDef.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {currentStageDef.subtitle}
              </p>
            </div>
          </div>

          {/* Controls: Interactive vs Output View + Status Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center text-xs font-bold">
              <button
                onClick={() => setActiveViewMode('interactive')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeViewMode === 'interactive'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Interactive Tools</span>
              </button>
              <button
                onClick={() => setActiveViewMode('output')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeViewMode === 'output'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Action Output</span>
              </button>
            </div>

            {/* Stage Status Toggle */}
            <div className="flex items-center gap-1.5">
              {currentStageData.status === 'completed' ? (
                <button
                  onClick={() => handleToggleStageStatus(activeStageId, 'in_progress')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/30 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Completed</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleStageStatus(activeStageId, 'completed')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Circle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mark as Completed</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="pt-6">
          {activeViewMode === 'interactive' ? (
            <div className="space-y-6">
              {renderStageInteractiveContent(activeStageId, roadmap, persistChanges, showToast)}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">
                  Deliverable Artifact: <strong className="text-white">{currentStageDef.outputName}</strong>
                </span>
                <button
                  onClick={handleCopyStageOutput}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedStageOutput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{copiedStageOutput ? 'Copied' : 'Copy Output'}</span>
                </button>
              </div>

              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-slate-200 text-sm font-sans leading-relaxed whitespace-pre-wrap overflow-x-auto">
                <ReactMarkdown>
                  {currentStageData.generatedOutput || generateStageOutput(activeStageId, roadmap)}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Stage Footer Navigation */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
          {prevStage ? (
            <button
              onClick={() => handleSelectStage(prevStage.id)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous: {prevStage.title}</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-3">
            {currentStageData.status !== 'completed' && (
              <button
                onClick={() => {
                  handleToggleStageStatus(activeStageId, 'completed');
                  if (nextStage) {
                    handleSelectStage(nextStage.id);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                <span>Mark Complete & Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {nextStage && currentStageData.status === 'completed' && (
              <button
                onClick={() => handleSelectStage(nextStage.id)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                <span>Next: {nextStage.title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// INTERACTIVE WORKSPACE RENDERERS FOR EACH OF THE 10 STAGES
// =========================================================================

function renderStageInteractiveContent(
  stageId: BuildStageId,
  roadmap: BuildMyBusinessRoadmap,
  persistChanges: (updated: BuildMyBusinessRoadmap) => void,
  showToast: (msg: string, type?: any) => void
) {
  switch (stageId) {
    case 'validation': {
      const d = roadmap.stages.validation.data;
      return (
        <div className="space-y-6">
          {/* Problem & Solution Hypotheses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Problem Hypothesis
              </label>
              <textarea
                value={d.problemHypothesis}
                onChange={(e) => {
                  const updated = { ...roadmap };
                  updated.stages.validation.data.problemHypothesis = e.target.value;
                  updated.stages.validation.generatedOutput = generateStageOutput('validation', updated);
                  persistChanges(updated);
                }}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                placeholder="What painful problem do customers face?"
              />
            </div>

            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Solution Hypothesis
              </label>
              <textarea
                value={d.solutionHypothesis}
                onChange={(e) => {
                  const updated = { ...roadmap };
                  updated.stages.validation.data.solutionHypothesis = e.target.value;
                  updated.stages.validation.generatedOutput = generateStageOutput('validation', updated);
                  persistChanges(updated);
                }}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                placeholder="How does your solution uniquely solve this?"
              />
            </div>
          </div>

          {/* Riskiest Assumptions Test (RAT) */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Riskiest Assumptions Test (RAT Matrix)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Validate high risks first to avoid wasted build cycles</span>
            </div>

            <div className="space-y-3">
              {d.riskiestAssumptions.map((assump, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        assump.riskLevel === 'High' 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {assump.riskLevel} Risk
                      </span>
                      <span className="font-semibold text-white">{assump.assumption}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">Verification Protocol: {assump.validationMethod}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Discovery Interview Questions */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Customer Discovery Interview Script (The Mom Test)</span>
            </h3>
            <div className="space-y-2">
              {d.customerInterviewQuestions.map((q, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{q}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'customer': {
      const d = roadmap.stages.customer.data;
      return (
        <div className="space-y-6">
          {/* Ideal Customer Profile Breakdown */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Ideal Customer Profile (ICP) Parameters</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium block mb-1">Target Segment</span>
                <span className="font-bold text-white text-sm">{d.idealCustomerProfile.segment}</span>
              </div>
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium block mb-1">Role & Demographics</span>
                <span className="font-bold text-white text-sm">{d.idealCustomerProfile.role} ({d.idealCustomerProfile.demographics})</span>
              </div>
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 sm:col-span-2">
                <span className="text-slate-400 font-medium block mb-1">Current Ineffective Workaround</span>
                <span className="text-slate-300">{d.idealCustomerProfile.currentWorkaround}</span>
              </div>
            </div>
          </div>

          {/* Pain Point Hierarchy */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Prioritized Pain Hierarchy</h3>
            <div className="space-y-3">
              {d.topPainPoints.map((p, i) => (
                <div key={i} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block">{p.pain}</span>
                    <span className="text-slate-400">Frequency: {p.frequency} • Willingness to pay: <strong className="text-emerald-400">{p.willingnessToPay}</strong></span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block uppercase">Severity</span>
                    <span className="text-sm font-black text-rose-400">{p.severity}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anti Persona */}
          <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl text-xs space-y-1">
            <span className="font-bold text-rose-300 uppercase tracking-wider block">Anti-Persona (Who NOT to Sell To)</span>
            <p className="text-slate-300 font-medium">{d.antiPersona.whoNotToSellTo}</p>
            <p className="text-slate-400 text-[11px]">{d.antiPersona.reason}</p>
          </div>
        </div>
      );
    }

    case 'business_model': {
      const d = roadmap.stages.business_model.data;
      const ue = d.unitEconomics;
      return (
        <div className="space-y-6">
          {/* Unit Economics Visualizer */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Unit Economics & Revenue Health</span>
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Monthly ARPU</span>
                <span className="text-lg font-black text-white">${ue.arpuMonthly}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Target CAC</span>
                <span className="text-lg font-black text-indigo-400">${ue.cacEstimated}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Projected LTV</span>
                <span className="text-lg font-black text-emerald-400">${ue.arpuMonthly * ue.ltvMonths}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Gross Margin</span>
                <span className="text-lg font-black text-purple-400">{ue.grossMarginPercent}%</span>
              </div>
            </div>
          </div>

          {/* Value Prop & Unfair Advantage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
              <span className="font-bold text-indigo-400 uppercase tracking-wider block text-[11px]">Core Value Proposition</span>
              <p className="text-slate-200 font-medium">{d.valueProposition}</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 uppercase tracking-wider block text-[11px]">Defensible Moat (Unfair Advantage)</span>
              <p className="text-slate-200 font-medium">{d.unfairAdvantage}</p>
            </div>
          </div>

          {/* Revenue Streams */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Revenue Stream Architecture</h4>
            <div className="space-y-2">
              {d.revenueStreams.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{r.stream} ({r.model})</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[11px]">{r.projectedShare}% of revenue</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'pricing': {
      const d = roadmap.stages.pricing.data;
      return (
        <div className="space-y-6">
          {/* Value Metric & Strategy */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Core Value Metric</span>
              <span className="font-bold text-white text-sm">{d.valueMetric}</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-slate-400 block font-medium">Monthly Break-Even Volume</span>
              <span className="font-bold text-emerald-400 text-sm">~{d.breakEvenMonthlyUnits} active accounts</span>
            </div>
          </div>

          {/* 3-Tier Packaging Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {d.tiers.map((tier, idx) => (
              <div 
                key={idx}
                className={`p-5 rounded-2xl border flex flex-col justify-between text-xs ${
                  tier.isPopular 
                    ? 'bg-indigo-950/30 border-indigo-500 shadow-xl shadow-indigo-950/50' 
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-base">{tier.name}</span>
                    {tier.isPopular && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 my-3">
                    <span className="text-2xl font-black text-white">${tier.priceMonthly}</span>
                    <span className="text-slate-400 text-xs">/month</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mb-4">Target: {tier.targetBuyer}</p>
                  
                  <div className="space-y-2 border-t border-slate-800/80 pt-3">
                    {tier.coreFeatures.map((feat, fidx) => (
                      <div key={fidx} className="flex items-center gap-2 text-slate-300 text-[11px]">
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Annual Discount Strategy */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-white block mb-1">Discounting Guideline</span>
            <p>{d.discountStrategy}</p>
          </div>
        </div>
      );
    }

    case 'brand': {
      const d = roadmap.stages.brand.data;
      const v = d.visualIdentity;
      return (
        <div className="space-y-6">
          {/* Geoffrey Moore Positioning Formula */}
          <div className="p-5 bg-indigo-950/30 rounded-2xl border border-indigo-500/40 text-xs space-y-2">
            <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">Positioning Statement</span>
            <p className="text-sm sm:text-base font-semibold text-white leading-relaxed italic">
              "{d.positioningStatement}"
            </p>
          </div>

          {/* Naming, Tagline & Pitch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium">Tagline</span>
              <p className="font-bold text-white text-sm">{d.tagline}</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-medium">Elevator Pitch (30s)</span>
              <p className="text-slate-300 leading-relaxed">{d.elevatorPitch30s}</p>
            </div>
          </div>

          {/* Brand Voice & Values */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <span className="font-bold text-white block">Tone of Voice & Core Values</span>
            <div className="flex flex-wrap gap-2">
              {d.brandVoiceTone.map((tone, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium">
                  {tone}
                </span>
              ))}
              {d.coreValues.map((val, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                  {val}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'marketing': {
      const d = roadmap.stages.marketing.data;
      const fun = d.acquisitionFunnel;
      return (
        <div className="space-y-6">
          {/* Priority Channels */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Bullseye Acquisition Channels</h3>
            <div className="space-y-2.5">
              {d.primaryChannels.map((c, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm">{c.channel}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                        {c.priority}
                      </span>
                    </div>
                    <p className="text-slate-400">{c.tactic}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-400 block text-[10px] uppercase">Est. CAC</span>
                    <span className="font-bold text-emerald-400">{c.expectedCAC}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3-Stage Acquisition Funnel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="text-indigo-400 font-bold block">1. Top of Funnel</span>
              <p className="text-slate-300">{fun.topOfFunnelLeadMagnet}</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="text-purple-400 font-bold block">2. Middle of Funnel</span>
              <p className="text-slate-300">{fun.middleOfFunnelNurture}</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="text-emerald-400 font-bold block">3. Bottom of Funnel</span>
              <p className="text-slate-300">{fun.bottomOfFunnelConversionCTA}</p>
            </div>
          </div>
        </div>
      );
    }

    case 'operations': {
      const d = roadmap.stages.operations.data;
      return (
        <div className="space-y-6">
          {/* Tech Stack */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Recommended Production Tech Stack</h3>
            <div className="space-y-2">
              {d.techStack.map((t, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{t.toolName}</span>
                    <span className="text-slate-400 ml-2">({t.category}) — {t.purpose}</span>
                  </div>
                  <span className="font-mono text-slate-300">${t.monthlyCost}/mo</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Checklist */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Legal & Compliance Readiness</h3>
            <div className="space-y-2">
              {d.legalReadiness.map((l, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 ${l.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className={l.completed ? 'text-white font-medium' : 'text-slate-400'}>{l.item}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{l.notes}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'launch': {
      const d = roadmap.stages.launch.data;
      const k = d.distributionKit;
      return (
        <div className="space-y-6">
          {/* Target Launch Date & Waitlist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block font-medium">Target Launch Date</span>
              <span className="text-lg font-black text-white">{d.targetLaunchDate}</span>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block font-medium">Waitlist Goal</span>
              <span className="text-lg font-black text-indigo-400">{d.preLaunchWaitlistGoal} founders</span>
            </div>
          </div>

          {/* 14-Day Countdown Checklist */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">14-Day Countdown Launch Checklist</h3>
            <div className="space-y-2">
              {d.countdownChecklist.map((c, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                      {c.timing}
                    </span>
                    <span className="text-slate-200">{c.task}</span>
                  </div>
                  <CheckCircle2 className={`w-4 h-4 ${c.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Distribution Copy Kit */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Launch Day Distribution Kit</h4>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2">
              <span className="text-slate-400 font-medium block">Product Hunt Tagline</span>
              <p className="font-bold text-white">{k.productHuntTagline}</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2">
              <span className="text-slate-400 font-medium block">Maker's First Comment</span>
              <p className="text-slate-300 leading-relaxed italic">"{k.productHuntMakerComment}"</p>
            </div>
          </div>
        </div>
      );
    }

    case 'customers': {
      const d = roadmap.stages.customers.data;
      return (
        <div className="space-y-6">
          {/* First 10 & 100 Playbook */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">First 10 Customers</span>
              <p className="text-slate-200 leading-relaxed">{d.first10CustomersTarget}</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">Scaling to 100 Customers</span>
              <p className="text-slate-200 leading-relaxed">{d.first100CustomersStrategy}</p>
            </div>
          </div>

          {/* Cold Outreach Templates */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Battle-Tested Outreach Scripts</h3>
            <div className="space-y-3">
              {d.coldOutreachTemplates.map((t, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400">{t.channel}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(t.body);
                        showToast(`${t.channel} script copied!`, 'success');
                      }}
                      className="text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  {t.subject && <p className="font-semibold text-white">Subject: {t.subject}</p>}
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed font-mono text-[11px] p-2 bg-slate-950 rounded-lg">
                    {t.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'growth': {
      const d = roadmap.stages.growth.data;
      const p = d.pirateMetricsTargets;
      return (
        <div className="space-y-6">
          {/* North Star Metric */}
          <div className="p-5 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 rounded-2xl border border-indigo-500/40 text-xs space-y-1">
            <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">North Star Metric (NSM)</span>
            <h3 className="text-lg font-black text-white">{d.northStarMetric}</h3>
          </div>

          {/* Pirate Metrics AARRR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block font-bold">Acquisition</span>
              <span className="text-sm font-bold text-white">{p.acquisitionGoal}</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block font-bold">Month-1 Retention</span>
              <span className="text-sm font-bold text-emerald-400">{p.retentionMonth1Percent}%</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block font-bold">Viral k-factor</span>
              <span className="text-sm font-bold text-purple-400">{p.referralKFactor}</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block font-bold">Target MRR</span>
              <span className="text-sm font-bold text-amber-400">${p.revenueMRRTarget.toLocaleString()}</span>
            </div>
          </div>

          {/* Retention & Anti-Churn Protocol */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Retention & Anti-Churn Cadence</h3>
            <div className="space-y-2">
              {d.retentionCadence.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-400">{r.milestone}</span>
                  <span className="text-slate-300 text-right">{r.engagementAction}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

export default BuildMyBusiness;
