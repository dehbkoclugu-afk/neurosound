import type { ImageSourcePropType } from 'react-native';
import type { IntentId } from './intents';

export type ArtworkPair = {
  dark: ImageSourcePropType;
  light: ImageSourcePropType;
};

export type ArtworkStateId = 'favorites-empty';

export const INTENT_ART: Record<IntentId, ArtworkPair> = {
  sleep: {
    dark: require('@/assets/images/art/intents/sleep.jpg'),
    light: require('@/assets/images/art/light/intents/sleep.jpg'),
  },
  focus: {
    dark: require('@/assets/images/art/intents/focus.jpg'),
    light: require('@/assets/images/art/light/intents/focus.jpg'),
  },
  relax: {
    dark: require('@/assets/images/art/intents/relax.jpg'),
    light: require('@/assets/images/art/light/intents/relax.jpg'),
  },
  meditate: {
    dark: require('@/assets/images/art/intents/meditate.jpg'),
    light: require('@/assets/images/art/light/intents/meditate.jpg'),
  },
};

export const PRESET_ART: Record<string, ArtworkPair> = {
  'binaural-delta': {
    dark: require('@/assets/images/art/presets/binaural-delta.jpg'),
    light: require('@/assets/images/art/light/presets/binaural-delta.jpg'),
  },
  'binaural-theta': {
    dark: require('@/assets/images/art/presets/binaural-theta.jpg'),
    light: require('@/assets/images/art/light/presets/binaural-theta.jpg'),
  },
  'binaural-alpha': {
    dark: require('@/assets/images/art/presets/binaural-alpha.jpg'),
    light: require('@/assets/images/art/light/presets/binaural-alpha.jpg'),
  },
  'binaural-beta': {
    dark: require('@/assets/images/art/presets/binaural-beta.jpg'),
    light: require('@/assets/images/art/light/presets/binaural-beta.jpg'),
  },
  'binaural-gamma': {
    dark: require('@/assets/images/art/presets/binaural-gamma.jpg'),
    light: require('@/assets/images/art/light/presets/binaural-gamma.jpg'),
  },
  'solfeggio-40': {
    dark: require('@/assets/images/art/presets/solfeggio-40.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-40.jpg'),
  },
  'solfeggio-111': {
    dark: require('@/assets/images/art/presets/solfeggio-111.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-111.jpg'),
  },
  'solfeggio-174': {
    dark: require('@/assets/images/art/presets/solfeggio-174.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-174.jpg'),
  },
  'solfeggio-285': {
    dark: require('@/assets/images/art/presets/solfeggio-285.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-285.jpg'),
  },
  'solfeggio-396': {
    dark: require('@/assets/images/art/presets/solfeggio-396.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-396.jpg'),
  },
  'solfeggio-417': {
    dark: require('@/assets/images/art/presets/solfeggio-417.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-417.jpg'),
  },
  'solfeggio-432': {
    dark: require('@/assets/images/art/presets/solfeggio-432.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-432.jpg'),
  },
  'solfeggio-440': {
    dark: require('@/assets/images/art/presets/solfeggio-440.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-440.jpg'),
  },
  'solfeggio-528': {
    dark: require('@/assets/images/art/presets/solfeggio-528.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-528.jpg'),
  },
  'solfeggio-639': {
    dark: require('@/assets/images/art/presets/solfeggio-639.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-639.jpg'),
  },
  'solfeggio-741': {
    dark: require('@/assets/images/art/presets/solfeggio-741.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-741.jpg'),
  },
  'solfeggio-777': {
    dark: require('@/assets/images/art/presets/solfeggio-777.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-777.jpg'),
  },
  'solfeggio-852': {
    dark: require('@/assets/images/art/presets/solfeggio-852.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-852.jpg'),
  },
  'solfeggio-888': {
    dark: require('@/assets/images/art/presets/solfeggio-888.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-888.jpg'),
  },
  'solfeggio-963': {
    dark: require('@/assets/images/art/presets/solfeggio-963.jpg'),
    light: require('@/assets/images/art/light/presets/solfeggio-963.jpg'),
  },
  'noise-white': {
    dark: require('@/assets/images/art/presets/noise-white.jpg'),
    light: require('@/assets/images/art/light/presets/noise-white.jpg'),
  },
  'noise-pink': {
    dark: require('@/assets/images/art/presets/noise-pink.jpg'),
    light: require('@/assets/images/art/light/presets/noise-pink.jpg'),
  },
  'noise-brown': {
    dark: require('@/assets/images/art/presets/noise-brown.jpg'),
    light: require('@/assets/images/art/light/presets/noise-brown.jpg'),
  },
  'noise-rain': {
    dark: require('@/assets/images/art/presets/noise-rain.jpg'),
    light: require('@/assets/images/art/light/presets/noise-rain.jpg'),
  },
  'noise-thunder': {
    dark: require('@/assets/images/art/presets/noise-thunder.jpg'),
    light: require('@/assets/images/art/light/presets/noise-thunder.jpg'),
  },
  'noise-ocean': {
    dark: require('@/assets/images/art/presets/noise-ocean.jpg'),
    light: require('@/assets/images/art/light/presets/noise-ocean.jpg'),
  },
  'noise-wind': {
    dark: require('@/assets/images/art/presets/noise-wind.jpg'),
    light: require('@/assets/images/art/light/presets/noise-wind.jpg'),
  },
  'noise-fire': {
    dark: require('@/assets/images/art/presets/noise-fire.jpg'),
    light: require('@/assets/images/art/light/presets/noise-fire.jpg'),
  },
  'noise-forest': {
    dark: require('@/assets/images/art/presets/noise-forest.jpg'),
    light: require('@/assets/images/art/light/presets/noise-forest.jpg'),
  },
  'noise-stream': {
    dark: require('@/assets/images/art/presets/noise-stream.jpg'),
    light: require('@/assets/images/art/light/presets/noise-stream.jpg'),
  },
  'noise-fan': {
    dark: require('@/assets/images/art/presets/noise-fan.jpg'),
    light: require('@/assets/images/art/light/presets/noise-fan.jpg'),
  },
  'noise-airplane': {
    dark: require('@/assets/images/art/presets/noise-airplane.jpg'),
    light: require('@/assets/images/art/light/presets/noise-airplane.jpg'),
  },
  'noise-train': {
    dark: require('@/assets/images/art/presets/noise-train.jpg'),
    light: require('@/assets/images/art/light/presets/noise-train.jpg'),
  },
};

