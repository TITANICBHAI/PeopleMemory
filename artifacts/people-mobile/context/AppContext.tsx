import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

export interface PersonDate {
  id: string;
  date: string;
  label: string;
  reminder?: boolean;
  reminderTime?: string;
}

export interface Interaction {
  id: string;
  date: string;
  note: string;
  audioUri?: string;
}

export interface Person {
  id: string;
  name: string;
  phone?: string;
  photoUri?: string;
  tags: string[];
  trustLevel: number | null;
  description: string;
  likes: string;
  dislikes: string;
  thingsToRemember: string;
  quickFacts: string;
  birthday?: string;
  birthdayReminderTime?: string;
  firstMet?: string;
  lastMet?: string;
  nextMeeting?: string;
  nextMeetingTime?: string;
  customDates: PersonDate[];
  interactions: Interaction[];
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface State {
  people: Person[];
  groups: Group[];
  pinHash: string | null;
  isUnlocked: boolean;
  isLoading: boolean;
  hasSeenTutorial: boolean;
  hasAcceptedPrivacy: boolean;
}

interface CtxValue extends State {
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  lock: () => void;
  resetInactivity: () => void;
  markTutorialSeen: () => Promise<void>;
  acceptPrivacy: () => Promise<void>;
  addPerson: (p: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Person>;
  updatePerson: (p: Person) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  getPersonById: (id: string) => Person | undefined;
  clearAllData: () => Promise<void>;
  addInteraction: (personId: string, note: string, audioUri?: string) => Promise<void>;
  deleteInteraction: (personId: string, interactionId: string) => Promise<void>;
  getRawData: () => { people: Person[]; groups: Group[]; pinHash: string | null };
  importRawData: (people: Person[]) => Promise<void>;
  addGroup: (g: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Group>;
  updateGroup: (g: Group) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
}

const Ctx = createContext<CtxValue | null>(null);

const PEOPLE_KEY = 'pm_people_v1';
const PIN_KEY = 'pm_pin_v1';
const TUTORIAL_KEY = 'pm_tutorial_seen';
const PRIVACY_KEY = 'pm_privacy_accepted';
const GROUPS_KEY = 'pm_groups_v1';
const AUTO_LOCK_MS = 5 * 60 * 1000;

async function sha256(text: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function migratePerson(p: any): Person {
  return {
    ...p,
    interactions: (p.interactions ?? []).map((i: any) => ({
      id: i.id,
      date: i.date,
      note: i.note,
      audioUri: i.audioUri,
    })),
    customDates: p.customDates ?? [],
  };
}

function migrateGroup(g: any): Group {
  return {
    id: g.id,
    name: g.name,
    emoji: g.emoji ?? '👥',
    color: g.color ?? '#007ACC',
    description: g.description ?? '',
    memberIds: g.memberIds ?? [],
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({
    people: [],
    groups: [],
    pinHash: null,
    isUnlocked: false,
    isLoading: true,
    hasSeenTutorial: false,
    hasAcceptedPrivacy: false,
  });
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      try {
        const [rawPeople, rawPin, rawTutorial, rawPrivacy, rawGroups] = await Promise.all([
          AsyncStorage.getItem(PEOPLE_KEY),
          AsyncStorage.getItem(PIN_KEY),
          AsyncStorage.getItem(TUTORIAL_KEY),
          AsyncStorage.getItem(PRIVACY_KEY),
          AsyncStorage.getItem(GROUPS_KEY),
        ]);
        const parsed: Person[] = rawPeople ? JSON.parse(rawPeople).map(migratePerson) : [];
        const parsedGroups: Group[] = rawGroups ? JSON.parse(rawGroups).map(migrateGroup) : [];
        setState(s => ({
          ...s,
          people: parsed,
          groups: parsedGroups,
          pinHash: rawPin,
          hasSeenTutorial: rawTutorial === '1',
          hasAcceptedPrivacy: rawPrivacy === '1',
          isLoading: false,
        }));
      } catch {
        setState(s => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (appStateRef.current === 'active' && next.match(/inactive|background/)) {
        lockTimer.current = setTimeout(() => {
          setState(s => {
            if (s.isUnlocked) {
              router.replace('/');
              return { ...s, isUnlocked: false };
            }
            return s;
          });
        }, AUTO_LOCK_MS);
      } else if (next === 'active') {
        if (lockTimer.current) clearTimeout(lockTimer.current);
      }
      appStateRef.current = next;
    });
    return () => { sub.remove(); if (lockTimer.current) clearTimeout(lockTimer.current); };
  }, []);

  const savePeople = async (people: Person[]) => {
    await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
  };

  const saveGroups = async (groups: Group[]) => {
    await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  };

  const setupPin = useCallback(async (pin: string) => {
    const hash = await sha256(pin);
    await AsyncStorage.setItem(PIN_KEY, hash);
    setState(s => ({ ...s, pinHash: hash, isUnlocked: true }));
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const hash = await sha256(pin);
    const ok = hash === state.pinHash;
    if (ok) setState(s => ({ ...s, isUnlocked: true }));
    return ok;
  }, [state.pinHash]);

  const lock = useCallback(() => {
    setState(s => ({ ...s, isUnlocked: false }));
    router.replace('/');
  }, []);

  const markTutorialSeen = useCallback(async () => {
    await AsyncStorage.setItem(TUTORIAL_KEY, '1');
    setState(s => ({ ...s, hasSeenTutorial: true }));
  }, []);

  const acceptPrivacy = useCallback(async () => {
    await AsyncStorage.setItem(PRIVACY_KEY, '1');
    setState(s => ({ ...s, hasAcceptedPrivacy: true }));
  }, []);

  const resetInactivity = useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      setState(s => {
        if (s.isUnlocked) {
          router.replace('/');
          return { ...s, isUnlocked: false };
        }
        return s;
      });
    }, AUTO_LOCK_MS);
  }, []);

  const addPerson = useCallback(async (data: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>): Promise<Person> => {
    const now = new Date().toISOString();
    const person: Person = { ...data, id: uid(), createdAt: now, updatedAt: now };
    const next = [...state.people, person];
    await savePeople(next);
    setState(s => ({ ...s, people: next }));
    return person;
  }, [state.people]);

  const updatePerson = useCallback(async (person: Person) => {
    const next = state.people.map(p =>
      p.id === person.id ? { ...person, updatedAt: new Date().toISOString() } : p
    );
    await savePeople(next);
    setState(s => ({ ...s, people: next }));
  }, [state.people]);

  const deletePerson = useCallback(async (id: string) => {
    const next = state.people.filter(p => p.id !== id);
    await savePeople(next);
    const nextGroups = state.groups.map(g => ({
      ...g,
      memberIds: g.memberIds.filter(mid => mid !== id),
    }));
    await saveGroups(nextGroups);
    setState(s => ({ ...s, people: next, groups: nextGroups }));
  }, [state.people, state.groups]);

  const getPersonById = useCallback((id: string) => {
    return state.people.find(p => p.id === id);
  }, [state.people]);

  const clearAllData = useCallback(async () => {
    await AsyncStorage.multiRemove([PEOPLE_KEY, GROUPS_KEY]);
    setState(s => ({ ...s, people: [], groups: [] }));
    router.replace('/dashboard');
  }, []);

  const addInteraction = useCallback(async (personId: string, note: string, audioUri?: string) => {
    const interaction: Interaction = {
      id: uid(),
      date: new Date().toISOString(),
      note: note.trim(),
      audioUri,
    };
    const next = state.people.map(p => {
      if (p.id !== personId) return p;
      return {
        ...p,
        interactions: [interaction, ...(p.interactions ?? [])],
        updatedAt: new Date().toISOString(),
      };
    });
    await savePeople(next);
    setState(s => ({ ...s, people: next }));
  }, [state.people]);

  const deleteInteraction = useCallback(async (personId: string, interactionId: string) => {
    const next = state.people.map(p => {
      if (p.id !== personId) return p;
      return {
        ...p,
        interactions: (p.interactions ?? []).filter(i => i.id !== interactionId),
        updatedAt: new Date().toISOString(),
      };
    });
    await savePeople(next);
    setState(s => ({ ...s, people: next }));
  }, [state.people]);

  const getRawData = useCallback(() => {
    return { people: state.people, groups: state.groups, pinHash: state.pinHash };
  }, [state.people, state.groups, state.pinHash]);

  const importRawData = useCallback(async (people: Person[]) => {
    const migrated = people.map(migratePerson);
    await savePeople(migrated);
    setState(s => ({ ...s, people: migrated }));
  }, []);

  const addGroup = useCallback(async (data: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> => {
    const now = new Date().toISOString();
    const group: Group = { ...data, id: uid(), createdAt: now, updatedAt: now };
    const next = [...state.groups, group];
    await saveGroups(next);
    setState(s => ({ ...s, groups: next }));
    return group;
  }, [state.groups]);

  const updateGroup = useCallback(async (group: Group) => {
    const next = state.groups.map(g =>
      g.id === group.id ? { ...group, updatedAt: new Date().toISOString() } : g
    );
    await saveGroups(next);
    setState(s => ({ ...s, groups: next }));
  }, [state.groups]);

  const deleteGroup = useCallback(async (id: string) => {
    const next = state.groups.filter(g => g.id !== id);
    await saveGroups(next);
    setState(s => ({ ...s, groups: next }));
  }, [state.groups]);

  return (
    <Ctx.Provider value={{
      ...state,
      setupPin, verifyPin, lock, resetInactivity, markTutorialSeen, acceptPrivacy,
      addPerson, updatePerson, deletePerson, getPersonById, clearAllData,
      addInteraction, deleteInteraction, getRawData, importRawData,
      addGroup, updateGroup, deleteGroup,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
