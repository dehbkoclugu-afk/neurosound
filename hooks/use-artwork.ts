import type { ImageSourcePropType } from 'react-native';

import { useColorScheme } from './use-color-scheme';
import type { ArtworkPair } from '@/lib/artAssets';

const DARK_FOREGROUND = {
  primary: '#FFFFFF',
  secondary: 'rgba(255,255,255,0.76)',
  tertiary: 'rgba(255,255,255,0.58)',
  badge: 'rgba(255,255,255,0.16)',
} as const;

export function useArtwork() {
  const scheme = useColorScheme();
  // Copy on artwork is white in both themes; ArtBackground lays a dark scrim
  // under it either way.
  const foreground = DARK_FOREGROUND;

  return {
    scheme,
    foreground,
    source: (pair?: ArtworkPair): ImageSourcePropType | undefined =>
      pair?.[scheme],
  };
}