/** 156px squares for list rows. A row drawing PRESET_ART has to decode the whole
 *  1080px file for a 52pt image, once per row, which is what janked Explore. */
export const PRESET_THUMB: Record<string, ArtworkPair> = {
  'binaural-delta': {
    dark: require('@/assets/images/art/thumbs/dark/binaural-delta.jpg'),
    light: require('@/assets/images/art/thumbs/light/binaural-delta.jpg'),
  },
  'binaural-theta': {
    dark: require('@/assets/images/art/thumbs/dark/binaural-theta.jpg'),
    light: require('@/assets/images/art/thumbs/light/binaural-theta.jpg'),
  },
  'binaural-alpha': {
    dark: require('@/assets/images/art/thumbs/dark/binaural-alpha.jpg'),
    light: require('@/assets/images/art/thumbs/light/binaural-alpha.jpg'),
  },
  'binaural-beta': {
    dark: require('@/assets/images/art/thumbs/dark/binaural-beta.jpg'),
    light: require('@/assets/images/art/thumbs/light/binaural-beta.jpg'),
  },
  'binaural-gamma': {
    dark: require('@/assets/images/art/thumbs/dark/binaural-gamma.jpg'),
    light: require('@/assets/images/art/thumbs/light/binaural-gamma.jpg'),
  },
  'solfeggio-40': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-40.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-40.jpg'),
  },
  'solfeggio-111': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-111.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-111.jpg'),
  },
  'solfeggio-174': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-174.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-174.jpg'),
  },
  'solfeggio-285': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-285.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-285.jpg'),
  },
  'solfeggio-396': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-396.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-396.jpg'),
  },
  'solfeggio-417': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-417.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-417.jpg'),
  },
  'solfeggio-432': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-432.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-432.jpg'),
  },
  'solfeggio-440': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-440.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-440.jpg'),
  },
  'solfeggio-528': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-528.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-528.jpg'),
  },
  'solfeggio-639': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-639.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-639.jpg'),
  },
  'solfeggio-741': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-741.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-741.jpg'),
  },
  'solfeggio-777': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-777.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-777.jpg'),
  },
  'solfeggio-852': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-852.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-852.jpg'),
  },
  'solfeggio-888': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-888.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-888.jpg'),
  },
  'solfeggio-963': {
    dark: require('@/assets/images/art/thumbs/dark/solfeggio-963.jpg'),
    light: require('@/assets/images/art/thumbs/light/solfeggio-963.jpg'),
  },
  'noise-white': {
    dark: require('@/assets/images/art/thumbs/dark/noise-white.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-white.jpg'),
  },
  'noise-pink': {
    dark: require('@/assets/images/art/thumbs/dark/noise-pink.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-pink.jpg'),
  },
  'noise-brown': {
    dark: require('@/assets/images/art/thumbs/dark/noise-brown.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-brown.jpg'),
  },
  'noise-rain': {
    dark: require('@/assets/images/art/thumbs/dark/noise-rain.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-rain.jpg'),
  },
  'noise-thunder': {
    dark: require('@/assets/images/art/thumbs/dark/noise-thunder.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-thunder.jpg'),
  },
  'noise-ocean': {
    dark: require('@/assets/images/art/thumbs/dark/noise-ocean.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-ocean.jpg'),
  },
  'noise-wind': {
    dark: require('@/assets/images/art/thumbs/dark/noise-wind.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-wind.jpg'),
  },
  'noise-fire': {
    dark: require('@/assets/images/art/thumbs/dark/noise-fire.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-fire.jpg'),
  },
  'noise-forest': {
    dark: require('@/assets/images/art/thumbs/dark/noise-forest.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-forest.jpg'),
  },
  'noise-stream': {
    dark: require('@/assets/images/art/thumbs/dark/noise-stream.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-stream.jpg'),
  },
  'noise-fan': {
    dark: require('@/assets/images/art/thumbs/dark/noise-fan.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-fan.jpg'),
  },
  'noise-airplane': {
    dark: require('@/assets/images/art/thumbs/dark/noise-airplane.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-airplane.jpg'),
  },
  'noise-train': {
    dark: require('@/assets/images/art/thumbs/dark/noise-train.jpg'),
    light: require('@/assets/images/art/thumbs/light/noise-train.jpg'),
  },
};

