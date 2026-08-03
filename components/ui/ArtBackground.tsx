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
    'rgba(5, 8, 13, 0.94)',
    'rgba(5, 8, 13, 0.72)',
    'rgba(5, 8, 13, 0.16)',
  ],
  row: ['rgba(5, 8, 13, 0.97)', 'rgba(5, 8, 13, 0.82)', 'rgba(5, 8, 13, 0.22)'],
  channel: [
    'rgba(5, 8, 13, 0.97)',
    'rgba(5, 8, 13, 0.88)',
    'rgba(5, 8, 13, 0.38)',
  ],
  hero: [
    'rgba(5, 8, 13, 0.16)',
    'rgba(5, 8, 13, 0.28)',
    'rgba(5, 8, 13, 0.92)',
  ],
} as const;

const LIGHT_SCRIMS = {
  card: [
    'rgba(247,249,252,0.96)',
    'rgba(247,249,252,0.76)',
    'rgba(247,249,252,0.14)',
  ],
  row: [
    'rgba(247,249,252,0.98)',
    'rgba(247,249,252,0.86)',
    'rgba(247,249,252,0.22)',
  ],
  channel: [
    'rgba(247,249,252,0.98)',
    'rgba(247,249,252,0.90)',
    'rgba(247,249,252,0.42)',
  ],
  hero: [
    'rgba(247,249,252,0.18)',
    'rgba(247,249,252,0.28)',
    'rgba(247,249,252,0.94)',
  ],
} as const;

export function ArtBackground({
  source,
  children,
  style,
  variant = 'row',
}: ArtBackgroundProps) {
  const scheme = useColorScheme();
  const scrims = scheme === 'light' ? LIGHT_SCRIMS : DARK_SCRIMS;
  const content = (
    <>
      <LinearGradient
        colors={scrims[variant]}
        locations={[0, 0.56, 1]}
        start={variant === 'hero' ? { x: 0.5, y: 0 } : { x: 0, y: 0.5 }}
        end={variant === 'hero' ? { x: 0.5, y: 1 } : { x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
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
    backgroundColor: '#F1F4F8',
  },
});
