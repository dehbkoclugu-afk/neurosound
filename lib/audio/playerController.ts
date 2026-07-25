/**
 * Player Controller - Global single-preset playback
 *
 * Owns the active generator at module level so playback survives
 * screen unmounts. UI state (currentPreset, isPlaying, timer) lives
 * in audioStore; this module is the only writer for playback actions.
 */

import { AppState } from 'react-native';

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

// ---------------------------------------------------------------------------
// Volume ramps — abrupt starts/stops are jarring in a sleep/focus app
// ---------------------------------------------------------------------------

const FADE_IN_MS = 400;
const FADE_OUT_MS = 250;
const TIMER_FADE_WINDOW_S = 30; // sleep timer fades over the last 30 seconds

let rampInterval: ReturnType<typeof setInterval> | null = null;
let lastVolume = 0;

function setGenVolume(v: number): void {
  generator?.setVolume(v);
  lastVolume = v;
}

function cancelRamp(): void {
  if (rampInterval) {
    clearInterval(rampInterval);
    rampInterval = null;
  }
}

function ramp(to: number, ms: number, onDone?: () => void): void {
  cancelRamp();
  if (!generator) {
    onDone?.();
    return;
  }
  const from = lastVolume;
  const steps = Math.max(1, Math.round(ms / 30));
  let i = 0;
  rampInterval = setInterval(() => {
    i++;
    setGenVolume(from + (to - from) * (i / steps));
    if (i >= steps) {
      cancelRamp();
      onDone?.();
    }
  }, 30);
}

/** Load a preset. Same preset = no-op so playback continues untouched. */
export function loadPreset(preset: FrequencyPreset): void {
  if (currentId === preset.id && generator) return;

  mixerStop(); // single preset and mixer are mutually exclusive

  if (generator) {
    cancelRamp();
    generator.stop();
    generator.dispose();
    generator = null;
  }
  useAudioStore.getState().setIsPlaying(false);
  useAudioStore.getState().setPlaybackError(false);

  generator = createGenerator(preset);
  currentId = preset.id;
  useAudioStore.getState().setCurrentPreset(preset);
}

let playPending = false;

export async function play(): Promise<void> {
  if (!generator || playPending) return;
  playPending = true;
  const store = useAudioStore.getState();
  store.setIsLoading(true);
  store.setPlaybackError(false);
  try {
    setGenVolume(0); // fade in from silence
    await generator.play();
    if (!generator || !generator.getIsPlaying()) {
      // generators swallow their own errors; surface the failure to the UI
      useAudioStore.getState().setPlaybackError(true);
      return;
    }
    ramp(effectiveVolume(), FADE_IN_MS);
    useAudioStore.getState().setIsPlaying(true);
  } finally {
    useAudioStore.getState().setIsLoading(false);
    playPending = false;
  }
}

/** Fade out then stop. `immediate` skips the fade (unload/switching). */
export function pause(immediate: boolean = false): void {
  const gen = generator;
  useAudioStore.getState().setIsPlaying(false);
  if (!gen) return;
  if (immediate) {
    cancelRamp();
    gen.stop();
    return;
  }
  ramp(0, FADE_OUT_MS, () => {
    gen.stop();
  });
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
  if (!rampInterval) {
    // don't fight an active fade
    setGenVolume(effectiveVolume());
  }
  const { mixerChannels } = useAudioStore.getState();
  const { maxVolume } = useSettingsStore.getState();
  mixerChannels.forEach((ch) =>
    mixerGenerators.get(ch.id)?.setVolume(ch.volume * maxVolume)
  );
}

/** Stop, dispose, and clear everything — MiniPlayer close button. */
export function unload(): void {
  pause(true);
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

/**
 * Advance the sleep timer against the wall clock. Called on every tick and
 * again whenever the app returns to the foreground, so a throttled or fully
 * suspended JS timer can never let playback run past its deadline — it just
 * catches up on the next evaluation.
 */
function evaluateTimer(): void {
  const { timerEndsAt, updateTimerRemaining, isPlaying } = useAudioStore.getState();
  if (timerEndsAt === null) {
    clearTimer();
    return;
  }

  const remaining = Math.max(0, Math.round((timerEndsAt - Date.now()) / 1000));

  if (remaining <= 0) {
    pause();
    clearTimer();
    return;
  }

  updateTimerRemaining(remaining);

  // Gentle fade over the final window instead of an abrupt cut
  if (isPlaying && remaining <= TIMER_FADE_WINDOW_S && !rampInterval) {
    setGenVolume(effectiveVolume() * (remaining / TIMER_FADE_WINDOW_S));
  }
}

/** Sleep timer: counts down globally, pauses playback when done. */
export function startTimer(minutes: number | null): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  useAudioStore.getState().setTimer(minutes);
  if (!minutes) return;

  timerInterval = setInterval(evaluateTimer, 1000);
}

// A suspended JS thread stops ticking; re-evaluating on resume closes the gap.
AppState.addEventListener('change', (next) => {
  if (next === 'active' && useAudioStore.getState().timerEndsAt !== null) {
    evaluateTimer();
  }
});

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

/** Stop the mixer and discard its channels — the MiniPlayer close button.
 *  Mirrors `unload()` for the single-preset player. */
export function mixerClear(): void {
  mixerStop();
  useAudioStore.getState().clearMixerChannels();
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
