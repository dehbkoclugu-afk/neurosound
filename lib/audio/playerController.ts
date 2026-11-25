/**
 * Player Controller - Global single-preset playback
 *
 * Owns the active generator at module level so playback survives
 * screen unmounts. UI state (currentPreset, isPlaying, timer) lives
 * in audioStore; this module is the only writer for playback actions.
 */

import { AppState, Platform } from 'react-native';
import type { AudioPlayer } from 'expo-audio';
import { Asset } from 'expo-asset';

import i18n from '@/i18n';
import { useAudioStore, MixerChannelState } from '@/stores/audioStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePremiumStore } from '@/stores/premiumStore';
import { PRESET_ART, PRESET_LOCK_ART } from '../artAssets';
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
let timerTimeout: ReturnType<typeof setTimeout> | null = null;

// ---------------------------------------------------------------------------
// Lock screen / now-playing — a background sound app with no lock screen
// control means unlocking the phone just to pause, which is exactly the
// interaction someone falling asleep doesn't want. expo-audio exposes this
// natively; no extra native module or build step needed.
// ---------------------------------------------------------------------------

let lockScreenPlayer: AudioPlayer | null = null;
let lockScreenSubscription: { remove: () => void } | null = null;
let lockScreenOwner: 'single' | 'mixer' | null = null;
let mirroringMediaCommand = false;
let pausingSingle = false;

/** Mirrors a lock-screen-triggered play/pause back into the store, so the
 *  in-app button reflects reality if the user opens the app again without
 *  having touched it directly. */
function watchLockScreenPlayer(player: AudioPlayer, owner: 'single' | 'mixer'): void {
  if (player === lockScreenPlayer && owner === lockScreenOwner) return;
  lockScreenSubscription?.remove();
  lockScreenPlayer = player;
  lockScreenOwner = owner;
  lockScreenSubscription = player.addListener('playbackStatusUpdate', (status) => {
    if (mirroringMediaCommand) return;
    const store = useAudioStore.getState();
    if (owner === 'single') {
      if (pausingSingle) return;
      if (store.isPlaying === status.playing) return;
      store.setIsPlaying(status.playing);
      if (status.playing) {
        // In-app pause() faded volume to 0 before pausing nativePlayer;
        // resuming from the lock screen must restore the audible level.
        setGenVolume(effectiveVolume() * timerFadeRatio);
        beginListening();
      } else {
        endListening();
      }
      return;
    }
    if (store.isMixerPlaying === status.playing) return;
    mirroringMediaCommand = true;
    try {
      mixerGenerators.forEach((gen) => {
        const nativePlayer = gen.getNativePlayer();
        if (!nativePlayer || nativePlayer === player) return;
        if (status.playing) nativePlayer.play();
        else nativePlayer.pause();
      });
      if (status.playing) {
        const { maxVolume } = useSettingsStore.getState();
        store.mixerChannels.forEach((ch) =>
          mixerGenerators.get(ch.id)?.setVolume(channelVolume(ch, maxVolume))
        );
      }
      store.setIsMixerPlaying(status.playing);
      if (status.playing) beginListening();
      else endListening();
    } finally {
      mirroringMediaCommand = false;
    }
  });
}

/**
 * The sound's own artwork on the lock screen.
 *
 * Only ever hands over a real file path. expo-audio parses this field into a
 * `java.net.URL`, and in a release build `Asset.fromModule().uri` is the bare
 * bundled-resource name, which threw MalformedURLException out of
 * `setActiveForLockScreen` and took the controls with it. `downloadAsync` copies
 * even a bare resource into the cache and gives back a `file://` path, but only
 * asynchronously, so the controls go up first and the artwork follows.
 *
 * Android gets a 320px square because the bitmap travels through binder in the
 * notification; iOS has no such limit and shows it large.
 */
const artworkUris = new Map<string, string>();

