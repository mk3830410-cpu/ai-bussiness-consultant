import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SavedStrategy, BusinessIdeaItem, AnalysisResult, AnalysisMode } from '../types';

export interface FirestoreStrategyRecord extends SavedStrategy {
  userId: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  notifications: boolean;
  emailNotifications: boolean;
  defaultIndustry: string;
  defaultMarket: string;
  language: string;
  updatedAt?: string;
}

export interface UserOnboardingData {
  businessIdea?: string;
  industry?: string;
  targetCustomer?: string;
  stage?: string;
}

export interface PersistedChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  createdAt: string;
}

// ==========================================
// 1. STRATEGIES SUBCOLLECTION (users/{uid}/strategies)
// ==========================================

export async function fetchUserStrategies(uid: string): Promise<SavedStrategy[]> {
  const path = `users/${uid}/strategies`;
  try {
    const colRef = collection(db, 'users', uid, 'strategies');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        businessName: data.businessName || 'Unnamed Venture',
        industry: data.industry || 'Technology & Services',
        createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now(),
        score: typeof data.score === 'number' ? data.score : 80,
        status: data.status || 'draft',
        mode: data.mode || 'deep',
        result: data.result,
        inputs: data.inputs || {},
      } as SavedStrategy;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveStrategyToFirestore(uid: string, strategy: Omit<SavedStrategy, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<SavedStrategy> {
  const id = strategy.id || 'strat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  const path = `users/${uid}/strategies/${id}`;
  const nowIso = new Date().toISOString();

  const record = {
    id,
    userId: uid,
    businessName: strategy.businessName || 'Venture Strategy',
    industry: strategy.industry || 'Technology',
    score: typeof strategy.score === 'number' ? strategy.score : 80,
    status: strategy.status || 'validated',
    mode: strategy.mode || 'deep',
    result: strategy.result || {},
    inputs: strategy.inputs || {},
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    await setDoc(doc(db, 'users', uid, 'strategies', id), record);
    return {
      ...strategy,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as SavedStrategy;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateStrategyInFirestore(uid: string, strategyId: string, updates: Partial<SavedStrategy>): Promise<void> {
  const path = `users/${uid}/strategies/${strategyId}`;
  try {
    const docRef = doc(db, 'users', uid, 'strategies', strategyId);
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (updates.businessName !== undefined) updateData.businessName = updates.businessName;
    if (updates.industry !== undefined) updateData.industry = updates.industry;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.score !== undefined) updateData.score = updates.score;
    if (updates.result !== undefined) updateData.result = updates.result;
    if (updates.inputs !== undefined) updateData.inputs = updates.inputs;

    await updateDoc(docRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStrategyFromFirestore(uid: string, strategyId: string): Promise<void> {
  const path = `users/${uid}/strategies/${strategyId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'strategies', strategyId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function duplicateStrategyInFirestore(uid: string, strategyId: string): Promise<SavedStrategy> {
  const path = `users/${uid}/strategies/${strategyId}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'strategies', strategyId));
    if (!snap.exists()) {
      throw new Error('Strategy to duplicate not found.');
    }
    const data = snap.data();
    const duplicatedName = `${data.businessName} (Copy)`;
    return await saveStrategyToFirestore(uid, {
      businessName: duplicatedName,
      industry: data.industry,
      score: data.score,
      status: 'draft',
      mode: data.mode,
      result: data.result,
      inputs: data.inputs,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ==========================================
// 2. BUSINESS IDEAS VAULT (users/{uid}/ideas)
// ==========================================

export async function fetchUserIdeas(uid: string): Promise<BusinessIdeaItem[]> {
  const path = `users/${uid}/ideas`;
  try {
    const colRef = collection(db, 'users', uid, 'ideas');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        title: d.title || 'Untitled Idea',
        description: d.description || '',
        industry: d.industry || 'Technology',
        status: d.status || 'raw',
        tags: Array.isArray(d.tags) ? d.tags : [],
        notes: d.notes || '',
        createdAt: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
        updatedAt: d.updatedAt ? new Date(d.updatedAt).getTime() : Date.now(),
      } as BusinessIdeaItem;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveIdeaToFirestore(uid: string, idea: Omit<BusinessIdeaItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<BusinessIdeaItem> {
  const id = idea.id || 'idea_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const path = `users/${uid}/ideas/${id}`;
  const nowIso = new Date().toISOString();

  const record = {
    id,
    userId: uid,
    title: idea.title || 'New Business Spark',
    description: idea.description || '',
    industry: idea.industry || 'Technology',
    status: idea.status || 'raw',
    tags: Array.isArray(idea.tags) ? idea.tags : [],
    notes: idea.notes || '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    await setDoc(doc(db, 'users', uid, 'ideas', id), record);
    return {
      ...idea,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as BusinessIdeaItem;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateIdeaInFirestore(uid: string, ideaId: string, updates: Partial<BusinessIdeaItem>): Promise<void> {
  const path = `users/${uid}/ideas/${ideaId}`;
  try {
    const docRef = doc(db, 'users', uid, 'ideas', ideaId);
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.industry !== undefined) updateData.industry = updates.industry;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    await updateDoc(docRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteIdeaFromFirestore(uid: string, ideaId: string): Promise<void> {
  const path = `users/${uid}/ideas/${ideaId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'ideas', ideaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// 3. AI ADVISOR CHAT PERSISTENCE (users/{uid}/chats/main/messages)
// ==========================================

export async function fetchChatHistory(uid: string, chatId: string = 'main'): Promise<PersistedChatMessage[]> {
  const path = `users/${uid}/chats/${chatId}/messages`;
  try {
    const colRef = collection(db, 'users', uid, 'chats', chatId, 'messages');
    const q = query(colRef, orderBy('timestamp', 'asc'), limit(50));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => docSnap.data() as PersistedChatMessage);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveChatMessage(uid: string, chatId: string = 'main', role: 'user' | 'assistant' | 'system', content: string): Promise<PersistedChatMessage> {
  const messageId = 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const path = `users/${uid}/chats/${chatId}/messages/${messageId}`;
  const now = Date.now();

  const record: PersistedChatMessage = {
    id: messageId,
    userId: uid,
    role,
    content,
    timestamp: now,
    createdAt: new Date(now).toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', uid, 'chats', chatId, 'messages', messageId), record);
    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function clearChatHistory(uid: string, chatId: string = 'main'): Promise<void> {
  const path = `users/${uid}/chats/${chatId}/messages`;
  try {
    const colRef = collection(db, 'users', uid, 'chats', chatId, 'messages');
    const snapshot = await getDocs(colRef);
    const deleteOps = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deleteOps);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// 4. USER SETTINGS & PREFERENCES (users/{uid}/settings/preferences)
// ==========================================

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  notifications: true,
  emailNotifications: true,
  defaultIndustry: 'SaaS & AI Software',
  defaultMarket: 'North America / Global',
  language: 'en',
};

export async function fetchUserSettings(uid: string): Promise<UserPreferences> {
  const path = `users/${uid}/settings/preferences`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'settings', 'preferences'));
    if (snap.exists()) {
      return { ...DEFAULT_PREFERENCES, ...snap.data() } as UserPreferences;
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserSettings(uid: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const path = `users/${uid}/settings/preferences`;
  try {
    const docRef = doc(db, 'users', uid, 'settings', 'preferences');
    const merged = {
      ...DEFAULT_PREFERENCES,
      ...prefs,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, merged, { merge: true });
    return merged;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// 5. USER ONBOARDING & PROFILE
// ==========================================

export async function updateUserProfile(uid: string, data: Record<string, any>): Promise<void> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveUserOnboardingData(uid: string, data: UserOnboardingData): Promise<void> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      onboardingCompleted: true,
      onboardingData: data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==========================================
// 6. REAL DASHBOARD STATS (Driven directly by Firestore)
// ==========================================

export async function fetchUserDashboardStats(uid: string) {
  try {
    const [strategies, ideas] = await Promise.all([
      fetchUserStrategies(uid),
      fetchUserIdeas(uid),
    ]);

    const totalAnalyses = strategies.length;
    const validatedStrategies = strategies.filter(s => s.status === 'validated' || s.status === 'launched').length;
    const totalIdeas = ideas.length;

    const scores = strategies.map(s => s.score || 0).filter(s => s > 0);
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
      : 84;

    return {
      totalAnalyses,
      validatedStrategies,
      totalIdeas,
      avgScore,
      strategies,
      ideas,
    };
  } catch (error) {
    console.error('Error calculating dashboard stats from Firestore:', error);
    return {
      totalAnalyses: 0,
      validatedStrategies: 0,
      totalIdeas: 0,
      avgScore: 84,
      strategies: [],
      ideas: [],
    };
  }
}
