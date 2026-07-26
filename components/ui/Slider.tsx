/**
 * Accessible Slider Component
 * - Large touch target
 * - Clear visual feedback
 * - Accessibility support
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  AccessibilityInfo,
  ViewStyle,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { AccessibilitySize, Spacing, Typography } from '@/constants/theme';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 1,
  step = 0.01,
  label,
  showValue = true,
  formatValue = (v) => `${Math.round(v * 100)}%`,
  accessibilityLabel,
  style,
}: SliderProps) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const { t } = useTranslation();

  const colors = useThemeColors();

  const normalizedValue = (value - min) / (max - min);
  const thumbPosition = normalizedValue * sliderWidth;

  const handleValueFromPosition = useCallback(
    (x: number) => {
      const clampedX = Math.max(0, Math.min(sliderWidth, x));
      const newNormalized = clampedX / sliderWidth;
      const newValue = min + newNormalized * (max - min);

      // Apply step
      const steppedValue = Math.round(newValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));

      onValueChange(clampedValue);
    },
    [sliderWidth, min, max, step, onValueChange]
  );

  // Track from the grant point + cumulative dx: locationX jumps to
  // child-relative coordinates when the finger lands on the thumb.
  const startXRef = useRef(0);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      startXRef.current = evt.nativeEvent.locationX;
      handleValueFromPosition(startXRef.current);
    },
    onPanResponderMove: (_evt, gestureState) => {
      handleValueFromPosition(startXRef.current + gestureState.dx);
    },
  });

  const handleAccessibilityAction = (direction: 'increment' | 'decrement') => {
    const newValue = direction === 'increment' ? value + step * 10 : value - step * 10;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    onValueChange(clampedValue);
    AccessibilityInfo.announceForAccessibility(formatValue(clampedValue));
  };

  return (
    <View style={[styles.container, style]}>
      {(label || showValue) && (
        <View style={styles.labelContainer}>
          {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
          {showValue && (
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {formatValue(value)}
            </Text>
          )}
        </View>
      )}

      <View
        style={[styles.sliderContainer, { backgroundColor: colors.slider }]}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel || label || 'Slider'}
        accessibilityValue={{
          min,
          max,
          now: value,
          text: formatValue(value),
        }}
        accessibilityActions={[
          { name: 'increment', label: t('accessibility.increase') },
          { name: 'decrement', label: t('accessibility.decrease') },
        ]}
        onAccessibilityAction={(event) => {
          switch (event.nativeEvent.actionName) {
            case 'increment':
              handleAccessibilityAction('increment');
              break;
            case 'decrement':
              handleAccessibilityAction('decrement');
              break;
          }
        }}
      >
        {/* Track fill — pointerEvents="none" so a tap here is always reported
            relative to the full track. Without it, a touch landing on this
            (partial-width) view or the thumb below gets a locationX relative
            to that child's own bounds instead of the track, and the slider
            jumps to the wrong value on touch-down. */}
        <View
          pointerEvents="none"
          style={[
            styles.trackFill,
            {
              backgroundColor: colors.accent,
              width: `${normalizedValue * 100}%`,
            },
          ]}
        />

        {/* Thumb */}
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              backgroundColor: colors.sliderThumb,
              left: Math.max(0, Math.min(sliderWidth - 24, thumbPosition - 12)),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.body,
    fontFamily: Typography.headline.fontFamily,
  },
  value: {
    ...Typography.body,
    fontVariant: ['tabular-nums'],
  },
  sliderContainer: {
    height: AccessibilitySize.minTouchTarget,
    borderRadius: AccessibilitySize.borderRadius,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: AccessibilitySize.borderRadius,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: '50%',
    marginTop: -12,
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)' },
      default: {
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
});
