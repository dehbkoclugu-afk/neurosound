/**
 * AudioEngine — the generated-audio path.
 *
 * The three player classes had no coverage at all, which is how a preset that
 * produces silence on a device gets shipped: every failure in here is caught
 * and written to console.log, so a broken sound looks exactly like a working
 * one from the outside. These tests decode what the engine actually hands to
 * the platform player and check it is the waveform the preset asked for.
 */

const createdPlayers: any[] = [];

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
      setActiveForLockScreen: jest.fn(),
      clearLockScreenControls: jest.fn(),
    };
    createdPlayers.push(player);
    return player;
  }),
}));

import { Platform } from 'react-native';
import { getTonePlayer, getBinauralPlayer, getNoisePlayer } from '../AudioEngine';
import { localSounds } from '../ambientSounds';

beforeEach(() => {
  createdPlayers.length = 0;
});

/** These tests describe the native (expo-audio) branch. */
it('runs against the native branch', () => {
  expect(Platform.OS).not.toBe('web');
});

// --- WAV decoding -----------------------------------------------------------

interface Wav {
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  /** One Int16Array per channel, de-interleaved. */
  data: Int16Array[];
}

function decodeWavDataUrl(uri: string): Wav {
  const prefix = 'data:audio/wav;base64,';
  expect(uri.startsWith(prefix)).toBe(true);
  const buf = Buffer.from(uri.slice(prefix.length), 'base64');

  expect(buf.toString('ascii', 0, 4)).toBe('RIFF');
  expect(buf.toString('ascii', 8, 12)).toBe('WAVE');
  expect(buf.toString('ascii', 12, 16)).toBe('fmt ');
  expect(buf.readUInt16LE(20)).toBe(1); // PCM
  expect(buf.toString('ascii', 36, 40)).toBe('data');

  const channels = buf.readUInt16LE(22);
  const sampleRate = buf.readUInt32LE(24);
  const bitsPerSample = buf.readUInt16LE(34);
  const dataSize = buf.readUInt32LE(40);

  // Header fields must agree with each other and with the real payload, or a
  // decoder reads past the end and yields noise (or nothing).
  expect(buf.readUInt32LE(4)).toBe(36 + dataSize);
  expect(dataSize).toBe(buf.length - 44);
  expect(buf.readUInt16LE(32)).toBe(channels * (bitsPerSample / 8)); // blockAlign
  expect(buf.readUInt32LE(28)).toBe(sampleRate * channels * (bitsPerSample / 8));

  const frames = dataSize / 2 / channels;
  const data = Array.from({ length: channels }, () => new Int16Array(frames));
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      data[c][i] = buf.readInt16LE(44 + (i * channels + c) * 2);
    }
  }
  return { channels, sampleRate, bitsPerSample, data };
}

/** Frequency of a pure tone, from zero crossings: a sine of f Hz crosses zero
 *  2f times a second. Cheap, and it cannot be fooled by an amplitude bug. */
function measureFrequency(samples: Int16Array, sampleRate: number): number {
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1] < 0 !== samples[i] < 0) crossings++;
  }
  return (crossings * sampleRate) / (2 * samples.length);
}

function peak(samples: Int16Array): number {
  let max = 0;
  for (let i = 0; i < samples.length; i++) max = Math.max(max, Math.abs(samples[i]));
  return max;
}

// --- TonePlayer -------------------------------------------------------------

describe('TonePlayer', () => {
  it.each([40, 174, 432, 528, 963])('generates a clean %i Hz tone', async (freq) => {
    const tone = getTonePlayer();
    tone.setFrequency(freq);
    await tone.play();

    expect(createdPlayers).toHaveLength(1);
    const wav = decodeWavDataUrl(createdPlayers[0].source.uri);
    expect(wav.channels).toBe(1);
    expect(wav.sampleRate).toBe(44100);
    expect(measureFrequency(wav.data[0], wav.sampleRate)).toBeCloseTo(freq, 0);
    expect(peak(wav.data[0])).toBeGreaterThan(0.25 * 32767);
    tone.dispose();
  });

  it('loops without a click: the buffer holds a whole number of cycles', async () => {
    // A partial final cycle makes the loop point audible as a tick every few
    // seconds — the one artefact a sleep app cannot have.
    const tone = getTonePlayer();
    tone.setFrequency(432);
    await tone.play();
    const wav = decodeWavDataUrl(createdPlayers[0].source.uri);
    const cycles = (432 * wav.data[0].length) / wav.sampleRate;
    expect(cycles).toBe(Math.round(cycles));
    expect(createdPlayers[0].loop).toBe(true);
    tone.dispose();
  });

  it('reports playing, and releases the player on stop', async () => {
    const tone = getTonePlayer();
    tone.setFrequency(440);
    await tone.play();
    expect(tone.getIsPlaying()).toBe(true);
    expect(createdPlayers[0].playing).toBe(true);

    tone.stop();
    expect(tone.getIsPlaying()).toBe(false);
    expect(createdPlayers[0].removed).toBe(true);
    expect(tone.getNativePlayer()).toBeNull();
  });

  it('applies volume to the underlying player', async () => {
    const tone = getTonePlayer();
    tone.setVolume(0.25);
    await tone.play();
    expect(createdPlayers[0].volume).toBeCloseTo(0.25);
    tone.setVolume(0.8);
    expect(createdPlayers[0].volume).toBeCloseTo(0.8);
    tone.dispose();
  });

  it('does not stack players when play is called twice', async () => {
    const tone = getTonePlayer();
    tone.setFrequency(396);
    await tone.play();
    await tone.play();
    expect(createdPlayers).toHaveLength(1);
    tone.dispose();
  });
});

