/**
 * PresetCard Component - Modern Grid Card Design
 * - Square card with gradient background
 * - Icon, name, frequency info
 * - Favorite indicator
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Spacing,
  Shadows,
  AccessibilitySize,
  GradientColors,
} from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { FrequencyPreset } from '@/lib/frequencies';
import { Icon, getPresetIcon, IconConfig } from './Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = Spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 3) / 2;

interface PresetCardProps {
  preset: FrequencyPreset;
  onPress: () => void;
  isFavorite?: boolean;
  showFrequency?: boolean;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

const getGradientColors = (preset: FrequencyPreset): string[] => {
  if (preset.type === 'binaural' && preset.binauralType) {
    return GradientColors[preset.binauralType] || [preset.color, preset.color];
  }
  if (preset.type === 'noise' && preset.noiseType) {
    return GradientColors[preset.noiseType] || [preset.color, preset.color];
  }
  if (preset.type === 'solfeggio') {
    // Use preset-specific gradient if available
    return GradientColors[preset.id] || GradientColors.solfeggio || [preset.color, preset.color];
  }
  return [preset.color, preset.color];
};

const getPresetIconConfig = (preset: FrequencyPreset): IconConfig => {
  if (preset.type === 'binaural' && preset.binauralType) {
    return getPresetIcon('binaural', preset.binauralType);
  }
  if (preset.type === 'noise' && preset.noiseType) {
    return getPresetIcon('noise', preset.noiseType);
  }
  if (preset.type === 'solfeggio') {
    return getPresetIcon('solfeggio');
  }
  return { name: 'headset', library: 'ionicon' };
};

const getFrequencyText = (preset: FrequencyPreset): string | null => {
  if (preset.type === 'binaural' && preset.beatFrequency) {
    return `${preset.beatFrequency} Hz`;
  }
  // Solfeggio frequency is already in the name, so no need to show it again
  return null;
};

export function PresetCard({
  preset,
  onPress,
  isFavorite = false,
  showFrequency = true,
  style,
  size = 'medium',
}: PresetCardProps) {
  const { t } = useTranslation();
  const { reduceMotion } = useSettingsStore();

  const gradientColors = getGradientColors(preset);
  const iconConfig = getPresetIconConfig(preset);
  const frequencyText = showFrequency ? getFrequencyText(preset) : null;

  const sizeStyles = {
    small: { width: 100, height: 100, iconSize: 28 },
    medium: { width: CARD_WIDTH, height: CARD_WIDTH, iconSize: 40 },
    large: { width: CARD_WIDTH * 2 + CARD_GAP, height: CARD_WIDTH, iconSize: 48 },
  };

  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={reduceMotion ? 1 : 0.8}
      style={[
        styles.container,
        {
          width: currentSize.width,
          height: currentSize.height,
        },
        Shadows.medium,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={t(preset.nameKey)}
    >
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Icon
              icon={iconConfig}
              size={currentSize.iconSize}
              color="rgba(255, 255, 255, 0.9)"
            />
          </View>

          {/* Preset Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.name} numberOfLines={2}>
              {t(preset.nameKey)}
            </Text>
            {frequencyText && (
              <Text style={styles.frequency}>{frequencyText}</Text>
            )}
          </View>

          {/* Favorite Indicator */}
          {isFavorite && (
            <View style={styles.favoriteContainer}>
              <Ionicons name="heart" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Horizontal scroll variant for recent items
interface PresetCardSmallProps {
  preset: FrequencyPreset;
  name: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function PresetCardSmall({
  preset,
  name,
  onPress,
  style,
}: PresetCardSmallProps) {
  const { reduceMotion } = useSettingsStore();
  const gradientColors = getGradientColors(preset);
  const iconConfig = getPresetIconConfig(preset);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={reduceMotion ? 1 : 0.8}
      style={[styles.smallContainer, Shadows.small, style]}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.smallGradient}
      >
        <Icon
          icon={iconConfig}
          size={32}
          color="rgba(255, 255, 255, 0.9)"
        />
        <Text style={styles.smallName} numberOfLines={1}>
          {name}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: AccessibilitySize.borderRadiusLarge,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: Spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    marginBottom: Spacing.sm,
  },
  infoContainer: {
    marginTop: 'auto',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  frequency: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  favoriteContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  // Small card styles
  smallContainer: {
    width: 100,
    height: 120,
    borderRadius: AccessibilitySize.borderRadius,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  smallGradient: {
    flex: 1,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  smallName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
