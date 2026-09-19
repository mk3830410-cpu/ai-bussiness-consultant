
import React, { useState, useRef, useMemo, FC } from 'react';
import { AnalysisResult, AnalysisMode, StrategyResponse, MarketPulseResponse, QuickResponse, VisualAnalysisResponse, CustomerPersona, PricingModel, PitchDeckSlide, LegalInsight, CustomerJourneyStage, MonetizationStrategy, Comment, UserSubscription } from '../types';
import { Target, Users, Gem, Zap, Lightbulb, Bot, Image as ImageIcon, ChevronDown, FileText, Briefcase, BarChart, Palette, Type as TypeIcon, UserCheck, Shield, Globe, Star, Link as LinkIcon, BrainCircuit, Search, Eye, TrendingUp, Megaphone, ShoppingCart, Heart, Repeat, Map, CheckCircle, Download, DollarSign, Linkedin, X, CheckSquare, ExternalLink, MessageSquare, Edit2, Save, Share2, Copy, Check, FileDown, Sparkles, Lock } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createPortal } from 'react-dom';
import { CommentSection } from './CollaborationTools';
import { FinancialCharts } from './FinancialCharts';
import { useToast } from './Toast';
import { exportStrategyToPdf } from '../services/pdfExportService';
import { exportFinancialProjectionsCsv } from '../services/financialExport';
import { downloadStrategyMarkdown, copyStrategyMarkdownToClipboard } from '../services/markdownExportService';
import { SWOTQuadrantGrid } from './SWOTQuadrantGrid';
import { SWOTAnalysisSection } from './SWOTAnalysisSection';
import { PrintPreviewModal } from './PrintPreviewModal';
import { BusinessScoreCard } from './BusinessScoreCard';
import { PitchDeckCarousel } from './PitchDeckCarousel';
import { BudgetCalculator } from './BudgetCalculator';
import { MilestoneTimelineWidget } from './MilestoneTimelineWidget';
import { CompetitorBubbleChart } from './CompetitorBubbleChart';
import { WizardData } from '../types';
import { ShieldAlert, ListOrdered, Coins, Users2, Printer, Layers, Compass, FileCode, Calculator, Calendar, ArrowLeft, Rocket } from 'lucide-react';
import { isFounderProActive, isTeamScaleActive } from '../subscriptionConfig';

// --- PDF Export Modal Component ---
interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (selectedSections: string[]) => void;
  sections: { id: string; title: string; icon: React.ReactNode }[];
}

