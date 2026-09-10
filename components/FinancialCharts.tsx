import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
} from 'recharts';
import { FinancialProjection } from '../types';
import { TrendingUp, DollarSign, Wallet, Percent, BarChart3, LineChart as LineChartIcon, Copy, Check } from 'lucide-react';
import { useToast } from './Toast';

interface FinancialChartsProps {
  projections: FinancialProjection[];
}

// Robust financial string parser
export function parseFinancialString(value: string | undefined | null): number {
  if (!value) return 0;
  
  // Handle ranges like "$100k - $150k" or "$100,000 - $150,000"
  const rangeMatch = value.split(/[-–—]|to/i);
  if (rangeMatch.length > 1) {
    const v1 = parseFinancialString(rangeMatch[0]);
    const v2 = parseFinancialString(rangeMatch[1]);
    if (v1 > 0 && v2 > 0) return (v1 + v2) / 2;
  }

  const cleaned = value.replace(/[\$,\s]/g, '').toLowerCase();

  const billionMatch = cleaned.match(/([\d.]+)\s*b/);
  if (billionMatch) return parseFloat(billionMatch[1]) * 1000000000;

  const millionMatch = cleaned.match(/([\d.]+)\s*m/);
  if (millionMatch) return parseFloat(millionMatch[1]) * 1000000;

  const thousandMatch = cleaned.match(/([\d.]+)\s*k/);
  if (thousandMatch) return parseFloat(thousandMatch[1]) * 1000;

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}k`;
  }
  return `$${amount.toLocaleString()}`;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ projections }) => {
  const [chartView, setChartView] = useState<'composed' | 'bars' | 'growth'>('composed');
  const [hasCopied, setHasCopied] = useState(false);
  const { showToast } = useToast();

  const chartData = useMemo(() => {
    if (!projections || projections.length === 0) return [];

    return projections.map((proj, index) => {
      const rev = parseFinancialString(proj.revenue);
      const exp = parseFinancialString(proj.costs);
      const profit = rev - exp;
      const profitMargin = rev > 0 ? (profit / rev) * 100 : 0;

      let growthRate: number = 0;
      if (index > 0) {
        const prevRev = parseFinancialString(projections[index - 1].revenue);
        if (prevRev > 0) {
          growthRate = Math.round(((rev - prevRev) / prevRev) * 100);
        }
      }

      return {
        year: `Year ${proj.year}`,
        yearNum: proj.year,
        revenue: rev,
        expenses: exp,
        profit: profit,
        profitMargin: Math.round(profitMargin * 10) / 10,
        growthRate: growthRate,
        rawRevenue: proj.revenue,
        rawCosts: proj.costs,
        assumptions: proj.assumptions,
      };
    });
  }, [projections]);

  // Aggregate metrics
  const totals = useMemo(() => {
    const totalRev = chartData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalExp = chartData.reduce((acc, curr) => acc + curr.expenses, 0);
    const totalProfit = totalRev - totalExp;
    const maxGrowth = Math.max(...chartData.map((d) => d.growthRate), 0);
    return {
      totalRev,
      totalExp,
      totalProfit,
      maxGrowth,
    };
  }, [chartData]);

  const handleCopyFinancials = () => {
    const summaryText = chartData
      .map(
        (d) =>
          `${d.year}: Revenue: ${d.rawRevenue || formatCurrency(d.revenue)}, Expenses: ${
            d.rawCosts || formatCurrency(d.expenses)
          }, Profit: ${formatCurrency(d.profit)} (Margin: ${d.profitMargin}%)${
            d.growthRate > 0 ? `, YoY Growth: +${d.growthRate}%` : ''
          }\nAssumptions: ${d.assumptions}`
      )
      .join('\n\n');

    navigator.clipboard.writeText(summaryText);
    setHasCopied(true);
    showToast('Financial projections copied to clipboard!', 'success', 'copy');
    setTimeout(() => setHasCopied(false), 2500);
  };

  if (!projections || projections.length === 0) {
    return (
      <div className="p-4 bg-gray-900/60 rounded-lg text-gray-400 text-sm">
        No financial projections available for this analysis.
      </div>
    );
  }

  return (
    <div id="financial-projections-chart-wrapper" className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-gray-900/80 rounded-xl border border-gray-700/80">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 mb-1">
            <DollarSign size={15} />
            <span>Total Projected Revenue</span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {formatCurrency(totals.totalRev)}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Across {chartData.length} years</div>
        </div>

        <div className="p-3.5 bg-gray-900/80 rounded-xl border border-gray-700/80">
          <div className="flex items-center gap-2 text-xs font-medium text-rose-400 mb-1">
            <Wallet size={15} />
            <span>Total Expenses / Costs</span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {formatCurrency(totals.totalExp)}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Estimated expenditure</div>
        </div>

        <div className="p-3.5 bg-gray-900/80 rounded-xl border border-gray-700/80">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 mb-1">
            <TrendingUp size={15} />
            <span>Net Operating Margin</span>
          </div>
          <div className={`text-xl font-bold tracking-tight ${totals.totalProfit >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
            {formatCurrency(totals.totalProfit)}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {totals.totalRev > 0
              ? `${Math.round((totals.totalProfit / totals.totalRev) * 100)}% overall margin`
              : 'Cumulative'}
          </div>
        </div>

        <div className="p-3.5 bg-gray-900/80 rounded-xl border border-gray-700/80">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400 mb-1">
            <Percent size={15} />
            <span>Peak YoY Growth</span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {totals.maxGrowth > 0 ? `+${totals.maxGrowth}%` : 'Stable'}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Annual acceleration</div>
        </div>
      </div>

      {/* Chart Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-900/60 p-2.5 rounded-xl border border-gray-700/60">
        <div className="flex items-center gap-1.5">
          <button
            id="view-composed-chart"
            onClick={() => setChartView('composed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              chartView === 'composed'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            <BarChart3 size={14} />
            Revenue, Expenses & Growth
          </button>
          <button
            id="view-bars-chart"
            onClick={() => setChartView('bars')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              chartView === 'bars'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            <BarChart3 size={14} />
            Bar Comparison
          </button>
          <button
            id="view-growth-chart"
            onClick={() => setChartView('growth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              chartView === 'growth'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            <LineChartIcon size={14} />
            Growth Trajectory %
          </button>
        </div>

        <button
          id="copy-financial-projections-btn"
          onClick={handleCopyFinancials}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
          title="Copy financial data to clipboard"
        >
          {hasCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          {hasCopied ? 'Copied' : 'Copy Table'}
        </button>
      </div>

      {/* Recharts Visualization */}
      <div className="p-4 bg-gray-900/90 rounded-2xl border border-gray-700/80 shadow-inner">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'composed' ? (
              <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="year" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis
                  yAxisId="currency"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(val) => formatCurrency(val)}
                />
                <YAxis
                  yAxisId="percentage"
                  orientation="right"
                  stroke="#F59E0B"
                  tick={{ fill: '#F59E0B', fontSize: 12 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(val) => <span className="text-xs text-gray-300 capitalize">{val}</span>}
                />
                <Bar
                  yAxisId="currency"
                  dataKey="revenue"
                  name="Revenue"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  yAxisId="currency"
                  dataKey="expenses"
                  name="Expenses"
                  fill="#F43F5E"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
                <Line
                  yAxisId="percentage"
                  type="monotone"
                  dataKey="growthRate"
                  name="YoY Growth %"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', r: 5, strokeWidth: 2, stroke: '#111827' }}
                />
              </ComposedChart>
            ) : chartView === 'bars' ? (
              <BarChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="year" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(val) => formatCurrency(val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(val) => <span className="text-xs text-gray-300 capitalize">{val}</span>}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={45} />
                <Bar dataKey="expenses" name="Expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={45} />
                <Bar dataKey="profit" name="Net Margin" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="year" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(val) => <span className="text-xs text-gray-300 capitalize">{val}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="growthRate"
                  name="YoY Revenue Growth %"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="profitMargin"
                  name="Operating Margin %"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 5 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Custom interactive dark tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
        <p className="font-bold text-white border-b border-gray-800 pb-1">{label}</p>
        <div className="flex justify-between items-center text-emerald-400">
          <span>Revenue:</span>
          <span className="font-bold">{data.rawRevenue || formatCurrency(data.revenue)}</span>
        </div>
        <div className="flex justify-between items-center text-rose-400">
          <span>Expenses:</span>
          <span className="font-bold">{data.rawCosts || formatCurrency(data.expenses)}</span>
        </div>
        <div className="flex justify-between items-center text-indigo-300">
          <span>Net Profit:</span>
          <span className="font-bold">{formatCurrency(data.profit)}</span>
        </div>
        {data.growthRate > 0 && (
          <div className="flex justify-between items-center text-amber-400">
            <span>YoY Growth:</span>
            <span className="font-bold">+{data.growthRate}%</span>
          </div>
        )}
        <div className="flex justify-between items-center text-gray-400">
          <span>Margin:</span>
          <span>{data.profitMargin}%</span>
        </div>
        {data.assumptions && (
          <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-800 italic line-clamp-2">
            {data.assumptions}
          </p>
        )}
      </div>
    );
  }
  return null;
};
