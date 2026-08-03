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

type ArtBackgroundProps = {
  source?: ImageSourcePropType;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'card' | 'row' | 'channel';
};

const SCRIMS = {
  card: ['rgba(5, 8, 13, 0.94)', 'rgba(5, 8, 13, 0.72)', 'rgba(5, 8, 13, 0.16)'],
  row: ['rgba(5, 8, 13, 0.97)', 'rgba(5, 8, 13, 0.82)', 'rgba(5, 8, 13, 0.22)'],
  channel: ['rgba(5, 8, 13, 0.97)', 'rgba(5, 8, 13, 0.88)', 'rgba(5, 8, 13, 0.38)'],
} as const;

export function ArtBackground({ source, children, style, variant = 'row' }: ArtBackgroundProps) {
  const content = (
    <>
      <LinearGradient
        colors={SCRIMS[variant]}
        locations={[0, 0.56, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </>
  );

  if (!source) {
    return <View style={[styles.surface, styles.fallback, style]}>{content}</View>;
  }

  return (
    <ImageBackground
      source={source}
      resizeMode="cover"
      style={[styles.surface, style]}
      imageStyle={styles.image}
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
  image: {
    left: '18%',
    width: '82%',
  },
  fallback: {
    backgroundColor: '#0B1018',
  },
});
