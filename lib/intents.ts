/**
 * Intent-first entry points. Users arrive with a goal ("I can't sleep",
 * "I need to focus"), not a taxonomy ("binaural or solfeggio?").
 * Each intent maps to a curated list of existing presets.
 */

import { IconConfig } from '@/components/ui/Icon';

export type IntentId = 'sleep' | 'focus' | 'relax' | 'meditate';

export interface Intent {
  id: IntentId;
  nameKey: string;
  descKey: string;
  icon: IconConfig;
  color: string;
  gradient: [string, string];
  /** Atmospheric background. Placeholder (picsum seed) — swap for
   *  art-directed photography before release. */
  image: string;
  presetIds: string[];
}

// ponytail: picsum placeholders, not curated art. Replace `image` values
// with real atmospheric photos (night sky / desk light / forest / dawn).
const placeholder = (seed: string) =>
  `https://picsum.photos/seed/${seed}/900/500`;

export const intents: Intent[] = [
  {
    id: 'sleep',
    nameKey: 'intents.sleep',
    descKey: 'intents.sleepDesc',
    icon: { name: 'moon', library: 'ionicon' },
    color: '#6D83C9',
    gradient: ['#1C2440', '#6D83C9'],
    image: placeholder('neurosound-night-sky'),
    presetIds: [
      'binaural-delta',
      'noise-rain',
      'noise-brown',
      'noise-fan',
      'noise-train',
      'solfeggio-174',
    ],
  },
  {
    id: 'focus',
    nameKey: 'intents.focus',
    descKey: 'intents.focusDesc',
    icon: { name: 'flash', library: 'ionicon' },
    color: '#D99A4E',
    gradient: ['#3D2A12', '#D99A4E'],
    image: placeholder('neurosound-desk-light'),
    presetIds: [
      'binaural-beta',
      'binaural-gamma',
      'noise-white',
      'noise-airplane',
      'solfeggio-40',
    ],
  },
  {
    id: 'relax',
    nameKey: 'intents.relax',
    descKey: 'intents.relaxDesc',
    icon: { name: 'leaf', library: 'ionicon' },
    color: '#7FB069',
    gradient: ['#1E2E18', '#7FB069'],
    image: placeholder('neurosound-forest-fog'),
    presetIds: [
      'binaural-alpha',
      'noise-ocean',
      'noise-forest',
      'noise-stream',
      'noise-fire',
      'solfeggio-432',
    ],
  },
  {
    id: 'meditate',
    nameKey: 'intents.meditate',
    descKey: 'intents.meditateDesc',
    icon: { name: 'meditation', library: 'material' },
    color: '#A78BFA',
    gradient: ['#2A2244', '#A78BFA'],
    image: placeholder('neurosound-mountain-dawn'),
    presetIds: [
      'binaural-theta',
      'solfeggio-528',
      'solfeggio-852',
      'solfeggio-963',
      'noise-wind',
    ],
  },
];

export function getIntentById(id: string): Intent | undefined {
  return intents.find((i) => i.id === id);
}
