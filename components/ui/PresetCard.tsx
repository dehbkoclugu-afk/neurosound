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
import { useSettingsStore } from '@/stores/settingsStore';
import { FrequencyPreset } from '@/lib/frequencies';

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
  const { reduceMotion } = useSettingsStore();
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={reduceMotion ? 1 : 0.6}
      style={[styles.row, { borderBottomColor: colors.cardBorder }, style]}
      accessibilityRole="button"
      accessibilityLabel={t(preset.nameKey)}
    >
      <View style={styles.rowText}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {t(preset.nameKey)}
        </Text>
        <Text style={[styles.subline, { color: colors.textSecondary }]} numberOfLines={1}>
          {getSubline(preset, t)}
        </Text>
      </View>
      {isFavorite && (
        <Ionicons name="heart" size={16} color={colors.primary} />
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
  name,
  onPress,
  style,
}: PresetCardSmallProps) {
  const { reduceMotion } = useSettingsStore();
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={reduceMotion ? 1 : 0.6}
      style={[styles.chip, { borderColor: colors.cardBorder }, style]}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipText: {
    ...Typography.subhead,
    fontFamily: FontFamily.semibold,
  },
});
