/**
 * Frequency definitions for NeuroSound
 */

export type FrequencyType = 'binaural' | 'solfeggio' | 'noise';
export type BinauralType = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';
export type NoiseType =
  | 'white'
  | 'pink'
  | 'brown'
  | 'rain'
  | 'thunder'
  | 'ocean'
  | 'wind'
  | 'fire'
  | 'forest'
  | 'fan'
  | 'airplane'
  | 'train'
  | 'stream';

export interface FrequencyPreset {
  id: string;
  type: FrequencyType;
  name: string;
  nameKey: string; // i18n key
  descriptionKey: string;
  // For binaural beats
  baseFrequency?: number; // Hz (carrier frequency, typically 200-400 Hz)
  beatFrequency?: number; // Hz (difference between left and right ear)
  binauralType?: BinauralType;
  // For solfeggio
  frequency?: number;
  // For noise
  noiseType?: NoiseType;
  // Visual
  color: string;
}

// Binaural beat presets
export const binauralPresets: FrequencyPreset[] = [
  {
    id: 'binaural-delta',
    type: 'binaural',
    name: 'Delta',
    nameKey: 'explore.binauralTypes.delta',
    descriptionKey: 'explore.binauralTypes.deltaDesc',
    baseFrequency: 200,
    beatFrequency: 2, // 0.5-4 Hz range, using 2 Hz
    binauralType: 'delta',
    color: '#3B82F6',
  },
  {
    id: 'binaural-theta',
    type: 'binaural',
    name: 'Theta',
    nameKey: 'explore.binauralTypes.theta',
    descriptionKey: 'explore.binauralTypes.thetaDesc',
    baseFrequency: 200,
    beatFrequency: 6, // 4-8 Hz range
    binauralType: 'theta',
    color: '#8B5CF6',
  },
  {
    id: 'binaural-alpha',
    type: 'binaural',
    name: 'Alpha',
    nameKey: 'explore.binauralTypes.alpha',
    descriptionKey: 'explore.binauralTypes.alphaDesc',
    baseFrequency: 200,
    beatFrequency: 10, // 8-14 Hz range
    binauralType: 'alpha',
    color: '#10B981',
  },
  {
    id: 'binaural-beta',
    type: 'binaural',
    name: 'Beta',
    nameKey: 'explore.binauralTypes.beta',
    descriptionKey: 'explore.binauralTypes.betaDesc',
    baseFrequency: 200,
    beatFrequency: 20, // 14-30 Hz range
    binauralType: 'beta',
    color: '#F59E0B',
  },
  {
    id: 'binaural-gamma',
    type: 'binaural',
    name: 'Gamma',
    nameKey: 'explore.binauralTypes.gamma',
    descriptionKey: 'explore.binauralTypes.gammaDesc',
    baseFrequency: 200,
    beatFrequency: 40, // 30-100 Hz range
    binauralType: 'gamma',
    color: '#EF4444',
  },
];

// Solfeggio frequency presets - sorted by frequency
export const solfeggioPresets: FrequencyPreset[] = [
  {
    id: 'solfeggio-40',
    type: 'solfeggio',
    name: '40 Hz',
    nameKey: 'explore.solfeggioFreqs.40',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 40,
    color: '#F59E0B', // Amber - Focus/Energy
  },
  {
    id: 'solfeggio-111',
    type: 'solfeggio',
    name: '111 Hz',
    nameKey: 'explore.solfeggioFreqs.111',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 111,
    color: '#10B981', // Emerald - Healing
  },
  {
    id: 'solfeggio-174',
    type: 'solfeggio',
    name: '174 Hz',
    nameKey: 'explore.solfeggioFreqs.174',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 174,
    color: '#EF4444', // Red - Pain relief
  },
  {
    id: 'solfeggio-285',
    type: 'solfeggio',
    name: '285 Hz',
    nameKey: 'explore.solfeggioFreqs.285',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 285,
    color: '#F97316', // Orange - Tissue healing
  },
  {
    id: 'solfeggio-396',
    type: 'solfeggio',
    name: '396 Hz',
    nameKey: 'explore.solfeggioFreqs.396',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 396,
    color: '#8B5CF6', // Violet - Liberation
  },
  {
    id: 'solfeggio-417',
    type: 'solfeggio',
    name: '417 Hz',
    nameKey: 'explore.solfeggioFreqs.417',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 417,
    color: '#F472B6', // Pink - Change
  },
  {
    id: 'solfeggio-432',
    type: 'solfeggio',
    name: '432 Hz',
    nameKey: 'explore.solfeggioFreqs.432',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 432,
    color: '#22C55E', // Green - Natural harmony
  },
  {
    id: 'solfeggio-440',
    type: 'solfeggio',
    name: '440 Hz',
    nameKey: 'explore.solfeggioFreqs.440',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 440,
    color: '#3B82F6', // Blue - Standard
  },
  {
    id: 'solfeggio-528',
    type: 'solfeggio',
    name: '528 Hz',
    nameKey: 'explore.solfeggioFreqs.528',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 528,
    color: '#EC4899', // Pink - Love frequency
  },
  {
    id: 'solfeggio-639',
    type: 'solfeggio',
    name: '639 Hz',
    nameKey: 'explore.solfeggioFreqs.639',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 639,
    color: '#06B6D4', // Cyan - Connection
  },
  {
    id: 'solfeggio-741',
    type: 'solfeggio',
    name: '741 Hz',
    nameKey: 'explore.solfeggioFreqs.741',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 741,
    color: '#0EA5E9', // Sky blue - Expression
  },
  {
    id: 'solfeggio-777',
    type: 'solfeggio',
    name: '777 Hz',
    nameKey: 'explore.solfeggioFreqs.777',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 777,
    color: '#FBBF24', // Yellow/Gold - Divine luck
  },
  {
    id: 'solfeggio-852',
    type: 'solfeggio',
    name: '852 Hz',
    nameKey: 'explore.solfeggioFreqs.852',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 852,
    color: '#6366F1', // Indigo - Intuition
  },
  {
    id: 'solfeggio-888',
    type: 'solfeggio',
    name: '888 Hz',
    nameKey: 'explore.solfeggioFreqs.888',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 888,
    color: '#A855F7', // Purple - Abundance
  },
  {
    id: 'solfeggio-963',
    type: 'solfeggio',
    name: '963 Hz',
    nameKey: 'explore.solfeggioFreqs.963',
    descriptionKey: 'explore.solfeggioDisclaimer',
    frequency: 963,
    color: '#D946EF', // Fuchsia - Cosmic
  },
];

