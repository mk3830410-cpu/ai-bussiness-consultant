
import React, { useState, useRef, ChangeEvent } from 'react';
import { Upload, Sparkles, FileText, Image as ImageIcon, BrainCircuit, Search, Zap, Eye, ShieldAlert } from 'lucide-react';
import { AnalysisMode } from '../types';

interface InputPanelProps {
  userInput: string;
  setUserInput: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  setError: (error: string | null) => void;
  analysisMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  image: File | null;
  setImage: (image: { b64: string; mimeType: string, file: File } | null) => void;
  isVerified: boolean;
}

const analysisModes = [
  { id: 'deep', name: 'Deep Dive', icon: BrainCircuit, description: 'Comprehensive strategy with financials, branding, SWOT & roadmap.' },
  { id: 'market', name: 'Market Pulse', icon: Search, description: 'Up-to-date industry trends, positioning & competitor breakdown.' },
  { id: 'quick', name: 'Quick Brainstorm', icon: Zap, description: 'Fast, high-level opportunity score & instant validation.' },
  { id: 'visual', name: 'Visual Spark', icon: Eye, description: 'Analyze branding assets, logo, UI, or product screenshots.' },
];

const InputPanel: React.FC<InputPanelProps> = ({ userInput, setUserInput, onGenerate, isLoading, setError, analysisMode, onModeChange, image, setImage, isVerified }) => {
  const [inputType, setInputType] = useState<'text' | 'file' | 'image'>('text');
  const textFileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const handleTextFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain' || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => setUserInput(e.target?.result as string);
        reader.readAsText(file);
      } else {
        setError('Please upload a valid .txt or .md file.');
      }
    }
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
       onModeChange('visual');
       const reader = new FileReader();
       reader.onloadend = () => {
         const base64String = (reader.result as string).split(',')[1];
         setImage({ b64: base64String, mimeType: file.type, file: file });
         setError(null);
       };
       reader.onerror = () => setError('Failed to read image file.');
       reader.readAsDataURL(file);
    } else {
        setError('Please upload a valid image file (PNG, JPG, etc.).');
    }
  };

  const isGenerateDisabled = isLoading || !isVerified || (analysisMode === 'visual' ? !image : !userInput.trim());

  return (
    <div className="space-y-6">
      <div>
          <label className="font-bold text-white mb-2 block">1. Select Analysis Mode</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {analysisModes.map(mode => (
                  <button key={mode.id} onClick={() => onModeChange(mode.id as AnalysisMode)} 
                    className={`p-3 rounded-lg text-left transition-all duration-200 border-2 ${analysisMode === mode.id ? 'bg-indigo-600 border-indigo-500 shadow-lg' : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'}`}
                    title={mode.description}
                  >
                      <mode.icon className={`h-5 w-5 mb-1 ${analysisMode === mode.id ? 'text-white' : 'text-indigo-400'}`} />
                      <p className={`font-semibold text-sm ${analysisMode === mode.id ? 'text-white' : 'text-gray-200'}`}>{mode.name}</p>
                  </button>
              ))}
          </div>
      </div>
      
      <div>
        <label className="font-bold text-white mb-2 block">2. Provide Your Input</label>
        {analysisMode === 'visual' ? (
           <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-lg bg-gray-900 hover:border-indigo-500 transition-colors duration-300">
               <input type="file" ref={imageFileRef} onChange={handleImageFileChange} className="hidden" accept="image/*" disabled={isLoading} />
               {image ? (
                 <div className="text-center p-2">
                    <ImageIcon className="mx-auto h-12 w-12 text-green-500" />
                    <p className="mt-2 text-gray-300 truncate max-w-xs">{image.name}</p>
                    <button onClick={() => imageFileRef.current?.click()} className="mt-1 text-sm text-indigo-400 hover:underline">Change image</button>
                 </div>
               ) : (
                <button onClick={() => imageFileRef.current?.click()} className="text-center text-gray-400" disabled={isLoading}>
                    <Upload className="mx-auto h-12 w-12" />
                    <p className="mt-2 font-semibold">Click to upload an image</p>
                    <p className="text-xs text-gray-500">(Logo, product, screenshot, etc.)</p>
                </button>
               )}
            </div>
        ) : (
             <textarea
                className="w-full h-48 p-4 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 placeholder-gray-500"
                placeholder="Describe your startup idea, your target market, and what makes you unique..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isLoading}
             />
        )}
        <textarea
          className="w-full mt-2 p-2 text-sm bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 placeholder-gray-500"
          placeholder={analysisMode === 'visual' ? "Optional: Add context for the image (e.g., 'Analyze this logo for my fintech app')" : "Optional: Add more context here"}
          value={analysisMode === 'visual' ? userInput : ''}
          onChange={(e) => analysisMode === 'visual' ? setUserInput(e.target.value) : null}
          disabled={isLoading}
          rows={2}
        />
      </div>


      <div className="text-center group relative">
        <button
          onClick={onGenerate}
          disabled={isGenerateDisabled}
          className="inline-flex items-center justify-center px-8 py-3 font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all duration-300 transform hover:scale-105 disabled:scale-100"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Strategy
            </>
          )}
        </button>
        {!isVerified && (
          <div className="absolute bottom-full mb-2 hidden group-hover:block w-max">
            <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 border border-gray-700 shadow-lg flex items-center gap-2">
              <ShieldAlert size={14} className="text-yellow-400" />
              Please verify your email to generate a strategy.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputPanel;
