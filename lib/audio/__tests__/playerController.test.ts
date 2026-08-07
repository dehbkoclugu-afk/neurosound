/**
 * playerController — the layer that decides which generator exists, when it
 * plays, and at what level.
 *
 * AudioEngine's own tests prove a preset produces the right waveform. These
 * prove the right waveform actually reaches the speaker at the right volume,
 * which is the part a user experiences as "that sound doesn't play".
 */

const createdPlayers: any[] = [];
/** Set by the lock-screen tests: makes the OS refuse foreground controls for
 *  every player, including ones created after the switch is flipped. */
const lockScreen = { refuse: false };

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn(async () => {}),
  createAudioPlayer: jest.fn((source: any) => {
    const player = {
      source,
      loop: false,
      volume: 1,
      playing: false,
      removed: false,
      play() {
        this.playing = true;
      },
      pause() {
        this.playing = false;
      },
      remove() {
        this.removed = true;
      },
      seekTo: jest.fn(async () => {}),
      addListener: jest.fn(() => ({ remove: () => {} })),
      setActiveForLockScreen: jest.fn(() => {
        if (lockScreen.refuse) throw new Error('ForegroundServiceStartNotAllowedException');
      }),
      clearLockScreenControls: jest.fn(() => {
        if (lockScreen.refuse) throw new Error('service already gone');
      }),
    };
    createdPlayers.push(player);
    return player;
  }),
}));

jest.mock('expo-asset', () => ({
  Asset: { fromModule: () => ({ localUri: 'file://icon.png', uri: 'icon.png' }) },
}));

import * as playerController from '../playerController';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getPresetById } from '@/lib/frequencies';

const preset = (id: string) => {
  const p = getPresetById(id);
  if (!p) throw new Error(`unknown preset ${id}`);
  return p;
};

/** Volume ramps run on a 30 ms interval; let them finish. */
const settle = async () => {
  jest.advanceTimersByTime(1000);
  await Promise.resolve();
};

beforeEach(() => {
  jest.useFakeTimers();
  createdPlayers.length = 0;
  playerController.unload();
  playerController.mixerClear();
  useAudioStore.getState().reset();
  useSettingsStore.setState({ maxVolume: 1 });
});

afterEach(() => {
  playerController.unload();
  playerController.mixerClear();
  jest.useRealTimers();
});

const live = () => createdPlayers.filter((p) => !p.removed);

describe('single preset playback', () => {
  it.each([
    'binaural-delta',
    'binaural-gamma',
    'solfeggio-40',
    'solfeggio-963',
    'noise-white',
    'noise-brown',
    'noise-rain',
    'noise-airplane',
    'noise-train',
  ])('%s actually starts', async (id) => {
    playerController.loadPreset(preset(id));
    await playerController.play();

    const store = useAudioStore.getState();
    expect(store.isPlaying).toBe(true);
    expect(store.playbackError).toBe(false);
    expect(store.isLoading).toBe(false);
    expect(live().some((p) => p.playing)).toBe(true);
  });

  it('reaches the requested volume once the fade-in finishes', async () => {
    useAudioStore.getState().setVolume(0.6);
    useSettingsStore.setState({ maxVolume: 0.8 });
    playerController.loadPreset(preset('noise-rain'));
    await playerController.play();
    await settle();

    expect(live()[0].volume).toBeCloseTo(0.6 * 0.8, 2);
  });

  it('switching presets ends up with one audible sound, not two', async () => {
    playerController.loadPreset(preset('noise-rain'));
    await playerController.play();
    await settle();

    playerController.loadPreset(preset('binaural-alpha'));
    await playerController.play();
    await settle();

    expect(live()).toHaveLength(1);
    expect(useAudioStore.getState().currentPreset?.id).toBe('binaural-alpha');
  });

  it('pause then play resumes the same sound', async () => {
    playerController.loadPreset(preset('noise-fire'));
    await playerController.play();
    await settle();
    const first = live()[0];

    playerController.pause();
    await settle();
    expect(useAudioStore.getState().isPlaying).toBe(false);
    expect(first.playing).toBe(false);

    await playerController.play();
    await settle();
    expect(useAudioStore.getState().isPlaying).toBe(true);
    expect(first.playing).toBe(true);
    expect(first.volume).toBeCloseTo(0.5, 2);
  });

  it('unload silences and forgets everything', async () => {
    playerController.loadPreset(preset('noise-ocean'));
    await playerController.play();
    playerController.unload();

    expect(useAudioStore.getState().currentPreset).toBeNull();
    expect(useAudioStore.getState().isPlaying).toBe(false);
    expect(live()).toHaveLength(0);
  });
});

