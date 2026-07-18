/**
 * Player Controller - Global single-preset playback
 *
 * Owns the active generator at module level so playback survives
 * screen unmounts. UI state (currentPreset, isPlaying, timer) lives
 * in audioStore; this module is the only writer for playback actions.
 */

import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { FrequencyPreset, getPresetById } from '../frequencies';
import {
  getBinauralPlayer,
  getNoisePlayer,
  getTonePlayer,
  BinauralPlayer,
  NoisePlayer,
  TonePlayer,
} from './AudioEngine';

type Generator = BinauralPlayer | NoisePlayer | TonePlayer;

let generator: Generator | null = null;
let currentId: string | null = null;
let timerInterval: ReturnType<typeof setInterval> | null = null;

function createGenerator(preset: FrequencyPreset): Generator | null {
  switch (preset.type) {
    case 'binaural': {
      const binaural = getBinauralPlayer();
      if (preset.baseFrequency) binaural.setBaseFrequency(preset.baseFrequency);
      if (preset.beatFrequency) binaural.setBeatFrequency(preset.beatFrequency);
      return binaural;
    }
    case 'noise': {
      const noise = getNoisePlayer();
      if (preset.noiseType) noise.setNoiseType(preset.noiseType);
      return noise;
    }
    case 'solfeggio': {
      const tone = getTonePlayer();
      if (preset.frequency) tone.setFrequency(preset.frequency);
      return tone;
    }
    default:
      return null;
  }
}

function effectiveVolume(): number {
  const { volume } = useAudioStore.getState();
  const { maxVolume } = useSettingsStore.getState();
  return volume * maxVolume;
}

/** Load a preset. Same preset = no-op so playback continues untouched. */
export function loadPreset(preset: FrequencyPreset): void {
  if (currentId === preset.id && generator) return;

  mixerStop(); // single preset and mixer are mutually exclusive

  if (generator) {
    generator.stop();
    generator.dispose();
    generator = null;
  }
  useAudioStore.getState().setIsPlaying(false);

  generator = createGenerator(preset);
  currentId = preset.id;
  useAudioStore.getState().setCurrentPreset(preset);
}

let playPending = false;

export async function play(): Promise<void> {
  if (!generator || playPending) return;
  playPending = true;
  try {
    generator.setVolume(effectiveVolume());
    await generator.play();
    useAudioStore.getState().setIsPlaying(true);
  } finally {
    playPending = false;
  }
}

export function pause(): void {
  generator?.stop();
  useAudioStore.getState().setIsPlaying(false);
}

export async function toggle(): Promise<void> {
  if (useAudioStore.getState().isPlaying) {
    pause();
  } else {
    await play();
  }
}

/** Re-apply store volume × maxVolume to all live generators. */
export function syncVolume(): void {
  generator?.setVolume(effectiveVolume());
  const { mixerChannels } = useAudioStore.getState();
  const { maxVolume } = useSettingsStore.getState();
  mixerChannels.forEach((ch) =>
    mixerGenerators.get(ch.id)?.setVolume(ch.volume * maxVolume)
  );
}

/** Stop, dispose, and clear everything — MiniPlayer close button. */
export function unload(): void {
  pause();
  generator?.dispose();
  generator = null;
  currentId = null;
  clearTimer();
  useAudioStore.getState().setCurrentPreset(null);
}

function clearTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  useAudioStore.getState().setTimer(null);
}

/** Sleep timer: counts down globally, pauses playback when done. */
export function startTimer(minutes: number | null): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  useAudioStore.getState().setTimer(minutes);
  if (!minutes) return;

  timerInterval = setInterval(() => {
    const { timerRemaining, updateTimerRemaining } = useAudioStore.getState();
    if (timerRemaining === null) {
      clearTimer();
      return;
    }
    if (timerRemaining <= 1) {
      pause();
      clearTimer();
    } else {
      updateTimerRemaining(timerRemaining - 1);
    }
  }, 1000);
}

// ---------------------------------------------------------------------------
// Mixer - up to MAX_MIXER_CHANNELS layered generators, channel list in store
// ---------------------------------------------------------------------------

export const MAX_MIXER_CHANNELS = 4;

const mixerGenerators = new Map<string, Generator>();

let mixerStartPending = false;

/** Start (or resume) all mixer channels. Silences the single-preset player. */
export async function mixerStart(): Promise<void> {
  if (mixerStartPending) return;
  unload(); // mutual exclusion: MiniPlayer preset off

  const { mixerChannels } = useAudioStore.getState();
  const { maxVolume } = useSettingsStore.getState();
  if (mixerChannels.length === 0) return;

  mixerStartPending = true;
  try {
    await startMixerChannels(mixerChannels, maxVolume);
  } finally {
    mixerStartPending = false;
  }
}

async function startMixerChannels(
  mixerChannels: { id: string; preset: FrequencyPreset; volume: number }[],
  maxVolume: number
): Promise<void> {
  for (const ch of mixerChannels) {
    let gen = mixerGenerators.get(ch.id);
    if (!gen) {
      const created = createGenerator(ch.preset);
      if (!created) continue;
      gen = created;
      mixerGenerators.set(ch.id, gen);
    }
    gen.setVolume(ch.volume * maxVolume);
    await gen.play();
  }
  useAudioStore.getState().setIsMixerPlaying(true);
}

export function mixerStop(): void {
  mixerGenerators.forEach((gen) => {
    gen.stop();
    gen.dispose();
  });
  mixerGenerators.clear();
  useAudioStore.getState().setIsMixerPlaying(false);
}

/** Add a channel. Returns false when the channel limit is reached.
 *  If the mixer is playing, the new channel starts immediately. */
export async function mixerAddChannel(preset: FrequencyPreset): Promise<boolean> {
  const store = useAudioStore.getState();
  if (store.mixerChannels.length >= MAX_MIXER_CHANNELS) return false;

  const id = `channel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  store.addMixerChannel({ id, preset, volume: 0.5 });

  if (store.isMixerPlaying) {
    const gen = createGenerator(preset);
    if (gen) {
      mixerGenerators.set(id, gen);
      gen.setVolume(0.5 * useSettingsStore.getState().maxVolume);
      await gen.play();
    }
  }
  return true;
}

export function mixerRemoveChannel(channelId: string): void {
  const gen = mixerGenerators.get(channelId);
  if (gen) {
    gen.stop();
    gen.dispose();
    mixerGenerators.delete(channelId);
  }
  useAudioStore.getState().removeMixerChannel(channelId);
  if (useAudioStore.getState().mixerChannels.length === 0) {
    useAudioStore.getState().setIsMixerPlaying(false);
  }
}

export function mixerSetChannelVolume(channelId: string, volume: number): void {
  useAudioStore.getState().updateMixerChannelVolume(channelId, volume);
  mixerGenerators
    .get(channelId)
    ?.setVolume(volume * useSettingsStore.getState().maxVolume);
}

/** Replace all channels from a saved mix (stops current mixer playback). */
export function mixerLoadChannels(
  channels: { presetId: string; volume: number }[]
): void {
  mixerStop();
  const store = useAudioStore.getState();
  store.clearMixerChannels();
  channels.slice(0, MAX_MIXER_CHANNELS).forEach((ch, index) => {
    const preset = getPresetById(ch.presetId);
    if (preset) {
      store.addMixerChannel({
        id: `channel-${Date.now()}-${index}`,
        preset,
        volume: ch.volume,
      });
    }
  });
}
