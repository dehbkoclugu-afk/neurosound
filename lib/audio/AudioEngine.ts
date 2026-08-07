/**
 * Cross-platform Audio Engine
 * Web: Uses Web Audio API for real-time synthesis
 * Native (Android/iOS): Uses expo-audio with generated audio
 * Ambient sounds: Uses real audio files when available
 */

import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { hasRealSound, getLocalSound } from './ambientSounds';

// Check if we're on web
const isWeb = Platform.OS === 'web';

// Initialize audio mode for native
async function initAudioMode() {
  if (isWeb) return;

  try {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      shouldRouteThroughEarpiece: false,
    });
  } catch (e) {
    console.log('Audio mode init error:', e);
  }
}

// Call init on module load
initAudioMode();

/**
 * Encode interleaved 16-bit PCM samples as a WAV data URL.
 * Int16Array is used directly for the data chunk; every supported
 * platform (ARM/x86) is little-endian, matching the WAV format.
 */
function int16ToWavDataUrl(samples: Int16Array, numChannels: number, sampleRate: number): string {
  const blockAlign = numChannels * 2;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  new Uint8Array(buffer, 44).set(new Uint8Array(samples.buffer, samples.byteOffset, dataSize));

  // Chunked conversion: per-character string concat is O(n^2) on multi-MB buffers
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }

  return 'data:audio/wav;base64,' + btoa(binary);
}

/**
 * Create a WAV data URL with a sine wave tone
 */
function createToneDataUrl(frequency: number, durationSec: number = 5, sampleRate: number = 44100): string {
  const numSamples = sampleRate * durationSec;
  const samples = new Int16Array(numSamples);
  const amplitude = 0.3 * 32767; // 30% volume to avoid clipping

  for (let i = 0; i < numSamples; i++) {
    samples[i] = Math.sin(2 * Math.PI * frequency * (i / sampleRate)) * amplitude;
  }

  return int16ToWavDataUrl(samples, 1, sampleRate);
}

/**
 * Create stereo binaural beat WAV (different frequency in each ear)
 */
function createBinauralDataUrl(
  baseFreq: number,
  beatFreq: number,
  durationSec: number = 5,
  sampleRate: number = 44100
): string {
  const numSamples = sampleRate * durationSec;
  const samples = new Int16Array(numSamples * 2);
  const amplitude = 0.3 * 32767;
  const leftFreq = baseFreq;
  const rightFreq = baseFreq + beatFreq;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    samples[i * 2] = Math.sin(2 * Math.PI * leftFreq * t) * amplitude;
    samples[i * 2 + 1] = Math.sin(2 * Math.PI * rightFreq * t) * amplitude;
  }

  return int16ToWavDataUrl(samples, 2, sampleRate);
}

/**
 * Create noise WAV (stereo, same signal in both channels)
 */
function createNoiseDataUrl(
  type: 'white' | 'pink' | 'brown',
  durationSec: number = 5,
  sampleRate: number = 44100
): string {
  const numSamples = sampleRate * durationSec;
  const samples = new Int16Array(numSamples * 2);
  const amplitude = 0.2 * 32767;

  if (type === 'white') {
    for (let i = 0; i < numSamples; i++) {
      const sample = (Math.random() * 2 - 1) * amplitude;
      samples[i * 2] = sample;
      samples[i * 2 + 1] = sample;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < numSamples; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11 * amplitude;
      b6 = white * 0.115926;
      samples[i * 2] = sample;
      samples[i * 2 + 1] = sample;
    }
  } else { // brown
    let lastOut = 0;
    for (let i = 0; i < numSamples; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      const sample = lastOut * 3.5 * amplitude;
      samples[i * 2] = sample;
      samples[i * 2 + 1] = sample;
    }
  }

  return int16ToWavDataUrl(samples, 2, sampleRate);
}

/**
 * Tone Player - For Solfeggio frequencies
 */