function artworkModule(presetId: string): number | undefined {
  const source = Platform.OS === 'android' ? PRESET_LOCK_ART[presetId] : PRESET_ART[presetId]?.dark;
  return source as number | undefined;
}

async function resolveArtwork(presetId: string): Promise<string | undefined> {
  const module = artworkModule(presetId);
  if (!module) return undefined;
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();
  if (asset.localUri) artworkUris.set(presetId, asset.localUri);
  return asset.localUri ?? undefined;
}

/**
 * Lock screen controls are a convenience, never a precondition for sound.
 *
 * expo-audio starts them with a bare `context.startForegroundService()`
 * (AudioControlsService.setActivePlayer) and Android 12+ answers with
 * ForegroundServiceStartNotAllowedException whenever the process is not in a
 * state permitted to start one. That exception came straight back across the
 * bridge into `play()`'s try block — which had already set isPlaying — so the
 * app announced "could not start audio" over a sound that was playing fine.
 * Through `startMixerChannels` it was worse: its catch stopped and disposed
 * every channel that had just started successfully.
 *
 * So both directions are contained here rather than at each call site: losing
 * the lock screen costs the lock screen and nothing else.
 */
function setNowPlaying(
  player: AudioPlayer | null,
  title: string,
  owner: 'single' | 'mixer',
  artPresetId?: string
): void {
  if (Platform.OS === 'web') return;
  if (!player) return;
  if (lockScreenPlayer && lockScreenPlayer !== player) clearNowPlaying();
  const known = artPresetId ? artworkUris.get(artPresetId) : undefined;
  try {
    player.setActiveForLockScreen(true, {
      title,
      artist: '852Hz',
      artworkUrl: known,
    }, { showSeekBackward: false, showSeekForward: false });
    watchLockScreenPlayer(player, owner);
  } catch (e) {
    console.log('Lock screen controls unavailable:', e);
    return;
  }
  if (known || !artPresetId) return;
  resolveArtwork(artPresetId)
    .then((artworkUrl) => {
      // The sound may have changed while the file was being copied.
      if (!artworkUrl || lockScreenPlayer !== player) return;
      player.updateLockScreenMetadata({ title, artist: '852Hz', artworkUrl });
    })
    .catch((e) => console.log('Lock screen artwork unavailable:', e));
}

function clearNowPlaying(): void {
  if (Platform.OS === 'web') return;
  const player = lockScreenPlayer;
  lockScreenSubscription?.remove();
  lockScreenSubscription = null;
  lockScreenPlayer = null;
  lockScreenOwner = null;
  try {
    player?.clearLockScreenControls();
  } catch (e) {
    console.log('Lock screen teardown failed:', e);
  }
}

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
// Three minutes rather than thirty seconds: a slow fall is what lets someone
// stay asleep through the end. A short timer never spends over a third fading.
const TIMER_FADE_WINDOW_S = 180;

/** Where the sleep timer's closing fade currently stands; 1 outside of it. */
let timerFadeRatio = 1;
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

/**
 * Fade a generator we are done with down to silence on its own timer, then
 * stop it — the module-level `ramp` only ever drives the *current* generator,
 * and by the time we retire one it is no longer that.
 *
 * Switching presets used to cut the outgoing sound dead. Letting it fall
 * away while the incoming one fades up (play() already ramps in over
 * FADE_IN_MS) turns the switch into a crossfade, which matters most in the
 * one situation this app is for: someone half-asleep changing their mind.
 *
 * This is only safe because `getBinauralPlayer()` and friends hand back a
 * fresh instance each call. If they ever become singletons, retiring the
 * outgoing one would silence the incoming one 250ms after it started.
 */
function retireGenerator(gen: Generator, fromVolume: number): void {
  const steps = 12;
  const stepMs = FADE_OUT_MS / steps;
  let i = 0;
  const timer = setInterval(() => {
    i += 1;
    if (i >= steps) {
      clearInterval(timer);
      gen.stop();
      gen.dispose();
      return;
    }
    gen.setVolume(fromVolume * (1 - i / steps));
  }, stepMs);
}

