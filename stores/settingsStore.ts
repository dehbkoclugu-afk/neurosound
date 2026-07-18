/**
 * Settings Store - User preferences and accessibility settings
 */

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isClient = typeof window !== 'undefined';

// Safe storage wrapper
const safeStorage: StateStorage = {
  getItem: async (name: string) => {
    if (!isClient) return null;
    try {
      return await AsyncStorage.getItem(name);
    } catch (e) {
      console.log('Storage getItem error:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    if (!isClient) return;
    try {
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      console.log('Storage setItem error:', e);
    }
  },
  removeItem: async (name: string) => {
    if (!isClient) return;
    try {
      await AsyncStorage.removeItem(name);
    } catch (e) {
      console.log('Storage removeItem error:', e);
    }
  },
};

export type ThemeMode = 'light' | 'dark' | 'auto';
export type Language = 'tr' | 'en';

interface SettingsState {
  // Appearance
  theme: ThemeMode;
  reduceMotion: boolean;
  lowContrast: boolean;

  // Language
  language: Language;

  // Audio
  maxVolume: number; // 0-1, safety limit
  defaultVolume: number;

  // Onboarding
  hasSeenOnboarding: boolean;
  hasSeenHeadphoneWarning: boolean;
  hasSeenEpilepsyWarning: boolean;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setReduceMotion: (reduce: boolean) => void;
  setLowContrast: (low: boolean) => void;
  setLanguage: (language: Language) => void;
  setMaxVolume: (volume: number) => void;
  setDefaultVolume: (volume: number) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setHasSeenHeadphoneWarning: (seen: boolean) => void;
  setHasSeenEpilepsyWarning: (seen: boolean) => void;
  resetSettings: () => void;
}

const initialState = {
  theme: 'auto' as ThemeMode,
  reduceMotion: false,
  lowContrast: false,
  language: 'tr' as Language,
  maxVolume: 0.8,
  defaultVolume: 0.5,
  hasSeenOnboarding: false,
  hasSeenHeadphoneWarning: false,
  hasSeenEpilepsyWarning: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,

      setTheme: (theme) => set({ theme }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setLowContrast: (lowContrast) => set({ lowContrast }),
      setLanguage: (language) => set({ language }),
      setMaxVolume: (maxVolume) => set({ maxVolume: Math.max(0.1, Math.min(1, maxVolume)) }),
      setDefaultVolume: (defaultVolume) => set({ defaultVolume: Math.max(0, Math.min(1, defaultVolume)) }),
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
      setHasSeenHeadphoneWarning: (hasSeenHeadphoneWarning) => set({ hasSeenHeadphoneWarning }),
      setHasSeenEpilepsyWarning: (hasSeenEpilepsyWarning) => set({ hasSeenEpilepsyWarning }),
      resetSettings: () => set(initialState),
    }),
    {
      name: 'neurosound-settings',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