export class TonePlayer {
  private player: AudioPlayer | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.5;
  private frequency: number = 440;
  private isLoaded: boolean = false;

  // Web Audio nodes - own context for isolation
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  setFrequency(freq: number) {
    this.frequency = freq;
    if (isWeb && this.oscillator && this.audioContext) {
      this.oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
    }
    if (!isWeb && this.isLoaded) {
      this.isLoaded = false;
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (isWeb && this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
    if (this.player) {
      this.player.volume = this.volume;
    }
  }

  async play(): Promise<void> {
    if (this.isPlaying) return;

    try {
      if (isWeb) {
        await this.playWeb();
      } else {
        await this.playNative();
      }
      this.isPlaying = true;
    } catch (e) {
      console.log('Tone play error:', e);
    }
  }

  private async playWeb(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(this.frequency, this.audioContext.currentTime);
    this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.oscillator.start();
  }

  private async playNative(): Promise<void> {
    try {
      // Use shorter duration (2 seconds) for lower memory usage
      const dataUrl = createToneDataUrl(this.frequency, 2);

      const player = createAudioPlayer({ uri: dataUrl });
      player.loop = true;
      player.volume = this.volume;
      player.play();

      this.player = player;
      this.isLoaded = true;
    } catch (e) {
      console.log('Native tone error:', e);
      console.log('Frequency was:', this.frequency);
    }
  }

  stop(): void {
    if (!this.isPlaying) return;

    try {
      if (isWeb) {
        if (this.oscillator) {
          this.oscillator.stop();
          this.oscillator.disconnect();
          this.oscillator = null;
        }
        if (this.gainNode) {
          this.gainNode.disconnect();
          this.gainNode = null;
        }
      } else {
        if (this.player) {
          this.player.pause();
          this.player.remove();
          this.player = null;
        }
      }
    } catch (e) {
      console.log('Stop error:', e);
    }

    this.isPlaying = false;
    this.isLoaded = false;
  }

  /** The underlying native player, for OS-level integrations (lock screen
   *  metadata) that live outside this class's web/native abstraction. Null
   *  on web, where there's no lock screen to control. */
  getNativePlayer(): AudioPlayer | null {
    return this.player;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close().catch(console.log);
      this.audioContext = null;
    }
  }
}

/**
 * Binaural Beat Player
 */
export class BinauralPlayer {
  private player: AudioPlayer | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.5;
  private baseFrequency: number = 200;
  private beatFrequency: number = 10;
  private isLoaded: boolean = false;

  // Web Audio nodes - own context for isolation
  private audioContext: AudioContext | null = null;
  private leftOscillator: OscillatorNode | null = null;
  private rightOscillator: OscillatorNode | null = null;
  private leftGain: GainNode | null = null;
  private rightGain: GainNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private masterGain: GainNode | null = null;

  setBaseFrequency(freq: number) {
    this.baseFrequency = Math.max(100, Math.min(500, freq));
    this.updateFrequencies();
    if (!isWeb) this.isLoaded = false;
  }

  setBeatFrequency(freq: number) {
    this.beatFrequency = Math.max(0.5, Math.min(100, freq));
    this.updateFrequencies();
    if (!isWeb) this.isLoaded = false;
  }

  private updateFrequencies() {
    if (!isWeb || !this.audioContext) return;
    if (!this.leftOscillator || !this.rightOscillator) return;

    try {
      this.leftOscillator.frequency.setValueAtTime(this.baseFrequency, this.audioContext.currentTime);
      this.rightOscillator.frequency.setValueAtTime(this.baseFrequency + this.beatFrequency, this.audioContext.currentTime);
    } catch (e) {
      console.log('Update frequency error:', e);
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));

    if (isWeb && this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
    if (this.player) {
      this.player.volume = this.volume;
    }
  }

  async play(): Promise<void> {
    if (this.isPlaying) return;

    try {
      if (isWeb) {
        await this.playWeb();
      } else {
        await this.playNative();
      }
      this.isPlaying = true;
    } catch (e) {
      console.log('Binaural play error:', e);
    }
  }

