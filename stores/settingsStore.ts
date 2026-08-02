/**
 * Settings Store - User preferences and accessibility settings
 */

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n, { deviceLanguageOrDefault } from '@/i18n';

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

export type ThemeMode = 'light' | 'dark' | 'night' | 'auto';
/** Any code in `locales/index.ts`. Kept as a plain string rather than a
 *  union so adding a language is one row in that file and nothing else. */
export type Language = string;

interface SettingsState {
  // Runtime-only persistence lifecycle
  hasHydrated: boolean;

  // Appearance
  theme: ThemeMode;
  reduceMotion: boolean;
  lowContrast: boolean;
  haptics: boolean;

  // Language
  language: Language;

  // Audio
  maxVolume: number; // 0-1, safety limit
  defaultVolume: number;

  // Onboarding
  hasSeenOnboarding: boolean;
  hasSeenHeadphoneWarning: boolean;
  hasSeenEpilepsyWarning: boolean;
  /** Explore's category blurb shown once per category, not on every visit. */
  seenCategoryDescriptions: Record<string, boolean>;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setReduceMotion: (reduce: boolean) => void;
  setLowContrast: (low: boolean) => void;
  setHaptics: (enabled: boolean) => void;
  setLanguage: (language: Language) => void;
  setMaxVolume: (volume: number) => void;
  setDefaultVolume: (volume: number) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setHasSeenHeadphoneWarning: (seen: boolean) => void;
  setHasSeenEpilepsyWarning: (seen: boolean) => void;
  markCategoryDescriptionSeen: (category: string) => void;
  setHasHydrated: (hydrated: boolean) => void;
  resetSettings: () => void;
}

const initialState = {
  hasHydrated: false,
  // Dark-first: the primary use case is at night, in a dark room
  theme: 'dark' as ThemeMode,
  reduceMotion: false,
  lowContrast: false,
  haptics: true,
  // Seeded from the device locale so a first launch agrees with i18n
  language: deviceLanguageOrDefault,
  maxVolume: 0.8,
  defaultVolume: 0.5,
  hasSeenOnboarding: false,
  hasSeenHeadphoneWarning: false,
  hasSeenEpilepsyWarning: false,
  seenCategoryDescriptions: {},
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,

      setTheme: (theme) => set({ theme }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setLowContrast: (lowContrast) => set({ lowContrast }),
      setHaptics: (haptics) => set({ haptics }),
      setLanguage: (language) => set({ language }),
      setMaxVolume: (maxVolume) => set({ maxVolume: Math.max(0.1, Math.min(1, maxVolume)) }),
      setDefaultVolume: (defaultVolume) => set({ defaultVolume: Math.max(0, Math.min(1, defaultVolume)) }),
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
      setHasSeenHeadphoneWarning: (hasSeenHeadphoneWarning) => set({ hasSeenHeadphoneWarning }),
      setHasSeenEpilepsyWarning: (hasSeenEpilepsyWarning) => set({ hasSeenEpilepsyWarning }),
      markCategoryDescriptionSeen: (category) =>
        set((state) => ({
          seenCategoryDescriptions: { ...state.seenCategoryDescriptions, [category]: true },
        })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      resetSettings: () =>
        set((state) => ({ ...initialState, hasHydrated: state.hasHydrated })),
    }),
    {
      name: 'neurosound-settings',
      storage: createJSONStorage(() => safeStorage),
      // Storage is async, so the restored language lands after i18n has already
      // initialised from the device locale. Re-apply it or the user's choice is
      // silently dropped on every cold start.
      onRehydrateStorage: () => (state) => {
        if (state?.language && i18n.language !== state.language) {
          i18n.changeLanguage(state.language).catch(() => {});
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
