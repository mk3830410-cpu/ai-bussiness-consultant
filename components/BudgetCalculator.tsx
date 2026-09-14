import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  PieChart, 
  Sliders, 
  TrendingUp, 
  ShieldAlert, 
  Clock, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useToast } from './Toast';

interface BudgetCalculatorProps {
  initialBudget?: string | number;
  industry?: string;
  stage?: string;
  isPrintable?: boolean;
}

interface CostCategory {
  id: string;
  name: string;
  defaultPercent: number;
  color: string;
  lightColor: string;
  description: string;
  subItems: string[];
}

// Industry-specific budget allocation baselines
const INDUSTRY_BASELINES: Record<string, Record<string, number>> = {
  'Technology & Software': { product: 40, marketing: 25, ops: 12, talent: 13, reserve: 10 },
  'AI & Automation': { product: 42, marketing: 22, ops: 12, talent: 14, reserve: 10 },
  'E-Commerce & Retail': { product: 22, marketing: 38, ops: 18, talent: 12, reserve: 10 },
  'Health & Wellness': { product: 28, marketing: 25, ops: 22, talent: 15, reserve: 10 },
  'Finance & FinTech': { product: 35, marketing: 20, ops: 25, talent: 10, reserve: 10 },
  'Education & EdTech': { product: 35, marketing: 30, ops: 13, talent: 12, reserve: 10 },
  'Services & Consulting': { product: 18, marketing: 32, ops: 15, talent: 25, reserve: 10 },
  'Default': { product: 32, marketing: 28, ops: 15, talent: 15, reserve: 10 },
};

const CATEGORIES_TEMPLATE: Omit<CostCategory, 'defaultPercent'>[] = [
  {
    id: 'product',
    name: 'Product & Technology Stack',
    color: '#6366f1', // Indigo
    lightColor: 'rgba(99, 102, 241, 0.15)',
    description: 'MVP development, cloud hosting, APIs, UI/UX design, software licenses & security',
    subItems: ['Cloud Hosting & Database (AWS/GCP/Supabase)', 'Domain, SSL & Web Infrastructure', 'Third-Party AI & API Credits', 'Dev Tools, GitHub & CI/CD Pipelines'],
  },
  {
    id: 'marketing',
    name: 'Marketing & Customer Acquisition',
    color: '#0284c7', // Sky
    lightColor: 'rgba(2, 132, 199, 0.15)',
    description: 'Paid advertising, SEO, social content, influencer outreach, launch PR & branding',
    subItems: ['Paid Search & Social Ads (Google/Meta/LinkedIn)', 'Content Creation & Video Production', 'Email Marketing & CRM Software', 'PR, Launch Events & Product Hunt Prep'],
  },
  {
    id: 'ops',
    name: 'Operations, Legal & Compliance',
    color: '#f59e0b', // Amber
    lightColor: 'rgba(245, 158, 11, 0.15)',
    description: 'Business incorporation, legal counsel, trademarking, insurance & accounting tools',
    subItems: ['LLC/C-Corp Formation & State Filings', 'Legal Contracts & Privacy Policies (Stripe Atlas / Counsel)', 'Bookkeeping & Tax Software (QuickBooks/Pilot)', 'Business Insurance & Banking Setup'],
  },
  {
    id: 'talent',
    name: 'Team, Talent & Key Contractors',
    color: '#10b981', // Emerald
    lightColor: 'rgba(16, 185, 129, 0.15)',
    description: 'Freelance specialists, technical contractors, domain advisors & specialized stipends',
    subItems: ['Specialized Freelance Developers/Designers', 'Virtual Assistants & Operational Support', 'Industry Advisory Honorariums', 'Contractor Payroll & Invoicing Platforms'],
  },
  {
    id: 'reserve',
    name: 'Runway Buffer & Contingency Reserve',
    color: '#ec4899', // Pink
    lightColor: 'rgba(236, 72, 153, 0.15)',
    description: 'Unforeseen costs, unexpected subscription bumps, extended runway cushion & emergency buffer',
    subItems: ['Emergency Operating Buffer (1-2 months)', 'Customer Support Surge Budget', 'Unforeseen Tool/API Tier Upgrades', 'Payment Gateway Processing Float'],
  },
];

