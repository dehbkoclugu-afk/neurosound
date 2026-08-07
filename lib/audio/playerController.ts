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
      if (store.isPlaying === status.playing) return;
      store.setIsPlaying(status.playing);
      if (status.playing) beginListening();
      else endListening();
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
      store.setIsMixerPlaying(status.playing);
      if (status.playing) beginListening();
      else endListening();
    } finally {
      mirroringMediaCommand = false;
    }
  });
}

/**
 * The lock screen's artwork slot was left empty, so the one place the app
 * appears while the phone is face-down showed a blank square.
 *
 * Only ever returns something with a URI scheme. expo-audio parses this field
 * into a `java.net.URL`, and in a release build `Asset.fromModule().uri` is
 * the bare bundled-resource name — "assets_images_icon" — which is not a URL.
 * Handing that over threw MalformedURLException out of
 * `setActiveForLockScreen`, taking the whole call with it, so lock screen
 * controls never appeared on a release build at all. Worse, before that call
 * was wrapped the throw surfaced as "could not start audio" over sound that
 * was already playing.
 *
 * `Asset.fromModule` is synchronous but its `localUri` only exists after the
 * asset has been copied out on Android, so an unresolved call starts that and
 * returns nothing; a later call picks up the real `file://` path. Nothing is
 * cached until it is usable, since caching the unusable value was what made
 * this permanent.
 *
 * On a release build nothing usable ever arrives, so the artwork square stays
 * empty — checked on a device, across sessions. expo-asset only rewrites an
 * Android embedded asset to `file:///android_res/…` when it is running with
 * local assets (expo-updates), and updates are disabled here, so `uri` stays
 * the bare drawable name. Constructing that path by hand is possible but it
 * is not established that Media3's artwork loader resolves it, and the payoff
 * is one small square. Title, artist and the transport all work.
 */
