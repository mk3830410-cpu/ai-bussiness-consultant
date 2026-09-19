import { SavedStrategy, BusinessIdeaItem, AnalysisResult } from '../types';
import { auth } from './authService';
import { 
  fetchUserStrategies, 
  saveStrategyToFirestore, 
  updateStrategyInFirestore, 
  deleteStrategyFromFirestore, 
  duplicateStrategyInFirestore, 
  fetchUserIdeas, 
  saveIdeaToFirestore, 
  updateIdeaInFirestore, 
  deleteIdeaFromFirestore 
} from './firestoreService';

const STORAGE_PREFIX = 'stratiq_saved_strategies_';
const IDEAS_PREFIX = 'stratiq_business_ideas_';

const DEMO_SAMPLE_STRATEGY: SavedStrategy = {
  id: 'strat_ecobite_demo',
  businessName: 'EcoBite',
  industry: 'FoodTech & Sustainability',
  createdAt: Date.now() - 86400000 * 2, // 2 days ago
  updatedAt: Date.now() - 86400000 * 2,
  score: 84,
  status: 'validated',
  mode: 'deep',
  inputs: {
    businessName: 'EcoBite',
    businessIdea: 'AI-driven zero-waste personalized meal kit subscription that predicts household eating patterns and partners with local organic regenerative farms.',
    industry: 'FoodTech & Sustainability',
    targetCustomer: 'Eco-conscious millennial professionals and dual-income urban families',
    location: 'North America (US Metros)',
    businessModel: 'Direct-to-Consumer Subscription (Weekly / Monthly)',
    primaryGoal: 'Validate market demand and build waitlist for seed round',
    targetRevenue: '$50k MRR within 12 months',
    timeline: '3 months to MVP',
    stage: 'Prototype',
    budget: '$15,000 bootstrapped',
  },
  result: {
    executiveSummary: 'EcoBite bridges the gap between convenient meal planning and environmental accountability. By employing lightweight predictive demand algorithms, EcoBite eliminates the 30% perishability waste common in legacy meal kits while delivering farm-to-table organic ingredients with 100% compostable packaging.',
    businessScore: {
      overallScore: 84,
      breakdown: {
        marketAttractiveness: 89,
        competitiveAdvantage: 72,
        financialViability: 85,
        executionFeasibility: 88,
        founderFit: 86,
      },
      analysisSummary: 'Strong structural tailwinds in sustainability and rising consumer aversion to grocery waste. High recurring revenue potential offset by supply chain logistics complexity.',
    },
    ideaValidation: {
      score: 8.4,
      verdict: 'Strong validation signals. High consumer willingness to pay for verified zero-waste circular packaging.',
      risks: ['Cold chain logistics costs in suburban regions', 'Initial CAC on paid social channels'],
      strengths: ['High retention among eco-advocates', 'Zero-waste narrative generates organic earned media'],
    },
  },
};

const getStorageKey = (userId?: string): string => {
  const uid = userId || auth.currentUser?.uid || 'anonymous';
  return `${STORAGE_PREFIX}${uid}`;
};

const getIdeasKey = (userId?: string): string => {
  const uid = userId || auth.currentUser?.uid || 'anonymous';
  return `${IDEAS_PREFIX}${uid}`;
};

// ==========================================
// STRATEGIES STORAGE
// ==========================================

export const getSavedStrategies = (userId?: string): SavedStrategy[] => {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = [DEMO_SAMPLE_STRATEGY];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const valid = parsed.filter((s): s is SavedStrategy => Boolean(s && typeof s === 'object' && s.id));
      return valid.length > 0 ? valid : [DEMO_SAMPLE_STRATEGY];
    }
    return [DEMO_SAMPLE_STRATEGY];
  } catch (err) {
    console.error('Error reading saved strategies:', err);
    return [DEMO_SAMPLE_STRATEGY];
  }
};

export const syncStrategiesWithLocal = (strategies: SavedStrategy[], userId?: string) => {
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(strategies));
  } catch {}
};

export const saveStrategy = (strategy: Omit<SavedStrategy, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: number; updatedAt?: number }, userId?: string): SavedStrategy => {
  const id = strategy.id || 'strat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const now = Date.now();
  const newStrategy: SavedStrategy = {
    ...strategy,
    id,
    createdAt: strategy.createdAt || now,
    updatedAt: now,
  } as SavedStrategy;

  try {
    const current = getSavedStrategies(userId);
    const existingIndex = current.findIndex(s => s.id === id);
    let updated: SavedStrategy[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = newStrategy;
    } else {
      updated = [newStrategy, ...current];
    }
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));

    // Firestore async sync
    const currentUid = userId || auth.currentUser?.uid;
    if (currentUid) {
      saveStrategyToFirestore(currentUid, newStrategy).catch(err => {
        console.warn('Background Firestore save failed:', err);
      });
    }
  } catch (err) {
    console.error('Error saving strategy:', err);
  }

  return newStrategy;
};

