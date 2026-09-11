import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SavedStrategy, BusinessIdeaItem } from '../types';

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

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  notifications: true,
  emailNotifications: true,
  defaultIndustry: 'SaaS & AI Software',
  defaultMarket: 'North America / Global',
  language: 'en',
};

// Local storage backup keys helper
const getStrategyKey = (uid: string) => `stratiq_strategies_${uid}`;
const getIdeaKey = (uid: string) => `stratiq_ideas_${uid}`;
const getSettingsKey = (uid: string) => `stratiq_settings_${uid}`;
const getChatKey = (strategyId: string) => `stratiq_chat_${strategyId}`;

// ==========================================
// 1. STRATEGIES SUBCOLLECTION
// ==========================================

export async function fetchUserStrategies(uid: string): Promise<SavedStrategy[]> {
  if (!uid) return [];

  try {
    const strategiesRef = collection(db, 'users', uid, 'strategies');
    const q = query(strategiesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const remoteList: SavedStrategy[] = snapshot.docs.map(docSnap => ({
      ...(docSnap.data() as SavedStrategy),
      id: docSnap.id,
    }));

    if (remoteList.length > 0) {
      localStorage.setItem(getStrategyKey(uid), JSON.stringify(remoteList));
      return remoteList;
    }
  } catch (error) {
    console.warn('Firestore fetchUserStrategies failed, using local cache:', error);
  }

  // Fallback to local cache
  try {
    const raw = localStorage.getItem(getStrategyKey(uid));
    if (!raw) return [];
    const list: SavedStrategy[] = JSON.parse(raw);
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch {
    return [];
  }
}

export async function saveStrategyToFirestore(
  strategy: Omit<SavedStrategy, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> {
  const uid = strategy.userId;
  const now = Date.now();
  const id = strategy.id || `strat_${Math.random().toString(36).substring(2, 9)}_${now}`;

  const completeStrategy: SavedStrategy = {
    ...strategy,
    id,
    createdAt: now,
    updatedAt: now,
  } as SavedStrategy;

  // 1. Update local storage for immediate UI responsiveness
  try {
    const localList = await fetchUserStrategies(uid);
    const existingIndex = localList.findIndex(s => s.id === id);
    if (existingIndex >= 0) {
      localList[existingIndex] = completeStrategy;
    } else {
      localList.unshift(completeStrategy);
    }
    localStorage.setItem(getStrategyKey(uid), JSON.stringify(localList));
  } catch (e) {
    console.error('Failed to update local strategy list:', e);
  }

  // 2. Persist to Firestore
  try {
    const stratDocRef = doc(db, 'users', uid, 'strategies', id);
    await setDoc(stratDocRef, {
      ...completeStrategy,
      updatedAt: serverTimestamp(),
      createdAt: completeStrategy.createdAt || now,
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore saveStrategy failed, strategy preserved locally:', error);
  }

  return id;
}

export async function updateStrategyInFirestore(
  strategyId: string,
  updates: Partial<SavedStrategy>
): Promise<void> {
  const now = Date.now();

  // 1. Local update
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('stratiq_strategies_')) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const list: SavedStrategy[] = JSON.parse(raw);
        const index = list.findIndex(item => item.id === strategyId);
        if (index >= 0) {
          list[index] = { ...list[index], ...updates, updatedAt: now };
          localStorage.setItem(key, JSON.stringify(list));
          
          // 2. Remote update if userId found
          const uid = list[index].userId;
          if (uid) {
            try {
              const stratDocRef = doc(db, 'users', uid, 'strategies', strategyId);
              await updateDoc(stratDocRef, {
                ...updates,
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              console.warn('Firestore updateDoc failed, updated locally:', err);
            }
          }
          return;
        }
      } catch (e) {
        console.error('Error updating strategy:', e);
      }
    }
  }
}

export async function deleteStrategyFromFirestore(strategyId: string): Promise<void> {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('stratiq_strategies_')) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const list: SavedStrategy[] = JSON.parse(raw);
        const target = list.find(s => s.id === strategyId);
        if (target) {
          const filtered = list.filter(item => item.id !== strategyId);
          localStorage.setItem(key, JSON.stringify(filtered));

          const uid = target.userId;
          if (uid) {
            try {
              const stratDocRef = doc(db, 'users', uid, 'strategies', strategyId);
              await deleteDoc(stratDocRef);
            } catch (err) {
              console.warn('Firestore deleteDoc failed:', err);
            }
          }
          return;
        }
      } catch (e) {
        console.error('Error deleting strategy:', e);
      }
    }
  }
}

