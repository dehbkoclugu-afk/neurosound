import React, { ReactNode } from 'react';
import {
  Image as RNImage,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ArtBackgroundProps = {
  source?: ImageSourcePropType;
  /** Small image shown while `source` decodes, so a screen's first paint is
   *  the artwork rather than the dark surface behind it. */
  placeholder?: ImageSourcePropType;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * card / row / channel — copy on the left, scrim runs left to right.
   * tile — copy at the bottom, scrim runs top to bottom.
   * hero — full-bleed header (Player): darkens the top for the status bar
   *        and buttons; fades into the page at night, keeps a crisp edge by day.
   */
  variant?: 'card' | 'row' | 'channel' | 'tile' | 'hero';
};

// Copy on artwork is always white over a dark scrim, in both themes. A light
// scrim with dark text (the old light theme) washed every photograph out to a
// milky haze and still left the words unreadable over busy, bright images.
const SCRIMS = {
  card: ['rgba(10, 9, 13, 0.86)', 'rgba(10, 9, 13, 0.55)', 'rgba(10, 9, 13, 0.05)'],
  row: ['rgba(10, 9, 13, 0.92)', 'rgba(10, 9, 13, 0.7)', 'rgba(10, 9, 13, 0.15)'],
  channel: ['rgba(10, 9, 13, 0.94)', 'rgba(10, 9, 13, 0.8)', 'rgba(10, 9, 13, 0.3)'],
  tile: ['rgba(10, 9, 13, 0.05)', 'rgba(10, 9, 13, 0.3)', 'rgba(10, 9, 13, 0.88)'],
} as const;

const GRAIN = require('@/assets/images/art/grain.png');
const HERO_DARK = ['rgba(10, 9, 13, 0.16)', 'rgba(10, 9, 13, 0.28)', 'rgba(10, 9, 13, 0.92)'] as const;
const HERO_LIGHT = ['rgba(10, 9, 13, 0.4)', 'rgba(10, 9, 13, 0)', 'rgba(10, 9, 13, 0)'] as const;

export function ArtBackground({
  source,
  placeholder,
  children,
  style,
  variant = 'row',
}: ArtBackgroundProps) {
  const scheme = useColorScheme();
  const vertical = variant === 'hero' || variant === 'tile';
  const lightHero = variant === 'hero' && scheme === 'light';
  const scrim = variant === 'hero' ? (lightHero ? HERO_LIGHT : HERO_DARK) : SCRIMS[variant];
  const content = (
    <>
      <LinearGradient
        colors={scrim}
        locations={lightHero ? [0, 0.3, 1] : [0, 0.56, 1]}
        start={vertical ? { x: 0.5, y: 0 } : { x: 0, y: 0.5 }}
        end={vertical ? { x: 0.5, y: 1 } : { x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </>
  );

  if (!source) {
    return <View style={[styles.surface, style]}>{content}</View>;
  }

  // expo-image, not ImageBackground: RN decoded the full 1774px artwork on
  // every mount with no memory cache, so cards janked and flashed dark first.
  return (
    <View style={[styles.surface, style]}>
      <Image
        source={source}
        placeholder={placeholder}
        placeholderContentFit="cover"
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
      />
      {/* Film grain on the large surfaces: it takes the digital flatness off the
          gradients. Rows are too small to show it, so they skip the overdraw. */}
      {variant !== 'row' && variant !== 'channel' && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <RNImage source={GRAIN} resizeMode="repeat" style={styles.grain} />
        </View>
      )}
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  grain: {
    width: '100%',
    height: '100%',
    opacity: 0.05,
  },
  surface: {
    overflow: 'hidden',
    backgroundColor: '#1B1821',
  },
});