/** Load a preset. Same preset = no-op so playback continues untouched. */
export function loadPreset(preset: FrequencyPreset): void {
  if (currentId === preset.id && generator) return;

  mixerStop(); // single preset and mixer are mutually exclusive
  playToken += 1;
  pausingSingle = false;

  if (generator) {
    const outgoing = generator;
    const outgoingVolume = lastVolume;
    const wasPlaying = useAudioStore.getState().isPlaying;
    cancelRamp();
    unbindTimerHeartbeat();
    if (lockScreenOwner === 'single') clearNowPlaying();
    generator = null;
    if (wasPlaying && outgoingVolume > 0) {
      retireGenerator(outgoing, outgoingVolume);
    } else {
      outgoing.stop();
      outgoing.dispose();
    }
  }
  useAudioStore.getState().setIsPlaying(false);
  useAudioStore.getState().setPlaybackError(false);

  generator = createGenerator(preset);
  currentId = preset.id;
  useAudioStore.getState().setCurrentPreset(preset);
}

/**
 * Listening time, measured rather than guessed.
 *
 * Wall-clock deltas between "started" and "stopped", not a ticking counter:
 * JS timers are throttled while the app is backgrounded, which is precisely
 * when this app is doing its job, so a counter would undercount every night.
 * Both playback paths — single preset and mixer — funnel through here.
 */
let listeningStartedAt: number | null = null;

function beginListening(): void {
  if (listeningStartedAt !== null) return;
  listeningStartedAt = Date.now();
  usePresetsStore.getState().recordSessionStart();
}

function endListening(): void {
  if (listeningStartedAt === null) return;
  const seconds = (Date.now() - listeningStartedAt) / 1000;
  listeningStartedAt = null;
  if (seconds >= 1) usePresetsStore.getState().recordListening(Math.round(seconds));
}

let playToken = 0;

export async function play(): Promise<void> {
  if (!generator) return;
  // Captured locally: unload()/loadPreset()/pause() can supersede this call
  // while it is awaiting gen.play(). A monotonic token guarantees a newer
  // preset switch or pause always wins cleanly.
  const gen = generator;
  const token = ++playToken;
  pausingSingle = false;
  cancelRamp();
  const store = useAudioStore.getState();
  store.setIsLoading(true);
  store.setPlaybackError(false);
  try {
    setGenVolume(0); // fade in from silence
    const nativePlayer = gen.getNativePlayer();
    if (nativePlayer && gen.getIsPlaying()) nativePlayer.play();
    else await gen.play();
    if (token !== playToken || generator !== gen) {
      if (generator !== gen) {
        gen.stop();
        gen.dispose();
      } else {
        const np = gen.getNativePlayer();
        if (np) np.pause();
        else gen.stop();
      }
      return;
    }
    if (!gen.getIsPlaying()) {
      useAudioStore.getState().setPlaybackError(true);
      return;
    }
    ramp(effectiveVolume() * timerFadeRatio, FADE_IN_MS);
    useAudioStore.getState().setIsPlaying(true);
    beginListening();
    bindTimerHeartbeat(gen.getNativePlayer());
    const preset = useAudioStore.getState().currentPreset;
    if (preset) setNowPlaying(gen.getNativePlayer(), i18n.t(preset.nameKey), 'single', preset.id);
  } catch {
    if (token === playToken && generator === gen) {
      useAudioStore.getState().setPlaybackError(true);
    }
  } finally {
    if (token === playToken) {
      useAudioStore.getState().setIsLoading(false);
    }
  }
}