export const updateStrategyName = (id: string, newName: string, userId?: string): void => {
  try {
    const current = getSavedStrategies(userId);
    const updated = current.map(s => s.id === id ? { ...s, businessName: newName, updatedAt: Date.now() } : s);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));

    const currentUid = userId || auth.currentUser?.uid;
    if (currentUid) {
      updateStrategyInFirestore(currentUid, id, { businessName: newName }).catch(err => {
        console.warn('Background Firestore rename failed:', err);
      });
    }
  } catch (err) {
    console.error('Error updating strategy name:', err);
  }
};

export const updateStrategyStatus = (
  id: string, 
  status: SavedStrategy['status'], 
  userId?: string
): void => {
  try {
    const current = getSavedStrategies(userId);
    const updated = current.map(s => s && s.id === id ? { ...s, status, updatedAt: Date.now() } : s).filter(Boolean);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));

    const currentUid = userId || auth.currentUser?.uid;
    if (currentUid) {
      updateStrategyInFirestore(currentUid, id, { status }).catch(err => {
        console.warn('Background Firestore status update failed:', err);
      });
    }
  } catch (err) {
    console.error('Error updating strategy status:', err);
  }
};

export const deleteStrategy = (id: string, userId?: string): void => {
  try {
    const current = getSavedStrategies(userId);
    const updated = current.filter(s => s.id !== id);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));

    const currentUid = userId || auth.currentUser?.uid;
    if (currentUid) {
      deleteStrategyFromFirestore(currentUid, id).catch(err => {
        console.warn('Background Firestore delete failed:', err);
      });
    }
  } catch (err) {
    console.error('Error deleting strategy:', err);
  }
};

export const duplicateStrategy = async (id: string, userId?: string): Promise<SavedStrategy | null> => {
  const currentUid = userId || auth.currentUser?.uid;
  if (currentUid) {
    try {
      const dup = await duplicateStrategyInFirestore(currentUid, id);
      const current = getSavedStrategies(userId);
      const updated = [dup, ...current];
      localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
      return dup;
    } catch (e) {
      console.warn('Firestore duplicate fallback to local:', e);
    }
  }

  const current = getSavedStrategies(userId);
  const target = current.find(s => s.id === id);
  if (!target) return null;

  const duplicated: SavedStrategy = {
    ...target,
    id: 'strat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    businessName: `${target.businessName} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'draft',
  };

  const updated = [duplicated, ...current];
  localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  return duplicated;
};

export const getStrategyById = (id: string, userId?: string): SavedStrategy | null => {
  const all = getSavedStrategies(userId);
  return all.find(s => s.id === id) || null;
};

// ==========================================
// BUSINESS IDEAS STORAGE
// ==========================================

export const getBusinessIdeas = (userId?: string): BusinessIdeaItem[] => {
  try {
    const key = getIdeasKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial: BusinessIdeaItem[] = [
        {
          id: 'idea_1',
          title: 'AI Contract Review for Freelancers',
          description: 'A micro-SaaS tool that scans freelance client contracts, highlights unfair liability clauses, and drafts professional revision emails.',
          industry: 'LegalTech',
          tags: ['SaaS', 'Freelance', 'AI'],
          createdAt: Date.now() - 86400000 * 3,
          status: 'exploring',
        },
        {
          id: 'idea_2',
          title: 'Decentralized Peer-to-Peer Pet Sitting',
          description: 'A verified neighborhood pet sitting exchange with automated insurance escrows and smart pet biometric check-ins.',
          industry: 'PetCare & Marketplace',
          tags: ['Marketplace', 'Mobile App', 'Consumer'],
          createdAt: Date.now() - 86400000 * 5,
          status: 'new',
        },
        {
          id: 'idea_3',
          title: 'Autonomous Cold-Email Personalizer for B2B Agencies',
          description: 'Deep-scrapes prospect LinkedIn posts, GitHub activity, and company earnings transcripts to write hyper-personalized 1-to-1 outreach emails.',
          industry: 'SaaS & Software',
          tags: ['SaaS', 'B2B', 'AI'],
          createdAt: Date.now() - 86400000 * 1,
          status: 'validated',
        },
        {
          id: 'idea_4',
          title: 'Embedded Invoice Factoring for Creators',
          description: 'Instant automated cash advance infrastructure that integrates with Stripe, YouTube, and TikTok creator payouts using real-time predictive analytics.',
          industry: 'Fintech',
          tags: ['Fintech', 'SaaS', 'Creator Economy'],
          createdAt: Date.now() - 86400000 * 2,
          status: 'exploring',
        },
        {
          id: 'idea_5',
          title: 'Pocket CFO Mobile App for Solopreneurs',
          description: 'Native mobile app providing real-time cashflow forecasting, automated tax withholding alerts, and expense anomaly detection with receipt camera scanning.',
          industry: 'Fintech',
          tags: ['Mobile App', 'Fintech', 'SaaS'],
          createdAt: Date.now() - 86400000 * 4,
          status: 'new',
        }
      ];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((i): i is BusinessIdeaItem => Boolean(i && typeof i === 'object' && i.id));
    }
    return [];
  } catch (err) {
    console.error('Error reading business ideas:', err);
    return [];
  }
};

