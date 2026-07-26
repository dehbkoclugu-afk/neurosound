import { useAudioStore } from '../audioStore';

beforeEach(() => {
  useAudioStore.getState().reset();
});

describe('audioStore volume', () => {
  it('clamps volume above 1 down to 1', () => {
    useAudioStore.getState().setVolume(1.5);
    expect(useAudioStore.getState().volume).toBe(1);
  });

  it('clamps volume below 0 up to 0', () => {
    useAudioStore.getState().setVolume(-0.5);
    expect(useAudioStore.getState().volume).toBe(0);
  });

  it('accepts an in-range volume unchanged', () => {
    useAudioStore.getState().setVolume(0.42);
    expect(useAudioStore.getState().volume).toBe(0.42);
  });
});

describe('audioStore timer', () => {
  it('derives timerEndsAt as a wall-clock deadline, not a plain countdown', () => {
    const before = Date.now();
    useAudioStore.getState().setTimer(30);
    const { timerEndsAt, timerDuration, timerRemaining } = useAudioStore.getState();
    expect(timerDuration).toBe(30);
    expect(timerRemaining).toBe(30 * 60);
    expect(timerEndsAt).toBeGreaterThanOrEqual(before + 30 * 60_000);
  });

  it('clears the timer when set to null', () => {
    useAudioStore.getState().setTimer(30);
    useAudioStore.getState().setTimer(null);
    const { timerEndsAt, timerDuration, timerRemaining } = useAudioStore.getState();
    expect(timerEndsAt).toBeNull();
    expect(timerDuration).toBeNull();
    expect(timerRemaining).toBeNull();
  });
});

describe('audioStore mixer channels', () => {
  const channel = {
    id: 'ch-1',
    preset: { id: 'noise-rain' } as any,
    volume: 0.5,
    muted: false,
  };

  it('adds and removes a mixer channel', () => {
    useAudioStore.getState().addMixerChannel(channel);
    expect(useAudioStore.getState().mixerChannels).toHaveLength(1);
    useAudioStore.getState().removeMixerChannel('ch-1');
    expect(useAudioStore.getState().mixerChannels).toHaveLength(0);
  });

  it('mutes a channel without losing its volume', () => {
    useAudioStore.getState().addMixerChannel(channel);
    useAudioStore.getState().setMixerChannelMuted('ch-1', true);
    const updated = useAudioStore.getState().mixerChannels[0];
    expect(updated.muted).toBe(true);
    expect(updated.volume).toBe(0.5);
  });

  it('reset restores initial state, including volume back to default', () => {
    useAudioStore.getState().setVolume(0.9);
    useAudioStore.getState().addMixerChannel(channel);
    useAudioStore.getState().reset();
    expect(useAudioStore.getState().volume).toBe(0.5);
    expect(useAudioStore.getState().mixerChannels).toHaveLength(0);
  });
});
