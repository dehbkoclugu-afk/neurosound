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
  /** Atmospheric background — a generated glow-and-grain gradient in the
   *  intent's own colour (assets/images/intents/), not a photo. Swap for
   *  art-directed photography if/when that's shot; the shape (require'd
   *  local asset) stays the same either way. */
  image: number;
  presetIds: string[];
  /** One-tap "start session" duration, in minutes — preset + timer + a
   *  comfortable volume together, instead of three separate steps every
   *  time. First entry in `presetIds` is the recommended sound. */
  recommendedMinutes: number;
}

export const intents: Intent[] = [
  {
    id: 'sleep',
    nameKey: 'intents.sleep',
    descKey: 'intents.sleepDesc',
    icon: { name: 'moon', library: 'ionicon' },
    color: '#6D83C9',
    gradient: ['#1C2440', '#6D83C9'],
    image: require('@/assets/images/intents/sleep.jpg'),
    presetIds: [
      'binaural-delta',
      'noise-rain',
      'noise-brown',
      'noise-fan',
      'noise-train',
      'solfeggio-174',
    ],
    recommendedMinutes: 30,
  },
  {
    id: 'focus',
    nameKey: 'intents.focus',
    descKey: 'intents.focusDesc',
    icon: { name: 'flash', library: 'ionicon' },
    color: '#D99A4E',
    gradient: ['#3D2A12', '#D99A4E'],
    image: require('@/assets/images/intents/focus.jpg'),
    presetIds: [
      'binaural-beta',
      'binaural-gamma',
      'noise-white',
      'noise-airplane',
      'solfeggio-40',
    ],
    recommendedMinutes: 45,
  },
  {
    id: 'relax',
    nameKey: 'intents.relax',
    descKey: 'intents.relaxDesc',
    icon: { name: 'leaf', library: 'ionicon' },
    color: '#7FB069',
    gradient: ['#1E2E18', '#7FB069'],
    image: require('@/assets/images/intents/relax.jpg'),
    presetIds: [
      'binaural-alpha',
      'noise-ocean',
      'noise-forest',
      'noise-stream',
      'noise-fire',
      'solfeggio-432',
    ],
    recommendedMinutes: 20,
  },
  {
    id: 'meditate',
    nameKey: 'intents.meditate',
    descKey: 'intents.meditateDesc',
    icon: { name: 'meditation', library: 'material' },
    color: '#A78BFA',
    gradient: ['#2A2244', '#A78BFA'],
    image: require('@/assets/images/intents/meditate.jpg'),
    presetIds: [
      'binaural-theta',
      'solfeggio-528',
      'solfeggio-852',
      'solfeggio-963',
      'noise-wind',
    ],
    recommendedMinutes: 15,
  },
];

export function getIntentById(id: string): Intent | undefined {
  return intents.find((i) => i.id === id);
}