/** Small squares for Android's now-playing notification; see optimize-art.ps1. */
export const PRESET_LOCK_ART: Record<string, ImageSourcePropType> = {
  'binaural-alpha': require('@/assets/images/art/lock/binaural-alpha.jpg'),
  'binaural-beta': require('@/assets/images/art/lock/binaural-beta.jpg'),
  'binaural-delta': require('@/assets/images/art/lock/binaural-delta.jpg'),
  'binaural-gamma': require('@/assets/images/art/lock/binaural-gamma.jpg'),
  'binaural-theta': require('@/assets/images/art/lock/binaural-theta.jpg'),
  'noise-airplane': require('@/assets/images/art/lock/noise-airplane.jpg'),
  'noise-brown': require('@/assets/images/art/lock/noise-brown.jpg'),
  'noise-fan': require('@/assets/images/art/lock/noise-fan.jpg'),
  'noise-fire': require('@/assets/images/art/lock/noise-fire.jpg'),
  'noise-forest': require('@/assets/images/art/lock/noise-forest.jpg'),
  'noise-ocean': require('@/assets/images/art/lock/noise-ocean.jpg'),
  'noise-pink': require('@/assets/images/art/lock/noise-pink.jpg'),
  'noise-rain': require('@/assets/images/art/lock/noise-rain.jpg'),
  'noise-stream': require('@/assets/images/art/lock/noise-stream.jpg'),
  'noise-thunder': require('@/assets/images/art/lock/noise-thunder.jpg'),
  'noise-train': require('@/assets/images/art/lock/noise-train.jpg'),
  'noise-white': require('@/assets/images/art/lock/noise-white.jpg'),
  'noise-wind': require('@/assets/images/art/lock/noise-wind.jpg'),
  'solfeggio-111': require('@/assets/images/art/lock/solfeggio-111.jpg'),
  'solfeggio-174': require('@/assets/images/art/lock/solfeggio-174.jpg'),
  'solfeggio-285': require('@/assets/images/art/lock/solfeggio-285.jpg'),
  'solfeggio-396': require('@/assets/images/art/lock/solfeggio-396.jpg'),
  'solfeggio-40': require('@/assets/images/art/lock/solfeggio-40.jpg'),
  'solfeggio-417': require('@/assets/images/art/lock/solfeggio-417.jpg'),
  'solfeggio-432': require('@/assets/images/art/lock/solfeggio-432.jpg'),
  'solfeggio-440': require('@/assets/images/art/lock/solfeggio-440.jpg'),
  'solfeggio-528': require('@/assets/images/art/lock/solfeggio-528.jpg'),
  'solfeggio-639': require('@/assets/images/art/lock/solfeggio-639.jpg'),
  'solfeggio-741': require('@/assets/images/art/lock/solfeggio-741.jpg'),
  'solfeggio-777': require('@/assets/images/art/lock/solfeggio-777.jpg'),
  'solfeggio-852': require('@/assets/images/art/lock/solfeggio-852.jpg'),
  'solfeggio-888': require('@/assets/images/art/lock/solfeggio-888.jpg'),
  'solfeggio-963': require('@/assets/images/art/lock/solfeggio-963.jpg'),
};

export const STATE_ART: Record<ArtworkStateId, ArtworkPair> = {
  'favorites-empty': {
    dark: require('@/assets/images/art/states/favorites-empty.jpg'),
    light: require('@/assets/images/art/light/states/favorites-empty.jpg'),
  },
};

export function intentArt(id: IntentId): ArtworkPair {
  return INTENT_ART[id];
}

export function presetArt(id: string): ArtworkPair | undefined {
  return PRESET_ART[id];
}

export function presetThumb(id: string): ArtworkPair | undefined {
  return PRESET_THUMB[id];
}

export function stateArt(id: ArtworkStateId): ArtworkPair {
  return STATE_ART[id];
}