  private async playWeb(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.leftOscillator = this.audioContext.createOscillator();
    this.rightOscillator = this.audioContext.createOscillator();

    this.leftOscillator.type = 'sine';
    this.rightOscillator.type = 'sine';

    this.leftOscillator.frequency.setValueAtTime(this.baseFrequency, this.audioContext.currentTime);
    this.rightOscillator.frequency.setValueAtTime(this.baseFrequency + this.beatFrequency, this.audioContext.currentTime);

    this.leftGain = this.audioContext.createGain();
    this.rightGain = this.audioContext.createGain();
    this.leftGain.gain.setValueAtTime(1, this.audioContext.currentTime);
    this.rightGain.gain.setValueAtTime(1, this.audioContext.currentTime);

    this.merger = this.audioContext.createChannelMerger(2);
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

    this.leftOscillator.connect(this.leftGain);
    this.rightOscillator.connect(this.rightGain);
    this.leftGain.connect(this.merger, 0, 0);
    this.rightGain.connect(this.merger, 0, 1);
    this.merger.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);

    this.leftOscillator.start();
    this.rightOscillator.start();
  }

  private async playNative(): Promise<void> {
    try {
      // 2 seconds, not 10. The buffer is built in JS and handed over as a
      // base64 data URL, so ten seconds of 44.1 kHz stereo means a ~3.5 MB
      // array, a ~3.5M-character binary string and a ~4.7 MB base64 string
      // alive at once — on a mid-range phone that is a real allocation spike
      // for a tone that repeats every cycle anyway.
      //
      // Seamless because both channels complete a whole number of cycles in
      // the window: frequencies are clamped to 0.5 Hz steps, and 2 s of any
      // multiple of 0.5 Hz is an integer cycle count. Asserted in the tests.
      const dataUrl = createBinauralDataUrl(this.baseFrequency, this.beatFrequency, 2);

      const player = createAudioPlayer({ uri: dataUrl });
      player.loop = true;
      player.volume = this.volume;
      player.play();

      this.player = player;
      this.isLoaded = true;
    } catch (e) {
      console.log('Native binaural error:', e);
    }
  }

  stop(): void {
    if (!this.isPlaying) return;

    try {
      if (isWeb) {
        [this.leftOscillator, this.rightOscillator].forEach(osc => {
          if (osc) {
            try {
              osc.stop();
              osc.disconnect();
            } catch (e) {}
          }
        });
        [this.leftGain, this.rightGain, this.merger, this.masterGain].forEach(node => {
          if (node) {
            try { node.disconnect(); } catch (e) {}
          }
        });
      } else {
        if (this.player) {
          this.player.pause();
          this.player.remove();
          this.player = null;
        }
      }
    } catch (e) {
      console.log('Stop error:', e);
    }

    this.leftOscillator = null;
    this.rightOscillator = null;
    this.leftGain = null;
    this.rightGain = null;
    this.merger = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.isLoaded = false;
  }

  /** The underlying native player, for OS-level integrations (lock screen
   *  metadata) that live outside this class's web/native abstraction. Null
   *  on web, where there's no lock screen to control. */
  getNativePlayer(): AudioPlayer | null {
    return this.player;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close().catch(console.log);
      this.audioContext = null;
    }
  }
}

/**
 * Noise Player - Uses real audio files for ambient sounds, procedural for basic noise
 */
export class NoisePlayer {
  private player: AudioPlayer | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.5;
  private noiseType: string = 'white';
  private isLoaded: boolean = false;

  // Web Audio nodes (for procedural noise only)
  private audioContext: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;

  async setNoiseType(type: string): Promise<void> {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stop();
    }
    this.noiseType = type;
    this.isLoaded = false;