export async function duplicateStrategyInFirestore(
  strategyId: string,
  uid: string
): Promise<SavedStrategy | null> {
  const list = await fetchUserStrategies(uid);
  const target = list.find(s => s.id === strategyId);
  if (!target) return null;

  const duplicated: SavedStrategy = {
    ...target,
    id: `strat_copy_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
    title: `${target.title} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveStrategyToFirestore(duplicated);
  return duplicated;
}

// ==========================================
// 2. IDEAS SUBCOLLECTION
// ==========================================

export async function fetchUserIdeas(uid: string): Promise<BusinessIdeaItem[]> {
  if (!uid) return [];

  try {
    const ideasRef = collection(db, 'users', uid, 'ideas');
    const q = query(ideasRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const remoteList: BusinessIdeaItem[] = snapshot.docs.map(docSnap => ({
      ...(docSnap.data() as BusinessIdeaItem),
      id: docSnap.id,
    }));

    if (remoteList.length > 0) {
      localStorage.setItem(getIdeaKey(uid), JSON.stringify(remoteList));
      return remoteList;
    }
  } catch (error) {
    console.warn('Firestore fetchUserIdeas failed, using local cache:', error);
  }

  try {
    const raw = localStorage.getItem(getIdeaKey(uid));
    if (!raw) return [];
    const list: BusinessIdeaItem[] = JSON.parse(raw);
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch {
    return [];
  }
}

export async function saveIdeaToFirestore(
  idea: Omit<BusinessIdeaItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> {
  const uid = idea.userId;
  const now = Date.now();
  const id = idea.id || `idea_${Math.random().toString(36).substring(2, 9)}_${now}`;

  const completeIdea: BusinessIdeaItem = {
    ...idea,
    id,
    createdAt: now,
    updatedAt: now,
  } as BusinessIdeaItem;

  // Local storage
  try {
    const localList = await fetchUserIdeas(uid);
    const existingIndex = localList.findIndex(i => i.id === id);
    if (existingIndex >= 0) {
      localList[existingIndex] = completeIdea;
    } else {
      localList.unshift(completeIdea);
    }
    localStorage.setItem(getIdeaKey(uid), JSON.stringify(localList));
  } catch (e) {
    console.error('Failed to update local idea cache:', e);
  }

  // Remote Firestore
  try {
    const ideaDocRef = doc(db, 'users', uid, 'ideas', id);
    await setDoc(ideaDocRef, {
      ...completeIdea,
      updatedAt: serverTimestamp(),
      createdAt: completeIdea.createdAt || now,
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore saveIdea failed, preserved locally:', error);
  }

  return id;
}

export async function updateIdeaInFirestore(
  ideaId: string,
  updates: Partial<BusinessIdeaItem>
): Promise<void> {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('stratiq_ideas_')) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const list: BusinessIdeaItem[] = JSON.parse(raw);
        const index = list.findIndex(item => item.id === ideaId);
        if (index >= 0) {
          list[index] = { ...list[index], ...updates };
          localStorage.setItem(key, JSON.stringify(list));

          const uid = list[index].userId;
          if (uid) {
            try {
              const ideaDocRef = doc(db, 'users', uid, 'ideas', ideaId);
              await updateDoc(ideaDocRef, updates);
            } catch (err) {
              console.warn('Firestore updateIdea failed:', err);
            }
          }
          return;
        }
      } catch (e) {
        console.error('Failed to update idea:', e);
      }
    }
  }
}

export async function deleteIdeaFromFirestore(ideaId: string): Promise<void> {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('stratiq_ideas_')) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const list: BusinessIdeaItem[] = JSON.parse(raw);
        const target = list.find(item => item.id === ideaId);
        if (target) {
          const filtered = list.filter(item => item.id !== ideaId);
          localStorage.setItem(key, JSON.stringify(filtered));

          const uid = target.userId;
          if (uid) {
            try {
              const ideaDocRef = doc(db, 'users', uid, 'ideas', ideaId);
              await deleteDoc(ideaDocRef);
            } catch (err) {
              console.warn('Firestore deleteIdea failed:', err);
            }
          }
          return;
        }
      } catch (e) {
        console.error('Failed to delete idea:', e);
      }
    }
  }
}

