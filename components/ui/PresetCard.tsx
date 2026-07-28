/**
 * The one way a preset is presented outside the player: a typographic list
 * row, no cards, no gradients.
 * Name carries the hierarchy; a quiet subline gives type and frequency.
 * The icon sits in a tinted circle rather than floating bare: a run of a
 * dozen identical rows read as one grey paragraph without something for the
 * eye to land on between them.
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
import { Spacing, Typography, BADGE_ALPHA, withAlpha } from '@/constants/theme';
import { useThemeColors, useCategoryColors } from '@/hooks/use-theme-colors';
import { FrequencyPreset } from '@/lib/frequencies';
import { Icon, getPresetIcon, IconConfig } from './Icon';

export function presetIcon(preset: FrequencyPreset): IconConfig {
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

// Same content as getSubline(), but with the *number alone* in the
// tape-counter face. The unit and the separator stay in Nunito: the
// monospace space glyph is much wider, so wrapping "2 Hz" as one run
// rendered a visible double gap ("2␣␣Hz"), and monospacing the category
// word alongside it read as a font glitch rather than a choice.
function Subline({ preset, color, t }: { preset: FrequencyPreset; color: string; t: (k: string) => string }) {
  if (preset.type === 'binaural' && preset.beatFrequency) {
    return (
      <Text style={[styles.subline, { color }]} numberOfLines={1}>
        {t('explore.categories.binaural')} ·{' '}
        <Text style={styles.sublineFreq}>{preset.beatFrequency}</Text> Hz
      </Text>
    );
  }
  if (preset.type === 'solfeggio' && preset.frequency) {
    return (
      <Text style={[styles.subline, { color }]} numberOfLines={1}>
        <Text style={styles.sublineFreq}>{preset.frequency}</Text> Hz
      </Text>
    );
  }
  return (
    <Text style={[styles.subline, { color }]} numberOfLines={1}>
      {t('explore.categories.noise')}
    </Text>
  );
}

export function PresetCard({
  preset,
  onPress,
  isFavorite = false,
  style,
}: PresetCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const categoryColors = useCategoryColors();

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
      <View
        style={[
          styles.iconBadge,
          { backgroundColor: withAlpha(categoryColors[preset.type], BADGE_ALPHA) },
        ]}
      >
        <Icon icon={presetIcon(preset)} size={19} color={categoryColors[preset.type]} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {t(preset.nameKey)}
        </Text>
        <Subline preset={preset} color={colors.textSecondary} t={t} />
      </View>
      {isFavorite && (
        <Ionicons
          name="heart"
          size={16}
          color={colors.accent}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}
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
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  sublineFreq: {
    ...Typography.numeral,
  },
});
