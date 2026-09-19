import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Milestone,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  Flame,
  Award,
  Zap,
  Info
} from 'lucide-react';
import { BusinessRoadmap, BuildStageId } from '../types';
import { BUILD_STAGES } from '../services/buildBusinessService';

interface ProjectRoadmapTrackerProps {
  roadmap: BusinessRoadmap;
  activeStageId: BuildStageId;
  onSelectStage: (stageId: BuildStageId) => void;
  onToggleStatus?: (stageId: BuildStageId, status: 'not_started' | 'in_progress' | 'completed') => void;
}

interface MilestoneTimelinePoint {
  id: BuildStageId;
  stageNumber: number;
  name: string;
  shortName: string;
  timeframe: string;
  weekNumber: number;
  plannedPercent: number;
  actualPercent: number;
  effortDays: number;
  status: 'not_started' | 'in_progress' | 'completed';
  category: string;
}

// Stage effort estimates in working days
const STAGE_EFFORTS: Record<BuildStageId, { days: number; weeks: string; weekNum: number }> = {
  validation: { days: 7, weeks: 'W1 - W2', weekNum: 2 },
  customer: { days: 10, weeks: 'W3 - W4', weekNum: 4 },
  business_model: { days: 8, weeks: 'W5 - W6', weekNum: 6 },
  pricing: { days: 6, weeks: 'W7 - W8', weekNum: 8 },
  brand: { days: 9, weeks: 'W9 - W10', weekNum: 10 },
  marketing: { days: 14, weeks: 'W11 - W14', weekNum: 14 },
  operations: { days: 8, weeks: 'W15 - W16', weekNum: 16 },
  launch: { days: 10, weeks: 'W17 - W18', weekNum: 18 },
  customers: { days: 14, weeks: 'W19 - W21', weekNum: 21 },
  growth: { days: 14, weeks: 'W22 - W24', weekNum: 24 }
};

