import React, { useState, useCallback, useEffect } from 'react';
import { 
  AnalysisResult, 
  AnalysisMode, 
  SubscriptionTier, 
  TeamMember, 
  Comment, 
  ConceptHistoryItem,
  SavedStrategy,
  BusinessIdeaItem,
  WizardData
} from './types';
import { generateStrategy, generateLogoImage } from './services/geminiService';
import InputPanel from './components/InputPanel';
import ResultsPanel from './components/ResultsPanel';
import { Header, AppNavTab } from './components/Header';
import { Hero } from './components/Hero';
import LandingPage from './components/LandingPage';
import ProfileSettings from './components/ProfileSettings';
import VerificationBanner from './components/VerificationBanner';
import PricingPage from './components/PricingPage';
import { AuthProvider, useAuth } from './services/AuthContext';
import { updateUserProfile } from './services/authService';
import { OnboardingModal } from './components/OnboardingModal';
import { trackEvent } from './services/analytics';
import { Users, Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';
import { TeamModal } from './components/CollaborationTools';
import { ToastProvider, useToast } from './components/Toast';
import { ConceptHistory } from './components/ConceptHistory';
import { DashboardOverview } from './components/DashboardOverview';
import { AnalysisWizard } from './components/AnalysisWizard';
import { SavedStrategiesView } from './components/SavedStrategiesView';
import { BusinessIdeasVault } from './components/BusinessIdeasVault';
import { BusinessAdvisorChat } from './components/BusinessAdvisorChat';
import { 
  fetchUserStrategies, 
  saveStrategyToFirestore, 
  updateStrategyInFirestore, 
  deleteStrategyFromFirestore, 
  duplicateStrategyInFirestore, 
  fetchUserIdeas, 
  saveIdeaToFirestore, 
  deleteIdeaFromFirestore 
} from './services/firestoreService';
import { 
  getSavedStrategies, 
  syncStrategiesWithLocal,
  getSavedIdeas, 
  syncIdeasWithLocal,
  getDashboardStats 
} from './services/strategyStorage';
import { exportStrategyToPdf } from './services/pdfExportService';
import { validateEnvironment } from './services/envValidation';
import { 
  loadRazorpayCheckoutScript, 
  createProSubscription, 
  verifySubscriptionPayment 
} from './services/subscriptionService';

const AppContent: React.FC = () => {
  const { showToast } = useToast();

  // Validate client environment upon app load
  useEffect(() => {
    validateEnvironment();
  }, []);

  const { 
    user, 
    userProfile, 
    subscription,
    isPro,
    authLoading,
    isAuthenticated, 
    isEmailVerified, 
    isAnonymous, 
    isOnline, 
    refreshProfile, 
    refreshVerification,
    refreshSubscription,
    logout
  } = useAuth();

  // Route mapping helpers
  const tabToPath = (tab: AppNavTab): string => {
    switch (tab) {
      case 'dashboard': return '/dashboard';
      case 'new_analysis': return '/new-analysis';
      case 'saved_strategies': return '/saved-strategies';
      case 'ideas_vault': return '/idea-vault';
      case 'advisor': return '/ai-advisor';
      case 'settings': return '/settings';
      case 'pricing': return '/pricing';
      default: return '/dashboard';
    }
  };

  const pathToTab = (pathname: string): AppNavTab | null => {
    const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/';
    if (normalized === '/dashboard' || normalized === '/command-center') return 'dashboard';
    if (normalized === '/new-analysis') return 'new_analysis';
    if (normalized === '/saved-strategies') return 'saved_strategies';
    if (normalized === '/idea-vault') return 'ideas_vault';
    if (normalized === '/ai-advisor') return 'advisor';
    if (normalized === '/settings' || normalized === '/profile') return 'settings';
    if (normalized === '/pricing') return 'pricing';
    return null;
  };

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<AppNavTab>(() => {
    if (typeof window !== 'undefined') {
      const tab = pathToTab(window.location.pathname);
      return tab || 'dashboard';
    }
    return 'dashboard';
  });

  // Track intended protected destination for post-login redirect
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot' | null>(null);

  // Synchronize URL routing & Protected Route Enforcement
  useEffect(() => {
    if (authLoading) return;

    const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';

    if (!user) {
      // User is logged out
      const matchedProtectedTab = pathToTab(pathname);
      if (matchedProtectedTab) {
        // Protected route accessed without auth -> Redirect to /login and preserve destination
        setIntendedDestination(pathname);
        setAuthModalMode('login');
        window.history.replaceState(null, '', '/login');
      } else if (pathname === '/login') {
        setAuthModalMode('login');
      } else if (pathname === '/signup') {
        setAuthModalMode('signup');
      } else if (pathname === '/forgot-password') {
        setAuthModalMode('forgot');
      } else {
        setAuthModalMode(null);
      }
    } else {
      // User is authenticated
      if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/') {
        // Redirect authenticated user away from public auth/home routes to dashboard or intended target
        const targetPath = intendedDestination || '/dashboard';
        const targetTab = pathToTab(targetPath) || 'dashboard';
        setIntendedDestination(null);
        setAuthModalMode(null);
        setCurrentTab(targetTab);
        window.history.replaceState(null, '', tabToPath(targetTab));
      } else {
        const matchedTab = pathToTab(pathname);
        if (matchedTab) {
          setCurrentTab(matchedTab);
        }
      }
    }
  }, [user, authLoading, intendedDestination]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      if (!user) {
        const matchedTab = pathToTab(pathname);
        if (matchedTab) {
          setIntendedDestination(pathname);
          setAuthModalMode('login');
          window.history.replaceState(null, '', '/login');
        } else if (pathname === '/login') {
          setAuthModalMode('login');
        } else if (pathname === '/signup') {
          setAuthModalMode('signup');
        } else if (pathname === '/forgot-password') {
          setAuthModalMode('forgot');
        } else {
          setAuthModalMode(null);
        }
      } else {
        const matchedTab = pathToTab(pathname);
        if (matchedTab) {
          setCurrentTab(matchedTab);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const handleNavigateTab = (tab: AppNavTab) => {
    setCurrentTab(tab);
    const newPath = tabToPath(tab);
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  };

  const handleOpenLogin = () => {
    setAuthModalMode('login');
    if (window.location.pathname !== '/login') {
      window.history.pushState(null, '', '/login');
    }
  };

  const handleOpenSignup = () => {
    setAuthModalMode('signup');
    if (window.location.pathname !== '/signup') {
      window.history.pushState(null, '', '/signup');
    }
  };

  const handleLogoutSuccess = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    setIntendedDestination(null);
    setAuthModalMode(null);
    setCurrentTab('dashboard');
    window.history.pushState(null, '', '/');
  };

  const handleLoginSuccess = () => {
    const targetPath = intendedDestination || '/dashboard';
    const targetTab = pathToTab(targetPath) || 'dashboard';
    setIntendedDestination(null);
    setAuthModalMode(null);
    setCurrentTab(targetTab);
    window.history.replaceState(null, '', tabToPath(targetTab));
  };

  // App State
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('deep');
  const [userInput, setUserInput] = useState<string>('');
  const [image, setImage] = useState<{ b64: string; mimeType: string; file: File } | null>(null);
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [activeStrategy, setActiveStrategy] = useState<SavedStrategy | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLogoLoading, setIsLogoLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding modal visibility
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

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

  // Persistent storage state from Firestore
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>(() => getSavedStrategies(user?.uid));
  const [savedIdeas, setSavedIdeas] = useState<BusinessIdeaItem[]>(() => getSavedIdeas(user?.uid));
  const [wizardPrefill, setWizardPrefill] = useState<Partial<WizardData> | null>(null);
  const [currentWizardData, setCurrentWizardData] = useState<WizardData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [showTeamModal, setShowTeamModal] = useState(false);

  // Collaboration State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  // Load Firestore data whenever authenticated user changes
  useEffect(() => {
    if (!user) {
      setSavedStrategies(getSavedStrategies());
      setSavedIdeas(getSavedIdeas());
      return;
    }

    let isMounted = true;
    async function loadFirestoreData() {
      setIsLoadingData(true);
      try {
        const [strategies, ideas] = await Promise.all([
          fetchUserStrategies(user!.uid),
          fetchUserIdeas(user!.uid),
        ]);

        if (isMounted) {
          if (strategies && strategies.length > 0) {
            setSavedStrategies(strategies);
            syncStrategiesWithLocal(strategies, user!.uid);
          }
          if (ideas && ideas.length > 0) {
            setSavedIdeas(ideas);
            syncIdeasWithLocal(ideas, user!.uid);
          }
        }
      } catch (err) {
        console.warn('Could not load initial data from Firestore:', err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    loadFirestoreData();

    // Check if onboarding needs to be shown for first-time signups
    if (userProfile && userProfile.onboardingCompleted === false && !isAnonymous) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user, userProfile, isAnonymous]);

  // Derived real dashboard stats from active strategies & ideas
  const overviewStats = getDashboardStats(user?.uid, savedStrategies, savedIdeas);

  const [isProcessingPro, setIsProcessingPro] = useState(false);

  // Check URL query on return for ?payment=success (Requirement 33)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      showToast('Verifying your Founder Pro subscription...', 'info');
      refreshSubscription().then(() => {
        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);
      }).catch(() => {});
    }
  }, [refreshSubscription, showToast]);

  const handleGetProSubscription = async () => {
    if (!user) {
      setIntendedDestination('/pricing');
      setAuthModalMode('login');
      if (window.location.pathname !== '/login') {
        window.history.pushState(null, '', '/login');
      }
      return;
    }

    if (subscription?.plan === 'pro' && subscription?.status === 'active') {
      showToast('You are already actively subscribed to Founder Pro!', 'info');
      return;
    }

    setIsProcessingPro(true);
    try {
      // 1. Ensure Razorpay script is dynamically loaded
      const isScriptLoaded = await loadRazorpayCheckoutScript();
      if (!isScriptLoaded) {
        throw new Error('Could not load Razorpay payment SDK. Please check your internet connection and try again.');
      }

      // 2. Call backend /api/razorpay/create-subscription
      const createRes = await createProSubscription();
      if (!createRes.success) {
        if (createRes.code === 'ALREADY_SUBSCRIBED') {
          showToast('You already have an active Pro subscription.', 'info');
          await refreshSubscription();
          return;
        }
        throw new Error(createRes.message || 'Failed to initiate Founder Pro subscription.');
      }

      const subscriptionId = createRes.subscriptionId;
      const keyId = createRes.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!subscriptionId || !keyId) {
        throw new Error('Missing subscription credentials from server. Please configure backend credentials.');
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: 'StratIQ',
        description: 'Founder Pro Subscription ($29/mo)',
        handler: async function (response: any) {
          setIsProcessingPro(true);
          try {
            // 4. Verification call to backend
            const verifyRes = await verifySubscriptionPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              await refreshSubscription();
              await refreshProfile();
              showToast('Founder Pro subscription activated successfully! Welcome to Pro.', 'success');
              setCurrentTab('dashboard');
            } else {
              showToast(verifyRes.message || 'Payment verification failed. Please contact support.', 'error');
            }
          } catch (verifyErr: any) {
            showToast('Error verifying payment: ' + (verifyErr.message || 'Unknown error'), 'error');
          } finally {
            setIsProcessingPro(false);
          }
        },
        prefill: {
          name: userProfile?.displayName || user.displayName || '',
          email: user.email || '',
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPro(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('[StratIQ] Subscription error:', err);
      showToast(err.message || 'Could not initiate subscription. Please try again.', 'error');
    } finally {
      setIsProcessingPro(false);
    }
  };

  // Common handler after strategy generation
  const handleStrategyReceived = async (
    result: AnalysisResult, 
    mode: AnalysisMode, 
    inputDetails: { businessName?: string; businessIdea?: string; industry?: string; fullInputText: string }
  ) => {
    setAnalysisResult(result);
    setAnalysisMode(mode);

    const name = 
      inputDetails.businessName || 
      (result as any)?.brandIdentity?.companyNameSuggestions?.[0] ||
      (result as any)?.branding?.companyNameSuggestions?.[0] ||
      inputDetails.fullInputText.split('\n')[0].substring(0, 40).trim() ||
      'New Venture';

    const industry = inputDetails.industry || 'Technology & Services';
    const score = (result as any)?.businessScore?.overallScore || ((result as any)?.ideaValidation?.score ? Math.round((result as any).ideaValidation.score * 10) : 80);

    const strategyPayload = {
      businessName: name,
      industry,
      mode,
      score,
      status: 'validated' as const,
      result,
      inputs: {
        businessName: inputDetails.businessName,
        businessIdea: inputDetails.businessIdea,
        industry: inputDetails.industry,
        userInput: inputDetails.fullInputText,
      }
    };

    let newSaved: SavedStrategy;
    if (user) {
      try {
        const savedResult = await saveStrategyToFirestore(user.uid, strategyPayload);
        newSaved = typeof savedResult === 'string'
          ? { ...strategyPayload, id: savedResult, createdAt: Date.now(), updatedAt: Date.now() }
          : savedResult;
        setSavedStrategies(prev => [newSaved, ...(prev || []).filter(s => s && s.id !== newSaved.id)]);
        syncStrategiesWithLocal([newSaved, ...(savedStrategies || []).filter(Boolean)], user.uid);
      } catch (e) {
        console.warn('Falling back to local strategy save:', e);
        newSaved = {
          ...strategyPayload,
          id: 'strat_' + Date.now().toString(36),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setSavedStrategies(prev => [newSaved, ...(prev || []).filter(Boolean)]);
      }
    } else {
      newSaved = {
        ...strategyPayload,
        id: 'strat_' + Date.now().toString(36),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSavedStrategies(prev => [newSaved, ...(prev || []).filter(Boolean)]);
    }

    setActiveStrategy(newSaved);

    // Update 3-item quick history
    const subtitle =
      (result as any)?.brandIdentity?.sloganSuggestions?.[0] ||
      (result as any)?.marketAnalysis?.uniqueSellingProposition ||
      (result as any)?.marketSummary ||
      inputDetails.fullInputText.substring(0, 80).trim();

    const newHistoryItem: ConceptHistoryItem = {
      id: newSaved.id,
      conceptTitle: name,
      subtitle,
      timestamp: Date.now(),
      analysisMode: mode,
      userInput: inputDetails.fullInputText,
      analysisResult: result,
      logoImageUrl: null,
      score: (result as any)?.ideaValidation?.score,
    };

    setConceptHistory((prev) => {
      const updated = [newHistoryItem, ...prev.filter(item => item.id !== newSaved.id)].slice(0, 3);
      try {
        localStorage.setItem('stratiq_concept_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setActiveConceptId(newSaved.id);

    // Check for logo generation
    const logoConcept = (result as any)?.brandIdentity?.logoConcept || (result as any)?.branding?.logoConcept;
    if (logoConcept) {
      setIsLogoLoading(true);
      try {
        const base64Image = await generateLogoImage(logoConcept);
        const fullLogoUrl = `data:image/jpeg;base64,${base64Image}`;
        setLogoImageUrl(fullLogoUrl);

        setConceptHistory((prev) => {
          const updated = prev.map(item => item.id === newSaved.id ? { ...item, logoImageUrl: fullLogoUrl } : item);
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
  };

  // Handler for wizard submission
  const handleWizardGenerate = async (
    wizardData: WizardData, 
    selectedMode: AnalysisMode, 
    uploadedImage?: { b64: string; mimeType: string; file: File } | null
  ) => {
    const composedText = `Startup Name: ${wizardData.businessName || 'Unnamed'}\nIndustry: ${wizardData.industry}\nTarget Customer: ${wizardData.targetCustomer}\nGeographic Market: ${wizardData.location}\nBusiness Model: ${wizardData.businessModel}\nStage: ${wizardData.stage}\nPrimary Goal: ${wizardData.primaryGoal}\nTarget Revenue: ${wizardData.targetRevenue}\nTimeline: ${wizardData.timeline}\nBudget: ${wizardData.budget}\n\nCore Concept:\n${wizardData.businessIdea}`;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setLogoImageUrl(null);
    trackEvent('wizard_generate_strategy', 'User', selectedMode);

    try {
      setCurrentWizardData(wizardData);
      const result = await generateStrategy(selectedMode, composedText, uploadedImage);
      await handleStrategyReceived(result, selectedMode, {
        businessName: wizardData.businessName,
        businessIdea: wizardData.businessIdea,
        industry: wizardData.industry,
        fullInputText: composedText,
      });
      showToast('Comprehensive business blueprint generated and saved to Firestore!', 'success');
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      showToast(err instanceof Error ? err.message : 'Strategy generation failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConcept = (item: ConceptHistoryItem) => {
    setActiveConceptId(item.id);
    setAnalysisResult(item.analysisResult);
    setAnalysisMode(item.analysisMode);
    setUserInput(item.userInput);
    setLogoImageUrl(item.logoImageUrl);
    setError(null);
    setCurrentTab('new_analysis');
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

  const handleOpenStrategy = (strat: SavedStrategy) => {
    setActiveStrategy(strat);
    setAnalysisResult(strat.result);
    setAnalysisMode(strat.mode || 'deep');
    setUserInput(strat.inputs?.userInput || strat.inputs?.businessIdea || '');
    if (strat.inputs) {
      setCurrentWizardData({
        businessName: strat.businessName || '',
        businessIdea: strat.inputs.businessIdea || '',
        industry: strat.industry || '',
        targetCustomer: strat.inputs.targetCustomer || '',
        location: strat.inputs.location || '',
        businessModel: strat.inputs.businessModel || '',
        primaryGoal: strat.inputs.primaryGoal || '',
        targetRevenue: strat.inputs.targetRevenue || '',
        timeline: strat.inputs.timeline || '',
        stage: strat.stage || '',
        budget: strat.inputs.budget || '',
      });
    }
    setCurrentTab('new_analysis');
    showToast(`Loaded "${strat.businessName}" strategy report`, 'info');
  };

  const handleRenameStrategy = async (id: string, newName: string) => {
    setSavedStrategies(prev => (prev || []).map(s => s && s.id === id ? { ...s, businessName: newName, updatedAt: Date.now() } : s).filter(Boolean));
    if (user) {
      try {
        await updateStrategyInFirestore(user.uid, id, { businessName: newName });
      } catch (e) {
        console.warn('Failed to rename in Firestore:', e);
      }
    }
    showToast('Renamed strategy successfully', 'success');
  };

  const handleUpdateStatus = async (id: string, newStatus: SavedStrategy['status']) => {
    setSavedStrategies(prev => (prev || []).map(s => s && s.id === id ? { ...s, status: newStatus, updatedAt: Date.now() } : s).filter(Boolean));
    if (user) {
      try {
        await updateStrategyInFirestore(user.uid, id, { status: newStatus });
      } catch (e) {
        console.warn('Failed to update status in Firestore:', e);
      }
    }
    showToast(`Status updated to ${newStatus}`, 'success');
  };

  const handleDeleteStrategy = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this strategy from your cloud workspace?')) {
      setSavedStrategies(prev => (prev || []).filter(s => s && s.id !== id));
      if (user) {
        try {
          await deleteStrategyFromFirestore(user.uid, id);
        } catch (e) {
          console.warn('Failed to delete in Firestore:', e);
        }
      }
      showToast('Strategy deleted from Firestore', 'info');
    }
  };

  const handleDuplicateStrategy = async (id: string) => {
    if (!user) return;
    try {
      const dup = await duplicateStrategyInFirestore(user.uid, id);
      setSavedStrategies(prev => [dup, ...prev]);
      showToast(`Duplicated "${dup.businessName}"`, 'success');
    } catch (e: any) {
      showToast('Failed to duplicate strategy: ' + e.message, 'error');
    }
  };

  const handleSaveIdea = async (newIdea: BusinessIdeaItem) => {
    if (user) {
      try {
        const saved = await saveIdeaToFirestore(user.uid, newIdea);
        setSavedIdeas(prev => [saved, ...prev.filter(i => i.id !== saved.id)]);
      } catch (e) {
        setSavedIdeas(prev => [newIdea, ...prev.filter(i => i.id !== newIdea.id)]);
      }
    } else {
      setSavedIdeas(prev => [newIdea, ...prev.filter(i => i.id !== newIdea.id)]);
    }
    showToast('Saved to Business Idea Vault', 'success');
  };

  const handleDeleteIdea = async (id: string) => {
    setSavedIdeas(prev => prev.filter(i => i.id !== id));
    if (user) {
      try {
        await deleteIdeaFromFirestore(user.uid, id);
      } catch (e) {
        console.warn('Failed to delete idea from Firestore:', e);
      }
    }
    showToast('Idea removed from vault', 'info');
  };

  const handleAnalyzeIdea = (idea: BusinessIdeaItem) => {
    setWizardPrefill({
      businessName: idea.title,
      businessIdea: idea.description,
      industry: idea.industry || 'SaaS & Software',
    });
    setCurrentTab('new_analysis');
    showToast(`Pushed "${idea.title}" into Strategy Wizard`, 'info');
  };

  const handleExportStrategyPdf = async (strat: SavedStrategy) => {
    try {
      await exportStrategyToPdf({
        result: strat.result,
        mode: strat.mode || 'deep',
        conceptTitle: strat.businessName,
      });
      showToast(`Exported ${strat.businessName} (PDF)`, 'success');
    } catch (err: any) {
      showToast('PDF Export failed: ' + err.message, 'error');
    }
  };

  const handleInviteMember = (email: string) => {
    const newMember: TeamMember = {
      id: Math.random().toString(36).substring(2, 9),
      email,
      role: 'viewer',
      status: 'pending'
    };
    setTeamMembers([...teamMembers, newMember]);
    showToast(`Invitation sent to ${email}`, 'success');
  };

  const handleAddComment = (sectionId: string, text: string) => {
    const newComment: Comment = {
      id: Math.random().toString(36).substring(2, 9),
      sectionId,
      text,
      author: userProfile?.displayName || user?.displayName || user?.email || 'Founder',
      timestamp: new Date()
    };
    setComments([...comments, newComment]);
  };

  // If unauthenticated, display the SaaS landing page with signup / login
  if (!user) {
    return (
      <LandingPage 
        initialAuthMode={authModalMode}
        onOpenLogin={handleOpenLogin}
        onOpenSignup={handleOpenSignup}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const currentPlan: SubscriptionTier = isPro ? 'pro' : (userProfile?.subscriptionPlan === 'enterprise' ? 'enterprise' : 'free');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      <div>
        <Header 
          currentTab={currentTab}
          onSelectTab={handleNavigateTab}
          onLogout={handleLogoutSuccess}
          avatarUrl={user.photoURL} 
          userEmail={user.email}
          displayName={userProfile?.displayName || user.displayName}
          isVerified={isEmailVerified}
        />

        {!isEmailVerified && !isAnonymous && (
          <VerificationBanner 
            email={user.email} 
            onRefresh={refreshVerification}
            isOnline={isOnline} 
          />
        )}

        {/* First-time Onboarding Modal */}
        {showOnboarding && (
          <OnboardingModal
            userId={user.uid}
            onComplete={() => {
              setShowOnboarding(false);
              refreshProfile();
              showToast('Workspace tailored to your venture!', 'success');
            }}
            onSkip={() => {
              setShowOnboarding(false);
              refreshProfile();
            }}
          />
        )}
        
        {/* Collaboration Team Button */}
        <div className="fixed bottom-6 right-6 z-40">
          <button 
            onClick={() => setShowTeamModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-indigo-400 p-3.5 rounded-full shadow-2xl border border-slate-700 hover:border-indigo-500 transition-all flex items-center gap-2 group"
            title="Manage Team & Co-Founders"
          >
            <Users size={18} />
            <span className="text-xs font-bold text-white hidden group-hover:inline pr-1">Team</span>
          </button>
        </div>

        <TeamModal 
          isOpen={showTeamModal} 
          onClose={() => setShowTeamModal(false)}
          members={teamMembers}
          onInvite={handleInviteMember}
        />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* 1. COMMAND CENTER (DASHBOARD) */}
          {currentTab === 'dashboard' && (
            <DashboardOverview 
              stats={overviewStats}
              recentStrategies={savedStrategies}
              subscription={subscription}
              onStartNewAnalysis={() => setCurrentTab('new_analysis')}
              onOpenAdvisor={() => setCurrentTab('advisor')}
              onOpenStrategy={handleOpenStrategy}
              onViewAllStrategies={() => setCurrentTab('saved_strategies')}
              onUpgradePro={() => setCurrentTab('pricing')}
            />
          )}

          {/* 2. NEW ANALYSIS (WIZARD & REPORT) */}
          {currentTab === 'new_analysis' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                    <span>AI Business Strategy Generator</span>
                  </h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Step-by-step venture analysis, market validation, and financial modeling.
                  </p>
                </div>

                {analysisResult && (
                  <button
                    onClick={() => setAnalysisResult(null)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Run Another Strategy</span>
                  </button>
                )}
              </div>

              {/* Wizard Form */}
              {!analysisResult && (
                <AnalysisWizard 
                  onGenerate={handleWizardGenerate}
                  isLoading={isLoading}
                  isVerified={isEmailVerified || isAnonymous}
                  initialData={wizardPrefill || undefined}
                />
              )}

              {error && (
                <div className="bg-rose-950/50 border border-rose-700/60 text-rose-300 px-4 py-3 rounded-xl text-sm" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span>{error}</span>
                </div>
              )}

              {/* History Bar */}
              {conceptHistory.length > 0 && !analysisResult && (
                <ConceptHistory 
                  history={conceptHistory}
                  activeId={activeConceptId}
                  onSelectConcept={handleSelectConcept}
                  onClearHistory={handleClearHistory}
                />
              )}

              {/* Strategic Results Panel */}
              {analysisResult && (
                <ResultsPanel 
                  analysisResult={analysisResult}
                  logoImageUrl={logoImageUrl}
                  isLoading={isLoading}
                  isLogoLoading={isLogoLoading}
                  analysisMode={analysisMode}
                  comments={comments}
                  onAddComment={handleAddComment}
                  isCollaborative={currentPlan === 'enterprise'}
                  wizardData={currentWizardData}
                />
              )}
            </div>
          )}

          {/* 3. SAVED STRATEGIES */}
          {currentTab === 'saved_strategies' && (
            <SavedStrategiesView 
              strategies={savedStrategies}
              onOpenStrategy={handleOpenStrategy}
              onRenameStrategy={handleRenameStrategy}
              onUpdateStatus={handleUpdateStatus}
              onDeleteStrategy={handleDeleteStrategy}
              onDuplicateStrategy={handleDuplicateStrategy}
              onCreateNew={() => setCurrentTab('new_analysis')}
              onExportPdf={handleExportStrategyPdf}
            />
          )}

          {/* 4. IDEA VAULT */}
          {currentTab === 'ideas_vault' && (
            <BusinessIdeasVault 
              ideas={savedIdeas}
              onSaveIdea={handleSaveIdea}
              onDeleteIdea={handleDeleteIdea}
              onAnalyzeIdea={handleAnalyzeIdea}
            />
          )}

          {/* 5. AI ADVISOR CHAT */}
          {currentTab === 'advisor' && (
            <div className="max-w-4xl mx-auto animate-fadeIn">
              <BusinessAdvisorChat 
                currentStrategy={activeStrategy || savedStrategies[0] || null}
                activeAnalysisResult={analysisResult}
                businessName={activeStrategy?.businessName || 'My Venture'}
                businessIdea={activeStrategy?.inputs?.businessIdea || activeStrategy?.inputs?.userInput || userInput}
                industry={activeStrategy?.industry || 'Technology & Services'}
              />
            </div>
          )}

          {/* 6. SUBSCRIPTION PRICING */}
          {currentTab === 'pricing' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Subscription Plans</span>
                <h2 className="text-3xl font-extrabold text-white mt-1">Upgrade Your Startup Velocity</h2>
                <p className="text-sm text-slate-400 mt-2">
                  Current plan: <strong className="text-indigo-400 uppercase">{currentPlan}</strong>
                </p>
              </div>
              <PricingPage 
                onSelectPlan={() => handleGetProSubscription()} 
                subscription={subscription}
                isProcessing={isProcessingPro}
                onGetPro={handleGetProSubscription}
              />
            </div>
          )}

          {/* 7. PROFILE SETTINGS */}
          {currentTab === 'settings' && (
            <ProfileSettings 
              user={user} 
              profile={userProfile}
              onBack={() => setCurrentTab('dashboard')} 
              onProfileUpdate={refreshProfile}
              onAccountDeleted={() => {
                setCurrentTab('dashboard');
                showToast('Account deleted successfully.', 'info');
              }}
            />
          )}
        </main>
      </div>

      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-400 mt-12">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} StratIQ — AI Business Co-Founder. Connected to Firebase Firestore.</p>
          <div className="flex items-center gap-4 text-xs">
            <span>Powered by Gemini 2.5 Flash</span>
            <span>•</span>
            <span>Workspace: <span className="uppercase font-bold text-indigo-400">{currentPlan}</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
