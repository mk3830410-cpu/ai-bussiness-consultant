import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Sparkles, Info, Eye, Layers, ShieldCheck, Target } from 'lucide-react';

export interface CompetitorDataPoint {
  id: string;
  name: string;
  analysis: string;
  priceScore: number; // 0 to 100 (0 = very low/free, 100 = enterprise expensive)
  performanceScore: number; // 0 to 100 (capability, speed, feature depth)
  marketShare: number; // 10 to 40 (for bubble radius)
  isUserStartup?: boolean;
  category: 'User Venture' | 'Incumbent Leader' | 'Niche Specialist' | 'Budget Alternative';
  color: string;
}

interface CompetitorBubbleChartProps {
  competitors: Array<{ name: string; analysis: string; positioning?: string }>;
  startupName?: string;
  startupUsp?: string;
  industry?: string;
}

export const CompetitorBubbleChart: React.FC<CompetitorBubbleChartProps> = ({
  competitors = [],
  startupName = 'Your Venture',
  startupUsp = 'AI-driven high velocity platform',
  industry = 'SaaS',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorDataPoint | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dimensions, setDimensions] = useState({ width: 700, height: 420 });

  // Map input competitors and user's venture into mathematical 2D price vs performance matrix
  const dataset: CompetitorDataPoint[] = useMemo(() => {
    // 1. User Startup is placed in the Disruptive sweet spot (Accessible price, High AI performance)
    const userPoint: CompetitorDataPoint = {
      id: 'startup-node',
      name: startupName,
      analysis: startupUsp,
      priceScore: 35, // Accessible disruptive pricing
      performanceScore: 88, // High AI-native performance
      marketShare: 32, // Growing footprint
      isUserStartup: true,
      category: 'User Venture',
      color: '#6366f1', // Indigo glow
    };

    const categories: CompetitorDataPoint['category'][] = [
      'Incumbent Leader',
      'Niche Specialist',
      'Budget Alternative',
    ];

    const mapped = (competitors || []).map((c, index) => {
      // Deterministic spread based on name length and index
      const hash = (c.name.length * 17 + index * 23) % 100;
      let price = 40 + (hash % 50); // 40-90
      let perf = 30 + ((hash * 3) % 55); // 30-85
      let category: CompetitorDataPoint['category'] = 'Incumbent Leader';
      let color = '#f59e0b'; // amber

      if (index % 3 === 0) {
        // Incumbent: High price, moderate-to-high perf
        price = 75 + (index * 5) % 20;
        perf = 65 + (hash % 20);
        category = 'Incumbent Leader';
        color = '#f59e0b'; // Amber
      } else if (index % 3 === 1) {
        // Niche Specialist: moderate price, focused perf
        price = 45 + (hash % 30);
        perf = 55 + (hash % 30);
        category = 'Niche Specialist';
        color = '#06b6d4'; // Cyan
      } else {
        // Budget alternative: Low price, basic perf
        price = 20 + (hash % 25);
        perf = 35 + (hash % 25);
        category = 'Budget Alternative';
        color = '#a855f7'; // Purple
      }

      return {
        id: `comp-${index}`,
        name: c.name,
        analysis: c.analysis || `${c.name} offers standard ${industry} solutions.`,
        priceScore: Math.min(95, Math.max(15, price)),
        performanceScore: Math.min(95, Math.max(20, perf)),
        marketShare: 18 + (hash % 16),
        isUserStartup: false,
        category,
        color,
      };
    });

    return [userPoint, ...mapped];
  }, [competitors, startupName, startupUsp, industry]);

  // Handle responsive sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setDimensions({
          width: Math.max(320, width),
          height: Math.min(480, Math.max(340, width * 0.55)),
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // D3 Chart Rendering
  useEffect(() => {
    if (!svgRef.current) return;

    const { width, height } = dimensions;
    const margin = { top: 40, right: 40, bottom: 50, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Definitions for glow filters & gradients
    const defs = svg.append('defs');

    // Startup Glow Filter
    const filter = defs.append('filter')
      .attr('id', 'bubble-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', 6)
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Linear gradient for startup bubble
    const userGrad = defs.append('linearGradient')
      .attr('id', 'userGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    userGrad.append('stop').attr('offset', '0%').attr('stop-color', '#818cf8');
    userGrad.append('stop').attr('offset', '100%').attr('stop-color', '#4f46e5');

    // Main Chart Group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Scales
    const xScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    const rScale = d3.scaleSqrt()
      .domain([10, 45])
      .range([12, 28]);

    // Quadrant Midpoints
    const midX = xScale(50);
    const midY = yScale(50);

    // 1. Quadrant Background Shading
    // Top-Left Sweet Spot (High Performance, Low Price)
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', midX)
      .attr('height', midY)
      .attr('fill', '#4f46e5')
      .attr('fill-opacity', 0.06)
      .attr('rx', 8);

    // Quadrant Labels
    const quadrantLabels = [
      { text: 'DISRUPTIVE SWEET SPOT (High Perf / Low Cost)', x: 12, y: 20, fill: '#818cf8' },
      { text: 'ENTERPRISE LEADERS (High Perf / High Cost)', x: innerWidth - 12, y: 20, fill: '#94a3b8', anchor: 'end' },
      { text: 'COMMODITY BUDGET (Low Perf / Low Cost)', x: 12, y: innerHeight - 12, fill: '#64748b' },
      { text: 'LEGACY OVERPRICED (Low Perf / High Cost)', x: innerWidth - 12, y: innerHeight - 12, fill: '#64748b', anchor: 'end' },
    ];

    quadrantLabels.forEach(q => {
      g.append('text')
        .attr('x', q.x)
        .attr('y', q.y)
        .attr('text-anchor', q.anchor || 'start')
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .attr('letter-spacing', '0.05em')
        .attr('fill', q.fill)
        .attr('opacity', 0.8)
        .text(q.text);
    });

    // 2. Quadrant Divider Grid Lines
    g.append('line')
      .attr('x1', midX)
      .attr('x2', midX)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 4');

    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', midY)
      .attr('y2', midY)
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 4');

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    // Add X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#475569')
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px');

    // Add Y Axis
    g.append('g')
      .call(yAxis)
      .attr('color', '#475569')
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px');

    // Axis Titles
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text('Price / Cost Level (Accessible → Enterprise)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text('Performance / Capability (Basic → AI-Native)');

    // Filtered data based on category selection
    const visibleData = filterCategory === 'all' 
      ? dataset 
      : dataset.filter(d => d.category === filterCategory || d.isUserStartup);

    // Bubble Nodes
    const nodeGroups = g.selectAll('.bubble-node')
      .data(visibleData, (d: any) => d.id)
      .enter()
      .append('g')
      .attr('class', 'bubble-node')
      .attr('transform', d => `translate(${xScale(d.priceScore)},${yScale(d.performanceScore)})`)
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        setSelectedCompetitor(d);
      });

    // Pulse Ring for User Startup
    nodeGroups.filter(d => !!d.isUserStartup)
      .append('circle')
      .attr('r', d => rScale(d.marketShare) + 8)
      .attr('fill', 'none')
      .attr('stroke', '#818cf8')
      .attr('stroke-width', 2)
      .attr('opacity', 0.6)
      .attr('stroke-dasharray', '3 3')
      .style('animation', 'spin 12s linear infinite');

    // Core Circles
    nodeGroups.append('circle')
      .attr('r', d => rScale(d.marketShare))
      .attr('fill', d => d.isUserStartup ? 'url(#userGrad)' : d.color)
      .attr('fill-opacity', d => d.isUserStartup ? 0.95 : 0.65)
      .attr('stroke', d => d.isUserStartup ? '#c7d2fe' : d.color)
      .attr('stroke-width', d => d.isUserStartup ? 2.5 : 1.5)
      .attr('filter', d => d.isUserStartup ? 'url(#bubble-glow)' : null)
      .transition()
      .duration(750)
      .attr('r', d => rScale(d.marketShare));

    // Bubble Labels
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => rScale(d.marketShare) + 14)
      .attr('font-size', d => d.isUserStartup ? '11px' : '10px')
      .attr('font-weight', d => d.isUserStartup ? '800' : '600')
      .attr('fill', d => d.isUserStartup ? '#ffffff' : '#e2e8f0')
      .text(d => d.name);

    // Inner icon / text for user startup
    nodeGroups.filter(d => !!d.isUserStartup)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '4px')
      .attr('font-size', '10px')
      .attr('font-weight', '900')
      .attr('fill', '#ffffff')
      .text('YOU');

  }, [dataset, dimensions, filterCategory]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Target className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Competitor Price vs. Performance Matrix
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
              D3.js Visualization
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Interactive positioning map comparing price tiers against functional capability.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'Incumbent Leader', 'Niche Specialist', 'Budget Alternative'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-750 border border-slate-700/60'
              }`}
            >
              {cat === 'all' ? 'All Competitors' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* D3 Chart Stage */}
      <div ref={containerRef} className="w-full flex justify-center relative overflow-hidden bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible select-none"
        />
      </div>

      {/* Dynamic Detail Card on Competitor Click */}
      {selectedCompetitor && (
        <div className="p-4 rounded-xl bg-slate-800/80 border border-indigo-500/30 animate-fadeIn flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedCompetitor.color }} />
              <h4 className="text-sm font-bold text-white">{selectedCompetitor.name}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 font-medium">
                {selectedCompetitor.category}
              </span>
              {selectedCompetitor.isUserStartup && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  Target Positioning
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {selectedCompetitor.analysis}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-xs">
            <div className="text-center px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-700/80">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Price Tier</span>
              <span className="font-bold text-white text-sm">{selectedCompetitor.priceScore}/100</span>
            </div>
            <div className="text-center px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-700/80">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Performance</span>
              <span className="font-bold text-emerald-400 text-sm">{selectedCompetitor.performanceScore}/100</span>
            </div>
            <button
              onClick={() => setSelectedCompetitor(null)}
              className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Legend and Strategic Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 ring-2 ring-indigo-400/40" />
            <span className="text-slate-300 font-semibold">{startupName} (Sweet Spot)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Incumbent Leaders</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Niche Specialists</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Budget Alternatives</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Click any competitor bubble to inspect strategic advantages</span>
        </div>
      </div>
    </div>
  );
};

export default CompetitorBubbleChart;
