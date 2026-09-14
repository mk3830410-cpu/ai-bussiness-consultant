import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { SWOT, StrategyResponse } from '../types';
import { ShieldCheck, TrendingUp, AlertOctagon, AlertTriangle, Info, HelpCircle } from 'lucide-react';

interface SWOTRadarChartProps {
  swot?: SWOT | null;
  strategy?: StrategyResponse | null;
}

interface RadarDimension {
  axis: string;
  quadrant: 'strengths' | 'opportunities' | 'threats' | 'weaknesses';
  score: number;
  label: string;
  color: string;
  badgeBg: string;
  items: string[];
}

export const SWOTRadarChart: React.FC<SWOTRadarChartProps> = ({ swot, strategy }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeDimension, setActiveDimension] = useState<RadarDimension | null>(null);

  const effectiveSwot = swot || strategy?.marketAnalysis?.swot || null;

  const strengths = effectiveSwot?.strengths || [];
  const weaknesses = effectiveSwot?.weaknesses || [];
  const opportunities = effectiveSwot?.opportunities || [];
  const threats = effectiveSwot?.threats || [];

  // Derive quantitative scores (0-100) for competitive positioning
  const dimensions: RadarDimension[] = useMemo(() => {
    // Idea validation base score (0-10) -> (0-100)
    const baseScore = (strategy?.ideaValidation?.score ?? 7.5) * 10;
    const oppScore = (strategy?.businessOpportunityScore?.marketViability ?? 8) * 10;
    const diffScore = (strategy?.businessOpportunityScore?.competitiveAdvantage ?? 7.5) * 10;

    // Strengths score based on depth and moat
    const sScore = Math.min(95, Math.max(40, Math.round((strengths.length * 15) + (diffScore * 0.4))));
    // Opportunities score based on market upside
    const oScore = Math.min(95, Math.max(40, Math.round((opportunities.length * 14) + (oppScore * 0.4))));
    // Threat Defense / Resilience: inverse risk cushion
    const tScore = Math.min(95, Math.max(35, Math.round(90 - (threats.length * 8) + (baseScore * 0.25))));
    // Weakness Mitigation / Execution capability
    const wScore = Math.min(95, Math.max(35, Math.round(88 - (weaknesses.length * 7) + (baseScore * 0.25))));

    return [
      {
        axis: 'Internal Strengths',
        quadrant: 'strengths',
        score: sScore,
        label: 'Strengths (S)',
        color: '#10b981', // emerald-500
        badgeBg: 'rgba(16, 185, 129, 0.15)',
        items: strengths,
      },
      {
        axis: 'Market Opportunities',
        quadrant: 'opportunities',
        score: oScore,
        label: 'Opportunities (O)',
        color: '#0284c7', // sky-600
        badgeBg: 'rgba(2, 132, 199, 0.15)',
        items: opportunities,
      },
      {
        axis: 'Threat Resilience',
        quadrant: 'threats',
        score: tScore,
        label: 'Threat Defense (T)',
        color: '#f59e0b', // amber-500
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        items: threats,
      },
      {
        axis: 'Execution Agility',
        quadrant: 'weaknesses',
        score: wScore,
        label: 'Weakness Mitigation (W)',
        color: '#ec4899', // pink-500
        badgeBg: 'rgba(236, 72, 153, 0.15)',
        items: weaknesses,
      },
    ];
  }, [strengths, weaknesses, opportunities, threats, strategy]);

  // Overall competitive positioning score
  const overallPositioningScore = useMemo(() => {
    if (dimensions.length === 0) return 75;
    const sum = dimensions.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / dimensions.length);
  }, [dimensions]);

  useEffect(() => {
    if (!svgRef.current || dimensions.length === 0) return;

    const width = 420;
    const height = 360;
    const margin = 50;
    const radius = Math.min(width, height) / 2 - margin;
    const totalAxes = dimensions.length;
    const angleSlice = (Math.PI * 2) / totalAxes;

    // Clear previous elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Radial polygon gradient
    const gradient = defs.append('radialGradient')
      .attr('id', 'swotRadarGradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '70%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0.45);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.15);

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const rScale = d3.scaleLinear()
      .range([0, radius])
      .domain([0, 100]);

    // Draw concentric background web levels (20%, 40%, 60%, 80%, 100%)
    const levels = 5;
    for (let level = 0; level < levels; level++) {
      const levelRadius = (radius / levels) * (level + 1);
      
      // Background polygon ring
      const points: [number, number][] = dimensions.map((_, i) => {
        const angle = i * angleSlice - Math.PI / 2;
        return [levelRadius * Math.cos(angle), levelRadius * Math.sin(angle)];
      });

      g.append('polygon')
        .attr('points', points.map(d => d.join(',')).join(' '))
        .attr('stroke', '#374151')
        .attr('stroke-width', level === levels - 1 ? 1.5 : 1)
        .attr('stroke-dasharray', level === levels - 1 ? 'none' : '3,3')
        .attr('fill', level % 2 === 0 ? 'rgba(31, 41, 55, 0.4)' : 'transparent');

      // Axis level percentage labels
      g.append('text')
        .attr('x', 6)
        .attr('y', -levelRadius + 4)
        .attr('fill', '#6b7280')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .text(`${((level + 1) * 20)}%`);
    }

    // Draw spokes (axes)
    const axes = g.selectAll('.axis')
      .data(dimensions)
      .enter()
      .append('g')
      .attr('class', 'axis');

    axes.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 1.2);

    // Draw Axis Label Text with quadrant indicator
    axes.append('text')
      .attr('x', (d, i) => {
        const factor = 1.18;
        return rScale(100) * factor * Math.cos(angleSlice * i - Math.PI / 2);
      })
      .attr('y', (d, i) => {
        const factor = 1.18;
        return rScale(100) * factor * Math.sin(angleSlice * i - Math.PI / 2);
      })
      .attr('text-anchor', (d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        if (Math.abs(Math.cos(angle)) < 0.2) return 'middle';
        return Math.cos(angle) > 0 ? 'start' : 'end';
      })
      .attr('dy', '0.35em')
      .attr('fill', d => d.color)
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('cursor', 'pointer')
      .text(d => `${d.label} (${d.score}%)`)
      .on('click', (_, d) => setActiveDimension(d));

    // Data polygon coordinates
    const polygonCoordinates: [number, number][] = dimensions.map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return [rScale(d.score) * Math.cos(angle), rScale(d.score) * Math.sin(angle)];
    });

    // Filled radar area
    g.append('polygon')
      .attr('points', polygonCoordinates.map(d => d.join(',')).join(' '))
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2.5)
      .attr('fill', 'url(#swotRadarGradient)')
      .attr('filter', 'url(#glow)')
      .attr('opacity', 0.9);

    // Vertex circular nodes
    const nodeGroups = g.selectAll('.node')
      .data(dimensions)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .on('mouseenter', (_, d) => setActiveDimension(d))
      .on('click', (_, d) => setActiveDimension(d));

    // Outer glow ring
    nodeGroups.append('circle')
      .attr('cx', (d, i) => rScale(d.score) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => rScale(d.score) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('r', 7)
      .attr('fill', d => d.color)
      .attr('opacity', 0.3)
      .attr('class', 'animate-ping');

    // Solid inner circle
    nodeGroups.append('circle')
      .attr('cx', (d, i) => rScale(d.score) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => rScale(d.score) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('r', 4.5)
      .attr('fill', '#ffffff')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2.5);

    // Center pivot circle
    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 3)
      .attr('fill', '#6366f1');

  }, [dimensions]);

  return (
    <div className="bg-gray-900/90 border border-gray-700/80 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top Header with positioning score */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-800 pb-3.5">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>SWOT Strategic Radar & Positioning</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              D3.js Powered
            </span>
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            Visualizes internal capability balance vs external market upside and defense.
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-800 rounded-xl border border-gray-700">
          <span className="text-xs text-gray-400 font-medium">Positioning Index:</span>
          <span className="text-sm font-extrabold text-indigo-400 font-mono">
            {overallPositioningScore}/100
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            overallPositioningScore >= 80 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
              : overallPositioningScore >= 65
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {overallPositioningScore >= 80 ? 'Strong Moat' : overallPositioningScore >= 65 ? 'Competitive' : 'Developing'}
          </span>
        </div>
      </div>

      {/* Radar Chart & Dimension Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* D3 SVG Canvas */}
        <div className="lg:col-span-7 flex justify-center items-center py-2">
          <svg 
            ref={svgRef} 
            className="w-full max-w-[380px] h-auto drop-shadow-md select-none"
          />
        </div>

        {/* Dynamic Detail Card for selected / active dimension */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Quadrant Breakdown</span>
            <span className="text-[11px] text-gray-500 normal-case">Hover/click points to inspect</span>
          </div>

          <div className="space-y-2">
            {dimensions.map((dim) => {
              const isSelected = activeDimension?.quadrant === dim.quadrant;
              return (
                <div
                  key={dim.quadrant}
                  onClick={() => setActiveDimension(dim)}
                  onMouseEnter={() => setActiveDimension(dim)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gray-800 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/40'
                      : 'bg-gray-800/40 border-gray-700/60 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: dim.color }}
                      />
                      <span className="text-xs font-bold text-white">{dim.axis}</span>
                    </div>
                    <span 
                      className="text-xs font-extrabold font-mono"
                      style={{ color: dim.color }}
                    >
                      {dim.score}%
                    </span>
                  </div>

                  {isSelected && dim.items.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-gray-700/60 text-xs text-gray-300">
                      <p className="text-[11px] font-semibold text-gray-400 mb-1">Key strategic factors:</p>
                      <ul className="space-y-1">
                        {dim.items.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px] text-gray-300">
                            <span className="text-indigo-400 font-bold">•</span>
                            <span className="line-clamp-2">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SWOTRadarChart;