export const ProjectRoadmapTracker: React.FC<ProjectRoadmapTrackerProps> = ({
  roadmap,
  activeStageId,
  onSelectStage,
  onToggleStatus
}) => {
  const [chartView, setChartView] = useState<'progression' | 'effort'>('progression');

  // Compute timeline data points across stages
  const timelineData: MilestoneTimelinePoint[] = useMemo(() => {
    let completedAccumulator = 0;

    return BUILD_STAGES.map((stage, idx) => {
      const stageData = roadmap.stages[stage.id];
      const isCompleted = roadmap.completedStages.includes(stage.id) || stageData?.status === 'completed';
      const isInProgress = stageData?.status === 'in_progress';
      const meta = STAGE_EFFORTS[stage.id];

      // Weight completion: completed = 10%, in_progress = 4%
      if (isCompleted) {
        completedAccumulator += 10;
      } else if (isInProgress) {
        completedAccumulator += 4;
      }

      const plannedPercent = (idx + 1) * 10;
      const actualPercent = Math.min(100, completedAccumulator);

      const status = isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'not_started';

      return {
        id: stage.id,
        stageNumber: stage.stageNumber,
        name: stage.title,
        shortName: `S${stage.stageNumber}: ${stage.title.split(' ')[0]}`,
        timeframe: meta.weeks,
        weekNumber: meta.weekNum,
        plannedPercent,
        actualPercent,
        effortDays: meta.days,
        status,
        category: stage.category
      };
    });
  }, [roadmap]);

  // Overall calculations
  const totalStages = BUILD_STAGES.length;
  const completedCount = roadmap.completedStages.length;
  const inProgressCount = Object.values(roadmap.stages).filter(s => s.status === 'in_progress').length;
  const overallPercent = Math.round((completedCount / totalStages) * 100);

  const totalEffortDays = useMemo(() => {
    return Object.values(STAGE_EFFORTS).reduce((acc, curr) => acc + curr.days, 0);
  }, []);

  const completedEffortDays = useMemo(() => {
    return BUILD_STAGES.reduce((acc, s) => {
      const isCompleted = roadmap.completedStages.includes(s.id);
      return isCompleted ? acc + STAGE_EFFORTS[s.id].days : acc;
    }, 0);
  }, [roadmap.completedStages]);

  // Find next critical uncompleted milestone
  const nextMilestone = useMemo(() => {
    return BUILD_STAGES.find(s => !roadmap.completedStages.includes(s.id)) || null;
  }, [roadmap.completedStages]);

  // Custom Tooltip for progression chart
  const CustomProgressionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as MilestoneTimelinePoint;
      const statusLabel = 
        point.status === 'completed' ? 'Completed' : 
        point.status === 'in_progress' ? 'In Progress' : 'Pending Milestone';
      
      const statusBadge = 
        point.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
        point.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
        'bg-slate-800 text-slate-400 border-slate-700';

      return (
        <div className="bg-slate-950/95 border border-indigo-500/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs max-w-xs z-50">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <span className="font-extrabold text-white text-sm">
              Stage {point.stageNumber}: {point.name}
            </span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${statusBadge}`}>
              {statusLabel}
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Timeframe:</span>
              <span className="font-semibold text-white">{point.timeframe} (Week {point.weekNumber})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Effort:</span>
              <span className="font-semibold text-indigo-300">{point.effortDays} Working Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Milestone Target:</span>
              <span className="font-semibold text-indigo-400">{point.plannedPercent}% Target</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Actual:</span>
              <span className={`font-bold ${point.actualPercent >= point.plannedPercent ? 'text-emerald-400' : 'text-amber-400'}`}>
                {point.actualPercent}% Velocity
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-indigo-300 flex items-center justify-between">
            <span>Click node to inspect stage</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/95 border border-indigo-500/25 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6" id="project-roadmap-tracker">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Milestone className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              Project Roadmap & Milestone Velocity Tracker
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Visualize startup execution progression over a 24-week timeline using Recharts telemetry.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex items-center text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setChartView('progression')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              chartView === 'progression'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Progression Curve</span>
          </button>
          <button
            onClick={() => setChartView('effort')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              chartView === 'effort'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sprint Days Effort</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stages Completed</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-white">{completedCount}</span>
            <span className="text-xs text-slate-500 font-semibold">/ {totalStages} ({overallPercent}%)</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Execution Days</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-400">{completedEffortDays}</span>
            <span className="text-xs text-slate-500 font-semibold">/ {totalEffortDays} Total Days</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Velocity Status</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-extrabold text-amber-300 truncate">
              {overallPercent >= 70 ? 'Scale Ready' : overallPercent >= 30 ? 'High Momentum' : 'Foundational'}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Next Critical Sprint</span>
          </div>
          <div className="mt-1">
            {nextMilestone ? (
              <button
                onClick={() => onSelectStage(nextMilestone.id)}
                className="text-xs font-bold text-purple-300 hover:text-white truncate block text-left underline underline-offset-2"
                title={`Jump to Stage ${nextMilestone.stageNumber}: ${nextMilestone.title}`}
              >
                Stage {nextMilestone.stageNumber}: {nextMilestone.title.split(' ')[0]} →
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-400">All Stages Completed!</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs">
          <div className="flex items-center gap-4 text-slate-300 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span>Actual Milestone Velocity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded bg-indigo-400 inline-block" />
              <span className="text-slate-400">Planned Target Curve</span>
            </div>
          </div>
          <span className="text-slate-500 text-[11px]">
            *Click any node or bar to navigate directly to that stage
          </span>
        </div>

        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'progression' ? (
              <ComposedChart
                data={timelineData}
                margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const point = e.activePayload[0].payload as MilestoneTimelinePoint;
                    if (point?.id) onSelectStage(point.id);
                  }
                }}
              >
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />

                <XAxis
                  dataKey="shortName"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />

                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                  tickLine={false}
                />

                <Tooltip content={<CustomProgressionTooltip />} />

                <ReferenceLine y={50} stroke="#64748b" strokeDasharray="4 4" label={{ value: 'Launch Gate (50%)', fill: '#94a3b8', fontSize: 10, position: 'insideTopRight' }} />

                {/* Target Baseline Curve */}
                <Area
                  type="monotone"
                  dataKey="plannedPercent"
                  name="Target Curve"
                  stroke="#818cf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="url(#targetGradient)"
                />

                {/* Actual Execution Velocity Area */}
                <Area
                  type="monotone"
                  dataKey="actualPercent"
                  name="Actual Velocity"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#velocityGradient)"
                  activeDot={{ r: 7, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </ComposedChart>
            ) : (
              <BarChart
                data={timelineData}
                margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const point = e.activePayload[0].payload as MilestoneTimelinePoint;
                    if (point?.id) onSelectStage(point.id);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />

                <XAxis
                  dataKey="shortName"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />

                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `${val}d`}
                  tickLine={false}
                />

                <Tooltip content={<CustomProgressionTooltip />} />

                <Bar dataKey="effortDays" radius={[6, 6, 0, 0]}>
                  {timelineData.map((entry, index) => {
                    const isSelected = entry.id === activeStageId;
                    const fill = 
                      entry.status === 'completed' 
                        ? '#10b981' 
                        : entry.status === 'in_progress' 
                        ? '#f59e0b' 
                        : isSelected 
                        ? '#6366f1' 
                        : '#334155';
                    return <Cell key={`cell-${index}`} fill={fill} className="cursor-pointer hover:opacity-80 transition-opacity" />;
                  })}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stage Progression Quick-Jumper Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Stage Milestones:
        </span>
        {timelineData.map((pt) => {
          const isSelected = pt.id === activeStageId;
          const isDone = pt.status === 'completed';
          const isInProgress = pt.status === 'in_progress';

          return (
            <button
              key={pt.id}
              onClick={() => onSelectStage(pt.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                  : isDone
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-950/60'
                  : isInProgress
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-950/60'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/40'
              }`}
            >
              <span className="text-[10px] opacity-75">#{pt.stageNumber}</span>
              <span>{pt.name.split(' ')[0]}</span>
              {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
