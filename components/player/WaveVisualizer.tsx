/**
 * Wave Visualizer Component
 * - Simple, calming wave animation
 * - Respects reduced motion preference
 * - Can be disabled in settings
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useSettingsStore } from '@/stores/settingsStore';

interface WaveVisualizerProps {
  isPlaying: boolean;
  color?: string;
  intensity?: number; // 0-1
  style?: ViewStyle;
}

const WAVE_COUNT = 3;

export function WaveVisualizer({
  isPlaying,
  color,
  intensity = 0.5,
  style,
}: WaveVisualizerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const { reduceMotion } = useSettingsStore();

  const colors = useThemeColors();

  const waveColor = color || colors.primary;

  // Animation values for each wave
  const waveAnimations = useRef(
    Array.from({ length: WAVE_COUNT }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (reduceMotion || !isPlaying) {
      // Reset animations when stopped or reduced motion is on
      waveAnimations.forEach((anim) => {
        anim.stopAnimation();
        anim.setValue(0);
      });
      return;
    }

    // Start wave animations with staggered delays
    const animations = waveAnimations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000 + index * 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 2000 + index * 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    });

    // Start with staggered delays
    animations.forEach((animation, index) => {
      setTimeout(() => {
        animation.start();
      }, index * 300);
    });

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [isPlaying, reduceMotion, waveAnimations]);

  // If reduced motion, show static indicator
  if (reduceMotion) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.staticIndicator, { backgroundColor: waveColor }]}>
          <View
            style={[
              styles.staticDot,
              {
                backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
                opacity: isPlaying ? 1 : 0.3,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {waveAnimations.map((anim, index) => {
        const scale = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6 + index * 0.1, 1 + intensity * 0.3],
        });

        const opacity = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.3, 0.6, 0.3],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.wave,
              {
                backgroundColor: waveColor,
                transform: [{ scale }],
                opacity: isPlaying ? opacity : 0.2,
              },
            ]}
          />
        );
      })}

      {/* Center dot */}
      <View style={[styles.centerDot, { backgroundColor: waveColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  centerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    zIndex: 10,
  },
  staticIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staticDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});