// ==========================================
// 3. USER SETTINGS & PREFERENCES
// ==========================================

export async function fetchUserSettings(uid: string): Promise<UserPreferences> {
  if (!uid) return DEFAULT_PREFERENCES;

  try {
    const settingsDoc = await getDoc(doc(db, 'users', uid, 'settings', 'preferences'));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data() as UserPreferences;
      localStorage.setItem(getSettingsKey(uid), JSON.stringify(data));
      return { ...DEFAULT_PREFERENCES, ...data };
    }
  } catch (err) {
    console.warn('Firestore fetchUserSettings fallback to local:', err);
  }

  try {
    const raw = localStorage.getItem(getSettingsKey(uid));
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
    return DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function saveUserSettings(
  uid: string,
  prefs: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current = await fetchUserSettings(uid);
  const merged: UserPreferences = {
    ...current,
    ...prefs,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(getSettingsKey(uid), JSON.stringify(merged));

  try {
    await setDoc(doc(db, 'users', uid, 'settings', 'preferences'), merged, { merge: true });
  } catch (error) {
    console.warn('Firestore saveUserSettings failed:', error);
  }

  return merged;
}

export async function updateUserProfile(uid: string, data: Record<string, any>): Promise<void> {
  try {
    const raw = localStorage.getItem(`stratiq_profile_${uid}`);
    const existing = raw ? JSON.parse(raw) : {};
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(`stratiq_profile_${uid}`, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update profile data locally:', error);
  }

  try {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore updateUserProfile failed:', err);
  }
}

export async function saveUserOnboardingData(uid: string, data: UserOnboardingData): Promise<void> {
  try {
    const raw = localStorage.getItem(`stratiq_onboarding_${uid}`);
    const existing = raw ? JSON.parse(raw) : {};
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(`stratiq_onboarding_${uid}`, JSON.stringify(updated));
    await updateUserProfile(uid, { onboardingCompleted: true, ...data });
  } catch (error) {
    console.error('Failed to save onboarding data:', error);
  }
}

// ==========================================
// 4. CHAT HISTORY
// ==========================================

export async function fetchChatHistory(strategyId: string): Promise<any[]> {
  try {
    const raw = localStorage.getItem(getChatKey(strategyId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveChatMessage(strategyId: string, message: any): Promise<void> {
  try {
    const list = await fetchChatHistory(strategyId);
    list.push(message);
    localStorage.setItem(getChatKey(strategyId), JSON.stringify(list));
  } catch (error) {
    console.error('Failed to save chat message:', error);
  }
}

export async function clearChatHistory(strategyId: string): Promise<void> {
  try {
    localStorage.removeItem(getChatKey(strategyId));
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
}

export async function fetchSharedStrategy(strategyId: string): Promise<SavedStrategy | null> {
  try {
    const sharedDoc = await getDoc(doc(db, 'shared_strategies', strategyId));
    if (sharedDoc.exists()) {
      return sharedDoc.data() as SavedStrategy;
    }
  } catch {}

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('stratiq_strategies_')) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const list: SavedStrategy[] = JSON.parse(raw);
        const match = list.find(s => s.id === strategyId);
        if (match) return match;
      }
    }
    return null;
  } catch {
    return null;
  }
}
