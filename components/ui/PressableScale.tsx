/**
 * A pressable that acknowledges the touch.
 *
 * Press feedback is the cheapest way to make an interface feel like it is
 * listening; without it a button reads as dead no matter how well it is drawn.
 * Feedback starts on press-*in*, not on release — waiting for the tap to
 * complete is the moment directness falls apart.
 *
 * Scale is movement, so it is gated on reduceMotion. Opacity is not: users who
 * turn motion down still need to know the interface heard them.
 */

import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { useSettingsStore } from '@/stores/settingsStore';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Subtle. 0.95 and below reads as a toy; 0.98 and above is invisible.
const PRESS_SCALE = 0.97;
// Down is immediate, release is a touch softer — the system responding, not
// the user deciding.
const PRESS_IN_MS = 100;
const PRESS_OUT_MS = 160;

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Scale floor at full press. Large surfaces want less travel than buttons. */
  scaleTo?: number;
  pressedOpacity?: number;
  /** Resting opacity while disabled. This component owns opacity outright —
   *  it writes after `style`, so a caller setting its own disabled opacity
   *  there would be silently overridden. */
  disabledOpacity?: number;
  children: React.ReactNode;
}

export function PressableScale({
  style,
  scaleTo = PRESS_SCALE,
  pressedOpacity = 0.85,
  disabledOpacity = 0.5,
  disabled,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const { reduceMotion } = useSettingsStore();
  const progress = useSharedValue(0);
  const restingOpacity = disabled ? disabledOpacity : 1;

  const handlePressIn = (e: GestureResponderEvent) => {
    progress.value = withTiming(1, { duration: PRESS_IN_MS });
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    progress.value = withTiming(0, { duration: PRESS_OUT_MS });
    onPressOut?.(e);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: restingOpacity - progress.value * restingOpacity * (1 - pressedOpacity),
    transform: reduceMotion ? [] : [{ scale: 1 - progress.value * (1 - scaleTo) }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
