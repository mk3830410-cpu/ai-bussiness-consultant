import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StrategyResponse, PitchDeckSlide } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Copy, 
  FileText, 
  Layers, 
  Check, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles,
  TrendingUp,
  Target,
  DollarSign,
  ShieldCheck,
  Award,
  Zap,
  Briefcase,
  Video,
  Download
} from 'lucide-react';
import { useToast } from './Toast';
import { VeoVideoGeneratorModal } from './VeoVideoGeneratorModal';

interface PitchDeckCarouselProps {
  strategy: StrategyResponse;
  logoImageUrl?: string | null;
  onBackToDocument?: () => void;
}

interface EnrichedSlide {
  id: number;
  category: string;
  title: string;
  subtitle?: string;
  points: string[];
  speakerNotes: string;
  icon: any;
  accentColor: string;
  bgGradient: string;
  badge: string;
  isVideoSlide?: boolean;
  videoUrl?: string;
  videoPrompt?: string;
  videoModel?: string;
}

export const PitchDeckCarousel: React.FC<PitchDeckCarouselProps> = ({
  strategy,
  logoImageUrl,
  onBackToDocument,
}) => {
  const { showToast } = useToast();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showVeoModal, setShowVeoModal] = useState(false);
  const [customSlides, setCustomSlides] = useState<EnrichedSlide[]>([]);

  // Presentation Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  // Transform strategy data into visual pitch deck slides
  const baseSlides: EnrichedSlide[] = useMemo(() => {
    const companyName = 
      strategy.brandIdentity?.companyNameSuggestions?.[0] || 
      'Venture Concept';
    const slogan = 
      strategy.brandIdentity?.sloganSuggestions?.[0] || 
      strategy.uniqueValueProposition || 
      'Next-Generation Business Platform';

    // If strategy has explicit pitch deck slides, map them with enriched metadata
    if (strategy.pitchDeck && strategy.pitchDeck.length > 0) {
      const iconMap = [
        Sparkles,
        Target,
        Zap,
        TrendingUp,
        DollarSign,
        ShieldCheck,
        Award,
        Briefcase,
      ];

      const colorMap = [
        { accent: '#6366f1', grad: 'from-indigo-900/40 via-gray-900 to-gray-950', badge: 'Cover & Vision' },
        { accent: '#f43f5e', grad: 'from-rose-900/40 via-gray-900 to-gray-950', badge: 'Problem Statement' },
        { accent: '#10b981', grad: 'from-emerald-900/40 via-gray-900 to-gray-950', badge: 'Solution & Tech' },
        { accent: '#0284c7', grad: 'from-sky-900/40 via-gray-900 to-gray-950', badge: 'Market Opportunity' },
        { accent: '#8b5cf6', grad: 'from-purple-900/40 via-gray-900 to-gray-950', badge: 'Business Model' },
        { accent: '#f59e0b', grad: 'from-amber-900/40 via-gray-900 to-gray-950', badge: 'Competitive Moat' },
        { accent: '#059669', grad: 'from-teal-900/40 via-gray-900 to-gray-950', badge: 'Financial Roadmap' },
        { accent: '#ec4899', grad: 'from-pink-900/40 via-gray-900 to-gray-950', badge: 'The Ask & Next Steps' },
      ];

      return strategy.pitchDeck.map((slide, idx) => {
        const style = colorMap[idx % colorMap.length];
        const Icon = iconMap[idx % iconMap.length];
        return {
          id: idx + 1,
          category: `Slide ${idx + 1}`,
          title: slide.title,
          subtitle: idx === 0 ? slogan : undefined,
          points: slide.content && slide.content.length > 0 ? slide.content : [
            'Clear market validation based on target buyer profiles',
            'Strong structural unit economics and scalable acquisition',
            'Defensible competitive moats and high customer retention'
          ],
          speakerNotes: slide.speakerNotes || 'Emphasize the customer pain point and why timing is critical right now.',
          icon: Icon,
          accentColor: style.accent,
          bgGradient: style.grad,
          badge: style.badge,
        };
      });
    }

    // Fallback: Generate full 7-slide sequence from core strategy fields
    return [
      {
        id: 1,
        category: 'Slide 1',
        title: companyName,
        subtitle: slogan,
        points: [
          `Validation Score: ${strategy.ideaValidation?.score || 8.5}/10 by StratIQ AI`,
          `Target Market: ${strategy.marketAnalysis?.targetAudience || 'Global B2B & Digital Consumers'}`,
          `Value Proposition: ${strategy.marketAnalysis?.uniqueSellingProposition || strategy.uniqueValueProposition || 'High-efficiency automated solution'}`,
        ],
        speakerNotes: `Introduce ${companyName}. State the one-sentence pitch with energy and clarity. Mention the validated market opportunity score.`,
        icon: Sparkles,
        accentColor: '#6366f1',
        bgGradient: 'from-indigo-950/60 via-gray-900 to-gray-950',
        badge: 'Title & Vision',
      },
      {
        id: 2,
        category: 'Slide 2',
        title: 'The Problem & Market Friction',
        subtitle: 'Critical pain points leaving current customers underserved',
        points: strategy.targetAudienceDetails?.customerPainPoints?.slice(0, 4) || [
          'High friction and fragmented toolchains wasting team hours',
          'Excessive operational overhead and unpredictable vendor costs',
          'Lack of integrated real-time visibility for decision makers',
        ],
        speakerNotes: 'Convey urgency. Walk the audience through the day-to-day frustration the buyer experiences without this solution.',
        icon: Target,
        accentColor: '#f43f5e',
        bgGradient: 'from-rose-950/50 via-gray-900 to-gray-950',
        badge: 'Market Problem',
      },
      {
        id: 3,
        category: 'Slide 3',
        title: 'Our Solution & Unique Moat',
        subtitle: 'An intelligent platform engineered for scalable impact',
        points: [
          strategy.marketAnalysis?.uniqueSellingProposition || 'AI-driven architecture purpose-built for low friction',
          ...(strategy.ideaValidation?.suggestions?.slice(0, 3) || [
            'Automated workflow orchestrations saving 80% time',
            'Plug-and-play integrations with modern tech stacks'
          ]),
        ],
        speakerNotes: 'Demonstrate how the solution directly eliminates the pain points covered in Slide 2. Emphasize why competitors cannot easily duplicate.',
        icon: Zap,
        accentColor: '#10b981',
        bgGradient: 'from-emerald-950/50 via-gray-900 to-gray-950',
        badge: 'Core Solution',
      },
      {
        id: 4,
        category: 'Slide 4',
        title: 'Target Audience & Market Expansion',
        subtitle: 'Pinpoint customer acquisition with clear expansion headroom',
        points: [
          `Primary Persona: ${strategy.customerPersonas?.[0]?.name || 'Early Adopter Leader'} (${strategy.customerPersonas?.[0]?.role || 'Decision Maker'})`,
          `Demographic Profile: ${strategy.marketAnalysis?.targetAudience || 'Digital-native organizations'}`,
          `Buying Behavior: ${strategy.targetAudienceDetails?.buyingBehavior || 'ROI-driven, rapid evaluation cycle'}`,
        ],
        speakerNotes: 'Show that we know exactly who writes the check and what triggers their purchasing decision.',
        icon: TrendingUp,
        accentColor: '#0284c7',
        bgGradient: 'from-sky-950/50 via-gray-900 to-gray-950',
        badge: 'Market Audience',
      },
      {
        id: 5,
        category: 'Slide 5',
        title: 'Monetization & Business Model',
        subtitle: 'Predictable high-margin recurring revenue engine',
        points: strategy.pricingModels?.map(p => `${p.tier}: ${p.price} — ${p.description}`) || [
          'Starter Tier: $29/mo — self-serve adoption',
          'Pro Tier: $99/mo — team collaboration & advanced features',
          'Enterprise: Custom annual contracts with dedicated SLA',
        ],
        speakerNotes: 'Highlight strong gross margins, negative churn expansion potential, and clear path to $1M ARR.',
        icon: DollarSign,
        accentColor: '#8b5cf6',
        bgGradient: 'from-purple-950/50 via-gray-900 to-gray-950',
        badge: 'Business Model',
      },
      {
        id: 6,
        category: 'Slide 6',
        title: 'Financial Projections (Years 1-3)',
        subtitle: 'Disciplined capital efficiency and aggressive growth trajectory',
        points: strategy.financialProjections?.map(f => `Year ${f.year}: ${f.revenue} Revenue (${f.costs} Operating Costs)`) || [
          'Year 1: $120,000 ARR with lean operating cash flow',
          'Year 2: $480,000 ARR driven by product-led expansion',
          'Year 3: $1,400,000 ARR at 78% software gross margin',
        ],
        speakerNotes: 'Explain the core assumptions behind Year 2 and Year 3 acceleration, pointing to low CAC and high LTV.',
        icon: Award,
        accentColor: '#059669',
        bgGradient: 'from-teal-950/50 via-gray-900 to-gray-950',
        badge: 'Financial Model',
      },
      {
        id: 7,
        category: 'Slide 7',
        title: '30-60-90 Day Execution & The Ask',
        subtitle: 'Action-oriented milestones ready to execute immediately',
        points: [
          `30 Days: ${strategy.actionPlan?.day30?.[0] || 'Deploy MVP & onboard first 25 beta design partners'}`,
          `60 Days: ${strategy.actionPlan?.day60?.[0] || 'Iterate on core telemetry & implement conversion funnels'}`,
          `90 Days: ${strategy.actionPlan?.day90?.[0] || 'Public launch & kickstart paid customer acquisition engine'}`,
        ],
        speakerNotes: 'Close with confidence. Recap the vision and invite questions or investment discussions.',
        icon: Briefcase,
        accentColor: '#ec4899',
        bgGradient: 'from-pink-950/50 via-gray-900 to-gray-950',
        badge: 'Execution & Ask',
      },
    ];
  }, [strategy]);

  // Combine base strategy slides with user-generated Veo video pitch slides
  const slides = useMemo(() => {
    return [...baseSlides, ...customSlides];
  }, [baseSlides, customSlides]);

  const handleVideoAppended = (videoData: {
    videoUrl: string;
    prompt: string;
    model: string;
    aspectRatio: string;
    title: string;
  }) => {
    const newSlide: EnrichedSlide = {
      id: slides.length + 1,
      category: 'Veo Video',
      title: videoData.title,
      subtitle: `Cinematic Concept Teaser • Produced with Google Veo 3.1`,
      points: [
        'AI-generated high-definition video summarizing core startup vision',
        `Format: ${videoData.aspectRatio} Landscape • 1080p Resolution`,
        `Veo Neural Prompt: "${videoData.prompt.slice(0, 110)}..."`,
      ],
      speakerNotes: 'Introduce this pitch video: "Here is an executive visual teaser produced with Google Veo summarizing our user experience before we explore our strategic roadmap."',
      icon: Video,
      accentColor: '#8b5cf6',
      bgGradient: 'from-purple-950/60 via-gray-900 to-gray-950',
      badge: 'Veo AI Video Pitch',
      isVideoSlide: true,
      videoUrl: videoData.videoUrl,
      videoPrompt: videoData.prompt,
      videoModel: videoData.model,
    };

    setCustomSlides((prev) => [...prev, newSlide]);
    // Navigate immediately to the new slide
    setCurrentSlideIndex(slides.length);
  };

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handleNext = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  }, [slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isFullscreen]);

  const handleCopySlide = () => {
    const slideText = `[Slide ${currentSlide.id}: ${currentSlide.title}]\n\n` +
      currentSlide.points.map((p) => `• ${p}`).join('\n') +
      `\n\nSpeaker Notes:\n${currentSlide.speakerNotes}`;
    
    navigator.clipboard.writeText(slideText);
    setCopiedIndex(currentSlideIndex);
    showToast(`Copied Slide ${currentSlide.id} to clipboard!`, 'success', 'copy');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const SlideIcon = currentSlide.icon;

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-950 p-6 md:p-10 overflow-y-auto flex flex-col justify-between' : ''}`}>
      {/* Top Carousel Navigation & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-900/90 border border-gray-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          {onBackToDocument && (
            <button
              onClick={onBackToDocument}
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-semibold border border-gray-700 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full Blueprint View</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Visual Pitch Deck</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
          </div>
        </div>

        {/* Presentation Controls: Timer, Notes, Fullscreen */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pitch Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/90 rounded-xl border border-gray-700 text-xs text-gray-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono font-semibold">{formatTimer(timerSeconds)}</span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 hover:text-white transition-colors"
              title={isTimerRunning ? 'Pause Pitch Timer' : 'Start Pitch Timer'}
            >
              {isTimerRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-1 hover:text-white transition-colors text-gray-500"
              title="Reset Timer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Create AI Video Pitch with Google Veo */}
          <button
            onClick={() => setShowVeoModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-550 hover:to-indigo-550 text-white shadow-md shadow-purple-900/30 border border-purple-500/40 flex items-center gap-1.5 transition-all"
            title="Generate a cinematic pitch video summarizing the concept using Google Veo"
          >
            <Video className="w-3.5 h-3.5 text-purple-200" />
            <span>Generate Pitch Video (Veo)</span>
          </button>

          {/* Toggle Speaker Notes */}
          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showSpeakerNotes
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
            }`}
            title="Toggle speaker presentation notes"
          >
            Speaker Notes: {showSpeakerNotes ? 'ON' : 'OFF'}
          </button>

          {/* Copy Slide */}
          <button
            onClick={handleCopySlide}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl border border-gray-700 transition-colors"
            title="Copy this slide to clipboard"
          >
            {copiedIndex === currentSlideIndex ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl border border-gray-700 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Present in Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Slide Stage */}
      <div className="relative group">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-gray-900/90 border border-gray-700 text-gray-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 shadow-2xl flex items-center justify-center transition-all duration-200"
          title="Previous slide (Left Arrow)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Slide Card */}
        <div
          className={`w-full min-h-[440px] md:min-h-[500px] rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-800 bg-gradient-to-br ${currentSlide.bgGradient} flex flex-col justify-between relative overflow-hidden transition-all duration-300`}
        >
          {/* Subtle watermark / background grid accent */}
          <div 
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: currentSlide.accentColor }}
          />

          {/* Slide Header */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2.5 rounded-2xl bg-gray-900/80 border border-gray-700/80 shadow-md"
                  style={{ color: currentSlide.accentColor }}
                >
                  <SlideIcon className="w-6 h-6" />
                </div>
                <div>
                  <span 
                    className="text-xs font-bold uppercase tracking-wider font-mono px-2.5 py-0.5 rounded-full border bg-gray-900/90"
                    style={{ color: currentSlide.accentColor, borderColor: `${currentSlide.accentColor}40` }}
                  >
                    {currentSlide.badge}
                  </span>
                </div>
              </div>

              {logoImageUrl && (
                <img 
                  src={logoImageUrl} 
                  alt="Company Logo" 
                  className="w-12 h-12 object-contain rounded-xl bg-gray-900/60 p-1 border border-gray-800"
                />
              )}
            </div>

            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-snug mb-3">
              {currentSlide.title}
            </h2>

            {currentSlide.subtitle && (
              <p className="text-base md:text-lg text-gray-300 font-medium leading-relaxed max-w-3xl mb-6">
                {currentSlide.subtitle}
              </p>
            )}

            {/* Slide Content: Check if Veo Video Slide or Standard Bullet Points */}
            {currentSlide.isVideoSlide && currentSlide.videoUrl ? (
              <div className="space-y-4 my-4">
                <div className="relative rounded-2xl overflow-hidden bg-black border border-purple-500/30 shadow-2xl aspect-video max-w-2xl mx-auto flex items-center justify-center">
                  <video
                    src={currentSlide.videoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-gray-900/80 border border-purple-500/30 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span className="font-semibold text-gray-200">Veo 3.1 Neural Video Teaser</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVeoModal(true)}
                      className="px-3 py-1 rounded-lg bg-gray-800 text-purple-300 hover:text-white border border-purple-500/40 flex items-center gap-1 text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Regenerate Video</span>
                    </button>
                    <a
                      href={currentSlide.videoUrl}
                      download="startup_pitch_video.webm"
                      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-550 text-white font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Video</span>
                    </a>
                  </div>
                </div>

                {/* Key talking points below video */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {currentSlide.points.map((point, i) => (
                    <div key={i} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Slide Bullet Points */
              <div className="space-y-4 my-6">
                {currentSlide.points.map((point, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-4 p-4 rounded-2xl bg-gray-900/60 border border-gray-800/80 hover:border-gray-700 transition-all shadow-md"
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm text-white"
                      style={{ backgroundColor: currentSlide.accentColor }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-sm md:text-base text-gray-200 leading-relaxed font-normal">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Slide Footer */}
          <div className="pt-6 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold text-gray-300">
              StratIQ Investor Deck • {strategy.brandIdentity?.companyNameSuggestions?.[0] || 'Venture Blueprint'}
            </span>
            <span className="font-mono text-gray-500">
              {currentSlideIndex + 1} / {slides.length}
            </span>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-gray-900/90 border border-gray-700 text-gray-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 shadow-2xl flex items-center justify-center transition-all duration-200"
          title="Next slide (Right Arrow)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Speaker Notes Drawer */}
      {showSpeakerNotes && (
        <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Presenter Script & Speaker Notes</span>
            </h4>
            <span className="text-[11px] text-gray-400">Read during this slide</span>
          </div>
          <p className="text-sm text-indigo-100/90 leading-relaxed italic">
            "{currentSlide.speakerNotes}"
          </p>
        </div>
      )}

      {/* Slide Thumbnails / Pagination Strip */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 px-1">
        {slides.map((slide, idx) => {
          const isCurrent = idx === currentSlideIndex;
          return (
            <button
              key={slide.id}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 ring-2 ring-indigo-400/50'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-750 border border-gray-700/60'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">
                {idx + 1}
              </span>
              <span className="hidden sm:inline line-clamp-1 max-w-[120px]">{slide.badge}</span>
            </button>
          );
        })}
      </div>
      {/* Veo Video Generator Modal */}
      <VeoVideoGeneratorModal
        isOpen={showVeoModal}
        onClose={() => setShowVeoModal(false)}
        strategy={strategy}
        onVideoAppended={handleVideoAppended}
      />
    </div>
  );
};

export default PitchDeckCarousel;
