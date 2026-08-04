import React, { ReactNode } from 'react';
import {
  ImageBackground,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ArtBackgroundProps = {
  source?: ImageSourcePropType;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'card' | 'row' | 'channel' | 'hero';
};

const DARK_SCRIMS = {
  card: [
    'rgba(10, 18, 28, 0.84)',
    'rgba(10, 18, 28, 0.60)',
    'rgba(10, 18, 28, 0.10)',
  ],
  row: ['rgba(10, 18, 28, 0.88)', 'rgba(10, 18, 28, 0.68)', 'rgba(10, 18, 28, 0.14)'],
  channel: [
    'rgba(10, 18, 28, 0.90)',
    'rgba(10, 18, 28, 0.74)',
    'rgba(10, 18, 28, 0.24)',
  ],
  hero: [
    'rgba(5, 8, 13, 0.16)',
    'rgba(5, 8, 13, 0.28)',
    'rgba(5, 8, 13, 0.92)',
  ],
} as const;

export function ArtBackground({
  source,
  children,
  style,
  variant = 'row',
}: ArtBackgroundProps) {
  const scheme = useColorScheme();
  const content = (
    <>
      {scheme === 'dark' && (
        <LinearGradient
          colors={DARK_SCRIMS[variant]}
          locations={[0, 0.56, 1]}
          start={variant === 'hero' ? { x: 0.5, y: 0 } : { x: 0, y: 0.5 }}
          end={variant === 'hero' ? { x: 0.5, y: 1 } : { x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {children}
    </>
  );

  if (!source) {
    return (
      <View
        style={[
          styles.surface,
          scheme === 'light' ? styles.lightFallback : styles.fallback,
          style,
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <ImageBackground
      source={source}
      resizeMode="cover"
      style={[styles.surface, style]}
    >
      {content}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  surface: {
    overflow: 'hidden',
    backgroundColor: '#0B1018',
  },
  fallback: {
    backgroundColor: '#0B1018',
  },
  lightFallback: {
    backgroundColor: '#E7ECF1',
  },
});
