import type { ImageSourcePropType } from 'react-native';
import type { IntentId } from './intents';

export const INTENT_ART: Record<IntentId, ImageSourcePropType> = {
  sleep: require('@/assets/images/art/intents/sleep.jpg'),
  focus: require('@/assets/images/art/intents/focus.jpg'),
  relax: require('@/assets/images/art/intents/relax.jpg'),
  meditate: require('@/assets/images/art/intents/meditate.jpg'),
};

export const PRESET_ART: Record<string, ImageSourcePropType> = {
  'binaural-delta': require('@/assets/images/art/presets/binaural-delta.jpg'),
  'binaural-theta': require('@/assets/images/art/presets/binaural-theta.jpg'),
  'binaural-alpha': require('@/assets/images/art/presets/binaural-alpha.jpg'),
  'binaural-beta': require('@/assets/images/art/presets/binaural-beta.jpg'),
  'binaural-gamma': require('@/assets/images/art/presets/binaural-gamma.jpg'),
  'solfeggio-40': require('@/assets/images/art/presets/solfeggio-40.jpg'),
  'solfeggio-111': require('@/assets/images/art/presets/solfeggio-111.jpg'),
  'solfeggio-174': require('@/assets/images/art/presets/solfeggio-174.jpg'),
  'solfeggio-285': require('@/assets/images/art/presets/solfeggio-285.jpg'),
  'solfeggio-396': require('@/assets/images/art/presets/solfeggio-396.jpg'),
  'solfeggio-417': require('@/assets/images/art/presets/solfeggio-417.jpg'),
  'solfeggio-432': require('@/assets/images/art/presets/solfeggio-432.jpg'),
  'solfeggio-440': require('@/assets/images/art/presets/solfeggio-440.jpg'),
  'solfeggio-528': require('@/assets/images/art/presets/solfeggio-528.jpg'),
  'solfeggio-639': require('@/assets/images/art/presets/solfeggio-639.jpg'),
  'solfeggio-741': require('@/assets/images/art/presets/solfeggio-741.jpg'),
  'solfeggio-777': require('@/assets/images/art/presets/solfeggio-777.jpg'),
  'solfeggio-852': require('@/assets/images/art/presets/solfeggio-852.jpg'),
  'solfeggio-888': require('@/assets/images/art/presets/solfeggio-888.jpg'),
  'solfeggio-963': require('@/assets/images/art/presets/solfeggio-963.jpg'),
  'noise-white': require('@/assets/images/art/presets/noise-white.jpg'),
  'noise-pink': require('@/assets/images/art/presets/noise-pink.jpg'),
  'noise-brown': require('@/assets/images/art/presets/noise-brown.jpg'),
  'noise-rain': require('@/assets/images/art/presets/noise-rain.jpg'),
  'noise-thunder': require('@/assets/images/art/presets/noise-thunder.jpg'),
  'noise-ocean': require('@/assets/images/art/presets/noise-ocean.jpg'),
  'noise-wind': require('@/assets/images/art/presets/noise-wind.jpg'),
  'noise-fire': require('@/assets/images/art/presets/noise-fire.jpg'),
  'noise-forest': require('@/assets/images/art/presets/noise-forest.jpg'),
  'noise-stream': require('@/assets/images/art/presets/noise-stream.jpg'),
  'noise-fan': require('@/assets/images/art/presets/noise-fan.jpg'),
  'noise-airplane': require('@/assets/images/art/presets/noise-airplane.jpg'),
  'noise-train': require('@/assets/images/art/presets/noise-train.jpg'),
};

export function intentArt(id: IntentId): ImageSourcePropType {
  return INTENT_ART[id];
}

export function presetArt(id: string): ImageSourcePropType | undefined {
  return PRESET_ART[id];
}

