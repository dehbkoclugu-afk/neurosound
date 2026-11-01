/**
 * Premium tier: which presets are behind the paywall, and the store SKUs that
 * unlock them. Create these exact product IDs in Play Console.
 */

import { getPresetById } from './frequencies';

export const PREMIUM_SKUS = {
  monthly: 'premium_monthly',
  yearly: 'premium_yearly',
  lifetime: 'premium_lifetime',
} as const;

export const SUBSCRIPTION_SKUS = [PREMIUM_SKUS.monthly, PREMIUM_SKUS.yearly];
export const ALL_SKUS: string[] = [...SUBSCRIPTION_SKUS, PREMIUM_SKUS.lifetime];

/**
 * Free tier: every intent's lead sound (Home's one-tap start must never hit a
 * paywall), all ambient noise, and the three headline Solfeggio tones —
 * 852 Hz is the store name, so locking it would feel like bait.
 */
const FREE_PRESET_IDS = new Set([
  'binaural-delta',
  'binaural-theta',
  'binaural-alpha',
  'binaural-beta',
  'solfeggio-432',
  'solfeggio-528',
  'solfeggio-852',
]);

export function isLockedPreset(id: string): boolean {
  const preset = getPresetById(id);
  return !!preset && preset.type !== 'noise' && !FREE_PRESET_IDS.has(id);
}
