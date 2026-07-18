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
  timerRemaining: number | null; // in seconds
  timerStartedAt: number | null;

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
  setTimerStartedAt: (timestamp: number | null) => void;
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
  timerStartedAt: null,
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
      timerStartedAt: duration ? Date.now() : null,
    }),

  updateTimerRemaining: (remaining) => set({ timerRemaining: remaining }),

  setTimerStartedAt: (timestamp) => set({ timerStartedAt: timestamp }),

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
