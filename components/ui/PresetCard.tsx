/**
 * Preset rows — typographic list items, no cards, no gradients.
 * Name carries the hierarchy; a quiet subline gives type and frequency.
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Spacing, Typography, FontFamily } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { FrequencyPreset } from '@/lib/frequencies';
import { Icon, getPresetIcon, IconConfig } from './Icon';

function presetIcon(preset: FrequencyPreset): IconConfig {
  if (preset.type === 'binaural' && preset.binauralType) {
    return getPresetIcon('binaural', preset.binauralType);
  }
  if (preset.type === 'noise' && preset.noiseType) {
    return getPresetIcon('noise', preset.noiseType);
  }
  return getPresetIcon('solfeggio');
}

interface PresetCardProps {
  preset: FrequencyPreset;
  onPress: () => void;
  isFavorite?: boolean;
  showFrequency?: boolean;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large'; // kept for API compat, unused
}

function getSubline(preset: FrequencyPreset, t: (k: string) => string): string {
  if (preset.type === 'binaural' && preset.beatFrequency) {
    return `${t('explore.categories.binaural')} · ${preset.beatFrequency} Hz`;
  }
  if (preset.type === 'solfeggio' && preset.frequency) {
    return `${preset.frequency} Hz`;
  }
  return t('explore.categories.noise');
}

export function PresetCard({
  preset,
  onPress,
  isFavorite = false,
  style,
}: PresetCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={[styles.row, { borderBottomColor: colors.cardBorder }, style]}
      accessibilityRole="button"
      // The subline carries the category and the frequency, and the heart
      // carries favourite state. Announcing the name alone dropped both, so a
      // screen reader user could not tell 6 Hz from 40 Hz.
      accessibilityLabel={[
        t(preset.nameKey),
        getSubline(preset, t),
        isFavorite ? t('common.addedToFavorites') : null,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      {/* Naked icon — no tinted box */}
      <Icon icon={presetIcon(preset)} size={20} color={colors.textSecondary} />
      <View style={styles.rowText}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {t(preset.nameKey)}
        </Text>
        <Text style={[styles.subline, { color: colors.textSecondary }]} numberOfLines={1}>
          {getSubline(preset, t)}
        </Text>
      </View>
      {isFavorite && (
        <Ionicons
          name="heart"
          size={16}
          color={colors.primary}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}
    </TouchableOpacity>
  );
}

// Compact chip for horizontal "recently played" strips — text only
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
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={[styles.chip, { borderColor: colors.cardBorder }, style]}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <Icon icon={presetIcon(preset)} size={15} color={colors.textSecondary} />
      <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
    minHeight: 56,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.headline,
  },
  subline: {
    ...Typography.footnote,
    fontVariant: ['tabular-nums'],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    minHeight: 40,
  },
  chipText: {
    ...Typography.subhead,
    fontFamily: FontFamily.semibold,
  },
});
