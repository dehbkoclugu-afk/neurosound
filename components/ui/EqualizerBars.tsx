/**
 * Three bars that say "this one is the sound you are hearing".
 *
 * The app could be playing a preset and every list on every screen still
 * looked exactly as it did when nothing was playing — you had to open the
 * player to find out what you had picked. A colour change alone would not
 * have carried it (colour already means category here), so this is motion:
 * the one thing in the interface that only the playing row does.
 *
 * Under `reduceMotion` the bars hold at three different heights instead of
 * animating. That still reads as an equalizer, and it still marks the row —
 * the mark is the information, the movement is only how it gets attention.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { useSettingsStore } from '@/stores/settingsStore';

// Resting heights, as a fraction of the full height. Deliberately unequal so
// the static (reduced-motion) form still reads as levels rather than a grid.
const BARS = [
  { rest: 0.45, peak: 1, duration: 520 },
  { rest: 0.85, peak: 0.35, duration: 380 },
  { rest: 0.6, peak: 0.95, duration: 620 },
];

interface EqualizerBarsProps {
  color: string;
  /** Full height of the tallest bar. */
  size?: number;
}

function Bar({
  color,
  size,
  rest,
  peak,
  duration,
  animate,
}: {
  color: string;
  size: number;
  rest: number;
  peak: number;
  duration: number;
  animate: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!animate) {
      // Leave it at the resting height rather than wherever the last frame
      // happened to land.
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = withRepeat(withTiming(1, { duration }), -1, true);
    return () => cancelAnimation(progress);
  }, [animate, duration, progress]);

  const style = useAnimatedStyle(() => ({
    height: size * (rest + progress.value * (peak - rest)),
  }));

  return <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />;
}

export function EqualizerBars({ color, size = 14 }: EqualizerBarsProps) {
  const { reduceMotion } = useSettingsStore();

  return (
    <View
      style={[styles.container, { height: size }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {BARS.map((bar, i) => (
        <Bar key={i} color={color} size={size} animate={!reduceMotion} {...bar} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
});
