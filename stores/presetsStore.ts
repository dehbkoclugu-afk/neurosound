/**
 * Presets Store - User favorites and custom mixes
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

export interface CustomMix {
  id: string;
  name: string;
  channels: {
    presetId: string;
    volume: number;
  }[];
  createdAt: number;
}

export interface RecentlyPlayed {
  presetId: string;
  playedAt: number;
}

interface PresetsState {
  // Favorites
  favoriteIds: string[];

  // Custom mixes
  customMixes: CustomMix[];

  // Recently played
  recentlyPlayed: RecentlyPlayed[];

  // Actions
  addFavorite: (presetId: string) => void;
  removeFavorite: (presetId: string) => void;
  isFavorite: (presetId: string) => boolean;

  addCustomMix: (mix: Omit<CustomMix, 'id' | 'createdAt'>) => string;
  updateCustomMix: (id: string, mix: Partial<Omit<CustomMix, 'id' | 'createdAt'>>) => void;
  deleteCustomMix: (id: string) => void;

  addRecentlyPlayed: (presetId: string) => void;
  clearRecentlyPlayed: () => void;

  reset: () => void;
}

const MAX_RECENTLY_PLAYED = 10;

const initialState = {
  favoriteIds: [],
  customMixes: [],
  recentlyPlayed: [],
};

export const usePresetsStore = create<PresetsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addFavorite: (presetId) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(presetId)
            ? state.favoriteIds
            : [...state.favoriteIds, presetId],
        })),

      removeFavorite: (presetId) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.filter((id) => id !== presetId),
        })),

      isFavorite: (presetId) => get().favoriteIds.includes(presetId),

      addCustomMix: (mix) => {
        const id = `mix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          customMixes: [
            ...state.customMixes,
            {
              ...mix,
              id,
              createdAt: Date.now(),
            },
          ],
        }));
        return id;
      },

      updateCustomMix: (id, updates) =>
        set((state) => ({
          customMixes: state.customMixes.map((mix) =>
            mix.id === id ? { ...mix, ...updates } : mix
          ),
        })),

      deleteCustomMix: (id) =>
        set((state) => ({
          customMixes: state.customMixes.filter((mix) => mix.id !== id),
        })),

      addRecentlyPlayed: (presetId) =>
        set((state) => {
          // Remove if already exists
          const filtered = state.recentlyPlayed.filter((r) => r.presetId !== presetId);

          // Add to beginning
          const updated = [{ presetId, playedAt: Date.now() }, ...filtered];

          // Keep only last N items
          return {
            recentlyPlayed: updated.slice(0, MAX_RECENTLY_PLAYED),
          };
        }),

      clearRecentlyPlayed: () => set({ recentlyPlayed: [] }),

      reset: () => set(initialState),
    }),
    {
      name: 'neurosound-presets',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