/** Fade out then stop. `immediate` skips the fade (unload/switching). */
export function pause(immediate: boolean = false): void {
  playToken += 1;
  if (immediate) pausingSingle = false;
  const gen = generator;
  useAudioStore.getState().setIsPlaying(false);
  useAudioStore.getState().setIsLoading(false);
  endListening();
  if (!gen) return;
  if (immediate) {
    cancelRamp();
    gen.stop();
    return;
  }
  const nativePlayer = gen.getNativePlayer();
  pausingSingle = true;
  ramp(0, FADE_OUT_MS, () => {
    if (nativePlayer) nativePlayer.pause();
    else gen.stop();
    pausingSingle = false;
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
    setGenVolume(effectiveVolume() * timerFadeRatio);
  }
  const { mixerChannels } = useAudioStore.getState();
  const { maxVolume } = useSettingsStore.getState();
  mixerChannels.forEach((ch) =>
    mixerGenerators.get(ch.id)?.setVolume(channelVolume(ch, maxVolume))
  );
}

/** Tear down the single-preset generator, leaving the timer alone. */
export function disposePreset(): void {
  pause(true);
  if (generator) unbindTimerHeartbeat();
  if (lockScreenOwner === 'single') clearNowPlaying();
  generator?.dispose();
  generator = null;
  currentId = null;
  useAudioStore.getState().setCurrentPreset(null);
}

/** Stop, dispose, and clear everything — MiniPlayer close button. */
export function unload(): void {
  disposePreset();
  clearTimer();
}

function clearTimer(): void {
  if (timerTimeout) {
    clearTimeout(timerTimeout);
    timerTimeout = null;
  }
  timerFadeRatio = 1;
  useAudioStore.getState().setTimer(null);
}

/**
 * Advance the sleep timer against the wall clock. Called on every tick and
 * again whenever the app returns to the foreground, so a throttled or fully
 * suspended JS timer can never let playback run past its deadline — it just
 * catches up on the next evaluation.
 */
/** Scale whatever is currently playing, for the timer's closing fade. */
function applyTimerFade(ratio: number): void {
  timerFadeRatio = ratio;
  const { isPlaying, isMixerPlaying, mixerChannels } = useAudioStore.getState();
  const { maxVolume } = useSettingsStore.getState();

  if (isPlaying) {
    setGenVolume(effectiveVolume() * ratio);
  }
  if (isMixerPlaying) {
    mixerChannels.forEach((ch) =>
      mixerGenerators.get(ch.id)?.setVolume(channelVolume(ch, maxVolume))
    );
  }
}

/** Stop whichever source the timer was counting down for. */
function stopForTimer(): void {
  const { isMixerPlaying } = useAudioStore.getState();
  if (isMixerPlaying) mixerStop();
  pause();
}

function evaluateTimer(): void {
  if (timerTimeout) clearTimeout(timerTimeout);
  timerTimeout = null;
  const { timerEndsAt, timerDuration, updateTimerRemaining, isPlaying, isMixerPlaying } =
    useAudioStore.getState();
  if (timerEndsAt === null) {
    clearTimer();
    return;
  }

  const remaining = Math.max(0, Math.round((timerEndsAt - Date.now()) / 1000));

  if (remaining <= 0) {
    stopForTimer();
    clearTimer();
    return;
  }

  updateTimerRemaining(remaining);

  // Squared because hearing is roughly logarithmic: a straight line down sounds
  // like nothing happens for two minutes and then the sound drops away.
  const fadeWindow = Math.min(TIMER_FADE_WINDOW_S, ((timerDuration ?? 0) * 60) / 3);
  if ((isPlaying || isMixerPlaying) && remaining <= fadeWindow && !rampInterval) {
    applyTimerFade((remaining / fadeWindow) ** 2);
  }

  timerTimeout = setTimeout(evaluateTimer, Math.min(1000, remaining * 1000));
}

/** Sleep timer: counts down globally, pauses playback when done. */
export function startTimer(minutes: number | null): void {
  if (timerTimeout) {
    clearTimeout(timerTimeout);
    timerTimeout = null;
  }
  useAudioStore.getState().setTimer(minutes);
  // Cancelled or replaced mid-fade: the sound comes back up to its real level.
  if (timerFadeRatio !== 1) {
    timerFadeRatio = 1;
    syncVolume();
  }
  if (!minutes) return;

  evaluateTimer();
}

/**
 * Drives the sleep timer from the playing native player's own status events.
 *
 * React Native on Android pauses JS timers (setTimeout) while the app is in
 * the background — which, for a sleep timer, is the entire time it matters:
 * the phone is locked, the countdown froze, and the sound played all night,
 * only "catching up" when the user next opened the app. The audio player
 * keeps emitting playbackStatusUpdate while it plays in the foreground
 * service, and those events do reach JS, so they make a reliable clock.
 */
let timerHeartbeat: { remove: () => void } | null = null;
let lastHeartbeat = 0;

function bindTimerHeartbeat(player: AudioPlayer | null | undefined): void {
  timerHeartbeat?.remove();
  timerHeartbeat = null;
  if (!player || typeof player.addListener !== 'function') return;
  timerHeartbeat = player.addListener('playbackStatusUpdate', () => {
    const now = Date.now();
    if (now - lastHeartbeat < 1000) return;
    lastHeartbeat = now;
    if (useAudioStore.getState().timerEndsAt !== null) evaluateTimer();
    applyLivingMix();
  });
}

function unbindTimerHeartbeat(): void {
  timerHeartbeat?.remove();
  timerHeartbeat = null;
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

let mixerStartToken = 0;
let webLivingInterval: ReturnType<typeof setInterval> | null = null;

function clearWebLivingInterval(): void {
  if (webLivingInterval) {
    clearInterval(webLivingInterval);
    webLivingInterval = null;
  }
}

/** Start (or resume) all mixer channels. Silences the single-preset player. */
export async function mixerStart(): Promise<void> {
  // Mutual exclusion only — a sleep timer set for this session must survive.
  disposePreset();

  const { mixerChannels } = useAudioStore.getState();
  const { maxVolume } = useSettingsStore.getState();
  if (mixerChannels.length === 0) return;

  useAudioStore.getState().setPlaybackError(false);
  const token = ++mixerStartToken;
  await startMixerChannels(mixerChannels, maxVolume, token);
}

async function startMixerChannels(
  mixerChannels: MixerChannelState[],
  maxVolume: number,
  token: number
): Promise<void> {
  try {
    for (const ch of mixerChannels) {
      if (token !== mixerStartToken) return;
      let gen = mixerGenerators.get(ch.id);
      if (!gen) {
        const created = createGenerator(ch.preset);
        if (!created) continue;
        gen = created;
        mixerGenerators.set(ch.id, gen);
      }
      gen.setVolume(channelVolume(ch, maxVolume));
      const nativePlayer = gen.getNativePlayer();
      if (nativePlayer && gen.getIsPlaying()) nativePlayer.play();
      else await gen.play();
      if (token !== mixerStartToken) {
        if (mixerGenerators.get(ch.id) !== gen) {
          gen.stop();
          gen.dispose();
        }
        return;
      }
      if (!gen.getIsPlaying()) throw new Error(`Mixer channel failed: ${ch.id}`);
    }
    if (token !== mixerStartToken) return;
    useAudioStore.getState().setIsMixerPlaying(true);
    beginListening();
    const leader = mixerGenerators.values().next().value as Generator | undefined;
    setNowPlaying(leader?.getNativePlayer() ?? null, '852Hz Mixer', 'mixer', mixerChannels[0]?.preset.id);
    bindTimerHeartbeat(leader?.getNativePlayer());
    if (Platform.OS === 'web') {
      clearWebLivingInterval();
      webLivingInterval = setInterval(applyLivingMix, 1500);
    }
  } catch {
    if (token !== mixerStartToken) return;
    mixerGenerators.forEach((gen) => {
      gen.stop();
      gen.dispose();
    });
    mixerGenerators.clear();
    clearWebLivingInterval();
    useAudioStore.getState().setIsMixerPlaying(false);
    useAudioStore.getState().setPlaybackError(true);
  }
}

export function mixerStop(): void {
  mixerStartToken += 1;
  clearWebLivingInterval();
  if (lockScreenOwner === 'mixer') clearNowPlaying();
  if (mixerGenerators.size > 0) unbindTimerHeartbeat();
  mixerGenerators.forEach((gen) => {
    gen.stop();
    gen.dispose();
  });
  mixerGenerators.clear();
  useAudioStore.getState().setIsMixerPlaying(false);
  endListening();
}

/**
 * The whole gain chain for one mixer channel, in one place: the channel's own
 * level, times the master fader, times the settings safety cap, times any
 * active sleep-timer fade ratio.
 */
function channelVolume(
  ch: { id: string; volume: number; muted: boolean },
  maxVolume: number,
  master = useAudioStore.getState().mixerMasterVolume
): number {
  if (ch.muted) return 0;
  const vol = Number.isFinite(ch.volume) ? Math.max(0, Math.min(1, ch.volume)) : 0;
  const drift = livingMixActive() ? livingDrift(ch.id, Date.now()) : 1;
  return vol * master * maxVolume * drift * timerFadeRatio;
}

/**
 * Living mix: each channel breathes on its own slow cycle, so a long mix never
 * settles into the exact same balance. Only ever turns a channel down from what
 * the user set, which keeps the hearing-safety cap a true ceiling.
 */
const LIVING_DEPTH = 0.24;

export function livingDrift(channelId: string, nowMs: number): number {
  let hash = 0;
  for (let i = 0; i < channelId.length; i++) hash = (hash * 31 + channelId.charCodeAt(i)) | 0;
  const seed = Math.abs(hash);
  const periodS = 70 + (seed % 61);
  const phase = ((seed % 360) * Math.PI) / 180;
  const wave = Math.sin((2 * Math.PI * nowMs) / (periodS * 1000) + phase);
  return 1 - LIVING_DEPTH * (0.5 + 0.5 * wave);
}

function livingMixActive(): boolean {
  const { livingMix, legacyPremium } = useSettingsStore.getState();
  return livingMix && (usePremiumStore.getState().owned || legacyPremium);
}

/** Runs on the player's own status events: JS timers stop in the background,
 *  and the background is where a mix plays for hours. */
function applyLivingMix(): void {
  const { isMixerPlaying, mixerChannels } = useAudioStore.getState();
  if (!isMixerPlaying || !livingMixActive()) return;
  const { maxVolume } = useSettingsStore.getState();
  mixerChannels.forEach((ch) =>
    mixerGenerators.get(ch.id)?.setVolume(channelVolume(ch, maxVolume))
  );
}

export function mixerSetChannelMuted(channelId: string, muted: boolean): void {
  useAudioStore.getState().setMixerChannelMuted(channelId, muted);
  const ch = useAudioStore
    .getState()
    .mixerChannels.find((c) => c.id === channelId);
  if (!ch) return;
  mixerGenerators
    .get(channelId)
    ?.setVolume(channelVolume(ch, useSettingsStore.getState().maxVolume));
}

/** Stop the mixer and discard its channels — the MiniPlayer close button.
 *  Mirrors `unload()` for the single-preset player. */
export function mixerClear(): void {
  mixerStop();
  useAudioStore.getState().clearMixerChannels();
  clearTimer();
}

/** Add a channel. Returns false when the channel limit is reached.
 *  If the mixer is playing, the new channel starts immediately. */
export async function mixerAddChannel(
  preset: FrequencyPreset,
  initialVolume: number = 0.5
): Promise<boolean> {
  const store = useAudioStore.getState();
  if (store.mixerChannels.length >= MAX_MIXER_CHANNELS) return false;

  const volume = Number.isFinite(initialVolume) ? Math.max(0, Math.min(1, initialVolume)) : 0.5;
  const id = `channel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  store.addMixerChannel({ id, preset, volume, muted: false });
  store.setActiveMixId(null);

  if (store.isMixerPlaying) {
    const gen = createGenerator(preset);
    if (gen) {
      mixerGenerators.set(id, gen);
      gen.setVolume(
        channelVolume({ id, volume, muted: false }, useSettingsStore.getState().maxVolume)
      );
      await gen.play();
      // If removed or mixer stopped while awaiting play(), clean up immediately.
      if (mixerGenerators.get(id) !== gen || !useAudioStore.getState().isMixerPlaying) {
        gen.stop();
        gen.dispose();
        if (mixerGenerators.get(id) === gen) mixerGenerators.delete(id);
      }
    }
  }
  return true;
}

export function mixerRemoveChannel(channelId: string): void {
  const gen = mixerGenerators.get(channelId);
  // The lock screen hangs off one channel's native player; removing that
  // channel left the controls bound to a disposed player.
  const ownedLockScreen =
    lockScreenOwner === 'mixer' && !!gen && gen.getNativePlayer() === lockScreenPlayer;
  if (ownedLockScreen) clearNowPlaying();
  if (gen) {
    gen.stop();
    gen.dispose();
    mixerGenerators.delete(channelId);
  }
  useAudioStore.getState().removeMixerChannel(channelId);
  useAudioStore.getState().setActiveMixId(null);
  if (useAudioStore.getState().mixerChannels.length === 0) {
    // Same teardown as stopping: also closes the listening-time session.
    mixerStop();
    return;
  }
  if (useAudioStore.getState().isMixerPlaying && gen) {
    // The removed channel may have been the one carrying the lock screen and
    // the timer heartbeat; hand both to whichever channel now leads.
    const leader = mixerGenerators.values().next().value as Generator | undefined;
    if (ownedLockScreen) {
      const leadPreset = useAudioStore.getState().mixerChannels[0]?.preset.id;
      setNowPlaying(leader?.getNativePlayer() ?? null, '852Hz Mixer', 'mixer', leadPreset);
    }
    bindTimerHeartbeat(leader?.getNativePlayer());
  }
}

export function mixerSetChannelVolume(channelId: string, volume: number): void {
  const clamped = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
  const store = useAudioStore.getState();
  store.updateMixerChannelVolume(channelId, clamped);
  // Moving a muted channel's level unmutes it — otherwise the slider moves and
  // nothing happens, which reads as broken.
  store.setMixerChannelMuted(channelId, false);
  mixerGenerators
    .get(channelId)
    ?.setVolume(
      channelVolume({ id: channelId, volume: clamped, muted: false }, useSettingsStore.getState().maxVolume)
    );
}

/** Move the master fader. Applies to every live channel at once and leaves
 *  each channel's own level untouched. */
export function mixerSetMasterVolume(volume: number): void {
  useAudioStore.getState().setMixerMasterVolume(volume);
  const { maxVolume } = useSettingsStore.getState();
  // Re-read after the set: the store clamps, and a snapshot taken before it
  // still holds the old value.
  const { mixerChannels, mixerMasterVolume } = useAudioStore.getState();
  mixerChannels.forEach((ch) =>
    mixerGenerators.get(ch.id)?.setVolume(channelVolume(ch, maxVolume, mixerMasterVolume))
  );
}

/**
 * Replace all channels from a saved mix and start playing.
 *
 * Loading used to swap the channels silently: no sound, no scroll, no
 * confirmation — the change happened off-screen above the list the user had
 * just tapped, so tapping a saved mix appeared to do nothing at all.
 */
export async function mixerLoadChannels(
  channels: { presetId: string; volume: number }[],
  mixId?: string
): Promise<void> {
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
        muted: false,
      });
    }
  });
  store.setActiveMixId(mixId ?? null);
  await mixerStart();
}
