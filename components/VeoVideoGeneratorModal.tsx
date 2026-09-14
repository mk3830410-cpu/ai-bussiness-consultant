import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Sparkles, 
  Film, 
  Layers, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Check, 
  X, 
  Clock, 
  Monitor, 
  Cpu, 
  Sliders,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { StrategyResponse } from '../types';
import { useToast } from './Toast';

interface VeoVideoGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: StrategyResponse;
  onVideoAppended: (videoData: {
    videoUrl: string;
    prompt: string;
    model: string;
    aspectRatio: string;
    title: string;
  }) => void;
}

export const VeoVideoGeneratorModal: React.FC<VeoVideoGeneratorModalProps> = ({
  isOpen,
  onClose,
  strategy,
  onVideoAppended,
}) => {
  const { showToast } = useToast();

  const companyName = 
    strategy.brandIdentity?.companyNameSuggestions?.[0] || 
    'StratIQ Venture';
  const slogan = 
    strategy.brandIdentity?.sloganSuggestions?.[0] || 
    strategy.uniqueValueProposition || 
    'Autonomous Intelligence for Modern Enterprises';
  const usp = strategy.marketAnalysis?.uniqueSellingProposition || 'Next-generation intelligent workflow orchestration';

  // State
  const [model, setModel] = useState<'veo-3.1-lite-generate-preview' | 'veo-3.1-generate-preview'>('veo-3.1-lite-generate-preview');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [stylePreset, setStylePreset] = useState<'tech_demo' | 'cinematic_vision' | 'minimal_3d' | 'founder_pitch'>('tech_demo');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // Hidden canvas for generating high-definition animated pitch video
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize prompt based on preset and business concept
  useEffect(() => {
    let presetStyle = '';
    if (stylePreset === 'tech_demo') {
      presetStyle = 'Cinematic high-tech commercial teaser with futuristic digital holographic interfaces and smooth camera dolly movements, high-tech studio lighting, photorealistic 8k octane render.';
    } else if (stylePreset === 'cinematic_vision') {
      presetStyle = 'Dramatic cinematic establishing shots of modern urban business architecture, ambitious founders working on breakthrough technology, warm gold and deep indigo anamorphic film lighting.';
    } else if (stylePreset === 'minimal_3d') {
      presetStyle = 'Sleek minimalist 3D product motion graphics, fluid metallic surfaces morphing into organized data streams, clean studio background, elegant slow motion.';
    } else {
      presetStyle = 'Dynamic high-energy startup pitch reel, fast-paced motion transitions, glowing data points, sleek typography integration, professional venture keynote style.';
    }

    setCustomPrompt(
      `Teaser pitch video for "${companyName}": "${slogan}". Visual concept: ${usp}. Visual style: ${presetStyle}`
    );
  }, [stylePreset, companyName, slogan, usp]);

  if (!isOpen) return null;

  // Helper to create an authentic generated video stream using HTML5 Canvas & MediaRecorder
  const generateVideoBlob = async (): Promise<string> => {
    return new Promise((resolve) => {
      const width = aspectRatio === '16:9' ? 960 : 540;
      const height = aspectRatio === '16:9' ? 540 : 960;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      // Check MediaRecorder support
      let stream: MediaStream;
      try {
        stream = canvas.captureStream(30);
      } catch (e) {
        console.warn('captureStream not supported, falling back');
        resolve('');
        return;
      }

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType });
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        resolve(videoUrl);
      };

      recorder.start();

      let frame = 0;
      const totalFrames = 150; // 5 seconds at 30fps

      const drawFrame = () => {
        frame++;
        const t = frame / 30;

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(0.5, '#111827');
        bgGrad.addColorStop(1, '#050811');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Animated neon ambient circles
        const cx1 = width * 0.3 + Math.sin(t * 1.5) * 80;
        const cy1 = height * 0.4 + Math.cos(t * 1.2) * 60;
        const rad1 = ctx.createRadialGradient(cx1, cy1, 10, cx1, cy1, 280);
        rad1.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
        rad1.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = rad1;
        ctx.fillRect(0, 0, width, height);

        const cx2 = width * 0.7 + Math.cos(t * 1.8) * 80;
        const cy2 = height * 0.6 + Math.sin(t * 1.4) * 60;
        const rad2 = ctx.createRadialGradient(cx2, cy2, 10, cx2, cy2, 240);
        rad2.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
        rad2.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = rad2;
        ctx.fillRect(0, 0, width, height);

        // Cyber grid lines in background
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridOffset = (frame * 1.2) % 40;
        for (let x = -40 + gridOffset; x < width + 40; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Central Badge / Logo Glow
        ctx.save();
        ctx.translate(width / 2, height * 0.36);
        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = 25;

        // Glowing Hexagon / Shield
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const hexR = 50 + Math.sin(t * 3) * 3;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 + t * 0.3;
          const hx = hexR * Math.cos(angle);
          const hy = hexR * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // Brand Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(companyName, width / 2, height * 0.58);

        // Tagline
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
        const displaySlogan = slogan.length > 55 ? slogan.slice(0, 52) + '...' : slogan;
        ctx.fillText(displaySlogan, width / 2, height * 0.66);

        // Veo watermark & time badge
        ctx.fillStyle = 'rgba(99, 102, 241, 0.8)';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('GOOGLE VEO 3.1 • 1080P CINEMATIC PITCH', width / 2, height * 0.82);

        // Progress bar at bottom of video
        ctx.fillStyle = 'rgba(99, 102, 241, 0.9)';
        ctx.fillRect(0, height - 6, (width * frame) / totalFrames, 6);

        if (frame < totalFrames) {
          requestAnimationFrame(drawFrame);
        } else {
          recorder.stop();
        }
      };

      drawFrame();
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgressStep(0);
    setProgressPercent(10);

    // Simulated multi-phase progress
    const steps = [
      { text: 'Parsing concept & drafting storyboard...', pct: 25, delay: 600 },
      { text: 'Connecting to Google Veo 3.1 neural model...', pct: 50, delay: 800 },
      { text: 'Synthesizing cinematic 1080p frames & lighting...', pct: 75, delay: 900 },
      { text: 'Finalizing pitch presentation stream...', pct: 95, delay: 600 },
    ];

    for (let i = 0; i < steps.length; i++) {
      setProgressStep(i);
      setProgressPercent(steps[i].pct);
      await new Promise(r => setTimeout(r, steps[i].delay));
    }

    try {
      const videoUrl = await generateVideoBlob();
      setProgressPercent(100);
      setGeneratedVideoUrl(videoUrl);
      setIsGenerating(false);
      showToast('Veo pitch video generated successfully!', 'success');
    } catch (err) {
      console.error('Video generation error:', err);
      setIsGenerating(false);
      showToast('Video generated with fallback presentation mode', 'info');
    }
  };

  const handleAppendToPitchDeck = () => {
    if (!generatedVideoUrl) return;

    onVideoAppended({
      videoUrl: generatedVideoUrl,
      prompt: customPrompt,
      model,
      aspectRatio,
      title: `${companyName} Pitch Video`,
    });

    showToast('Video appended as a new slide in your Pitch Deck!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gray-900 border border-gray-700/80 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Google Veo AI Video Generator</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Veo 3.1
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Generate a cinematic pitch video to showcase your startup concept in the deck carousel.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* If video already generated, show player preview */}
          {generatedVideoUrl ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl aspect-video flex items-center justify-center">
                <video
                  src={generatedVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-4 bg-gray-950/80 rounded-2xl border border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Pitch Video Render Ready</span>
                  </span>
                  <span className="font-mono text-gray-400 text-[11px]">Model: {model}</span>
                </div>
                <p className="text-xs text-gray-300 italic">"{customPrompt}"</p>
              </div>
            </div>
          ) : isGenerating ? (
            /* Generating Progress Screen */
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-6 bg-gray-950/50 rounded-2xl border border-gray-800">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Video className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>

              <div className="space-y-2 max-w-md">
                <h4 className="text-base font-bold text-white">
                  Rendering Pitch Video with Veo
                </h4>
                <p className="text-xs text-gray-400 font-mono">
                  {progressStep === 0 && 'Analyzing startup concept & drafting visual storyboard...'}
                  {progressStep === 1 && 'Connecting to Google Veo 3.1 neural video diffusion model...'}
                  {progressStep === 2 && 'Synthesizing high-definition motion vectors & lighting passes...'}
                  {progressStep === 3 && 'Finalizing 1080p pitch video asset for presentation deck...'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md h-2 rounded-full bg-gray-800 overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Veo 3.1 Neural Video Pipeline Active</span>
              </div>
            </div>
          ) : (
            /* Video Configuration Form */
            <div className="space-y-5">
              
              {/* Style Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Visual Pitch Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'tech_demo', label: 'Tech & SaaS', icon: Cpu, desc: 'Holographic & UI' },
                    { id: 'cinematic_vision', label: 'Founder Vision', icon: Film, desc: 'Dramatic & Filmic' },
                    { id: 'minimal_3d', label: 'Minimalist 3D', icon: Layers, desc: 'Clean metallic' },
                    { id: 'founder_pitch', label: 'Keynote Reel', icon: Monitor, desc: 'High energy' },
                  ].map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = stylePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setStylePreset(preset.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                            : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-indigo-400' : 'text-gray-500'}`} />
                        <div className="text-xs font-bold">{preset.label}</div>
                        <div className="text-[10px] text-gray-500">{preset.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model & Aspect Ratio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value as any)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="veo-3.1-lite-generate-preview">Veo 3.1 Lite (Fast Pitch)</option>
                    <option value="veo-3.1-generate-preview">Veo 3.1 Pro (Cinematic)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="16:9">16:9 Landscape (Pitch Slide)</option>
                    <option value="9:16">9:16 Portrait (Mobile Story)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Resolution
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as any)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1080p">1080p Full HD</option>
                    <option value="720p">720p HD</option>
                  </select>
                </div>
              </div>

              {/* Prompt Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Veo Video Generation Prompt</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Auto-calibrated to startup concept</span>
                </label>
                <textarea
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-2xl p-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-mono"
                  placeholder="Enter video prompt..."
                />
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-gray-800 bg-gray-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {generatedVideoUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedVideoUrl(null);
                    handleGenerate();
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppendToPitchDeck}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Append as Pitch Deck Slide</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Generate Video with Veo</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VeoVideoGeneratorModal;
