/**
 * Intent-first entry points. Users arrive with a goal ("I can't sleep",
 * "I need to focus"), not a taxonomy ("binaural or solfeggio?").
 * Each intent maps to a curated list of existing presets.
 */

import { IconConfig } from '@/components/ui/Icon';
import { intentArt } from '@/lib/artAssets';
import type { ArtworkPair } from '@/lib/artAssets';

export type IntentId = 'sleep' | 'focus' | 'relax' | 'meditate';

export interface Intent {
  id: IntentId;
  nameKey: string;
  descKey: string;
  icon: IconConfig;
  /** Shared cinematic artwork for the Home card and Intent detail hero. */
  image: ArtworkPair;
  /** Cosmetic catalogue code retained as compact secondary metadata. */
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
    image: intentArt('sleep'),
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
    image: intentArt('focus'),
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
    image: intentArt('relax'),
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
    image: intentArt('meditate'),
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

/** Time-of-day bands. Named rather than numeric so the label the Home screen
 *  prints ("Tonight", "This morning") stays tied to the rule that picked it. */
export type TimeBand = 'night' | 'morning' | 'day' | 'evening';

const BAND_INTENT: Record<TimeBand, IntentId> = {
  night: 'sleep',
  morning: 'meditate',
  day: 'focus',
  evening: 'relax',
};

/**
 * Which band a wall-clock hour (0–23) falls in.
 *
 * An app whose whole premise is "what do you need right now?" was asking the
 * question at 3am and 3pm with the identical four answers in the identical
 * order. The clock is the one thing it already knows about the moment.
 *
 * Bands are contiguous and cover all 24 hours; night wraps midnight.
 */
export function getTimeBand(hour: number): TimeBand {
  if (hour >= 22 || hour < 6) return 'night';
  if (hour < 9) return 'morning';
  if (hour < 17) return 'day';
  return 'evening';
}

/** The intent to surface first, given the hour. Never throws: every band maps
 *  to an intent that exists in `intents`. */
export function getSuggestedIntent(hour: number): {
  intent: Intent;
  band: TimeBand;
} {
  const band = getTimeBand(hour);
  const id = BAND_INTENT[band];
  // `intents` is a static list containing all four ids, so this cannot miss.
  const intent = intents.find((i) => i.id === id)!;
  return { intent, band };
}
