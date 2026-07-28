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
  /** Atmospheric background for the Intent detail hero only — a single
   *  full-bleed moment earns the photo; the repeated Home card grid does
   *  not (see DESIGN.md). */
  image: number;
  /** Cosmetic catalog code for the Home label cards — a record-label
   *  numbering convention, not a real product SKU. */
  catalogCode: string;
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
    image: require('@/assets/images/intents/sleep.jpg'),
    catalogCode: 'ND-01',
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
    image: require('@/assets/images/intents/focus.jpg'),
    catalogCode: 'ND-02',
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
    image: require('@/assets/images/intents/relax.jpg'),
    catalogCode: 'ND-03',
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
    image: require('@/assets/images/intents/meditate.jpg'),
    catalogCode: 'ND-04',
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
