import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  RotateCcw, 
  Briefcase,
  Cloud 
} from 'lucide-react';
import { ChatMessage, SavedStrategy, AnalysisResult } from '../types';
import { askBusinessAdvisor } from '../services/geminiService';
import { auth } from '../lib/firebase';
import { 
  fetchChatHistory, 
  saveChatMessage, 
  clearChatHistory 
} from '../services/firestoreService';

interface BusinessAdvisorChatProps {
  currentStrategy?: SavedStrategy | null;
  activeAnalysisResult?: AnalysisResult | null;
  businessName?: string;
  businessIdea?: string;
  industry?: string;
}

export const BusinessAdvisorChat: React.FC<BusinessAdvisorChatProps> = ({
  currentStrategy,
  activeAnalysisResult,
  businessName,
  businessIdea,
  industry,
}) => {
  const activeName = currentStrategy?.businessName || businessName || 'Your Startup';
  const activeIndustry = currentStrategy?.industry || industry || 'Technology & Services';
  const activeIdea = currentStrategy?.inputs?.businessIdea || currentStrategy?.inputs?.userInput || businessIdea || '';
  const activeScore = currentStrategy?.score || 82;
  const currentUid = auth.currentUser?.uid;
  const chatId = currentStrategy?.id || 'main';

  const quickPrompts = [
    "How do I get my first 100 customers?",
    "What should I charge for this product?",
    "How can I beat my strongest competitors?",
    "Create a step-by-step marketing launch plan",
    "What are my biggest execution risks?",
    "What exact tasks should I accomplish this week?",
  ];

  const initialMessage: ChatMessage = {
    id: 'msg_welcome',
    role: 'assistant',
    content: `Hello! I'm **StratIQ**, your AI co-founder and venture advisor. 

I'm currently primed with context on **${activeName}** (${activeIndustry}). Ask me anything about customer acquisition, pricing psychology, growth loops, investor pitches, or risk mitigation.

Select a quick topic below or type your strategic question:`,
    timestamp: Date.now(),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSyncingWithFirestore, setIsSyncingWithFirestore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history from Firestore
  useEffect(() => {
    let isMounted = true;
    async function loadChat() {
      if (currentUid) {
        setIsSyncingWithFirestore(true);
        try {
          const history = await fetchChatHistory(currentUid, chatId);
          if (isMounted && history && history.length > 0) {
            setMessages(history.map(h => ({
              id: h.id,
              role: h.role,
              content: h.content,
              timestamp: h.timestamp,
            })));
            setIsSyncingWithFirestore(false);
            return;
          }
        } catch (e) {
          console.warn('Could not load chat history from Firestore:', e);
        }
        setIsSyncingWithFirestore(false);
      }

      // Local fallback
      try {
        const saved = localStorage.getItem(`stratiq_chat_${activeName.replace(/\s+/g, '_')}`);
        if (saved && isMounted) {
          setMessages(JSON.parse(saved));
        }
      } catch {}
    }

    loadChat();

    return () => {
      isMounted = false;
    };
  }, [currentUid, chatId, activeName]);

  useEffect(() => {
    scrollToBottom();
    try {
      localStorage.setItem(`stratiq_chat_${activeName.replace(/\s+/g, '_')}`, JSON.stringify(messages));
    } catch {}
  }, [messages, activeName]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // Save user message to Firestore
    if (currentUid) {
      saveChatMessage(currentUid, chatId, 'user', query).catch(err => 
        console.warn('Could not save user message to Firestore:', err)
      );
    }

    try {
      const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));
      
      const response = await askBusinessAdvisor(
        query,
        {
          name: activeName,
          industry: activeIndustry,
          idea: activeIdea,
          stage: currentStrategy?.stage || 'Validation',
          targetMarket: currentStrategy?.targetMarket,
          score: activeScore,
          strategy: activeAnalysisResult || currentStrategy?.result,
        },
        historyForApi
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);

      // Save assistant message to Firestore
      if (currentUid) {
        saveChatMessage(currentUid, chatId, 'assistant', response).catch(err => 
          console.warn('Could not save AI message to Firestore:', err)
        );
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered a minor glitch while processing that strategic advice. Let me know what specific dimension you'd like to dive into.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = async () => {
    setMessages([initialMessage]);
    try {
      localStorage.removeItem(`stratiq_chat_${activeName.replace(/\s+/g, '_')}`);
    } catch {}

    if (currentUid) {
      try {
        await clearChatHistory(currentUid, chatId);
      } catch (e) {
        console.warn('Could not clear Firestore chat:', e);
      }
    }
  };

  return (
    <div className="flex flex-col h-[700px] max-h-[82vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">StratIQ Business Advisor</h3>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Context
              </span>
              {currentUid && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <Cloud size={11} className="text-indigo-400" /> Synced
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate max-w-md">
              <Briefcase className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>{activeName}</span>
              <span>•</span>
              <span className="text-slate-300">{activeIndustry}</span>
              {activeScore && (
                <>
                  <span>•</span>
                  <span className="text-indigo-400 font-semibold">Score {activeScore}/100</span>
                </>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
          title="Reset chat history"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-indigo-400 border border-slate-700'
              }`}
            >
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 border border-slate-700/80 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 text-slate-400 rounded-2xl px-4 py-3 text-xs flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>Analyzing market data & drafting advisory insights...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-6 py-2 bg-slate-950/40 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-slate-500 shrink-0 flex items-center gap-1 font-medium">
          <Sparkles size={12} className="text-amber-400" /> Prompts:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isTyping}
            className="px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white whitespace-nowrap transition disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask StratIQ about scaling ${activeName}...`}
          disabled={isTyping}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition disabled:opacity-50 shadow-md shadow-indigo-600/20"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default BusinessAdvisorChat;
