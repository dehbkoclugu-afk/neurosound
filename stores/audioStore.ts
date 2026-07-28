/**
 * Audio Store - Playback state management
 */

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FrequencyPreset } from '../lib/frequencies';

const isClient = typeof window !== 'undefined';

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

export interface PlaybackState {
  // Current playback
  currentPreset: FrequencyPreset | null;
  isPlaying: boolean;
  isLoading: boolean;
  playbackError: boolean;
  volume: number;

  // Timer
  timerDuration: number | null; // in minutes, null = no timer
  timerRemaining: number | null; // in seconds, derived from timerEndsAt for display
  /**
   * Absolute wall-clock deadline (ms). The countdown is derived from this, not
   * accumulated by decrementing a counter: JS timers get throttled while the
   * app is backgrounded, so a decrementing counter drifts and a sleep timer
   * fires late — the exact failure a sleep app cannot afford.
   */
  timerEndsAt: number | null;

  // Mixer
  isMixerPlaying: boolean;
  mixerChannels: MixerChannelState[];
  /** One fader over the whole mix. Channel levels are a balance the user
   *  spent time on; turning the mix down should not cost them that balance,
   *  so this scales every channel instead of editing any of them. */
  mixerMasterVolume: number;
  /** Saved mix the current channels came from, so the list can show which one
   *  is loaded. Cleared as soon as the structure is edited. */
  activeMixId: string | null;

  // Actions
  setCurrentPreset: (preset: FrequencyPreset | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setPlaybackError: (error: boolean) => void;
  setVolume: (volume: number) => void;
  setTimer: (duration: number | null) => void;
  updateTimerRemaining: (remaining: number | null) => void;
  setIsMixerPlaying: (playing: boolean) => void;
  setMixerMasterVolume: (volume: number) => void;
  addMixerChannel: (channel: MixerChannelState) => void;
  removeMixerChannel: (channelId: string) => void;
  updateMixerChannelVolume: (channelId: string, volume: number) => void;
  setMixerChannelMuted: (channelId: string, muted: boolean) => void;
  clearMixerChannels: () => void;
  setActiveMixId: (id: string | null) => void;
  reset: () => void;
}

export interface MixerChannelState {
  id: string;
  preset: FrequencyPreset;
  volume: number;
  /** Silences the channel without losing its level — the whole point of a
   *  mute. Dragging the slider to zero would destroy the setting. */
  muted: boolean;
}

const initialState = {
  currentPreset: null,
  isPlaying: false,
  isLoading: false,
  playbackError: false,
  volume: 0.5,
  timerDuration: null,
  timerRemaining: null,
  timerEndsAt: null,
  isMixerPlaying: false,
  mixerChannels: [],
  mixerMasterVolume: 1,
  activeMixId: null,
};

export const useAudioStore = create<PlaybackState>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentPreset: (preset) => set({ currentPreset: preset }),

      setIsPlaying: (isPlaying) => set({ isPlaying }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setPlaybackError: (playbackError) => set({ playbackError }),

      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

      setTimer: (duration) =>
        set({
          timerDuration: duration,
          timerRemaining: duration ? duration * 60 : null,
          timerEndsAt: duration ? Date.now() + duration * 60_000 : null,
        }),

      updateTimerRemaining: (remaining) => set({ timerRemaining: remaining }),

      setIsMixerPlaying: (isMixerPlaying) => set({ isMixerPlaying }),

      setMixerMasterVolume: (volume) =>
        set({ mixerMasterVolume: Math.max(0, Math.min(1, volume)) }),

      addMixerChannel: (channel) =>
        set((state) => ({
          mixerChannels: [...state.mixerChannels, channel],
        })),

      removeMixerChannel: (channelId) =>
        set((state) => ({
          mixerChannels: state.mixerChannels.filter((c) => c.id !== channelId),
        })),

      updateMixerChannelVolume: (channelId, volume) =>
        set((state) => ({
          mixerChannels: state.mixerChannels.map((c) =>
            c.id === channelId ? { ...c, volume: Math.max(0, Math.min(1, volume)) } : c
          ),
        })),

      setMixerChannelMuted: (channelId, muted) =>
        set((state) => ({
          mixerChannels: state.mixerChannels.map((c) =>
            c.id === channelId ? { ...c, muted } : c
          ),
        })),

      clearMixerChannels: () => set({ mixerChannels: [], activeMixId: null }),

      setActiveMixId: (activeMixId) => set({ activeMixId }),

      reset: () => set(initialState),
    }),
    {
      name: 'neurosound-audio',
      storage: createJSONStorage(() => safeStorage),
      // Only the two volume levels survive a restart — playback, timers and
      // mixer sessions die with the process and should not resume from stale
      // state. The master fader is a setting, not session state: coming back
      // to a mix at a level you never chose is the thing it exists to prevent.
      partialize: (state) => ({
        volume: state.volume,
        mixerMasterVolume: state.mixerMasterVolume,
      }),
    }
  )
);