const ExportPdfModal: FC<ExportPdfModalProps> = ({ isOpen, onClose, onExport, sections }) => {
  const [selected, setSelected] = useState<string[]>(sections.map(s => s.id));

  const handleToggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
  
  const handleSelectAll = () => setSelected(sections.map(s => s.id));
  const handleDeselectAll = () => setSelected([]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Export PDF Options</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
        </div>
        <p className="text-gray-400 mb-4">Select the sections you want to include in your PDF report.</p>
        
        <div className="flex items-center gap-4 mb-4">
            <button onClick={handleSelectAll} className="text-sm text-indigo-400 hover:underline">Select All</button>
            <button onClick={handleDeselectAll} className="text-sm text-indigo-400 hover:underline">Deselect All</button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
          {sections.map(section => (
            <label key={section.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-700/50">
              <input 
                type="checkbox" 
                checked={selected.includes(section.id)}
                onChange={() => handleToggle(section.id)}
                className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2 text-gray-300">
                {section.icon}
                <span>{section.title}</span>
              </div>
            </label>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
          <button onClick={() => onExport(selected)} disabled={selected.length === 0} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
            Export PDF
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


// --- Main Router Component ---
interface ResultsPanelProps {
  analysisResult: AnalysisResult | null;
  logoImageUrl: string | null;
  isLoading: boolean;
  isLogoLoading: boolean;
  analysisMode: AnalysisMode;
  comments: Comment[];
  onAddComment: (sectionId: string, text: string) => void;
  isCollaborative: boolean;
  wizardData?: WizardData | null;
  subscription?: UserSubscription;
  onUpgradePro?: () => void;
  onLaunchBuildBusiness?: () => void;
}

interface PrintableReportProps {
  analysisResult: AnalysisResult | null;
  logoImageUrl: string | null;
  analysisMode: AnalysisMode;
}

const ResultsPanel: React.FC<ResultsPanelProps> = (props) => {
  const { showToast } = useToast();
  const isPaidActive = isFounderProActive(props.subscription) || isTeamScaleActive(props.subscription);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [activeResultsTab, setActiveResultsTab] = useState<'blueprint' | 'pitchdeck' | 'budget' | 'roadmap'>('blueprint');
  
  // Collaboration State
  const [activeCommentSection, setActiveCommentSection] = useState<string | null>(null);

  const printableRef = useRef<HTMLDivElement>(null);
  
  const deepDiveSections = useMemo(() => [
        { id: 'ideaValidation', title: 'Idea Validation', icon: <Star size={16}/> },
        { id: 'marketAnalysis', title: 'Market Analysis', icon: <BarChart size={16}/> },
        { id: 'financialProjections', title: 'Financial Projections', icon: <TrendingUp size={16}/> },
        { id: 'brandIdentity', title: 'Brand Identity', icon: <Palette size={16}/> },
        { id: 'customerPersonas', title: 'Customer Personas & Journey', icon: <UserCheck size={16}/> },
        { id: 'growthHackingTips', title: 'Growth Hacking', icon: <Megaphone size={16}/> },
        { id: 'pricingModels', title: 'Pricing Models', icon: <ShoppingCart size={16}/> },
        { id: 'monetizationPlan', title: 'Monetization Plan', icon: <DollarSign size={16}/> },
        { id: 'budgetCalculator', title: 'Startup Budget Breakdown', icon: <Calculator size={16}/> },
        { id: 'milestoneTimeline', title: 'Milestone Roadmap', icon: <Calendar size={16}/> },
        { id: 'pitchDeck', title: 'Pitch Deck Outline', icon: <Briefcase size={16}/> },
        { id: 'legalInsights', title: 'Legal Insights', icon: <Shield size={16}/> },
  ], []);

  const handleDownloadPdfDirect = async () => {
    if (!props.analysisResult) return;
    setIsExportingPDF(true);
    try {
      const resObj = props.analysisResult as any;
      const title =
        resObj?.brandIdentity?.companyNameSuggestions?.[0] ||
        resObj?.branding?.companyNameSuggestions?.[0] ||
        'StratIQ Strategy Report';
      await exportStrategyToPdf({
        result: props.analysisResult,
        mode: props.analysisMode,
        logoImageUrl: props.logoImageUrl,
        conceptTitle: title,
      });
      showToast('Export successful! Downloaded StratIQ Strategy Report (PDF)', 'success', 'download');
    } catch (err: any) {
      console.error('PDF export failed:', err);
      showToast('Failed to export PDF: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleInitiatePdfExport = () => {
      if (props.analysisMode === 'deep') {
          setShowExportModal(true);
      } else {
          handleExportPDF([]); // For non-deep-dive, just export everything
      }
  };

  const handleExportPDF = async (selectedSections: string[]) => {
    setShowExportModal(false);
    if (!printableRef.current) return;
    setIsExportingPDF(true);
    
    // Temporarily apply a class to the printable content to show only selected sections
    const style = document.createElement('style');
    style.innerHTML = `
      @media print, screen {
        .printable-content .accordion-section:not([data-section-id="title-page"]) { display: none; }
        ${selectedSections.map(id => `.printable-content .accordion-section[data-section-id="${id}"]`).join(',\n')} {
          display: block !important;
          page-break-inside: avoid;
        }
        .printable-content .accordion-content {
           padding: 20px;
           display: block !important; /* Ensure content is visible */
        }
        .printable-content .accordion-button {
           display: none; /* Hide collapse buttons */
        }
      }
    `;
    document.head.appendChild(style);

    try {
      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
        backgroundColor: '#111827',
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / pdfWidth;
      const imgHeight = canvasHeight / ratio;
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const fileName = `StratIQ_${props.analysisMode}_Custom_Report.pdf`;
      pdf.save(fileName);
      showToast('Export successful! Custom PDF report downloaded.', 'success', 'download');

    } catch (error) {
      console.error("Failed to export PDF:", error);
      showToast('Failed to export PDF', 'error');
    } finally {
      setIsExportingPDF(false);
      document.head.removeChild(style);
    }
  };

  const handleExportCSV = () => {
    if (!props.analysisResult) return;
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(props.analysisResult, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `StratIQ_${props.analysisMode}_data.json`;
      link.click();
      showToast('Export successful! JSON data downloaded.', 'success', 'download');
    } catch (err) {
      showToast('Failed to export JSON data', 'error');
    }
  };

  const handleExportFinancialsCsv = () => {
    if (!props.analysisResult) return;
    if (!isPaidActive) {
      props.onUpgradePro?.();
      return;
    }
    const deep = props.analysisResult as any;
    const projections = deep?.financialProjections;
    if (!projections || projections.length === 0) {
      showToast('No financial projections available to export.', 'error');
      return;
    }
    setIsExportingCsv(true);
    try {
      const businessName =
        deep?.brandIdentity?.companyNameSuggestions?.[0] ||
        deep?.conceptTitle ||
        'venture';
      exportFinancialProjectionsCsv(projections, businessName);
      showToast('Financial projections exported', 'success', 'download');
    } catch (err: any) {
      console.error('CSV export failed:', err);
      showToast("Couldn't export financial projections. Please try again.", 'error');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handlePrintExportClick = () => {
    if (!isPaidActive) {
      props.onUpgradePro?.();
      return;
    }
    setShowPrintPreview(true);
  };

  const handleExportMarkdown = () => {
    if (!props.analysisResult) return;
    try {
      const companyName =
        (props.analysisResult as any)?.brandIdentity?.companyNameSuggestions?.[0] ||
        (props.analysisResult as any)?.conceptTitle ||
        'StratIQ Strategy';
      downloadStrategyMarkdown(props.analysisResult, props.analysisMode, {
        conceptTitle: companyName,
      });
      showToast('Markdown exported! Ready for Notion, Obsidian, or Jira.', 'success', 'download');
    } catch (err) {
      console.error('Failed to export markdown:', err);
      showToast('Failed to export Markdown', 'error');
    }
  };

  const handleCopyMarkdown = async () => {
    if (!props.analysisResult) return;
    try {
      const companyName =
        (props.analysisResult as any)?.brandIdentity?.companyNameSuggestions?.[0] ||
        (props.analysisResult as any)?.conceptTitle ||
        'StratIQ Strategy';
      const success = await copyStrategyMarkdownToClipboard(props.analysisResult, props.analysisMode, {
        conceptTitle: companyName,
      });
      if (success) {
        showToast('Full Markdown copied! Paste directly into Notion or Jira.', 'success', 'copy');
      } else {
        showToast('Failed to copy Markdown', 'error');
      }
    } catch (err) {
      showToast('Failed to copy Markdown', 'error');
    }
  };

  const handleCopySummary = () => {
    if (!props.analysisResult) return;
    const res = props.analysisResult as any;
    let textToCopy = '';
    if (props.analysisMode === 'deep') {
      const deep = res as StrategyResponse;
      const companyName = deep.brandIdentity?.companyNameSuggestions?.[0] || 'Startup Concept';
      textToCopy = `StratIQ Strategy Report: ${companyName}\n` +
        `Validation Score: ${deep.ideaValidation?.score}/10\n` +
        `Executive Summary: ${deep.ideaValidation?.justification}\n\n` +
        `Target Audience: ${deep.marketAnalysis?.targetAudience}\n` +
        `Unique Selling Proposition: ${deep.marketAnalysis?.uniqueSellingProposition}\n\n` +
        `Top Recommendations:\n${deep.ideaValidation?.suggestions?.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    } else if (props.analysisMode === 'market') {
      const market = res as MarketPulseResponse;
      textToCopy = `StratIQ Market Pulse\nSummary: ${market.marketSummary}\n\nEmerging Trends:\n${market.emergingTrends?.map(t => `- ${t}`).join('\n')}`;
    } else if (props.analysisMode === 'quick') {
      const quick = res as QuickResponse;
      textToCopy = `StratIQ Quick Brainstorm\nScore: ${quick.ideaValidation?.score}/10\n${quick.ideaValidation?.justification}\n\nKey Strategies:\n${quick.keyStrategies?.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    } else {
      const vis = res as VisualAnalysisResponse;
      textToCopy = `StratIQ Visual Spark\n${vis.analysis}\n\nSuggestions:\n${vis.suggestions?.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    }

    navigator.clipboard.writeText(textToCopy);
    showToast('Copied strategy summary to clipboard!', 'success', 'copy');
  };
  
  const toggleComments = (sectionId: string) => {
      setActiveCommentSection(activeCommentSection === sectionId ? null : sectionId);
  }


  if (props.isLoading) return <SkeletonLoader />;
  if (!props.analysisResult) return null;

  const renderContext = {
      isCollaborative: props.isCollaborative,
      onCommentClick: toggleComments,
      activeComments: activeCommentSection,
      allComments: props.comments,
      onOpenPitchDeck: () => setActiveResultsTab('pitchdeck')
  };

  const modeMap = {
    deep: {
        icon: BrainCircuit,
        title: "Deep Dive Strategy",
        component: (
          <DeepDiveResults 
            strategy={props.analysisResult as StrategyResponse} 
            logoImageUrl={props.logoImageUrl} 
            isLogoLoading={props.isLogoLoading} 
            context={renderContext} 
            wizardData={props.wizardData}
            isPaidActive={isPaidActive}
            onUpgradePro={props.onUpgradePro}
          />
        )
    },
    market: {
        icon: Search,
        title: "Market Pulse Report",
        component: <MarketPulseResults report={props.analysisResult as MarketPulseResponse} />
    },
    quick: {
        icon: Zap,
        title: "Quick Brainstorm",
        component: <QuickBrainstormResults result={props.analysisResult as QuickResponse} />
    },
    visual: {
        icon: Eye,
        title: "Visual Spark Analysis",
        component: <VisualAnalysisResults result={props.analysisResult as VisualAnalysisResponse} />
    },
  };
  
  const currentMode = modeMap[props.analysisMode];

  return (
    <div className="mt-12 relative">
      <ExportPdfModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportPDF}
        sections={deepDiveSections}
      />

      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        result={props.analysisResult}
        mode={props.analysisMode}
        businessName={
          (props.analysisResult as any)?.brandIdentity?.companyNameSuggestions?.[0] ||
          (props.analysisResult as any)?.conceptTitle ||
          'StratIQ Business Strategy'
        }
        logoImageUrl={props.logoImageUrl}
      />

      <CommentSection 
        isOpen={!!activeCommentSection}
        onClose={() => setActiveCommentSection(null)}
        sectionId={activeCommentSection || ''}
        comments={props.comments.filter(c => c.sectionId === activeCommentSection)}
        onAddComment={(text) => activeCommentSection && props.onAddComment(activeCommentSection, text)}
      />

      <div className="text-center relative mb-8">
        <currentMode.icon className="h-10 w-10 mx-auto text-indigo-400" />
        <h2 className="text-3xl font-extrabold text-white mt-2">{currentMode.title}</h2>
        <p className="text-gray-400 mt-1">Your AI-powered analysis is ready.</p>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 mt-4 sm:mt-0 sm:absolute sm:top-0 sm:right-0">
           {props.onLaunchBuildBusiness && (
             <button
               id="launch-build-business-btn"
               onClick={props.onLaunchBuildBusiness}
               className="inline-flex items-center justify-center px-4 py-2 text-xs md:text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all gap-1.5 transform hover:scale-105"
               title="Transfer this strategy into the 10-Stage 'Build My Business' Execution Engine"
             >
               <Rocket size={15} className="text-amber-300" />
               <span>Build My Business</span>
             </button>
           )}

           <button
             id="copy-summary-btn"
             onClick={handleCopySummary}
             className="inline-flex items-center justify-center px-3.5 py-2 text-xs md:text-sm font-semibold text-gray-200 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-750 hover:text-white hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
             title="Copy executive summary to clipboard"
           >
             <Copy size={15} className="mr-1.5 text-indigo-400" />
             Copy Summary
           </button>

           <button
             id="copy-markdown-btn"
             onClick={handleCopyMarkdown}
             className="hidden md:inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-750 hover:text-white hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
             title="Copy full Markdown to clipboard to paste directly into Notion, Jira, or GitHub"
           >
             <Copy size={14} className="mr-1.5 text-indigo-400" />
             Copy .MD
           </button>

           <button
             id="export-markdown-btn"
             onClick={handleExportMarkdown}
             className="inline-flex items-center justify-center px-3.5 py-2 text-xs md:text-sm font-semibold text-indigo-200 bg-indigo-950/60 border border-indigo-500/40 rounded-xl hover:bg-indigo-900/70 hover:text-white hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-sm"
             title="Download strategy as Markdown (.md) for Notion, Obsidian, Jira, Linear, or GitHub"
           >
             <FileCode size={15} className="mr-1.5 text-indigo-400" />
             <span>Export Markdown</span>
           </button>

           {(props.analysisResult as any)?.financialProjections?.length > 0 && (
             <button
               id="export-financials-csv-btn"
               onClick={handleExportFinancialsCsv}
               disabled={isExportingCsv}
               className="inline-flex items-center justify-center px-3.5 py-2 text-xs md:text-sm font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 rounded-xl hover:bg-emerald-900/60 hover:text-white hover:border-emerald-500/70 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all shadow-sm gap-1.5"
               title={isPaidActive ? "Export financial projections directly to CSV" : "Export to CSV is available with Founder Pro"}
             >
               <Download size={15} className="text-emerald-400" />
               <span>{isExportingCsv ? 'Exporting...' : 'Export Financials CSV'}</span>
               {!isPaidActive && (
                 <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-500/40">PRO</span>
               )}
             </button>
           )}

           <button
             id="export-json-btn"
             onClick={handleExportCSV}
             disabled={isExportingPDF}
             className="hidden sm:inline-flex items-center justify-center px-3.5 py-2 text-xs md:text-sm font-semibold text-gray-200 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-750 hover:text-white hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
             title="Download analysis data as JSON"
           >
             <Download size={15} className="mr-1.5 text-gray-400" />
             Export JSON
           </button>

           <button
             id="print-export-pdf-btn"
             onClick={handlePrintExportClick}
             className="inline-flex items-center justify-center px-4 py-2 text-xs md:text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-550 active:bg-indigo-700 shadow-lg shadow-indigo-900/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/40 transition-all gap-1.5"
             title={isPaidActive ? "Open Print Preview to customize sections, print, or download PDF" : "Export to PDF is available with Founder Pro"}
           >
             <FileDown size={16} />
             <span>Print / Export PDF</span>
             {!isPaidActive && (
               <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">PRO</span>
             )}
           </button>
        </div>
      </div>

      {/* Mode View Switcher for Deep Dive (Blueprint vs Pitch Deck vs Budget vs Roadmap) */}
      {props.analysisMode === 'deep' && (
        <div className="flex items-center justify-center mb-8 overflow-x-auto px-2">
          <div className="inline-flex p-1.5 bg-gray-900/90 border border-gray-700/80 rounded-2xl shadow-xl flex-wrap sm:flex-nowrap gap-1">
            <button
              id="tab-blueprint-btn"
              type="button"
              onClick={() => setActiveResultsTab('blueprint')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeResultsTab === 'blueprint'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <FileText size={16} />
              <span>Full Strategy Blueprint</span>
            </button>

            <button
              id="tab-pitchdeck-btn"
              type="button"
              onClick={() => setActiveResultsTab('pitchdeck')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeResultsTab === 'pitchdeck'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Briefcase size={16} />
              <span>Pitch Deck (Carousel)</span>
            </button>

            <button
              id="tab-budget-btn"
              type="button"
              onClick={() => setActiveResultsTab('budget')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeResultsTab === 'budget'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Calculator size={16} />
              <span>Startup Budget Calculator</span>
            </button>

            <button
              id="tab-roadmap-btn"
              type="button"
              onClick={() => setActiveResultsTab('roadmap')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeResultsTab === 'roadmap'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Calendar size={16} />
              <span>Milestone Roadmap</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {props.analysisMode === 'deep' && activeResultsTab === 'pitchdeck' ? (
          <PitchDeckCarousel 
            strategy={props.analysisResult as StrategyResponse} 
            logoImageUrl={props.logoImageUrl} 
            onBackToDocument={() => setActiveResultsTab('blueprint')} 
          />
        ) : props.analysisMode === 'deep' && activeResultsTab === 'budget' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveResultsTab('blueprint')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 rounded-lg border border-gray-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Strategy Blueprint</span>
              </button>
            </div>
            <BudgetCalculator
              initialBudget={props.wizardData?.budget ? parseInt(props.wizardData.budget.replace(/[^0-9]/g, ''), 10) : undefined}
              initialIndustry={props.wizardData?.industry}
              businessScope="lean-mvp"
              companyName={(props.analysisResult as any)?.brandIdentity?.companyNameSuggestions?.[0] || props.wizardData?.businessName}
            />
          </div>
        ) : props.analysisMode === 'deep' && activeResultsTab === 'roadmap' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveResultsTab('blueprint')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 rounded-lg border border-gray-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Strategy Blueprint</span>
              </button>
            </div>
            <MilestoneTimelineWidget
              strategy={props.analysisResult as StrategyResponse}
              businessStage={props.wizardData?.stage || 'Early Stage'}
              timelineGoal={props.wizardData?.timeline || '3 - 6 Months'}
            />
          </div>
        ) : (
          currentMode.component
        )}
      </div>

       {/* Hidden, styled content for PDF export */}
       <div ref={printableRef} className="printable-content" style={{ position: 'absolute', left: '-9999px', width: '850px', backgroundColor: '#111827', padding: '20px' }}>
          <PrintableReport 
            analysisResult={props.analysisResult} 
            logoImageUrl={props.logoImageUrl} 
            analysisMode={props.analysisMode} 
          />
       </div>

    </div>
  );
};


// --- Printable Report Component for PDF Generation ---
const PrintableReport: FC<PrintableReportProps> = ({ analysisResult, logoImageUrl, analysisMode }) => {
    if (!analysisResult) return null;
    const isDeepDive = analysisMode === 'deep' && 'ideaValidation' in analysisResult;
    const reportTitle = (analysisResult as any)?.brandIdentity?.companyNameSuggestions?.[0] || (analysisResult as any)?.branding?.companyNameSuggestions?.[0] || "Business Strategy Report";
    return (
        <div className="space-y-8 p-4 text-gray-100 font-sans">
            {/* Title Page */}
            <div data-section-id="title-page" className="accordion-section text-center flex flex-col items-center justify-center h-[900px]">
                {logoImageUrl && <img src={logoImageUrl} alt="Logo" className="w-48 h-48 object-contain mb-8 rounded-lg" />}
                <h1 className="text-5xl font-extrabold text-white">{reportTitle}</h1>
                <p className="text-2xl text-indigo-400 mt-4">Generated by StratIQ</p>
                <p className="text-gray-500 mt-2">Date: {new Date().toLocaleDateString()}</p>
            </div>
            
            {isDeepDive && <DeepDiveResults strategy={analysisResult as StrategyResponse} logoImageUrl={logoImageUrl} isLogoLoading={false} isPrintable={true} />}
            {analysisMode === 'market' && <MarketPulseResults report={analysisResult as MarketPulseResponse} isPrintable={true} />}
            {analysisMode === 'quick' && <QuickBrainstormResults result={analysisResult as QuickResponse} isPrintable={true} />}
            {analysisMode === 'visual' && <VisualAnalysisResults result={analysisResult as VisualAnalysisResponse} isPrintable={true} />}
        </div>
    );
};


// --- Child Components for each mode ---
interface AccordionProps {
  icon: React.ReactNode; 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  isPrintable?: boolean;
  sectionId?: string;
  onCopySection?: () => void;
  context?: {
      isCollaborative: boolean;
      onCommentClick: (id: string) => void;
      activeComments: string | null;
      allComments: Comment[];
  };
}

const AccordionSection: React.FC<AccordionProps> = ({ icon, title, children, defaultOpen = false, isPrintable = false, sectionId, onCopySection, context }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);

  const commentCount = context?.allComments.filter(c => c.sectionId === sectionId).length || 0;

  if (isPrintable) {
      return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg overflow-hidden my-4 accordion-section" data-section-id={sectionId}>
            <div className="w-full p-4 bg-gray-800 flex items-center gap-3 border-b border-gray-700">
              <span className="text-indigo-400">{icon}</span>
              <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            <div className="p-5 text-gray-300 text-sm leading-relaxed accordion-content">{children}</div>
        </div>
      )
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
      <div className="w-full p-4 bg-gray-800 flex items-center justify-between gap-3 border-b border-gray-700 accordion-button">
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 flex-1 text-left">
          <span className="text-indigo-400">{icon}</span>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <ChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={16} />
        </button>
        
        {/* Actions: Copy & Collaboration Tools */}
        <div className="flex items-center gap-1.5">
            {onCopySection && !isPrintable && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onCopySection();
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    title="Copy section to clipboard"
                    aria-label={`Copy ${title}`}
                >
                    <Copy size={16} />
                </button>
            )}

            {sectionId && !isPrintable && (
                <>
                    {context?.isCollaborative && (
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className={`p-1.5 rounded-lg transition-colors ${isEditing ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                            title="Edit Section"
                        >
                            {isEditing ? <Save size={16} /> : <Edit2 size={16} />}
                        </button>
                    )}
                    <button 
                        onClick={() => context?.onCommentClick(sectionId)}
                        className={`p-1.5 rounded-lg transition-colors relative ${context?.activeComments === sectionId ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                        title="Comments"
                    >
                        <MessageSquare size={16} />
                        {commentCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                                {commentCount}
                            </span>
                        )}
                    </button>
                </>
            )}
        </div>
      </div>
      
      {isOpen && (
        <div className="p-5 text-gray-300 text-sm leading-relaxed accordion-content relative">
            {isEditing ? (
                 <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/5 rounded-lg pointer-events-none border border-yellow-500/20"></div>
                    <div className="p-2">
                         <p className="text-xs text-yellow-500 mb-2 font-mono uppercase tracking-wider">Editing Mode Active</p>
                        {/* In a real app, this would use a contentEditable div or controlled inputs mapped to the deep structure. 
                            For this demo, we just render the children in a 'visual' edit container */}
                        <div className="opacity-90">{children}</div>
                    </div>
                </div>
            ) : (
                children
            )}
        </div>
      )}
    </div>
  );
};

const stageIconMap: { [key: string]: React.ElementType } = {
    awareness: Megaphone,
    consideration: Lightbulb,
    conversion: ShoppingCart,
    purchase: ShoppingCart,
    loyalty: Heart,
    retention: Heart,
    advocacy: Repeat,
    default: Star
};

interface DeepDiveProps {
  strategy: StrategyResponse;
  logoImageUrl: string | null;
  isLogoLoading: boolean;
  isPrintable?: boolean;
  context?: any;
  wizardData?: WizardData | null;
  isPaidActive?: boolean;
  onUpgradePro?: () => void;
}

const DeepDiveResults: React.FC<DeepDiveProps> = ({ strategy, logoImageUrl, isLogoLoading, isPrintable = false, context, wizardData, isPaidActive = true, onUpgradePro }) => {
    const { showToast } = useToast();

    const handleLinkedInShare = (slide: PitchDeckSlide) => {
        const title = slide.title;
        const summary = slide.content.join('\n\n') + `\n\n- Generated by StratIQ`;
        const url = window.location.href; // Use the current app's URL

        const linkedInUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}&source=StratIQ`;
        
        window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
    };

    return (
    <div className="space-y-6">
        {/* Business Opportunity Score Gauge & Dimensional Breakdown */}
        <div className="mb-6">
          <BusinessScoreCard 
            scoreData={strategy.businessScore} 
            fallbackScore={strategy.ideaValidation?.score}
            fallbackJustification={strategy.ideaValidation?.justification}
          />
        </div>

        {strategy.executiveSummary && (
          <AccordionSection 
            sectionId="executiveSummary" 
            icon={<FileText size={20}/>} 
            title="Executive Summary & Venture Overview" 
            defaultOpen={true} 
            isPrintable={isPrintable} 
            context={context}
          >
            <div className="p-4 bg-gray-900/80 rounded-xl border border-gray-800 text-sm leading-relaxed text-gray-200">
              {strategy.executiveSummary}
            </div>
          </AccordionSection>
        )}

        <AccordionSection 
            sectionId="ideaValidation" 
            icon={<Star size={20}/>} 
            title="Idea Validation & Suggestions" 
            defaultOpen={true} 
            isPrintable={isPrintable} 
            context={context}
            onCopySection={() => {
                const text = `Idea Validation: ${strategy.ideaValidation.score}/10\n${strategy.ideaValidation.justification}\n\nImprovement Suggestions:\n${strategy.ideaValidation.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
                navigator.clipboard.writeText(text);
                showToast('Idea validation copied to clipboard!', 'success', 'copy');
            }}
        >
            <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg mb-4">
                <div className="text-4xl font-bold text-indigo-400">{strategy.ideaValidation.score}/10</div>
                <div>
                    <p className="font-semibold text-white">Justification</p>
                    <p>{strategy.ideaValidation.justification}</p>
                </div>
            </div>
            <h4 className="font-bold text-indigo-400 mb-2">Improvement Suggestions:</h4>
            <ul className="list-disc list-outside pl-5 space-y-2">{strategy.ideaValidation.suggestions.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
        </AccordionSection>
        <AccordionSection 
            sectionId="marketAnalysis" 
            icon={<BarChart size={20}/>} 
            title="Market & Competitor Analysis" 
            isPrintable={isPrintable} 
            context={context}
            onCopySection={() => {
                const swotText = strategy.marketAnalysis.swot ? 
                    `\n\nSWOT Analysis:\n` +
                    `Strengths:\n${strategy.marketAnalysis.swot.strengths?.map(s => `• ${s}`).join('\n')}\n` +
                    `Weaknesses:\n${strategy.marketAnalysis.swot.weaknesses?.map(w => `• ${w}`).join('\n')}\n` +
                    `Opportunities:\n${strategy.marketAnalysis.swot.opportunities?.map(o => `• ${o}`).join('\n')}\n` +
                    `Threats:\n${strategy.marketAnalysis.swot.threats?.map(t => `• ${t}`).join('\n')}` : '';
                const text = `Target Audience: ${strategy.marketAnalysis.targetAudience}\n\nUnique Selling Proposition: ${strategy.marketAnalysis.uniqueSellingProposition}${swotText}\n\nCompetitors:\n${strategy.marketAnalysis.competitors.map(c => `• ${c.name}: ${c.analysis}`).join('\n')}`;
                navigator.clipboard.writeText(text);
                showToast('Market analysis copied to clipboard!', 'success', 'copy');
            }}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-gray-900/80 rounded-xl border border-gray-800">
                        <h4 className="font-bold text-indigo-400 mb-1 text-xs uppercase tracking-wider">Target Audience</h4>
                        <p className="text-gray-200 text-sm leading-relaxed">{strategy.marketAnalysis.targetAudience}</p>
                    </div>
                    <div className="p-3.5 bg-gray-900/80 rounded-xl border border-gray-800">
                        <h4 className="font-bold text-indigo-400 mb-1 text-xs uppercase tracking-wider">Unique Selling Proposition (USP)</h4>
                        <p className="text-gray-200 text-sm leading-relaxed">{strategy.marketAnalysis.uniqueSellingProposition}</p>
                    </div>
                </div>

                {/* Interactive D3.js Competitor Bubble Chart */}
                <div className="pt-2">
                    <CompetitorBubbleChart 
                        competitors={strategy.marketAnalysis.competitors}
                        startupName={strategy.brandIdentity?.companyNameSuggestions?.[0] || 'Your Venture'}
                        startupUsp={strategy.marketAnalysis.uniqueSellingProposition || strategy.uniqueValueProposition}
                        industry="SaaS"
                    />
                </div>

                <div>
                    <h4 className="font-bold text-indigo-400 mb-2.5">Competitor Detailed Profiles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {strategy.marketAnalysis.competitors.map((c, i) => (
                            <div key={i} className="p-3.5 bg-gray-900/80 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                                <h5 className="font-semibold text-white mb-1">{c.name}</h5>
                                <p className="text-xs text-gray-300 leading-relaxed">{c.analysis}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AccordionSection>

        <AccordionSection 
            sectionId="swotAnalysis" 
            icon={<Layers size={20}/>} 
            title="SWOT Analysis" 
            defaultOpen={true}
            isPrintable={isPrintable} 
            context={context}
            onCopySection={() => {
                const s = strategy.marketAnalysis?.swot;
                if (!s) return;
                const text = `SWOT Analysis:\nStrengths:\n${s.strengths?.map(i => `• ${i}`).join('\n')}\n\nWeaknesses:\n${s.weaknesses?.map(i => `• ${i}`).join('\n')}\n\nOpportunities:\n${s.opportunities?.map(i => `• ${i}`).join('\n')}\n\nThreats:\n${s.threats?.map(i => `• ${i}`).join('\n')}`;
                navigator.clipboard.writeText(text);
                showToast('SWOT analysis copied to clipboard!', 'success', 'copy');
            }}
        >
            <SWOTAnalysisSection 
                swot={strategy.marketAnalysis?.swot} 
                strategy={strategy} 
                isPrintable={isPrintable} 
            />
        </AccordionSection>
         <AccordionSection 
            sectionId="financialProjections" 
            icon={<TrendingUp size={20}/>} 
            title="Financial Projections (1-3 Years)" 
            defaultOpen={true}
            isPrintable={isPrintable} 
            context={context}
            onCopySection={() => {
                if (!isPaidActive) {
                  onUpgradePro?.();
                  return;
                }
                const text = strategy.financialProjections.map(p => `Year ${p.year}:\n• Projected Revenue: ${p.revenue}\n• Projected Costs: ${p.costs}\n• Assumptions: ${p.assumptions}`).join('\n\n');
                navigator.clipboard.writeText(text);
                showToast('Financial projections copied to clipboard!', 'success', 'copy');
            }}
        >
            {!isPaidActive && !isPrintable ? (
                <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900/90 to-purple-950/40 border border-indigo-500/40 text-center overflow-hidden my-2">
                    <div className="max-w-lg mx-auto relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                            <Lock size={24} />
                        </div>
                        <h4 className="text-lg font-extrabold text-white mb-2">
                            Financial Projections (3 Years) is available with Founder Pro
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                            Access interactive charts, 3-year revenue forecasts, operating cost breakdown, profit margin models, and CSV export.
                        </p>
                        <button
                            type="button"
                            onClick={onUpgradePro}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:scale-105"
                        >
                            <Zap size={15} className="text-amber-300" />
                            <span>Upgrade to Founder Pro — $29/mo</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {!isPrintable && (
                        <FinancialCharts projections={strategy.financialProjections} />
                    )}

                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-gray-300">Annual Breakdown & Assumptions</h4>
                        {!isPrintable && (
                            <button
                                type="button"
                                onClick={() => {
                                    const name = strategy.brandIdentity?.companyNameSuggestions?.[0] || 'venture';
                                    exportFinancialProjectionsCsv(strategy.financialProjections, name);
                                    showToast('Financial projections exported', 'success', 'download');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
                                title="Export financial table as CSV"
                            >
                                <Download size={13} className="text-emerald-400" />
                                <span>Export Financials CSV</span>
                            </button>
                        )}
                    </div>
                    <div className="space-y-4">
                            {strategy.financialProjections.map((proj, i) => (
                                <div key={i} className="p-4 bg-gray-900/70 rounded-lg border border-gray-700">
                                    <h4 className="text-lg font-bold text-white mb-2">Year {proj.year}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                        <div className="flex justify-between border-b border-gray-700 pb-1">
                                            <span className="text-gray-400">Projected Revenue:</span>
                                            <span className="font-semibold text-green-400">{proj.revenue}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-700 pb-1">
                                            <span className="text-gray-400">Projected Costs:</span>
                                            <span className="font-semibold text-red-400">{proj.costs}</span>
                                        </div>
                                        <div className="md:col-span-2 mt-2">
                                            <p className="text-gray-400 text-xs">Assumptions:</p>
                                            <p className="text-gray-300">{proj.assumptions}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </AccordionSection>

        {!isPrintable && (
          <AccordionSection 
            sectionId="budgetCalculator" 
            icon={<Calculator size={20}/>} 
            title="Interactive Startup Budget & Cost Breakdown" 
            defaultOpen={false} 
            isPrintable={isPrintable} 
            context={context}
          >
            <div className="pt-2">
              <BudgetCalculator 
                initialBudget={wizardData?.budget ? parseInt(wizardData.budget.replace(/[^0-9]/g, ''), 10) : undefined}
                initialIndustry={wizardData?.industry}
                businessScope="lean-mvp"
                companyName={strategy.brandIdentity?.companyNameSuggestions?.[0] || wizardData?.businessName}
              />
            </div>
          </AccordionSection>
        )}
        
         <AccordionSection sectionId="brandIdentity" icon={<Palette size={20}/>} title="Brand Identity" isPrintable={isPrintable} context={context}>
            <div className="space-y-6">
                 <div>
                    <h4 className="font-bold text-indigo-400 mb-2">Company Name Suggestions</h4>
                    <div className="flex flex-wrap gap-2">{strategy.brandIdentity.companyNameSuggestions.map((name, i) => <span key={i} className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-xs">{name}</span>)}</div>
                </div>
                 <div>
                    <h4 className="font-bold text-indigo-400 mb-2">Slogan Suggestions</h4>
                    <ul className="list-disc list-outside pl-5 space-y-1 italic text-gray-400">{strategy.brandIdentity.sloganSuggestions.map((slogan, i) => <li key={i}>"{slogan}"</li>)}</ul>
                </div>
                {strategy.brandIdentity.brandVoice && (
                <div>
                    <h4 className="font-bold text-indigo-400 mb-2">Brand Voice</h4>
                    <div className="p-3 bg-gray-900/70 rounded-md space-y-2 border border-gray-700">
                        <p><strong>Tone:</strong> {strategy.brandIdentity.brandVoice.tone}</p>
                        <p><strong>Style:</strong> {strategy.brandIdentity.brandVoice.style}</p>
                        <div>
                            <h5 className="font-semibold text-white">Key Messaging:</h5>
                            <ul className="list-disc list-outside pl-5 text-gray-400">
                                {strategy.brandIdentity.brandVoice.keyMessaging.map((msg, i) => <li key={i}>{msg}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-4">
                         <div>
                            <h4 className="font-bold text-indigo-400 mb-2">Color Palette</h4>
                            <div className="flex flex-wrap gap-2">{strategy.brandIdentity.colorPalette.map(c => <div key={c.hex} className="text-center text-xs"><div style={{backgroundColor: c.hex}} className="w-12 h-12 rounded-full border-2 border-gray-600 mb-1"></div><p>{c.name}</p><p className="text-gray-500">{c.hex}</p></div>)}</div>
                         </div>
                         <div>
                            <h4 className="font-bold text-indigo-400 mb-2">Typography</h4>
                            <p><strong>Primary:</strong> {strategy.brandIdentity.typography.primaryFont}</p>
                            <p><strong>Secondary:</strong> {strategy.brandIdentity.typography.secondaryFont}</p>
                         </div>
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <h4 className="font-bold text-indigo-400">Logo Concept</h4>
                        <div className="w-36 h-36 bg-gray-900 rounded-lg flex items-center justify-center border-2 border-gray-700">
                             {isLogoLoading ? <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                             : logoImageUrl ? <img src={logoImageUrl} alt="Generated Logo" className="w-full h-full object-cover rounded-lg"/>
                             : <span className="text-gray-500 text-xs text-center p-2">Logo will appear here</span>}
                        </div>
                         <p className="text-xs text-gray-500 text-center px-2">{strategy.brandIdentity.logoConcept}</p>
                    </div>
                </div>
            </div>
        </AccordionSection>
        
        <AccordionSection sectionId="customerPersonas" icon={<UserCheck size={20}/>} title="Customer Personas & Journey Map" isPrintable={isPrintable} context={context}>
            <div className="space-y-8">
                <div>
                    <h4 className="font-bold text-indigo-400 mb-2">Target Personas</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {strategy.customerPersonas.map((persona: CustomerPersona, i: number) => (
                            <div key={i} className="p-4 bg-gray-900/70 rounded-lg border border-gray-700">
                                <h5 className="font-bold text-white text-lg">{persona.name}</h5>
                                <p className="text-xs text-gray-400 mb-3">{persona.demographics}</p>
                                <div className="space-y-2 text-xs">
                                    <div><h6 className="font-semibold text-gray-300">Goals:</h6><ul className="list-disc list-outside pl-4">{persona.goals.map((g, gi)=><li key={gi}>{g}</li>)}</ul></div>
                                    <div><h6 className="font-semibold text-gray-300">Pain Points:</h6><ul className="list-disc list-outside pl-4">{persona.painPoints.map((p, pi)=><li key={pi}>{p}</li>)}</ul></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-indigo-400 mb-3">Customer Journey Map</h4>
                    <div className="relative border-l-2 border-indigo-500/30 pl-6 space-y-8">
                        {strategy.customerJourneyMap.map((stage: CustomerJourneyStage, i: number) => {
                            const stageNameKey = stage.stageName.toLowerCase().split(' ')[0];
                            const StageIcon = stageIconMap[stageNameKey] || stageIconMap.default;
                            return (
                                <div key={i} className="relative">
                                    <div className="absolute -left-6 top-1 transform -translate-x-1/2 w-4 h-4 bg-indigo-500 rounded-full border-2 border-gray-800"></div>
                                    <h5 className="font-bold text-white text-lg flex items-center gap-2 mb-1"><StageIcon size={16} className="text-indigo-400" /> {stage.stageName}</h5>
                                    <p className="text-gray-400 text-xs mb-2">{stage.description}</p>
                                    <div className="text-xs space-y-2">
                                        <div><h6 className="font-semibold text-gray-300">Touchpoints:</h6><p className="text-gray-400">{stage.touchpoints.join(', ')}</p></div>
                                        <div><h6 className="font-semibold text-gray-300">Strategies:</h6><ul className="list-disc list-outside pl-4">{stage.strategies.map((s, si)=><li key={si}>{s}</li>)}</ul></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AccordionSection>
        
        <AccordionSection sectionId="growthHackingTips" icon={<Megaphone size={20}/>} title="Growth Hacking Tips" isPrintable={isPrintable} context={context}>
            <ul className="list-decimal list-outside pl-5 space-y-3">
                {strategy.growthHackingTips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
        </AccordionSection>
        
        <AccordionSection 
            sectionId="pricingModels" 
            icon={<ShoppingCart size={20}/>} 
            title="Pricing Models" 
            isPrintable={isPrintable} 
            context={context}
            onCopySection={() => {
                const text = strategy.pricingModels.map(m => `${m.name} (for ${m.targetCustomer}): ${m.description}\nFeatures: ${m.keyFeatures.join(', ')}\nPros: ${m.pros.join(', ')}\nCons: ${m.cons.join(', ')}`).join('\n\n');
                navigator.clipboard.writeText(text);
                showToast('Pricing models copied to clipboard!', 'success', 'copy');
            }}
        >
            <div className="space-y-4">
                {strategy.pricingModels.map((model: PricingModel, i: number) => (
                    <div key={i} className="p-4 bg-gray-900/70 rounded-lg border border-gray-700">
                        <h4 className="text-lg font-bold text-white">{model.name}</h4>
                        <p className="text-xs text-gray-400 mb-2">Ideal for: {model.targetCustomer}</p>
                        <p className="mb-3">{model.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><h5 className="font-semibold text-indigo-400 mb-1">Key Features</h5><ul className="list-disc list-outside pl-4 space-y-1">{model.keyFeatures.map((f, fi)=><li key={fi}>{f}</li>)}</ul></div>
                            <div><h5 className="font-semibold text-green-400 mb-1">Pros</h5><ul className="list-disc list-outside pl-4 space-y-1">{model.pros.map((p, pi)=><li key={pi}>{p}</li>)}</ul></div>
                            <div><h5 className="font-semibold text-red-400 mb-1">Cons</h5><ul className="list-disc list-outside pl-4 space-y-1">{model.cons.map((c, ci)=><li key={ci}>{c}</li>)}</ul></div>
                        </div>
                    </div>
                ))}
            </div>
        </AccordionSection>
        
        <AccordionSection 
            sectionId="monetizationPlan" 
            icon={<DollarSign size={20}/>} 
            title="Monetization Plan" 
            isPrintable={isPrintable} 
            context={context}
            onCopySection={() => {
                const text = strategy.monetizationPlan.map(p => `${p.name}: ${p.description}\nStreams: ${p.revenueStreams.join(', ')}\nJustification: ${p.justification}`).join('\n\n');
                navigator.clipboard.writeText(text);
                showToast('Monetization plan copied to clipboard!', 'success', 'copy');
            }}
        >
            <div className="space-y-4">
                {strategy.monetizationPlan.map((plan: MonetizationStrategy, i: number) => (
                    <div key={i} className="p-4 bg-gray-900/70 rounded-lg border border-gray-700">
                        <h4 className="text-lg font-bold text-white mb-2">{plan.name}</h4>
                        <p className="mb-3">{plan.description}</p>
                        <div className="mb-3">
                            <h5 className="font-semibold text-indigo-400 mb-1">Potential Revenue Streams:</h5>
                            <ul className="list-disc list-outside pl-5 space-y-1 text-gray-400">
                                {plan.revenueStreams.map((stream, j) => <li key={j}>{stream}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-semibold text-indigo-400 mb-1">Justification:</h5>
                            <p className="text-gray-400">{plan.justification}</p>
                        </div>
                    </div>
                ))}
            </div>
        </AccordionSection>
        
        <AccordionSection 
            sectionId="pitchDeck" 
            icon={<Briefcase size={20}/>} 
            title="Pitch Deck Outline" 
            isPrintable={isPrintable} 
            context={context}
            onCopySection={() => {
                const text = strategy.pitchDeck.map((s, idx) => `Slide ${idx + 1}: ${s.title}\n${s.content.map(c => `• ${c}`).join('\n')}\nNotes: ${s.speakerNotes}`).join('\n\n');
                navigator.clipboard.writeText(text);
                showToast('Full pitch deck copied to clipboard!', 'success', 'copy');
            }}
        >
            <div className="space-y-4">
                {!isPrintable && context?.onOpenPitchDeck && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/40 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Sparkles size={15} className="text-indigo-400" />
                        Interactive Visual Pitch Deck Available
                      </h4>
                      <p className="text-xs text-indigo-200/80 mt-0.5">
                        Present this venture with dynamic slide carousels, full-screen mode, pitch timer, and speaker notes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={context.onOpenPitchDeck}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all shrink-0"
                    >
                      <Briefcase size={14} />
                      <span>Launch Slide Carousel</span>
                    </button>
                  </div>
                )}
                {strategy.pitchDeck.map((slide: PitchDeckSlide, i: number) => (
                    <div key={i} className="bg-gray-900/70 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-bold text-white">Slide {i + 1}: {slide.title}</h4>
                            {!isPrintable && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const slideText = `Slide ${i + 1}: ${slide.title}\n\n${slide.content.map(c => `• ${c}`).join('\n')}\n\nSpeaker Notes: ${slide.speakerNotes}`;
                                            navigator.clipboard.writeText(slideText);
                                            showToast(`Slide ${i + 1} copied to clipboard!`, 'success', 'copy');
                                        }}
                                        title="Copy Slide Content"
                                        className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button onClick={() => handleLinkedInShare(slide)} title="Share Slide on LinkedIn" className="p-1 rounded text-indigo-400 hover:text-white hover:bg-gray-800 transition-colors">
                                        <Linkedin size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <ul className="list-disc list-outside pl-5 mb-3 text-gray-300">
                            {slide.content.map((point, j) => <li key={j}>{point}</li>)}
                        </ul>
                        <div className="bg-gray-800/50 p-3 rounded text-xs text-gray-400 italic">
                            <span className="font-semibold text-indigo-400 not-italic">Speaker Notes: </span>
                            {slide.speakerNotes}
                        </div>
                    </div>
                ))}
            </div>
        </AccordionSection>
        
        <AccordionSection sectionId="legalInsights" icon={<Shield size={20}/>} title="Legal Insights" isPrintable={isPrintable} context={context}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strategy.legalInsights.map((insight: LegalInsight, i: number) => (
                    <div key={i} className="bg-gray-900/70 p-4 rounded-lg border border-gray-700">
                        <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                            <CheckSquare size={16} className="text-indigo-400"/>
                            {insight.title}
                        </h4>
                        <p className="text-sm text-gray-400">{insight.content}</p>
                    </div>
                ))}
            </div>
        </AccordionSection>

        {/* 30/60/90 Day Action Plan */}
        {strategy.actionPlan && (
          <AccordionSection
            sectionId="actionPlan"
            icon={<ListOrdered size={20} />}
            title="Execution Roadmap & Action Plan (30 / 60 / 90 Days)"
            defaultOpen={true}
            isPrintable={isPrintable}
            context={context}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Days 1 - 30: Validation & Prototype', tasks: strategy.actionPlan.days30, color: 'border-indigo-500/40 text-indigo-400' },
                  { title: 'Days 31 - 60: MVP Launch & First Users', tasks: strategy.actionPlan.days60, color: 'border-purple-500/40 text-purple-400' },
                  { title: 'Days 61 - 90: Monetization & Scale', tasks: strategy.actionPlan.days90, color: 'border-emerald-500/40 text-emerald-400' },
                ].map((col, idx) => (
                  <div key={idx} className="p-4 bg-gray-900/70 rounded-xl border border-gray-700/80">
                    <h5 className={`font-bold text-sm mb-3 border-b border-gray-800 pb-2 ${col.color}`}>
                      {col.title}
                    </h5>
                    <ul className="space-y-2 text-xs text-gray-300">
                      {col.tasks?.map((t, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                          <span className="leading-relaxed">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {strategy.actionPlan.keyMilestones && strategy.actionPlan.keyMilestones.length > 0 && (
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">Key Critical Milestones</h5>
                  <div className="flex flex-wrap gap-2">
                    {strategy.actionPlan.keyMilestones.map((m, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
                        🎯 {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!isPrintable && (
                <div className="pt-4 border-t border-gray-800">
                  <MilestoneTimelineWidget 
                    strategy={strategy}
                    businessStage={wizardData?.stage || 'Early Stage'}
                    timelineGoal={wizardData?.timeline || '3 - 6 Months'}
                  />
                </div>
              )}
            </div>
          </AccordionSection>
        )}

        {/* Risk & Mitigation Matrix */}
        {strategy.risksAndMitigation && strategy.risksAndMitigation.length > 0 && (
          <AccordionSection
            sectionId="risksAndMitigation"
            icon={<ShieldAlert size={20} />}
            title="Strategic Risk & Mitigation Matrix"
            isPrintable={isPrintable}
            context={context}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategy.risksAndMitigation.map((risk, i) => (
                <div key={i} className="p-4 bg-gray-900/70 rounded-xl border border-gray-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white text-sm">{risk.risk}</h5>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      risk.severity === 'high' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                      risk.severity === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {risk.severity || 'medium'} risk
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-gray-400"><strong className="text-gray-300">Likelihood:</strong> {risk.likelihood}</p>
                    <p className="text-indigo-300"><strong className="text-indigo-400">Mitigation Strategy:</strong> {risk.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Funding & Capital Strategy */}
        {strategy.fundingStrategy && (
          <AccordionSection
            sectionId="fundingStrategy"
            icon={<Coins size={20} />}
            title="Funding & Capital Strategy"
            isPrintable={isPrintable}
            context={context}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900/70 rounded-xl border border-gray-700">
                  <span className="text-xs text-gray-400 uppercase font-semibold">Recommended Capital Path</span>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{strategy.fundingStrategy.recommendedStage}</p>
                </div>
                <div className="p-4 bg-gray-900/70 rounded-xl border border-gray-700">
                  <span className="text-xs text-gray-400 uppercase font-semibold">Estimated Target Raise</span>
                  <p className="text-lg font-bold text-indigo-400 mt-1">{strategy.fundingStrategy.estimatedRaiseAmount}</p>
                </div>
              </div>

              {strategy.fundingStrategy.useOfFunds && (
                <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
                  <h5 className="text-xs font-bold text-gray-300 mb-2">Recommended Allocation of Funds:</h5>
                  <ul className="list-disc list-outside pl-5 space-y-1 text-xs text-gray-300">
                    {strategy.fundingStrategy.useOfFunds.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AccordionSection>
        )}
    </div>
    );
};

const MarketPulseResults: React.FC<{ report: MarketPulseResponse, isPrintable?: boolean }> = ({ report, isPrintable }) => {
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Globe className="text-indigo-400" /> Market Summary</h3>
                <p className="text-gray-300 leading-relaxed">{report.marketSummary}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="text-green-400" /> Emerging Trends</h3>
                    <ul className="space-y-2">
                        {report.emergingTrends.map((trend, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-300">
                                <span className="text-green-400 mt-1">•</span>
                                <span>{trend}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Users className="text-blue-400" /> Competitors</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {report.competitors.map((comp, i) => (
                            <div key={i} className="bg-gray-900/50 p-3 rounded-lg">
                                <h4 className="font-bold text-white">{comp.name}</h4>
                                <p className="text-xs text-gray-400 mt-1 mb-2">{comp.analysis}</p>
                                <p className="text-xs text-indigo-300"><span className="font-semibold text-indigo-400">Positioning:</span> {comp.positioning}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {report.sources && report.sources.length > 0 && !isPrintable && (
                <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
                     <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2"><LinkIcon size={14}/> Sources</h4>
                     <div className="flex flex-wrap gap-2">
                        {report.sources.map((source, i) => (
                            <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 bg-indigo-900/20 px-2 py-1 rounded hover:bg-indigo-900/40 transition-colors flex items-center gap-1">
                                <ExternalLink size={10} />
                                {source.title}
                            </a>
                        ))}
                     </div>
                </div>
            )}
        </div>
    );
};

const QuickBrainstormResults: React.FC<{ result: QuickResponse, isPrintable?: boolean }> = ({ result }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg flex flex-col justify-center text-center">
                    <h3 className="text-lg font-bold text-gray-400 mb-2">Idea Validation Score</h3>
                    <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{result.ideaValidation.score}/10</div>
                    <p className="text-gray-300 mt-4 text-sm">{result.ideaValidation.justification}</p>
                </div>
                
                 <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Zap className="text-yellow-400" /> Quick Branding</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-400 text-sm mb-2">Company Names</h4>
                            <div className="flex flex-wrap gap-2">
                                {result.branding.companyNameSuggestions.map((name, i) => (
                                    <span key={i} className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm">{name}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-400 text-sm mb-2">Slogans</h4>
                            <ul className="space-y-1">
                                {result.branding.sloganSuggestions.map((slogan, i) => (
                                    <li key={i} className="text-gray-300 text-sm italic">"{slogan}"</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Lightbulb className="text-indigo-400" /> Key Strategies</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.keyStrategies.map((strat, i) => (
                        <div key={i} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                            <div className="text-indigo-500 font-bold text-xl mb-2">0{i+1}</div>
                            <p className="text-gray-300 text-sm">{strat}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const VisualAnalysisResults: React.FC<{ result: VisualAnalysisResponse, isPrintable?: boolean }> = ({ result }) => {
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Eye className="text-indigo-400" /> Visual Analysis</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Lightbulb className="text-yellow-400" /> Actionable Suggestions</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-3 bg-gray-900/50 p-3 rounded-lg">
                            <div className="mt-1 min-w-[20px] h-5 w-5 rounded-full bg-indigo-900 text-indigo-300 flex items-center justify-center text-xs font-bold">{i+1}</div>
                            <span className="text-gray-300 text-sm">{suggestion}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const SkeletonLoader = () => {
    return (
        <div className="space-y-6 mt-12 animate-pulse">
            <div className="h-8 w-64 bg-gray-700 rounded mx-auto mb-8"></div>
            <div className="bg-gray-800 rounded-xl p-6 h-40 border border-gray-700">
                <div className="h-6 w-1/3 bg-gray-700 rounded mb-4"></div>
                <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-700 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-700 rounded"></div>
                    <div className="h-4 w-4/6 bg-gray-700 rounded"></div>
                </div>
            </div>
             <div className="bg-gray-800 rounded-xl p-6 h-64 border border-gray-700">
                <div className="h-6 w-1/4 bg-gray-700 rounded mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-40 bg-gray-700 rounded"></div>
                    <div className="h-40 bg-gray-700 rounded"></div>
                </div>
            </div>
        </div>
    );
};

export default ResultsPanel;