// Noise presets
export const noisePresets: FrequencyPreset[] = [
  // Classic noise types
  {
    id: 'noise-white',
    type: 'noise',
    name: 'White Noise',
    nameKey: 'explore.noiseTypes.white',
    descriptionKey: 'explore.noiseTypes.whiteDesc',
    noiseType: 'white',
    color: '#94A3B8',
  },
  {
    id: 'noise-pink',
    type: 'noise',
    name: 'Pink Noise',
    nameKey: 'explore.noiseTypes.pink',
    descriptionKey: 'explore.noiseTypes.pinkDesc',
    noiseType: 'pink',
    color: '#F472B6',
  },
  {
    id: 'noise-brown',
    type: 'noise',
    name: 'Brown Noise',
    nameKey: 'explore.noiseTypes.brown',
    descriptionKey: 'explore.noiseTypes.brownDesc',
    noiseType: 'brown',
    color: '#A78BFA',
  },
  // Nature sounds
  {
    id: 'noise-rain',
    type: 'noise',
    name: 'Rain',
    nameKey: 'explore.noiseTypes.rain',
    descriptionKey: 'explore.noiseTypes.rainDesc',
    noiseType: 'rain',
    color: '#60A5FA',
  },
  {
    id: 'noise-thunder',
    type: 'noise',
    name: 'Thunderstorm',
    nameKey: 'explore.noiseTypes.thunder',
    descriptionKey: 'explore.noiseTypes.thunderDesc',
    noiseType: 'thunder',
    color: '#6366F1',
  },
  {
    id: 'noise-ocean',
    type: 'noise',
    name: 'Ocean Waves',
    nameKey: 'explore.noiseTypes.ocean',
    descriptionKey: 'explore.noiseTypes.oceanDesc',
    noiseType: 'ocean',
    color: '#06B6D4',
  },
  {
    id: 'noise-wind',
    type: 'noise',
    name: 'Wind',
    nameKey: 'explore.noiseTypes.wind',
    descriptionKey: 'explore.noiseTypes.windDesc',
    noiseType: 'wind',
    color: '#8B5CF6',
  },
  {
    id: 'noise-fire',
    type: 'noise',
    name: 'Fireplace',
    nameKey: 'explore.noiseTypes.fire',
    descriptionKey: 'explore.noiseTypes.fireDesc',
    noiseType: 'fire',
    color: '#F97316',
  },
  {
    id: 'noise-forest',
    type: 'noise',
    name: 'Forest',
    nameKey: 'explore.noiseTypes.forest',
    descriptionKey: 'explore.noiseTypes.forestDesc',
    noiseType: 'forest',
    color: '#22C55E',
  },
  {
    id: 'noise-stream',
    type: 'noise',
    name: 'Stream',
    nameKey: 'explore.noiseTypes.stream',
    descriptionKey: 'explore.noiseTypes.streamDesc',
    noiseType: 'stream',
    color: '#14B8A6',
  },
  // Machine sounds
  {
    id: 'noise-fan',
    type: 'noise',
    name: 'Fan',
    nameKey: 'explore.noiseTypes.fan',
    descriptionKey: 'explore.noiseTypes.fanDesc',
    noiseType: 'fan',
    color: '#64748B',
  },
  {
    id: 'noise-airplane',
    type: 'noise',
    name: 'Airplane Cabin',
    nameKey: 'explore.noiseTypes.airplane',
    descriptionKey: 'explore.noiseTypes.airplaneDesc',
    noiseType: 'airplane',
    color: '#475569',
  },
  {
    id: 'noise-train',
    type: 'noise',
    name: 'Train',
    nameKey: 'explore.noiseTypes.train',
    descriptionKey: 'explore.noiseTypes.trainDesc',
    noiseType: 'train',
    color: '#78716C',
  },
];

// All presets combined
export const allPresets: FrequencyPreset[] = [
  ...binauralPresets,
  ...solfeggioPresets,
  ...noisePresets,
];

// Get preset by ID
export function getPresetById(id: string): FrequencyPreset | undefined {
  return allPresets.find(preset => preset.id === id);
}

// Binaural beat frequency ranges
export const binauralRanges = {
  delta: { min: 0.5, max: 4, default: 2 },
  theta: { min: 4, max: 8, default: 6 },
  alpha: { min: 8, max: 14, default: 10 },
  beta: { min: 14, max: 30, default: 20 },
  gamma: { min: 30, max: 100, default: 40 },
};