export const BudgetCalculator: React.FC<BudgetCalculatorProps> = ({
  initialBudget,
  industry = 'Technology & Software',
  stage = 'Idea / Concept',
  isPrintable = false,
}) => {
  const { showToast } = useToast();

  // Parse initial budget string (e.g. "$50,000", "50000", "50k") into numeric amount
  const parsedDefaultAmount = useMemo(() => {
    if (typeof initialBudget === 'number') return initialBudget;
    if (!initialBudget) return 50000;
    const clean = initialBudget.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    if (!isNaN(num)) {
      if (initialBudget.toLowerCase().includes('k')) return num * 1000;
      if (initialBudget.toLowerCase().includes('m')) return num * 1000000;
      return num;
    }
    return 50000;
  }, [initialBudget]);

  const [totalBudget, setTotalBudget] = useState<number>(parsedDefaultAmount);
  const [selectedIndustry, setSelectedIndustry] = useState<string>(industry || 'Technology & Software');
  const [scope, setScope] = useState<'lean' | 'standard' | 'aggressive'>('standard');
  const [runwayMonths, setRunwayMonths] = useState<number>(12);
  const [copied, setCopied] = useState(false);

  // Determine baseline percentages based on industry
  const baselinePercentages = useMemo(() => {
    const key = Object.keys(INDUSTRY_BASELINES).find(k => 
      selectedIndustry.toLowerCase().includes(k.toLowerCase())
    ) || 'Default';
    return INDUSTRY_BASELINES[key];
  }, [selectedIndustry]);

  // Adjust percentages by scope
  const initialCategoryPercentages = useMemo(() => {
    let { product, marketing, ops, talent, reserve } = baselinePercentages;

    if (scope === 'lean') {
      product += 5;
      marketing -= 5;
      talent -= 3;
      reserve += 3;
    } else if (scope === 'aggressive') {
      marketing += 8;
      talent += 4;
      product -= 6;
      ops -= 4;
      reserve -= 2;
    }

    return { product, marketing, ops, talent, reserve };
  }, [baselinePercentages, scope]);

  // Customizable category percentages state
  const [percentages, setPercentages] = useState<{ [key: string]: number }>(initialCategoryPercentages);

  // Sync when industry or scope changes
  React.useEffect(() => {
    setPercentages(initialCategoryPercentages);
  }, [initialCategoryPercentages]);

  const handlePercentageChange = (catId: string, newValue: number) => {
    setPercentages(prev => ({
      ...prev,
      [catId]: Math.max(0, Math.min(100, newValue))
    }));
  };

  const resetToIndustryDefaults = () => {
    setPercentages(initialCategoryPercentages);
    showToast('Reset allocations to industry benchmark', 'info');
  };

  // Computed amounts
  const categoryAllocations = useMemo(() => {
    const totalPercent = Object.values(percentages).reduce((sum, val) => sum + val, 0) || 100;
    
    return CATEGORIES_TEMPLATE.map(cat => {
      const pct = percentages[cat.id] ?? 20;
      const normalizedPct = Math.round((pct / totalPercent) * 100);
      const amount = Math.round((totalBudget * pct) / totalPercent);
      return {
        ...cat,
        percent: normalizedPct,
        amount,
        monthlyAmount: Math.round(amount / (runwayMonths || 12)),
      };
    });
  }, [percentages, totalBudget, runwayMonths]);

  // High-level summary metrics
  const monthlyBurn = useMemo(() => {
    return Math.round(totalBudget / (runwayMonths || 12));
  }, [totalBudget, runwayMonths]);

  const reserveAmount = useMemo(() => {
    const res = categoryAllocations.find(c => c.id === 'reserve');
    return res ? res.amount : Math.round(totalBudget * 0.1);
  }, [categoryAllocations, totalBudget]);

  const handleCopySummary = () => {
    const lines = [
      `StratIQ Startup Budget Breakdown: $${totalBudget.toLocaleString()}`,
      `Industry: ${selectedIndustry} | Scope: ${scope.toUpperCase()} | Runway: ${runwayMonths} Months`,
      `Estimated Monthly Burn: $${monthlyBurn.toLocaleString()}/mo`,
      '',
      ...categoryAllocations.map(c => `• ${c.name}: $${c.amount.toLocaleString()} (${c.percent}%) — $${c.monthlyAmount.toLocaleString()}/mo`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    showToast('Budget summary copied to clipboard', 'success', 'copy');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Category', 'Percentage', 'Total Allocation ($)', 'Monthly Burn ($)', 'Key Sub-Items'];
    const rows = categoryAllocations.map(c => [
      `"${c.name}"`,
      `"${c.percent}%"`,
      `"${c.amount}"`,
      `"${c.monthlyAmount}"`,
      `"${c.subItems.join('; ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `startup_budget_${totalBudget}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported budget breakdown to CSV', 'success');
  };

  const presetBudgets = [10000, 25000, 50000, 100000, 250000];

  return (
    <div className="bg-gray-900/90 border border-gray-700/80 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Interactive Startup Budget Calculator</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Industry-Adaptive
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Model your capital allocation, estimated monthly burn rate, and category line items based on industry dynamics.
          </p>
        </div>

        {!isPrintable && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={resetToIndustryDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-xs font-semibold text-gray-300 hover:text-white border border-gray-700 transition-all"
              title="Reset sliders to industry baseline"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reset Baseline</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-xs font-semibold text-gray-300 hover:text-white border border-gray-700 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-xs font-semibold text-emerald-300 hover:text-white border border-emerald-500/40 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Input Parameters: Budget, Presets, Scope, Runway */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-gray-950/60 p-4 rounded-2xl border border-gray-800">
        {/* Budget Input & Presets */}
        <div className="md:col-span-6 space-y-2">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
            Total Available Budget ($)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input
              type="number"
              min={1000}
              max={10000000}
              step={1000}
              value={totalBudget}
              onChange={(e) => setTotalBudget(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-8 pr-4 py-2 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-gray-500 font-medium mr-1">Presets:</span>
            {presetBudgets.map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setTotalBudget(val)}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                  totalBudget === val
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                    : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                ${(val / 1000)}k
              </button>
            ))}
          </div>
        </div>

        {/* Scope Selector */}
        <div className="md:col-span-3 space-y-2">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
            Execution Scope
          </label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as any)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="lean">Bootstrapped / Lean MVP</option>
            <option value="standard">Standard Market Launch</option>
            <option value="aggressive">Aggressive Scale / Funded</option>
          </select>
          <p className="text-[11px] text-gray-400">
            {scope === 'lean' ? 'Minimizes overhead; focuses on MVP' : scope === 'standard' ? 'Balanced product & acquisition mix' : 'Aggressive paid marketing & speed'}
          </p>
        </div>

        {/* Target Runway */}
        <div className="md:col-span-3 space-y-2">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
            Target Runway
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[6, 12, 18].map(months => (
              <button
                key={months}
                type="button"
                onClick={() => setRunwayMonths(months)}
                className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                  runwayMonths === months
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {months} mo
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 text-center">
            Est. Burn: <span className="text-white font-mono font-bold">${monthlyBurn.toLocaleString()}</span>/mo
          </p>
        </div>
      </div>

      {/* Visual Stacked Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-300">
          <span>Capital Allocation Distribution</span>
          <span className="text-gray-400 font-mono text-[11px]">Total: ${totalBudget.toLocaleString()}</span>
        </div>
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-800 border border-gray-700 shadow-inner">
          {categoryAllocations.map(cat => (
            <div
              key={cat.id}
              style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
              className="h-full transition-all duration-300 hover:opacity-90 relative group"
              title={`${cat.name}: $${cat.amount.toLocaleString()} (${cat.percent}%)`}
            />
          ))}
        </div>
      </div>

      {/* Category Breakdown Cards with Sliders & Line Items */}
      <div className="space-y-3">
        {categoryAllocations.map(cat => (
          <div
            key={cat.id}
            className="p-4 rounded-2xl bg-gray-950/40 border border-gray-800/80 hover:border-gray-700 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span 
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: cat.color }}
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                  <p className="text-xs text-gray-400">{cat.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-white">
                    ${cat.amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    ${cat.monthlyAmount.toLocaleString()}/mo ({cat.percent}%)
                  </div>
                </div>

                {!isPrintable && (
                  <div className="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1">
                    <input
                      type="range"
                      min={5}
                      max={60}
                      value={percentages[cat.id] ?? cat.percent}
                      onChange={(e) => handlePercentageChange(cat.id, parseInt(e.target.value))}
                      className="w-20 accent-indigo-500 cursor-pointer"
                      title="Adjust allocation percentage"
                    />
                    <span className="text-xs font-mono font-bold text-gray-300 w-8 text-right">
                      {cat.percent}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-800/60 text-xs text-gray-400">
              {cat.subItems.map((sub, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  <span className="text-[11px] text-gray-300">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Strategic Runway & Health Summary */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Capital Efficiency & Runway Assessment</span>
          </div>
          <p className="text-xs text-indigo-100/80 leading-relaxed">
            With a <strong>${totalBudget.toLocaleString()}</strong> budget and a <strong>${monthlyBurn.toLocaleString()}/mo</strong> burn rate, your business maintains <strong>{runwayMonths} months</strong> of continuous operational headroom with a <strong>${reserveAmount.toLocaleString()}</strong> emergency buffer.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center px-3 py-1.5 rounded-xl bg-gray-900/80 border border-indigo-500/30">
            <span className="block text-[10px] text-gray-400 uppercase font-semibold">Runway</span>
            <span className="text-sm font-extrabold text-white font-mono">{runwayMonths} Mo</span>
          </div>
          <div className="text-center px-3 py-1.5 rounded-xl bg-gray-900/80 border border-emerald-500/30">
            <span className="block text-[10px] text-gray-400 uppercase font-semibold">Health</span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono">Strong</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetCalculator;
