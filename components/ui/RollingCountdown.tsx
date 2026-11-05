/**
 * The sleep timer's digits roll over instead of swapping, like a flip clock
 * seen from a distance. Each character is its own cell, keyed by value, so only
 * the digit that changed moves.
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

  return (
    <View style={styles.row} accessible accessibilityLabel={value}>
      {value.split('').map((char, index) => (
        <View key={index} style={styles.cell} importantForAccessibility="no-hide-descendants">
          <Animated.Text
            key={char}
            entering={ENTER}
            exiting={EXIT}
            style={style}
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
  },
});
