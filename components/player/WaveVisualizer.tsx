/**
 * Wave Visualizer Component
 * - Simple, calming wave animation
 * - Respects reduced motion preference
 * - Can be disabled in settings
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useSettingsStore } from '@/stores/settingsStore';

interface WaveVisualizerProps {
  isPlaying: boolean;
  color?: string;
  intensity?: number; // 0-1
  /** Full breathing-cycle duration. Derived from the sound: slow for delta,
   *  fast shimmer for gamma, long drift for ambient noise. */
  tempoMs?: number;
  style?: ViewStyle;
}

const WAVE_COUNT = 3;

export function WaveVisualizer({
  isPlaying,
  color,
  intensity = 0.5,
  tempoMs = 4000,
  style,
}: WaveVisualizerProps) {
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

    // Half cycle per direction; outer rings breathe slightly behind the core
    const halfCycle = tempoMs / 2;
    const animations = waveAnimations.map((anim, index) => {
      const duration = halfCycle + index * halfCycle * 0.25;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    });

    // Start with staggered delays proportional to the tempo
    const timeouts = animations.map((animation, index) =>
      setTimeout(() => {
        animation.start();
      }, index * tempoMs * 0.08)
    );

    return () => {
      timeouts.forEach(clearTimeout);
      animations.forEach((animation) => animation.stop());
    };
  }, [isPlaying, reduceMotion, waveAnimations, tempoMs]);

  // If reduced motion, show a static ring
  if (reduceMotion) {
    return (
      <View style={[styles.container, style]}>
        <View
          style={[
            styles.wave,
            { borderColor: waveColor, opacity: isPlaying ? 0.8 : 0.3 },
          ]}
        />
        <View style={[styles.centerDot, { backgroundColor: waveColor }]} />
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
          outputRange: [0.25, 0.7, 0.25],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.wave,
              {
                borderColor: waveColor,
                transform: [{ scale }],
                opacity: isPlaying ? opacity : 0.15,
              },
            ]}
          />
        );
      })}

      {/* Quiet core */}
      <View style={[styles.centerDot, { backgroundColor: waveColor, opacity: isPlaying ? 1 : 0.4 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Thin stroke rings, not filled discs
  wave: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  centerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
