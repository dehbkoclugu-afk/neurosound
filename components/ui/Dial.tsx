/**
 * Dial — the Player's signature instrument. A rotary hi-fi gain dial
 * replaces the old flat play button + breathing rings: tapping the dial
 * itself plays or pauses, and the needle sweeps gently while playing like a
 * VU meter reacting to level, settling to a calm-but-visible resting angle
 * when paused (never fading toward invisible — see the note on
 * RESTING_ANGLE below, learned from the same bug in the visual this
 * replaces).
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

import { withAlpha } from '@/constants/theme';

const DIAL_SIZE = 216;
const FACE_SIZE = 176;
const TICK_COUNT = 28;
const MAJOR_EVERY = 7;

// Needle rests just past zero rather than at dead-centre — a dial sitting
// exactly at 0 reads as "off"; a hair past it reads as "idle, ready."
const RESTING_ANGLE = -34;

/** How far the whole dial dims at the bottom of the warming-up breath.
 *  Deliberately shallow — this is a "still waking up" signal, not a
 *  flash. */
const LOADING_DIM = 0.45;
const SWEEP_MIN = -46;
const SWEEP_MAX = 40;
const SWEEP_MS = 2600;

interface DialProps {
  isPlaying: boolean;
  isLoading?: boolean;
  color: string;
  reduceMotion?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

export function Dial({
  isPlaying,
  isLoading = false,
  color,
  reduceMotion = false,
  onPress,
  accessibilityLabel,
}: DialProps) {
  const needle = useSharedValue(RESTING_ANGLE);
  const glow = useSharedValue(isPlaying ? 1 : 0.35);
  const press = useSharedValue(0);
  const load = useSharedValue(isLoading ? LOADING_DIM : 1);

  useEffect(() => {
    cancelAnimation(needle);
    if (isPlaying && !reduceMotion) {
      needle.value = withRepeat(
        withSequence(
          withTiming(SWEEP_MAX, { duration: SWEEP_MS, easing: Easing.inOut(Easing.sin) }),
          withTiming(SWEEP_MIN, { duration: SWEEP_MS, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else if (isPlaying && reduceMotion) {
      // Motion off: jump once to a fixed "on" position, no continuous sweep.
      needle.value = withTiming((SWEEP_MIN + SWEEP_MAX) / 2, { duration: 200 });
    } else {
      needle.value = withTiming(RESTING_ANGLE, { duration: reduceMotion ? 0 : 500 });
    }
  }, [isPlaying, reduceMotion, needle]);

  useEffect(() => {
    glow.value = withTiming(isPlaying ? 1 : 0.35, { duration: 400 });
  }, [isPlaying, glow]);

  // Warming up: the dial dims and breathes slowly rather than spinning a
  // spinner at someone about to fall asleep. Generating sound is not a
  // spinner's kind of wait, and shipping no loading affordance at all (the
  // first cut of this component accepted `isLoading` and ignored it) left
  // the screen looking simply unresponsive while audio decoded.
  useEffect(() => {
    cancelAnimation(load);
    if (!isLoading) {
      load.value = withTiming(1, { duration: 260 });
      return;
    }
    if (reduceMotion) {
      load.value = LOADING_DIM;
      return;
    }
    load.value = withRepeat(
      withSequence(
        withTiming(LOADING_DIM, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [isLoading, reduceMotion, load]);

  const handlePressIn = () => {
    press.value = withTiming(1, { duration: 90 });
  };
  const handlePressOut = () => {
    press.value = withTiming(0, { duration: 160 });
  };

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${needle.value}deg` }],
  }));
  const faceStyle = useAnimatedStyle(() => ({
    opacity: (0.85 + glow.value * 0.15) * load.value,
    transform: [{ scale: 1 - press.value * 0.02 }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * load.value,
  }));
  const rimStyle = useAnimatedStyle(() => ({
    opacity: load.value,
  }));

  const ticks = Array.from({ length: TICK_COUNT });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: isLoading, disabled: isLoading }}
      style={styles.hitArea}
    >
      <View style={[styles.dial, { width: DIAL_SIZE, height: DIAL_SIZE, borderRadius: DIAL_SIZE / 2 }]}>
        {ticks.map((_, i) => {
          const isMajor = i % MAJOR_EVERY === 0;
          return (
            <Animated.View
              key={i}
              style={[
                StyleSheet.absoluteFillObject,
                styles.tickPivot,
                { transform: [{ rotate: `${(360 / TICK_COUNT) * i}deg` }] },
                rimStyle,
              ]}
            >
              <View
                style={[
                  styles.tick,
                  {
                    height: isMajor ? 9 : 5,
                    width: isMajor ? 2 : 1.5,
                    // Minor ticks were at 0.28, which disappears against a
                    // true-black night surface; 0.40 keeps the rim readable
                    // there without the ticks competing with the needle.
                    backgroundColor: withAlpha(color, isMajor ? 0.7 : 0.4),
                  },
                ]}
              />
            </Animated.View>
          );
        })}

        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.glowLayer,
            { borderRadius: DIAL_SIZE / 2 },
            glowStyle,
          ]}
        >
          <LinearGradient
            colors={[withAlpha(color, 0.22), withAlpha(color, 0)]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.face,
            {
              width: FACE_SIZE,
              height: FACE_SIZE,
              borderRadius: FACE_SIZE / 2,
              borderColor: withAlpha(color, 0.4),
            },
            faceStyle,
          ]}
        >
          <LinearGradient
            colors={[withAlpha(color, 0.1), withAlpha(color, 0.02)]}
            style={[StyleSheet.absoluteFill, { borderRadius: FACE_SIZE / 2 }]}
          />
          <Animated.View style={[StyleSheet.absoluteFillObject, needleStyle]}>
            <View style={[styles.needle, { backgroundColor: color }]} />
          </Animated.View>
          <View style={[styles.hub, { backgroundColor: color }]} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  dial: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickPivot: {
    alignItems: 'center',
  },
  tick: {
    borderRadius: 1,
  },
  glowLayer: {
    overflow: 'hidden',
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  // The rotate transform on the absoluteFillObject parent pivots around
  // that view's own centre by default — which is the face's true centre —
  // so the needle only has to span from there to the rim.
  needle: {
    position: 'absolute',
    top: 8,
    bottom: '50%',
    left: '50%',
    width: 2.5,
    marginLeft: -1.25,
    borderRadius: 1.5,
  },
  hub: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 8,
    height: 8,
    marginTop: -4,
    marginLeft: -4,
    borderRadius: 4,
  },
});
