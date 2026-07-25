/**
 * Accessible Button Component
 * - Minimum 48x48 touch target
 * - Supports reduced motion
 * - Clear visual feedback
 */

import React from 'react';
import { Text, ViewStyle, TextStyle } from 'react-native';

import { PressableScale } from './PressableScale';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { AccessibilitySize, Spacing, Typography, onPrimary } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  iconPosition = 'left',
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
}: ButtonProps) {
  const colors = useThemeColors();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      minHeight: AccessibilitySize.minTouchTarget,
      minWidth: AccessibilitySize.minTouchTarget,
      borderRadius: AccessibilitySize.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: iconPosition === 'right' ? 'row-reverse' : 'row',
      gap: Spacing.sm,
      // Disabled opacity is owned by PressableScale — it composes press
      // feedback on top of the resting value.
    };

    // Size variants
    const sizeStyles: Record<string, ViewStyle> = {
      small: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
      medium: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
      large: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: colors.primary,
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    // fontWeight does nothing for the loaded Nunito Sans faces — React Native
    // does not synthesize weights for custom fonts, it silently falls back to
    // the system font. Weight has to come from fontFamily.
    const baseStyle: TextStyle = {
      fontFamily: Typography.headline.fontFamily,
    };

    const sizeStyles: Record<string, TextStyle> = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: { color: onPrimary },
      secondary: { color: colors.accent },
      ghost: { color: colors.accent },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[getButtonStyle(), style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {icon}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </PressableScale>
  );
}
