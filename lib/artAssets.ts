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

export function stateArt(id: ArtworkStateId): ArtworkPair {
  return STATE_ART[id];
}