// --- BinauralPlayer ---------------------------------------------------------

describe('BinauralPlayer', () => {
  it.each([
    ['delta', 2],
    ['theta', 6],
    ['alpha', 10],
    ['beta', 20],
    ['gamma', 40],
  ])('puts a %s beat (%i Hz) between the two ears', async (_name, beat) => {
    const binaural = getBinauralPlayer();
    binaural.setBaseFrequency(200);
    binaural.setBeatFrequency(beat as number);
    await binaural.play();

    const wav = decodeWavDataUrl(createdPlayers[0].source.uri);
    expect(wav.channels).toBe(2);

    const left = measureFrequency(wav.data[0], wav.sampleRate);
    const right = measureFrequency(wav.data[1], wav.sampleRate);
    expect(left).toBeCloseTo(200, 0);
    expect(right).toBeCloseTo(200 + (beat as number), 0);
    // The beat *is* the product; a stereo file with identical channels is a
    // mono tone wearing a costume.
    expect(right - left).toBeCloseTo(beat as number, 0);
    binaural.dispose();
  });

  // The buffer is short to keep the allocation spike down, which only works
  // because every reachable frequency lands on a whole number of cycles in it.
  it.each([
    [200, 2],
    [200, 40],
    [100, 0.5], // the clamped extremes, including the half-Hertz step
    [500, 100],
  ])('loops seamlessly in both ears at %i Hz + %s Hz', async (base, beat) => {
    const binaural = getBinauralPlayer();
    binaural.setBaseFrequency(base);
    binaural.setBeatFrequency(beat);
    await binaural.play();

    const wav = decodeWavDataUrl(createdPlayers[0].source.uri);
    const seconds = wav.data[0].length / wav.sampleRate;
    expect(base * seconds).toBe(Math.round(base * seconds));
    expect((base + beat) * seconds).toBe(Math.round((base + beat) * seconds));
    binaural.dispose();
  });

  it('clamps frequencies to a safe, audible range', () => {
    const binaural = getBinauralPlayer();
    binaural.setBaseFrequency(20_000);
    binaural.setBeatFrequency(-5);
    return binaural.play().then(() => {
      const wav = decodeWavDataUrl(createdPlayers[0].source.uri);
      const left = measureFrequency(wav.data[0], wav.sampleRate);
      expect(left).toBeLessThanOrEqual(500);
      expect(measureFrequency(wav.data[1], wav.sampleRate)).toBeGreaterThan(left);
      binaural.dispose();
    });
  });

  it('releases the player on stop', async () => {
    const binaural = getBinauralPlayer();
    await binaural.play();
    binaural.stop();
    expect(createdPlayers[0].removed).toBe(true);
    expect(binaural.getIsPlaying()).toBe(false);
  });
});

// --- NoisePlayer ------------------------------------------------------------

describe('NoisePlayer', () => {
  it.each(['white', 'pink', 'brown'])('synthesises %s noise as stereo PCM', async (type) => {
    const noise = getNoisePlayer();
    await noise.setNoiseType(type);
    await noise.play();

    const wav = decodeWavDataUrl(createdPlayers[createdPlayers.length - 1].source.uri);
    expect(wav.channels).toBe(2);
    expect(peak(wav.data[0])).toBeGreaterThan(0.05 * 32767);
    // Not a constant, not silence: a real noise floor moves sample to sample.
    const distinct = new Set(Array.from(wav.data[0].subarray(0, 500))).size;
    expect(distinct).toBeGreaterThan(100);
    noise.dispose();
  });

  it.each(Object.keys(localSounds))('plays the bundled recording for %s', async (type) => {
    const noise = getNoisePlayer();
    await noise.setNoiseType(type);
    await noise.play();

    expect(noise.getIsPlaying()).toBe(true);
    const player = createdPlayers[createdPlayers.length - 1];
    // The bundled asset, not a synthesised fallback standing in for it.
    expect(player.source).toBe(localSounds[type]);
    expect(player.loop).toBe(true);
    expect(player.playing).toBe(true);
    noise.dispose();
  });

  it('switching type while playing leaves exactly one live player', async () => {
    const noise = getNoisePlayer();
    await noise.setNoiseType('rain');
    await noise.play();
    await noise.setNoiseType('ocean');

    expect(noise.getNoiseType()).toBe('ocean');
    expect(noise.getIsPlaying()).toBe(true);
    const live = createdPlayers.filter((p) => !p.removed);
    expect(live).toHaveLength(1);
    expect(live[0].source).toBe(localSounds.ocean);
    noise.dispose();
  });

  it('carries volume across a type switch', async () => {
    const noise = getNoisePlayer();
    noise.setVolume(0.3);
    await noise.setNoiseType('fire');
    await noise.play();
    await noise.setNoiseType('forest');
    const live = createdPlayers.filter((p) => !p.removed);
    expect(live[0].volume).toBeCloseTo(0.3);
    noise.dispose();
  });

  it('releases every player it created once disposed', async () => {
    const noise = getNoisePlayer();
    await noise.setNoiseType('rain');
    await noise.play();
    noise.dispose();
    expect(createdPlayers.every((p) => p.removed)).toBe(true);
  });
});