    // Preload real audio file for faster playback. Awaited before replaying
    // below — firing it and moving on left play() racing the preload, which
    // would find isLoaded still false and create a second, orphaned player.
    if (hasRealSound(type) && !isWeb) {
      await this.preloadAudio();
    }

    if (wasPlaying) {
      await this.play();
    }
  }

  // Preload audio file for instant playback
  private async preloadAudio(): Promise<void> {
    const soundAsset = getLocalSound(this.noiseType);
    if (!soundAsset) return;

    try {
      // Create without playing — loads so playback can start instantly later
      const player = createAudioPlayer(soundAsset);
      player.loop = true;
      player.volume = this.volume;

      // A tap fast enough to land before this resolves takes play()'s own
      // "create and play directly" fallback path. If that's already making
      // sound, swapping in this (unplayed) player would silently kill it
      // while isPlaying kept reporting true.
      if (this.isPlaying) {
        player.remove();
        return;
      }

      if (this.player) {
        this.player.remove();
      }
      this.player = player;
      this.isLoaded = true;
    } catch (e) {
      console.log('Preload error:', e);
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));

    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (this.player) {
      this.player.volume = this.volume;
    }
  }

  private generateWhiteNoise(bufferSize: number): Float32Array {
    const output = new Float32Array(bufferSize);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return output;
  }

  private generatePinkNoise(bufferSize: number): Float32Array {
    const output = new Float32Array(bufferSize);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return output;
  }

  private generateBrownNoise(bufferSize: number): Float32Array {
    const output = new Float32Array(bufferSize);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    return output;
  }

  // Only white/pink/brown ever reach here — play() routes anything with a
  // bundled real recording (ambientSounds.ts's ten themed types) through
  // playRealAudioWeb/Native instead. This used to also carry a per-type
  // synthesis branch (rain, thunder, ocean, wind, fire, forest, stream, fan,
  // airplane, train) that could never execute for exactly that reason.
  private generateNoiseData(type: string, bufferSize: number): Float32Array {
    switch (type) {
      case 'pink':
        return this.generatePinkNoise(bufferSize);
      case 'brown':
        return this.generateBrownNoise(bufferSize);
      case 'white':
      default:
        return this.generateWhiteNoise(bufferSize);
    }
  }

  async play(): Promise<void> {
    if (this.isPlaying) return;

    try {
      // Check if this noise type has a real audio file
      if (hasRealSound(this.noiseType)) {
        // Use real audio file
        if (isWeb) {
          await this.playRealAudioWeb();
        } else {
          await this.playRealAudioNative();
        }
      } else {
        // Use procedural audio for white/pink/brown noise
        if (isWeb) {
          await this.playProceduralWeb();
        } else {
          await this.playProceduralNative();
        }
      }
      this.isPlaying = true;
    } catch (e) {
      console.log('Noise play error:', e);
    }
  }

  // Play real audio file on web using HTML Audio element
  private async playRealAudioWeb(): Promise<void> {
    const soundAsset = getLocalSound(this.noiseType);
    if (!soundAsset) {
      // Fallback to procedural
      await this.playProceduralWeb();
      return;
    }

    // For web, use HTMLAudioElement (window.Audio, not the audio engine classes)
    this.audioElement = new (window as any).Audio() as HTMLAudioElement;
    this.audioElement.src = soundAsset;
    this.audioElement.loop = true;
    this.audioElement.volume = this.volume;
    await this.audioElement.play();
  }

  // Play real audio file on native using expo-audio
  private async playRealAudioNative(): Promise<void> {
    const soundAsset = getLocalSound(this.noiseType);
    if (!soundAsset) {
      // Fallback to procedural
      await this.playProceduralNative();
      return;
    }

    try {
      // If already preloaded, just play
      if (this.player && this.isLoaded) {
        await this.player.seekTo(0);
        this.player.play();
        return;
      }

      // Otherwise load and play
      const player = createAudioPlayer(soundAsset);
      player.loop = true;
      player.volume = this.volume;
      player.play();

      this.player = player;
      this.isLoaded = true;
    } catch (e) {
      console.log('Native real audio error:', e);
      // Fallback to procedural
      await this.playProceduralNative();
    }
  }

  // Only white/pink/brown ever reach playProceduralWeb (see
  // generateNoiseData) — the themed types' filter settings this used to
  // carry alongside them were equally unreachable.
  private getFilterSettings(type: string): { frequency: number; Q: number; type: BiquadFilterType } | null {
    switch (type) {
      case 'brown': return { frequency: 500, Q: 0.5, type: 'lowpass' };
      default: return null;
    }
  }

  // Play procedural noise (web)
  private async playProceduralWeb(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const sampleRate = this.audioContext.sampleRate;
    // Use 8 seconds for better looping quality
    const bufferSize = sampleRate * 8;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);

    // Generate appropriate noise for the type
    const noiseData = this.generateNoiseData(this.noiseType, bufferSize);
    buffer.copyToChannel(noiseData as Float32Array<ArrayBuffer>, 0);
    buffer.copyToChannel(noiseData as Float32Array<ArrayBuffer>, 1);

    this.noiseNode = this.audioContext.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

    // Apply filter for warmer sound
    const filterSettings = this.getFilterSettings(this.noiseType);
    if (filterSettings) {
      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = filterSettings.type;
      this.filterNode.frequency.setValueAtTime(filterSettings.frequency, this.audioContext.currentTime);
      this.filterNode.Q.setValueAtTime(filterSettings.Q, this.audioContext.currentTime);

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
    } else {
      this.noiseNode.connect(this.gainNode);
    }

    this.gainNode.connect(this.audioContext.destination);
    this.noiseNode.start();
  }

  // Play procedural noise (native)
  private async playProceduralNative(): Promise<void> {
    try {
      let basicType: 'white' | 'pink' | 'brown' = 'white';
      if (this.noiseType === 'pink') basicType = 'pink';
      else if (this.noiseType === 'brown') basicType = 'brown';

      const dataUrl = createNoiseDataUrl(basicType, 10);

      const player = createAudioPlayer({ uri: dataUrl });
      player.loop = true;
      player.volume = this.volume;
      player.play();

      this.player = player;
      this.isLoaded = true;
    } catch (e) {
      console.log('Native noise error:', e);
    }
  }

  stop(): void {
    if (!this.isPlaying) return;

    try {
      // Stop HTML Audio element (real audio on web)
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.audioElement.src = '';
        this.audioElement = null;
      }

      // Stop Web Audio nodes (procedural on web)
      if (this.noiseNode) {
        try {
          this.noiseNode.stop();
          this.noiseNode.disconnect();
        } catch (e) {}
        this.noiseNode = null;
      }
      if (this.filterNode) {
        try { this.filterNode.disconnect(); } catch (e) {}
        this.filterNode = null;
      }
      if (this.gainNode) {
        try { this.gainNode.disconnect(); } catch (e) {}
        this.gainNode = null;
      }

      // Stop native player
      if (this.player) {
        this.player.pause();
        this.player.remove();
        this.player = null;
      }
    } catch (e) {
      console.log('Noise stop error:', e);
    }

    this.isPlaying = false;
    this.isLoaded = false;
  }

  /** The underlying native player, for OS-level integrations (lock screen
   *  metadata) that live outside this class's web/native abstraction. Null
   *  on web, where there's no lock screen to control. */
  getNativePlayer(): AudioPlayer | null {
    return this.player;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getNoiseType() {
    return this.noiseType;
  }

  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close().catch(console.log);
      this.audioContext = null;
    }
  }
}

// Create fresh instances each time to avoid audio conflicts
export function getTonePlayer(): TonePlayer {
  return new TonePlayer();
}

export function getBinauralPlayer(): BinauralPlayer {
  return new BinauralPlayer();
}

export function getNoisePlayer(): NoisePlayer {
  return new NoisePlayer();
}
