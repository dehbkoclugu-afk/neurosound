/**
 * Audio Store - Playback state management
 */

import { create } from 'zustand';
import { FrequencyPreset } from '../lib/frequencies';

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

  // Actions
  setCurrentPreset: (preset: FrequencyPreset | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setPlaybackError: (error: boolean) => void;
  setVolume: (volume: number) => void;
  setTimer: (duration: number | null) => void;
  updateTimerRemaining: (remaining: number | null) => void;
  setIsMixerPlaying: (playing: boolean) => void;
  addMixerChannel: (channel: MixerChannelState) => void;
  removeMixerChannel: (channelId: string) => void;
  updateMixerChannelVolume: (channelId: string, volume: number) => void;
  clearMixerChannels: () => void;
  reset: () => void;
}

export interface MixerChannelState {
  id: string;
  preset: FrequencyPreset;
  volume: number;
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
};

export const useAudioStore = create<PlaybackState>((set) => ({
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

  clearMixerChannels: () => set({ mixerChannels: [] }),

  reset: () => set(initialState),
}));
