/**
 * The sleep timer's digits roll over instead of swapping, like a flip clock
 * seen from a distance. Each character is its own cell, keyed from the right
 * so length transitions (10:00 -> 9:59) don't remount every digit, and an
 * invisible placeholder keeps cell height stable during the 200ms overlap.
 */

import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import Animated, { FadeOutUp, SlideInDown } from 'react-native-reanimated';

import { useSettingsStore } from '@/stores/settingsStore';

const ENTER = SlideInDown.duration(240);
const EXIT = FadeOutUp.duration(200);

export function RollingCountdown({ value, style }: { value: string; style?: StyleProp<TextStyle> }) {
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  if (reduceMotion) return <Text style={style}>{value}</Text>;

  const chars = value.split('');

  return (
    <View style={styles.row} accessible accessibilityLabel={value}>
      {chars.map((char, index) => (
        <View
          key={chars.length - 1 - index}
          style={styles.cell}
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={[style, styles.placeholder]} accessibilityElementsHidden>
            {char}
          </Text>
          <Animated.Text
            key={char}
            entering={ENTER}
            exiting={EXIT}
            style={[style, styles.digit]}
            accessibilityElementsHidden
          >
            {char}
          </Animated.Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cell: {
    overflow: 'hidden',
    position: 'relative',
  },
  placeholder: {
    opacity: 0,
  },
  digit: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
