
import React, { useState, useRef, useMemo, FC } from 'react';
import { AnalysisResult, AnalysisMode, StrategyResponse, MarketPulseResponse, QuickResponse, VisualAnalysisResponse, CustomerPersona, PricingModel, PitchDeckSlide, LegalInsight, CustomerJourneyStage, MonetizationStrategy, Comment } from '../types';
import { Target, Users, Gem, Zap, Lightbulb, Bot, Image as ImageIcon, ChevronDown, FileText, Briefcase, BarChart, Palette, Type as TypeIcon, UserCheck, Shield, Globe, Star, Link as LinkIcon, BrainCircuit, Search, Eye, TrendingUp, Megaphone, ShoppingCart, Heart, Repeat, Map, CheckCircle, Download, DollarSign, Linkedin, X, CheckSquare, ExternalLink, MessageSquare, Edit2, Save, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createPortal } from 'react-dom';
import { CommentSection } from './CollaborationTools';

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
}

interface PrintableReportProps {
  analysisResult: AnalysisResult | null;
  logoImageUrl: string | null;
  analysisMode: AnalysisMode;
}

const ResultsPanel: React.FC<ResultsPanelProps> = (props) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
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
        { id: 'pitchDeck', title: 'Pitch Deck Outline', icon: <Briefcase size={16}/> },
        { id: 'legalInsights', title: 'Legal Insights', icon: <Shield size={16}/> },
  ], []);

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
      
      const fileName = `StratIQ_${props.analysisMode}_Report.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setIsExportingPDF(false);
      document.head.removeChild(style);
    }
  };

  const handleExportCSV = () => {
    if (!props.analysisResult) return;
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(props.analysisResult, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `StratIQ_${props.analysisMode}_data.json`;
    link.click();
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
      allComments: props.comments
  };

  const modeMap = {
    deep: {
        icon: BrainCircuit,
        title: "Deep Dive Strategy",
        component: <DeepDiveResults strategy={props.analysisResult as StrategyResponse} logoImageUrl={props.logoImageUrl} isLogoLoading={props.isLogoLoading} context={renderContext} />
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
        <div className="absolute top-0 right-0 mt-2 mr-2 flex items-center gap-2">
           <button
             onClick={handleExportCSV}
             disabled={isExportingPDF}
             className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-gray-500/50 transition-all duration-300"
           >
             <Download size={16} className="mr-2" />
             Export JSON
           </button>
           <button
             onClick={handleInitiatePdfExport}
             disabled={isExportingPDF}
             className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all duration-300"
           >
             {isExportingPDF ? (
               <>
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <span>Exporting...</span>
               </>
             ) : (
               <>
                 <Download size={16} className="mr-2" />
                 Export PDF
               </>
             )}
           </button>
        </div>
      </div>
      <div className="space-y-8">
        {currentMode.component}
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
  context?: {
      isCollaborative: boolean;
      onCommentClick: (id: string) => void;
      activeComments: string | null;
      allComments: Comment[];
  };
}

const AccordionSection: React.FC<AccordionProps> = ({ icon, title, children, defaultOpen = false, isPrintable = false, sectionId, context }) => {
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
        
        {/* Collaboration Tools */}
        {sectionId && !isPrintable && (
            <div className="flex items-center gap-2">
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
            </div>
        )}
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
}

const DeepDiveResults: React.FC<DeepDiveProps> = ({ strategy, logoImageUrl, isLogoLoading, isPrintable = false, context }) => {
    
    const handleLinkedInShare = (slide: PitchDeckSlide) => {
        const title = slide.title;
        const summary = slide.content.join('\n\n') + `\n\n- Generated by StratIQ`;
        const url = window.location.href; // Use the current app's URL

        const linkedInUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}&source=StratIQ`;
        
        window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
    };

    return (
    <div className="space-y-6">
        <AccordionSection sectionId="ideaValidation" icon={<Star size={20}/>} title="Idea Validation & Suggestions" defaultOpen={true} isPrintable={isPrintable} context={context}>
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
        <AccordionSection sectionId="marketAnalysis" icon={<BarChart size={20}/>} title="Market & Competitor Analysis" isPrintable={isPrintable} context={context}>
            <div className="space-y-4">
                <div><h4 className="font-bold text-indigo-400">Target Audience:</h4><p>{strategy.marketAnalysis.targetAudience}</p></div>
                <div><h4 className="font-bold text-indigo-400">Unique Selling Proposition:</h4><p>{strategy.marketAnalysis.uniqueSellingProposition}</p></div>
                <div>
                    <h4 className="font-bold text-indigo-400 mb-2">SWOT Analysis:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {Object.entries(strategy.marketAnalysis.swot).map(([key, value]: [string, unknown]) =>(
                            <div key={key} className="p-3 bg-gray-900/70 rounded-md">
                                <h5 className="font-semibold capitalize text-white mb-1">{key}</h5>
                                <ul className="list-disc list-inside space-y-1">{Array.isArray(value) && value.map((item, i)=><li key={i}>{item}</li>)}</ul>
                            </div>
                        ))}
                    </div>
                </div>
                 <div>
                    <h4 className="font-bold text-indigo-400 mb-2">Competitor Landscape:</h4>
                    <div className="space-y-3">
                        {strategy.marketAnalysis.competitors.map((c, i) => <div key={i} className="p-3 bg-gray-900/70 rounded-md"><h5 className="font-semibold text-white">{c.name}</h5><p>{c.analysis}</p></div>)}
                    </div>
                </div>
            </div>
        </AccordionSection>
         <AccordionSection sectionId="financialProjections" icon={<TrendingUp size={20}/>} title="Financial Projections (1-3 Years)" isPrintable={isPrintable} context={context}>
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
        </AccordionSection>
        
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
        
        <AccordionSection sectionId="pricingModels" icon={<ShoppingCart size={20}/>} title="Pricing Models" isPrintable={isPrintable} context={context}>
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
        
        <AccordionSection sectionId="monetizationPlan" icon={<DollarSign size={20}/>} title="Monetization Plan" isPrintable={isPrintable} context={context}>
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
        
        <AccordionSection sectionId="pitchDeck" icon={<Briefcase size={20}/>} title="Pitch Deck Outline" isPrintable={isPrintable} context={context}>
            <div className="space-y-4">
                {strategy.pitchDeck.map((slide: PitchDeckSlide, i: number) => (
                    <div key={i} className="bg-gray-900/70 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-bold text-white">Slide {i + 1}: {slide.title}</h4>
                            {!isPrintable && (
                                <button onClick={() => handleLinkedInShare(slide)} title="Share Slide on LinkedIn" className="text-indigo-400 hover:text-white transition-colors">
                                    <Linkedin size={18} />
                                </button>
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
