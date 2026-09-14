import React, { useState } from 'react';
import { 
  X, 
  Presentation, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useToast } from './Toast';
import { 
  SlideData, 
  downloadGoogleSlidesDeck, 
  generateSlidesBatchApiPayload,
  pushDeckToGoogleSlidesApi 
} from '../services/slidesExportService';

interface GoogleSlidesExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  slides: SlideData[];
}

export const GoogleSlidesExportModal: React.FC<GoogleSlidesExportModalProps> = ({
  isOpen,
  onClose,
  companyName,
  slides,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState<string>('idle');
  const [apiResultUrl, setApiResultUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    try {
      downloadGoogleSlidesDeck(companyName, slides);
      showToast('Google Slides deck template downloaded successfully!', 'success');
      setExportStep('downloaded');
    } catch (err) {
      showToast('Failed to download presentation template.', 'error');
    }
  };

  const handleCopySlidesOutline = () => {
    const formatted = slides.map((s, i) => `=== SLIDE ${i + 1}: ${s.title.toUpperCase()} ===
[Badge: ${s.badge}]
${s.subtitle ? `Subtitle: ${s.subtitle}\n` : ''}Key Points:
${s.points.map(p => `• ${p}`).join('\n')}

Speaker Notes:
${s.speakerNotes}
`).join('\n\n');

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    showToast('Pitch deck slides outline copied to clipboard!', 'success', 'copy');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenGoogleSlides = () => {
    // First download the template so the user has the exact file to import
    downloadGoogleSlidesDeck(companyName, slides);
    showToast('Downloaded template. Opening Google Slides in a new tab...', 'info');
    // Open Google Slides presentations
    window.open('https://docs.google.com/presentation/u/0/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scaleIn text-slate-200"
        id="google-slides-export-modal"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Presentation className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Export to Google Slides
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {companyName} • {slides.length} Presentation Slides
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presentation Summary Badge */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Aspect Ratio: <strong className="text-white">16:9 Widescreen</strong></span>
          <span className="text-slate-400">Layout: <strong className="text-white">Executive Pitch Format</strong></span>
          <span className="text-slate-400">Speaker Notes: <strong className="text-emerald-400">Included</strong></span>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Option 1: Direct Open & Download Google Slides Package */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 hover:border-indigo-500/50 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Recommended Workflow
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                Instant
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">Download Template & Launch Google Slides</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Downloads the pre-formatted 16:9 Google Slides deck and opens Google Slides in a new tab where you can click <strong>File &gt; Import slides</strong> or open directly.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleOpenGoogleSlides}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Launch in Google Slides</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download HTML Template</span>
              </button>
            </div>
          </div>

          {/* Option 2: Copy Outline for Manual Paste */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Copy Formatted Presentation Text</span>
              <button
                onClick={handleCopySlidesOutline}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Outline' : 'Copy All Slides'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Formatted markdown text with title, subtitle, bullet points, and speaker notes ready to paste into any presentation tool.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ready for investor pitch meetings</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleSlidesExportModal;
