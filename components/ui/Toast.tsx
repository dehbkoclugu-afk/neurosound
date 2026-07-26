/**
 * Inline confirmation, not a blocking dialog.
 *
 * A save confirmation doesn't need to stop the user — Alert.alert did, which
 * turns "your mix is saved" into a modal the user has to dismiss before doing
 * anything else. This fades in over the content, sits briefly, and clears
 * itself.
 */

import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';

const VISIBLE_MS = 1800;
const FADE_MS = 200;

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  style?: ViewStyle;
}

export function Toast({ message, visible, onHide, style }: ToastProps) {
  const colors = useThemeColors();
  const { reduceMotion } = useSettingsStore();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    progress.value = withSequence(
      withTiming(1, { duration: reduceMotion ? 0 : FADE_MS }),
      withDelay(
        VISIBLE_MS,
        withTiming(0, { duration: reduceMotion ? 0 : FADE_MS }, (finished) => {
          'worklet';
          if (finished) {
            runOnJS(onHide)();
          }
        })
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { backgroundColor: colors.text },
        animatedStyle,
        style,
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
    >
      <Animated.Text style={[styles.text, { color: colors.background }]}>
        {message}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 24,
    maxWidth: '85%',
  },
  text: {
    ...Typography.body,
    textAlign: 'center',
  },
});
