import React from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  Bot, 
  Plus, 
  FileText, 
  ChevronRight,
  Compass,
  CheckCircle2,
  Zap,
  BarChart3,
  ShieldCheck,
  Clock,
  ExternalLink
} from 'lucide-react';
import { SavedStrategy, UserSubscription } from '../types';

interface DashboardOverviewProps {
  stats: {
    ideasAnalyzed: number;
    strategiesGenerated: number;
    marketOpportunities: number;
    averageScore: number;
  };
  recentStrategies: SavedStrategy[];
  subscription?: UserSubscription;
  onStartNewAnalysis: () => void;
  onOpenAdvisor: () => void;
  onOpenStrategy: (strategy: SavedStrategy) => void;
  onViewAllStrategies: () => void;
  onUpgradePro?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  recentStrategies,
  subscription,
  onStartNewAnalysis,
  onOpenAdvisor,
  onOpenStrategy,
  onViewAllStrategies,
  onUpgradePro,
}) => {
  const isProActive = subscription?.plan === 'pro' && subscription?.status === 'active';
  const isPending = subscription?.plan === 'pro' && subscription?.status === 'pending';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/60 via-gray-800/80 to-purple-900/40 rounded-3xl border border-indigo-500/30 p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Business Command Center</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Turn Your Startup Vision Into an{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Unstoppable Roadmap
            </span>
          </h1>

          <p className="mt-3 text-base md:text-lg text-gray-300 leading-relaxed max-w-2xl">
            StratIQ continuously analyzes your target markets, calculates business opportunity scores, generates financial forecasts, and provides 24/7 AI venture advising.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onStartNewAnalysis}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-sm transition-all duration-200 shadow-xl hover:shadow-indigo-500/30 flex items-center gap-2 transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Launch New Analysis</span>
            </button>

            <button
              onClick={onOpenAdvisor}
              className="px-6 py-3.5 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 text-gray-200 font-bold rounded-xl text-sm transition-all duration-200 flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Chat with AI Co-Founder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Subscription State Card (Requirement 23) */}
      <div className="bg-gray-800/80 border border-gray-700/80 rounded-2xl p-5 md:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
            isProActive 
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' 
              : isPending 
              ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' 
              : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
          }`}>
            {isProActive ? <ShieldCheck className="w-6 h-6" /> : isPending ? <Clock className="w-6 h-6 animate-pulse" /> : <Zap className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-white">
                {isProActive ? 'Founder Pro' : isPending ? 'Founder Pro' : 'Starter'}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isProActive 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : isPending 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {isProActive ? 'Active' : isPending ? 'Payment Confirmation Pending' : 'Free Plan'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isProActive 
                ? 'Unlimited AI strategies, financial projections, 24/7 AI Advisor, and export tools enabled.'
                : isPending 
                ? 'Payment confirmation pending. Verifying subscription status with Razorpay...'
                : '3 Quick Brainstorms included. Upgrade to unlock full SWOT, financial models, and exports.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isProActive ? (
            <button
              onClick={onUpgradePro}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
            >
              <span>Manage Subscription</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : isPending ? (
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Payment confirmation pending</span>
            </span>
          ) : (
            <button
              onClick={onUpgradePro}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 transform hover:scale-105"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Upgrade to Founder Pro</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          {
            title: 'Ideas Analyzed',
            value: stats.ideasAnalyzed,
            icon: Lightbulb,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
            sub: 'Concepts evaluated',
          },
          {
            title: 'Strategies Generated',
            value: stats.strategiesGenerated,
            icon: FileText,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10 border-indigo-500/20',
            sub: 'Full business blueprints',
          },
          {
            title: 'Market Opportunities',
            value: stats.marketOpportunities,
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            sub: 'Identified growth vectors',
          },
          {
            title: 'Avg. Business Score',
            value: `${stats.averageScore}/100`,
            icon: Award,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10 border-purple-500/20',
            sub: 'Comparative viability',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/80 rounded-2xl p-5 md:p-6 transition-all duration-200 hover:border-gray-600 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-xl border ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {kpi.value}
              </div>

              <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Strategies + AI Advisor Quick Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Strategies */}
        <div className="lg:col-span-8 bg-gray-800/80 border border-gray-700/80 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Recent Business Strategies</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Click any strategy to inspect full market models, SWOT, and financial projections.
                </p>
              </div>

              <button
                onClick={onViewAllStrategies}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentStrategies.slice(0, 3).map((strat) => (
                <div
                  key={strat.id}
                  onClick={() => onOpenStrategy(strat)}
                  className="p-4 bg-gray-900/60 hover:bg-gray-900 border border-gray-700/60 hover:border-indigo-500/40 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                      {strat.businessName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors truncate">
                        {strat.businessName}
                      </h4>
                      <p className="text-xs text-gray-400 truncate">
                        {strat.industry} • Created {new Date(strat.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase block">Score</span>
                      <span className="text-sm font-bold text-emerald-400">{strat.score || 82}/100</span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-gray-800 text-gray-400 group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-700/60 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              StratIQ auto-saves all strategy iterations locally.
            </span>
            <button
              onClick={onStartNewAnalysis}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Another Analysis</span>
            </button>
          </div>
        </div>

        {/* Right Column: AI Co-Founder Advisor Box */}
        <div className="lg:col-span-4 bg-gradient-to-br from-gray-800 via-gray-800 to-indigo-950/40 border border-gray-700/80 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/20">
              <Bot className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">AI Business Advisor</h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              Stuck on go-to-market channels, competitor responses, or pricing? Your AI co-founder is available around the clock.
            </p>

            <div className="space-y-2 mb-6">
              {[
                "How do I acquire my first 100 paying customers?",
                "What is the best pricing model for my business?",
                "How do I build defensible competitive moats?",
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={onOpenAdvisor}
                  className="w-full text-left p-2.5 rounded-xl bg-gray-900/60 hover:bg-gray-900 border border-gray-700 text-xs text-gray-300 hover:text-white transition-colors flex items-center justify-between gap-2"
                >
                  <span className="truncate">{q}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenAdvisor}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2"
          >
            <span>Open AI Advisor Chat</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