describe('mixer', () => {
  const addChannels = async (...ids: string[]) => {
    for (const id of ids) await playerController.mixerAddChannel(preset(id));
  };

  it('starts every channel', async () => {
    await addChannels('noise-rain', 'binaural-alpha', 'solfeggio-528');
    await playerController.mixerStart();

    expect(useAudioStore.getState().isMixerPlaying).toBe(true);
    expect(useAudioStore.getState().playbackError).toBe(false);
    expect(live().filter((p) => p.playing)).toHaveLength(3);
  });

  it('caps the channel count', async () => {
    await addChannels('noise-rain', 'noise-ocean', 'noise-wind', 'noise-fire');
    expect(await playerController.mixerAddChannel(preset('noise-forest'))).toBe(false);
    expect(useAudioStore.getState().mixerChannels).toHaveLength(4);
  });

  it('applies the master fader to channels added while playing', async () => {
    await addChannels('noise-rain');
    await playerController.mixerStart();
    playerController.mixerSetMasterVolume(0.2);

    await playerController.mixerAddChannel(preset('noise-ocean'));

    const added = live()[live().length - 1];
    // A channel added into a mix turned down to 20% must arrive at 20%, not
    // blast in at its own level over everything already balanced around it.
    expect(added.volume).toBeCloseTo(0.5 * 0.2, 2);
  });

  it('respects the settings volume cap for channels added while playing', async () => {
    useSettingsStore.setState({ maxVolume: 0.5 });
    await addChannels('noise-rain');
    await playerController.mixerStart();

    await playerController.mixerAddChannel(preset('noise-wind'));
    expect(live()[live().length - 1].volume).toBeCloseTo(0.5 * 0.5, 2);
  });

  it('mute silences without losing the channel level', async () => {
    await addChannels('noise-rain');
    await playerController.mixerStart();
    const [channel] = useAudioStore.getState().mixerChannels;

    playerController.mixerSetChannelMuted(channel.id, true);
    expect(live()[0].volume).toBe(0);

    playerController.mixerSetChannelMuted(channel.id, false);
    expect(live()[0].volume).toBeCloseTo(0.5, 2);
    expect(useAudioStore.getState().mixerChannels[0].volume).toBeCloseTo(0.5);
  });

  it('single preset and mixer never sound at the same time', async () => {
    await addChannels('noise-rain', 'noise-wind');
    await playerController.mixerStart();

    playerController.loadPreset(preset('binaural-theta'));
    await playerController.play();

    expect(useAudioStore.getState().isMixerPlaying).toBe(false);
    expect(live()).toHaveLength(1);
  });

  it('loading a saved mix plays it', async () => {
    await playerController.mixerLoadChannels(
      [
        { presetId: 'noise-rain', volume: 0.6 },
        { presetId: 'binaural-alpha', volume: 0.35 },
      ],
      'mix-1'
    );

    expect(useAudioStore.getState().isMixerPlaying).toBe(true);
    expect(useAudioStore.getState().activeMixId).toBe('mix-1');
    expect(live().filter((p) => p.playing)).toHaveLength(2);
  });

  it('drops unknown preset ids from a saved mix instead of failing it', async () => {
    await playerController.mixerLoadChannels([
      { presetId: 'noise-rain', volume: 0.5 },
      { presetId: 'noise-removed-in-a-later-version', volume: 0.5 },
    ]);

    expect(useAudioStore.getState().mixerChannels).toHaveLength(1);
    expect(useAudioStore.getState().isMixerPlaying).toBe(true);
  });
});

/**
 * Lock screen controls are decoration. expo-audio starts them with an
 * uncaught `context.startForegroundService()` (AudioControlsService.kt), and
 * Android 12+ rejects that call with ForegroundServiceStartNotAllowedException
 * whenever the process is not in a state allowed to start one. The rejection
 * used to surface as "could not start audio" over sound that was already
 * playing — and on the mixer it went through startMixerChannels' catch, which
 * tore down every channel that had just started.
 */
describe('when the OS refuses lock screen controls', () => {
  beforeEach(() => {
    lockScreen.refuse = true;
  });
  afterEach(() => {
    lockScreen.refuse = false;
  });

  it('single playback still plays and reports no error', async () => {
    playerController.loadPreset(preset('noise-rain'));
    await playerController.play();
    await settle();

    expect(useAudioStore.getState().isPlaying).toBe(true);
    expect(useAudioStore.getState().playbackError).toBe(false);
    expect(live().some((p) => p.playing)).toBe(true);
  });

  it('the mixer keeps every channel it started', async () => {
    await playerController.mixerAddChannel(preset('noise-rain'));
    await playerController.mixerAddChannel(preset('noise-wind'));
    await playerController.mixerStart();

    expect(useAudioStore.getState().isMixerPlaying).toBe(true);
    expect(useAudioStore.getState().playbackError).toBe(false);
    expect(live().filter((p) => p.playing)).toHaveLength(2);
  });

  it('tearing the controls down again cannot break switching presets', async () => {
    playerController.loadPreset(preset('noise-rain'));
    await playerController.play();

    playerController.loadPreset(preset('binaural-alpha'));
    await playerController.play();
    await settle();

    expect(useAudioStore.getState().isPlaying).toBe(true);
    expect(useAudioStore.getState().playbackError).toBe(false);
    expect(live()).toHaveLength(1);
  });
});

describe('sleep timer', () => {
  it('stops single playback when it runs out', async () => {
    playerController.loadPreset(preset('noise-rain'));
    await playerController.play();
    playerController.startTimer(1);

    jest.advanceTimersByTime(61_000);
    await Promise.resolve();
    await settle();

    expect(useAudioStore.getState().isPlaying).toBe(false);
    expect(useAudioStore.getState().timerDuration).toBeNull();
  });

  it('stops the mixer when it runs out', async () => {
    await playerController.mixerAddChannel(preset('noise-rain'));
    await playerController.mixerStart();
    playerController.startTimer(1);

    jest.advanceTimersByTime(61_000);
    await Promise.resolve();
    await settle();

    expect(useAudioStore.getState().isMixerPlaying).toBe(false);
    expect(live()).toHaveLength(0);
  });
});
