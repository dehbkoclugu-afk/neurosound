import type { ImageSourcePropType } from 'react-native';

import { useColorScheme } from './use-color-scheme';
import type { ArtworkPair } from '@/lib/artAssets';

const DARK_FOREGROUND = {
  primary: '#FFFFFF',
  secondary: 'rgba(255,255,255,0.76)',
  tertiary: 'rgba(255,255,255,0.58)',
  badge: 'rgba(255,255,255,0.16)',
} as const;

const LIGHT_FOREGROUND = {
  primary: '#10151D',
  secondary: 'rgba(16,21,29,0.74)',
  tertiary: 'rgba(16,21,29,0.58)',
  badge: 'rgba(16,21,29,0.12)',
} as const;

export function useArtwork() {
  const scheme = useColorScheme();
  const foreground = scheme === 'light' ? LIGHT_FOREGROUND : DARK_FOREGROUND;

  return {
    scheme,
    foreground,
    source: (pair?: ArtworkPair): ImageSourcePropType | undefined =>
      pair?.[scheme],
  };
}