export const syncIdeasWithLocal = (ideas: BusinessIdeaItem[], userId?: string) => {
  try {
    const key = getIdeasKey(userId);
    localStorage.setItem(key, JSON.stringify((ideas || []).filter(Boolean)));
  } catch {}
};

export const saveBusinessIdea = (idea: BusinessIdeaItem, userId?: string): void => {
  try {
    const current = getBusinessIdeas(userId);
    const existingIndex = current.findIndex(i => i.id === idea.id);
    let updated: BusinessIdeaItem[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = idea;
    } else {
      updated = [idea, ...current];
    }
    localStorage.setItem(getIdeasKey(userId), JSON.stringify(updated.filter(Boolean)));

    const currentUid = userId || auth.currentUser?.uid;
    if (currentUid) {
      saveIdeaToFirestore(currentUid, idea).catch(err => {
        console.warn('Background Firestore save idea failed:', err);
      });
    }
  } catch (err) {
    console.error('Error saving business idea:', err);
  }
};

export const deleteBusinessIdea = (id: string, userId?: string): void => {
  try {
    const current = getBusinessIdeas(userId);
    const updated = current.filter(i => i && i.id !== id);
    localStorage.setItem(getIdeasKey(userId), JSON.stringify(updated));

    const currentUid = userId || auth.currentUser?.uid;
    if (currentUid) {
      deleteIdeaFromFirestore(currentUid, id).catch(err => {
        console.warn('Background Firestore delete idea failed:', err);
      });
    }
  } catch (err) {
    console.error('Error deleting business idea:', err);
  }
};

export const getDashboardStats = (userId?: string, cachedStrategies?: SavedStrategy[], cachedIdeas?: BusinessIdeaItem[]) => {
  const rawStrategies = cachedStrategies || getSavedStrategies(userId);
  const rawIdeas = cachedIdeas || getBusinessIdeas(userId);

  const strategies = (Array.isArray(rawStrategies) ? rawStrategies : []).filter((s): s is SavedStrategy => Boolean(s && typeof s === 'object'));
  const ideas = (Array.isArray(rawIdeas) ? rawIdeas : []).filter((i): i is BusinessIdeaItem => Boolean(i && typeof i === 'object'));

  const totalAnalyzed = strategies.length;
  const strategiesGenerated = strategies.filter(s => s && s.status !== 'draft').length;
  
  let marketOpportunities = 0;
  let totalScore = 0;

  strategies.forEach(s => {
    if (!s) return;
    const opps = (s.result as any)?.marketAnalysis?.swot?.opportunities?.length || 3;
    marketOpportunities += opps;
    const score = (s.result as any)?.businessScore?.overallScore || (s.result as any)?.businessOpportunityScore?.overallScore || ((s.result as any)?.ideaValidation?.score ? Math.round((s.result as any).ideaValidation.score * 10) : null) || s.score || 75;
    totalScore += score;
  });

  const averageScore = totalAnalyzed > 0 ? Math.round(totalScore / totalAnalyzed) : 84;

  return {
    ideasAnalyzed: totalAnalyzed + ideas.length,
    strategiesGenerated: Math.max(strategiesGenerated, strategies.length),
    marketOpportunities: Math.max(marketOpportunities, 8),
    averageScore: averageScore || 84,
  };
};

export const getSavedIdeas = getBusinessIdeas;
export const saveIdea = saveBusinessIdea;
export const deleteIdea = deleteBusinessIdea;
export const getOverviewStats = getDashboardStats;