let artworkUri: string | null = null;
function ensureArtwork(): string | undefined {
  if (artworkUri) return artworkUri;
  try {
    const asset = Asset.fromModule(require('@/assets/images/icon.png'));
    const candidate = asset.localUri ?? asset.uri ?? null;
    if (candidate && /^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
      artworkUri = candidate;
      return artworkUri;
    }
    void asset.downloadAsync().catch(() => {});
  } catch {
    return undefined;
  }
  return undefined;
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
  owner: 'single' | 'mixer'
): void {
  if (Platform.OS === 'web') return;
  if (!player) return;
  if (lockScreenPlayer && lockScreenPlayer !== player) clearNowPlaying();
  try {
    player.setActiveForLockScreen(true, {
      title,
      artist: 'NeuroSound',
      artworkUrl: ensureArtwork(),
    }, { showSeekBackward: false, showSeekForward: false });
    watchLockScreenPlayer(player, owner);
  } catch (e) {
    console.log('Lock screen controls unavailable:', e);
  }
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

  if (generator) {
    const outgoing = generator;
    const outgoingVolume = lastVolume;
    const wasPlaying = useAudioStore.getState().isPlaying;
    cancelRamp();
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

let playPending = false;

export async function play(): Promise<void> {
  if (!generator || playPending) return;
  // Captured locally: unload()/loadPreset() can dispose and null out the
  // module-level `generator` while this call is still awaiting play() (e.g.
  // the user taps the MiniPlayer's close button mid-load) — re-reading the
  // mutable variable afterwards would dereference null instead of finding
  // out cleanly that this attempt is no longer relevant.
  const gen = generator;
  playPending = true;
  const store = useAudioStore.getState();
  store.setIsLoading(true);
  store.setPlaybackError(false);
  try {
    setGenVolume(0); // fade in from silence
    const nativePlayer = gen.getNativePlayer();
    if (nativePlayer && gen.getIsPlaying()) nativePlayer.play();
    else await gen.play();
    if (generator !== gen || !gen.getIsPlaying()) {
      // Either superseded (unloaded/switched while awaiting) or the
      // generator swallowed its own error — either way, this attempt is
      // done; only surface a failure if it's still the active generator.
      if (generator === gen) useAudioStore.getState().setPlaybackError(true);
      return;
    }
    ramp(effectiveVolume(), FADE_IN_MS);
    useAudioStore.getState().setIsPlaying(true);
    beginListening();
    const preset = useAudioStore.getState().currentPreset;
    if (preset) setNowPlaying(gen.getNativePlayer(), i18n.t(preset.nameKey), 'single');
  } catch (e) {
    if (generator === gen) useAudioStore.getState().setPlaybackError(true);
  } finally {
    useAudioStore.getState().setIsLoading(false);
    playPending = false;
  }
}

/** Fade out then stop. `immediate` skips the fade (unload/switching). */
export function pause(immediate: boolean = false): void {
  const gen = generator;
  useAudioStore.getState().setIsPlaying(false);
  endListening();
  if (!gen) return;
  if (immediate) {
    cancelRamp();
    gen.stop();
    return;
  }
  const nativePlayer = gen.getNativePlayer();
  ramp(0, FADE_OUT_MS, () => {
    if (nativePlayer) nativePlayer.pause();
    else gen.stop();
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
    mixerGenerators.get(ch.id)?.setVolume(channelVolume(ch, maxVolume))
  );
}

/** Tear down the single-preset generator, leaving the timer alone. */
function disposePreset(): void {
  pause(true);
  clearNowPlaying();
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
  const { isPlaying, isMixerPlaying, mixerChannels } = useAudioStore.getState();
  const { maxVolume } = useSettingsStore.getState();

  if (isPlaying) {
    setGenVolume(effectiveVolume() * ratio);
  }
  if (isMixerPlaying) {
    mixerChannels.forEach((ch) =>
      mixerGenerators.get(ch.id)?.setVolume(channelVolume(ch, maxVolume) * ratio)
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
  const { timerEndsAt, updateTimerRemaining, isPlaying, isMixerPlaying } =
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

  // Gentle fade over the final window instead of an abrupt cut
  if ((isPlaying || isMixerPlaying) && remaining <= TIMER_FADE_WINDOW_S && !rampInterval) {
    applyTimerFade(remaining / TIMER_FADE_WINDOW_S);
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
  if (!minutes) return;

  evaluateTimer();
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
  // Mutual exclusion only — a sleep timer set for this session must survive.
  disposePreset();

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
  mixerChannels: MixerChannelState[],
  maxVolume: number
): Promise<void> {
  try {
    for (const ch of mixerChannels) {
      let gen = mixerGenerators.get(ch.id);
      if (!gen) {
        const created = createGenerator(ch.preset);
        if (!created) continue;
        gen = created;
        mixerGenerators.set(ch.id, gen);
      }
      gen.setVolume(channelVolume(ch, maxVolume));
      await gen.play();
      if (!gen.getIsPlaying()) throw new Error(`Mixer channel failed: ${ch.id}`);
    }
    useAudioStore.getState().setIsMixerPlaying(true);
    beginListening();
    const leader = mixerGenerators.values().next().value as Generator | undefined;
    setNowPlaying(leader?.getNativePlayer() ?? null, 'NeuroSound Mixer', 'mixer');
  } catch {
    mixerGenerators.forEach((gen) => {
      gen.stop();
      gen.dispose();
    });
    mixerGenerators.clear();
    useAudioStore.getState().setIsMixerPlaying(false);
    useAudioStore.getState().setPlaybackError(true);
  }
}

export function mixerStop(): void {
  if (lockScreenOwner === 'mixer') clearNowPlaying();
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
 * level, times the master fader, times the settings safety cap.
 *
 * A muted channel outputs nothing but keeps its level, so unmuting restores
 * exactly what the user set — the same reason the master scales channels
 * rather than rewriting them.
 */
function channelVolume(
  ch: { volume: number; muted: boolean },
  maxVolume: number,
  master = useAudioStore.getState().mixerMasterVolume
): number {
  return ch.muted ? 0 : ch.volume * master * maxVolume;
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
}

/** Add a channel. Returns false when the channel limit is reached.
 *  If the mixer is playing, the new channel starts immediately. */
export async function mixerAddChannel(preset: FrequencyPreset): Promise<boolean> {
  const store = useAudioStore.getState();
  if (store.mixerChannels.length >= MAX_MIXER_CHANNELS) return false;

  const id = `channel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  store.addMixerChannel({ id, preset, volume: 0.5, muted: false });
  store.setActiveMixId(null);

  if (store.isMixerPlaying) {
    const gen = createGenerator(preset);
    if (gen) {
      mixerGenerators.set(id, gen);
      // Same gain chain as every other channel — a channel added into a mix
      // whose master is turned down used to arrive at full level and blast
      // over the balance the user had just set.
      gen.setVolume(
        channelVolume({ volume: 0.5, muted: false }, useSettingsStore.getState().maxVolume)
      );
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
  useAudioStore.getState().setActiveMixId(null);
  if (useAudioStore.getState().mixerChannels.length === 0) {
    useAudioStore.getState().setIsMixerPlaying(false);
  }
}

export function mixerSetChannelVolume(channelId: string, volume: number): void {
  const store = useAudioStore.getState();
  store.updateMixerChannelVolume(channelId, volume);
  // Moving a muted channel's level unmutes it — otherwise the slider moves and
  // nothing happens, which reads as broken.
  store.setMixerChannelMuted(channelId, false);
  mixerGenerators
    .get(channelId)
    ?.setVolume(
      channelVolume({ volume, muted: false }, useSettingsStore.getState().maxVolume)
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
