import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckSquare, 
  Square, 
  Sliders, 
  Calendar,
  Building,
  BrainCircuit,
  Loader2,
  Copy,
  FileCode
} from 'lucide-react';
import { AnalysisResult, AnalysisMode, StrategyResponse } from '../types';
import { exportStrategyToPdf } from '../services/pdfExportService';
import { downloadStrategyMarkdown, copyStrategyMarkdownToClipboard } from '../services/markdownExportService';
import { useToast } from './Toast';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  mode?: AnalysisMode;
  businessName?: string;
  logoImageUrl?: string | null;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  result,
  mode = 'deep',
  businessName = 'StratIQ Strategy Blueprint',
  logoImageUrl,
}) => {
  const { showToast } = useToast();

  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [marginSetting, setMarginSetting] = useState<'compact' | 'normal' | 'wide'>('normal');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Section visibility toggles
  const [sections, setSections] = useState({
    executiveSummary: true,
    businessModel: true,
    marketAnalysis: true,
    competition: true,
    swot: true,
    financials: true,
    goToMarket: true,
    plan90Days: true,
    recommendations: true,
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !result) return null;

  const strat = result as any;

  // Handle Browser Native Print
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF Download via existing jsPDF service
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportStrategyToPdf({
        result,
        mode,
        logoImageUrl,
        conceptTitle: businessName,
      });
      showToast('Strategy PDF exported successfully', 'success');
      onClose();
    } catch (err: any) {
      console.error('PDF export failed:', err);
      showToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const marginClasses = {
    compact: 'p-6 sm:p-8',
    normal: 'p-8 sm:p-12',
    wide: 'p-10 sm:p-16',
  }[marginSetting];

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto print:p-0 print:static print:bg-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-preview-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-slate-100 print:bg-white print:border-none print:shadow-none print:max-w-full print:max-h-none print:overflow-visible">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900 shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 id="print-preview-title" className="text-base sm:text-lg font-black text-white tracking-tight">
                Print Preview
              </h2>
              <p className="text-xs text-slate-400">
                Configure layout and select sections for print or PDF download
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                downloadStrategyMarkdown(result, mode, { conceptTitle: businessName });
                showToast('Strategy exported as Markdown (.md)', 'success', 'download');
              }}
              type="button"
              className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Download as Markdown (.md) for Notion, Obsidian, Jira, or Linear"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Markdown</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              type="button"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors ml-1"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout: Left Settings, Right Document Preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden print:overflow-visible">
          {/* Controls Sidebar */}
          <div className="w-full md:w-72 bg-slate-900/90 border-b md:border-b-0 md:border-r border-slate-800 p-4 overflow-y-auto space-y-5 shrink-0 text-xs no-print">
            {/* Page Format Controls */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Page Size
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPageSize('a4')}
                  className={`py-1.5 text-center rounded-lg font-semibold transition-all ${
                    pageSize === 'a4' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A4
                </button>
                <button
                  type="button"
                  onClick={() => setPageSize('letter')}
                  className={`py-1.5 text-center rounded-lg font-semibold transition-all ${
                    pageSize === 'letter' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Letter
                </button>
              </div>
            </div>

            {/* Orientation */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Orientation
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`py-1.5 text-center rounded-lg font-semibold transition-all ${
                    orientation === 'portrait' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`py-1.5 text-center rounded-lg font-semibold transition-all ${
                    orientation === 'landscape' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            {/* Margins */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Page Margins
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px]">
                {(['compact', 'normal', 'wide'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarginSetting(m)}
                    className={`py-1.5 capitalize text-center rounded-lg font-semibold transition-all ${
                      marginSetting === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Include Sections */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Included Sections
                </label>
                <button
                  onClick={() => {
                    const allActive = Object.values(sections).every(Boolean);
                    setSections({
                      executiveSummary: !allActive,
                      businessModel: !allActive,
                      marketAnalysis: !allActive,
                      competition: !allActive,
                      swot: !allActive,
                      financials: !allActive,
                      goToMarket: !allActive,
                      plan90Days: !allActive,
                      recommendations: !allActive,
                    });
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Toggle All
                </button>
              </div>

              <div className="space-y-1.5">
                {[
                  { key: 'executiveSummary', label: 'Executive Summary' },
                  { key: 'businessModel', label: 'Business Model' },
                  { key: 'marketAnalysis', label: 'Market Analysis' },
                  { key: 'competition', label: 'Competition' },
                  { key: 'swot', label: 'SWOT Analysis' },
                  { key: 'financials', label: 'Financials' },
                  { key: 'goToMarket', label: 'Go-To-Market' },
                  { key: 'plan90Days', label: '90-Day Plan' },
                  { key: 'recommendations', label: 'AI Recommendations' },
                ].map(({ key, label }) => {
                  const isChecked = sections[key as keyof typeof sections];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSection(key as keyof typeof sections)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className={isChecked ? 'text-slate-200' : 'text-slate-500'}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PM Tool Markdown Export Card */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                PM & Docs Export (.md)
              </label>
              <p className="text-[11px] text-slate-400 leading-normal">
                Export clean, formatted Markdown for Notion, Linear, Obsidian, Jira, or GitHub Issues.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    downloadStrategyMarkdown(result, mode, { conceptTitle: businessName });
                    showToast('Strategy exported as Markdown (.md)', 'success', 'download');
                  }}
                  className="w-full py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/50 text-slate-200 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  title="Download strategy as Markdown (.md)"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download .md</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyStrategyMarkdownToClipboard(result, mode, { conceptTitle: businessName });
                    if (ok) showToast('Full Markdown copied! Ready to paste into Notion/Jira.', 'success', 'copy');
                  }}
                  className="w-full py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/50 text-slate-200 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  title="Copy full Markdown to clipboard"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Copy .md</span>
                </button>
              </div>
            </div>
          </div>

          {/* Document Preview Canvas (Styled like real print paper) */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center print:p-0 print:bg-white print:overflow-visible print:block">
            <div 
              id="print-preview-content"
              className={`w-full max-w-3xl bg-white text-slate-900 rounded-lg shadow-2xl transition-all print:shadow-none print:max-w-full print:rounded-none print:p-0 ${marginClasses} ${
                orientation === 'landscape' ? 'max-w-4xl' : ''
              }`}
              style={{
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {/* Document Header */}
              <div className="border-b-2 border-indigo-600 pb-4 mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-xl tracking-tight text-slate-950">
                      STRAT<span className="text-indigo-600">IQ</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 border-l border-slate-300 pl-2">
                      AI Co-Founder Strategy
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {businessName}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Strategic Market Analysis & Business Blueprint
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <div className="font-semibold text-slate-700">{currentDate}</div>
                  <div>Confidential Document</div>
                  {strat?.overallScore && (
                    <div className="mt-1 font-bold text-indigo-600 text-sm">
                      Score: {strat.overallScore}/100
                    </div>
                  )}
                </div>
              </div>

              {/* Document Content Sections with print page-break safeguards */}
              <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed">
                {/* 1. Executive Summary */}
                {sections.executiveSummary && strat?.executiveSummary && (
                  <div className="break-inside-avoid">
                    <h2 className="text-sm sm:text-base font-black text-indigo-900 border-b border-slate-200 pb-1.5 mb-2">
                      1. Executive Summary
                    </h2>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                      {strat.executiveSummary}
                    </p>
                  </div>
                )}

                {/* 2. Business Model */}
                {sections.businessModel && (strat?.businessModelOverview || strat?.uniqueValueProposition) && (
                  <div className="break-inside-avoid">
                    <h2 className="text-sm sm:text-base font-black text-indigo-900 border-b border-slate-200 pb-1.5 mb-2">
                      2. Business Model & Value Proposition
                    </h2>
                    {strat.uniqueValueProposition && (
                      <p className="font-semibold text-slate-900 mb-2">
                        {strat.uniqueValueProposition}
                      </p>
                    )}
                    {strat.businessModelOverview && (
                      <p className="text-slate-700">
                        {strat.businessModelOverview}
                      </p>
                    )}
                  </div>
                )}

                {/* 3. Market Analysis */}
                {sections.marketAnalysis && strat?.marketAnalysis && (
                  <div className="break-inside-avoid">
                    <h2 className="text-sm sm:text-base font-black text-indigo-900 border-b border-slate-200 pb-1.5 mb-2">
                      3. Target Market & Audience
                    </h2>
                    <p className="text-slate-700 mb-2">
                      <strong>Target Audience:</strong> {strat.marketAnalysis.targetAudience || 'Primary adopters in target industry.'}
                    </p>
                    {strat.marketAnalysis.uniqueSellingProposition && (
                      <p className="text-slate-700">
                        <strong>Strategic USP:</strong> {strat.marketAnalysis.uniqueSellingProposition}
                      </p>
                    )}
                  </div>
                )}

                {/* 4. Competition */}
                {sections.competition && strat?.marketAnalysis?.competitors && (
                  <div className="break-inside-avoid">
                    <h2 className="text-sm sm:text-base font-black text-indigo-900 border-b border-slate-200 pb-1.5 mb-2">
                      4. Competitive Landscape
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {strat.marketAnalysis.competitors.map((c: any, i: number) => (
                        <div key={i} className="p-2.5 rounded border border-slate-200 bg-slate-50 text-xs">
                          <strong className="text-slate-900 block">{c.name || `Competitor ${i + 1}`}</strong>
                          <span className="text-slate-600 block mt-0.5">{c.differentiation || c.threatLevel || 'Market participant'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. SWOT Analysis */}
                {sections.swot && (strat?.marketAnalysis?.swot || strat?.swot) && (
                  <div className="break-inside-avoid">
                    <h2 className="text-sm sm:text-base font-black text-indigo-900 border-b border-slate-200 pb-1.5 mb-2">
                      5. SWOT Analysis
                    </h2>
                    <p className="text-[11px] text-slate-500 mb-2">
                      A strategic snapshot of the internal strengths and weaknesses of your business, plus external opportunities and threats.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 border border-emerald-200 bg-emerald-50/50 rounded">
                        <strong className="text-emerald-900 block mb-1">Strengths (S)</strong>
                        <ul className="list-disc list-inside space-y-1 text-slate-700">
                          {(strat.marketAnalysis?.swot?.strengths || []).slice(0, 3).map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 border border-rose-200 bg-rose-50/50 rounded">
                        <strong className="text-rose-900 block mb-1">Weaknesses (W)</strong>
                        <ul className="list-disc list-inside space-y-1 text-slate-700">
                          {(strat.marketAnalysis?.swot?.weaknesses || []).slice(0, 3).map((w: string, i: number) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 border border-sky-200 bg-sky-50/50 rounded">
                        <strong className="text-sky-900 block mb-1">Opportunities (O)</strong>
                        <ul className="list-disc list-inside space-y-1 text-slate-700">
                          {(strat.marketAnalysis?.swot?.opportunities || []).slice(0, 3).map((o: string, i: number) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 border border-amber-200 bg-amber-50/50 rounded">
                        <strong className="text-amber-900 block mb-1">Threats (T)</strong>
                        <ul className="list-disc list-inside space-y-1 text-slate-700">
                          {(strat.marketAnalysis?.swot?.threats || []).slice(0, 3).map((t: string, i: number) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Financials */}
                {sections.financials && strat?.financialProjections && (
                  <div className="break-inside-avoid">
                    <h2 className="text-sm sm:text-base font-black text-indigo-900 border-b border-slate-200 pb-1.5 mb-2">
                      6. Financial Projections
                    </h2>
                    <table className="w-full border-collapse text-xs mt-2 border border-slate-200">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700">
                          <th className="border border-slate-200 p-2 text-left">Period</th>
                          <th className="border border-slate-200 p-2 text-right">Revenue</th>
                          <th className="border border-slate-200 p-2 text-right">Operating Costs</th>
                          <th className="border border-slate-200 p-2 text-left">Key Assumptions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {strat.financialProjections.map((p: any, i: number) => (
                          <tr key={i} className="border-t border-slate-200">
                            <td className="border border-slate-200 p-2 font-medium">Year {p.year || i + 1}</td>
                            <td className="border border-slate-200 p-2 text-right font-bold text-emerald-700">{p.revenue}</td>
                            <td className="border border-slate-200 p-2 text-right text-rose-700">{p.costs}</td>
                            <td className="border border-slate-200 p-2 text-slate-600">{p.assumptions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 7. Go-To-Market */}
                {sections.goToMarket && (strat?.goToMarketStrategy || strat?.marketingStrategy) && (
                  <div className="break-inside-avoid">
                    <h2 className="text-sm sm:text-base font-black text-indigo-900 border-b border-slate-200 pb-1.5 mb-2">
                      7. Go-To-Market & Growth Strategy
                    </h2>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                      {strat.goToMarketStrategy || strat.marketingStrategy}
                    </p>
                  </div>
                )}

                {/* 8. 90-Day Plan */}
                {sections.plan90Days && strat?.actionPlan && (
                  <div className="break-inside-avoid">
                    <h2 className="text-sm sm:text-base font-black text-indigo-900 border-b border-slate-200 pb-1.5 mb-2">
                      8. 90-Day Execution Roadmap
                    </h2>
                    <div className="space-y-2 mt-2">
                      {strat.actionPlan.day30?.length > 0 && (
                        <div>
                          <strong className="text-indigo-900 block text-xs">Days 1 - 30: Validation & Setup</strong>
                          <ul className="list-disc list-inside text-slate-700 text-xs mt-0.5">
                            {strat.actionPlan.day30.map((item: string, i: number) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {strat.actionPlan.day60?.length > 0 && (
                        <div>
                          <strong className="text-indigo-900 block text-xs">Days 31 - 60: MVP & Beta</strong>
                          <ul className="list-disc list-inside text-slate-700 text-xs mt-0.5">
                            {strat.actionPlan.day60.map((item: string, i: number) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {strat.actionPlan.day90?.length > 0 && (
                        <div>
                          <strong className="text-indigo-900 block text-xs">Days 61 - 90: Scaling & Acquisition</strong>
                          <ul className="list-disc list-inside text-slate-700 text-xs mt-0.5">
                            {strat.actionPlan.day90.map((item: string, i: number) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 9. AI Recommendations */}
                {sections.recommendations && (strat?.nextSteps || strat?.keyRecommendations) && (
                  <div className="break-inside-avoid">
                    <h2 className="text-sm sm:text-base font-black text-indigo-900 border-b border-slate-200 pb-1.5 mb-2">
                      9. AI Co-Founder Recommendations
                    </h2>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {(strat.nextSteps || strat.keyRecommendations || []).map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Document Running Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>Generated by StratIQ AI Business Intelligence</span>
                <span>Confidential — Prepared for Founder</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-400 hidden sm:inline">
            Print layout uses CSS page-break optimization.
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-white font-semibold transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              type="button"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
