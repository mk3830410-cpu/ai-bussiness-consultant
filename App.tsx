
import React, { useState, useCallback, useEffect } from 'react';
import { AnalysisResult, AnalysisMode, SubscriptionTier, TeamMember, Comment, ConceptHistoryItem } from './types';
import { generateStrategy, generateLogoImage } from './services/geminiService';
import InputPanel from './components/InputPanel';
import ResultsPanel from './components/ResultsPanel';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import LandingPage from './components/LandingPage';
import ProfileSettings from './components/ProfileSettings';
import VerificationBanner from './components/VerificationBanner';
import PricingPage from './components/PricingPage';
import { supabase } from './services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { trackEvent } from './services/analytics';
import { Users } from 'lucide-react';
import { TeamModal } from './components/CollaborationTools';
import { ToastProvider, useToast } from './components/Toast';
import { ConceptHistory } from './components/ConceptHistory';

interface Profile {
  full_name: string;
  role: string;
  avatar_url: string;
  subscription_tier: SubscriptionTier;
}

const AppContent: React.FC = () => {
  const { showToast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  // App State
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('deep');
  const [userInput, setUserInput] = useState<string>('');
  const [image, setImage] = useState<{ b64: string; mimeType: string; file: File } | null>(null);
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLogoLoading, setIsLogoLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Concept History State (keeps last 3 concepts)
  const [conceptHistory, setConceptHistory] = useState<ConceptHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('stratiq_concept_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeConceptId, setActiveConceptId] = useState<string | null>(null);

  const [view, setView] = useState<'main' | 'settings'>('main');
  const [showTeamModal, setShowTeamModal] = useState(false);

  // Collaboration State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  const fetchProfile = async (user: User | null) => {
    if (user) {
      try {
        const { data, error, status } = await supabase
          .from('profiles')
          .select(`full_name, role, avatar_url, subscription_tier`)
          .eq('id', user.id)
          .single();
        
        // Handle case where subscription_tier column might not exist in old schema by defaulting
        if (error && status !== 406) {
           // If column missing error, we just ignore and use default
           console.warn("Could not fetch full profile:", error.message);
        }
        
        if (data) {
          setProfile(data as Profile);
        } else {
             // Basic fallback if profile doesn't exist yet
             setProfile({ full_name: '', role: '', avatar_url: '', subscription_tier: null });
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error.message);
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsVerified(!!session?.user?.email_confirmed_at);
      fetchProfile(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsVerified(!!session?.user?.email_confirmed_at);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
      }

      if (_event === 'SIGNED_OUT') {
        setAnalysisResult(null);
        setUserInput('');
        setImage(null);
        setError(null);
        setView('main');
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePlan = async (tier: SubscriptionTier) => {
      if (!user) return;
      
      // Optimistic update for UI
      setProfile(prev => prev ? { ...prev, subscription_tier: tier } : null);

      try {
          // Attempt to update Supabase
          const { error } = await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', user.id);
          if (error) throw error;
      } catch (err) {
          console.error("Failed to sync plan to DB (might be schema mismatch), but continuing session.", err);
      }
  };

  const handleGenerate = useCallback(async () => {
    const hasTextInput = userInput.trim();
    const hasImageInput = !!image;

    if (!isVerified) {
      setError('Please verify your email address to generate a strategy.');
      return;
    }

    if (analysisMode === 'visual' && !hasImageInput) {
      setError('Please upload an image for Visual Spark analysis.');
      return;
    }
    if (analysisMode !== 'visual' && !hasTextInput) {
      setError('Please describe your startup or upload a business plan.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setLogoImageUrl(null);
    trackEvent('generate_strategy', 'User', analysisMode);

    try {
      const result = await generateStrategy(analysisMode, userInput, image);
      setAnalysisResult(result);
      showToast('Strategy generated successfully!', 'success');
      
      // Build history item to save the last 3 business concepts
      const conceptTitle =
        (result as any)?.brandIdentity?.companyNameSuggestions?.[0] ||
        (result as any)?.branding?.companyNameSuggestions?.[0] ||
        userInput.split('\n')[0].substring(0, 45).trim() ||
        'Business Concept';
      const subtitle =
        (result as any)?.brandIdentity?.sloganSuggestions?.[0] ||
        (result as any)?.marketAnalysis?.uniqueSellingProposition ||
        (result as any)?.marketSummary ||
        userInput.substring(0, 90).trim();
      const score = (result as any)?.ideaValidation?.score;
      const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

      const newItem: ConceptHistoryItem = {
        id: newId,
        conceptTitle,
        subtitle,
        timestamp: Date.now(),
        analysisMode,
        userInput,
        analysisResult: result,
        logoImageUrl: null,
        score,
      };

      setConceptHistory((prev) => {
        const updated = [newItem, ...prev.filter(item => item.id !== newId)].slice(0, 3);
        try {
          localStorage.setItem('stratiq_concept_history', JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to save concept history to localStorage', e);
        }
        return updated;
      });
      setActiveConceptId(newId);

      const logoConcept = (result as any)?.brandIdentity?.logoConcept || (result as any)?.branding?.logoConcept;

      if (logoConcept) {
        setIsLogoLoading(true);
        try {
          const base64Image = await generateLogoImage(logoConcept);
          const fullLogoUrl = `data:image/jpeg;base64,${base64Image}`;
          setLogoImageUrl(fullLogoUrl);

          // Update the saved history item with the generated logo
          setConceptHistory((prev) => {
            const updated = prev.map(item => item.id === newId ? { ...item, logoImageUrl: fullLogoUrl } : item);
            try {
              localStorage.setItem('stratiq_concept_history', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        } catch (logoError) {
          console.error('Logo generation failed:', logoError);
        } finally {
          setIsLogoLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      showToast(err instanceof Error ? err.message : 'Strategy generation failed', 'error');
      trackEvent('generate_error', 'User', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userInput, analysisMode, image, isVerified, showToast]);

  const handleSelectConcept = (item: ConceptHistoryItem) => {
    setActiveConceptId(item.id);
    setAnalysisResult(item.analysisResult);
    setAnalysisMode(item.analysisMode);
    setUserInput(item.userInput);
    setLogoImageUrl(item.logoImageUrl);
    setError(null);
    showToast(`Loaded "${item.conceptTitle}" from history`, 'info');
  };

  const handleClearHistory = () => {
    setConceptHistory([]);
    setActiveConceptId(null);
    try {
      localStorage.removeItem('stratiq_concept_history');
    } catch {}
    showToast('Concept history cleared', 'info');
  };

  const handleModeChange = (mode: AnalysisMode) => {
    setAnalysisMode(mode);
    setAnalysisResult(null);
    setError(null);
    trackEvent('change_mode', 'User', mode);
  }

  const handleResendVerification = async () => {
    if (user?.email) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      if (error) {
        alert(`Error resending verification: ${error.message}`);
      } else {
        alert('Verification email sent! Please check your inbox.');
      }
    }
  };

  const handleInviteMember = (email: string) => {
      const newMember: TeamMember = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          role: 'viewer',
          status: 'pending'
      };
      setTeamMembers([...teamMembers, newMember]);
      alert(`Invitation sent to ${email}`);
  };

  const handleAddComment = (sectionId: string, text: string) => {
      const newComment: Comment = {
          id: Math.random().toString(36).substr(2, 9),
          sectionId,
          text,
          author: profile?.full_name || user?.email || 'Anonymous',
          timestamp: new Date()
      };
      setComments([...comments, newComment]);
  };


  const showSettings = () => {
    trackEvent('view_settings', 'User');
    setView('settings');
  };
  const showMain = () => setView('main');

  if (!session || !user) {
    return <LandingPage />;
  }

  // --- GATEKEEPING LOGIC ---
  // If user is logged in but has no subscription tier set, show Pricing Page
  if (!profile?.subscription_tier) {
      return <PricingPage onSelectPlan={handleUpdatePlan} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header onShowSettings={showSettings} avatarUrl={profile?.avatar_url} />
      {session && !isVerified && <VerificationBanner onResend={handleResendVerification} />}
      
      {/* Collaboration / Team Header Action */}
      <div className="fixed top-20 right-4 z-40">
           <button 
             onClick={() => setShowTeamModal(true)}
             className="bg-gray-800 p-2 rounded-full shadow-lg border border-gray-700 hover:bg-gray-700 text-indigo-400 transition-colors"
             title="Manage Team"
           >
               <Users size={20} />
           </button>
      </div>

      <TeamModal 
        isOpen={showTeamModal} 
        onClose={() => setShowTeamModal(false)}
        members={teamMembers}
        onInvite={handleInviteMember}
      />

      <main className="container mx-auto px-4 py-8">
        {view === 'main' ? (
          <>
            <Hero />
            <div className="bg-gray-800 shadow-2xl rounded-2xl p-6 md:p-10 border border-gray-700">
              <InputPanel
                userInput={userInput}
                setUserInput={setUserInput}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                setError={setError}
                analysisMode={analysisMode}
                onModeChange={handleModeChange}
                image={image?.file}
                setImage={setImage}
                isVerified={isVerified}
              />
              {error && (
                <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
            </div>

            <ConceptHistory 
              history={conceptHistory}
              activeId={activeConceptId}
              onSelectConcept={handleSelectConcept}
              onClearHistory={handleClearHistory}
            />

            <ResultsPanel 
              analysisResult={analysisResult}
              logoImageUrl={logoImageUrl}
              isLoading={isLoading}
              isLogoLoading={isLogoLoading}
              analysisMode={analysisMode}
              comments={comments}
              onAddComment={handleAddComment}
              isCollaborative={profile.subscription_tier === 'enterprise'}
            />
          </>
        ) : (
          <ProfileSettings 
            user={user} 
            onBack={showMain} 
            onProfileUpdate={() => fetchProfile(user)}
          />
        )}
      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Powered by Gemini API | Plan: <span className="uppercase text-indigo-400">{profile.subscription_tier}</span></p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
