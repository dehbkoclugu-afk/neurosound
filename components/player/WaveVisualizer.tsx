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

/**
 * How long the ring keeps breathing before it settles to a still state.
 *
 * Delta runs a 6s cycle — 0.17 Hz — which is squarely in the band Apple's
 * reduced-motion guidance warns about for slow looping oscillation, and it ran
 * for as long as playback did: eight hours of a 220pt ring pulsing at someone
 * trying to fall asleep. It now does its job during the settling-in period and
 * then gets out of the way.
 */
const SETTLE_AFTER_MS = 90_000;

/** Matches the audio ramps in playerController, so the ring and the sound
 *  arrive and leave together instead of the visual snapping. */
const PRESENCE_IN_MS = 400;
const PRESENCE_OUT_MS = 250;

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

  // 0 = silent and dim, 1 = playing. Cross-fades rather than cutting.
  const presence = useRef(new Animated.Value(isPlaying ? 1 : 0)).current;

  useEffect(() => {
    const animation = Animated.timing(presence, {
      toValue: isPlaying ? 1 : 0,
      duration: isPlaying ? PRESENCE_IN_MS : PRESENCE_OUT_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [isPlaying, presence]);

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

    // Come to rest rather than oscillating for the whole session.
    const settle = setTimeout(() => {
      animations.forEach((animation) => animation.stop());
      waveAnimations.forEach((anim) =>
        Animated.timing(anim, {
          toValue: 0.5,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }).start()
      );
    }, SETTLE_AFTER_MS);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(settle);
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

        const pulseOpacity = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.25, 0.7, 0.25],
        });

        // Pausing used to snap the ring to 0.15 on a single frame while the
        // audio faded out over 250ms — the two came apart.
        const opacity = Animated.multiply(
          pulseOpacity,
          presence.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] })
        );

        return (
          <Animated.View
            key={index}
            style={[
              styles.wave,
              {
                borderColor: waveColor,
                transform: [{ scale }],
                opacity,
              },
            ]}
          />
        );
      })}

      {/* Quiet core */}
      <Animated.View
        style={[
          styles.centerDot,
          {
            backgroundColor: waveColor,
            opacity: presence.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 1],
            }),
          },
        ]}
      />
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
