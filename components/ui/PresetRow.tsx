/**
 * The shared image-led sound row used by Home, Explore and Intent screens.
 * Artwork is semantic content, while the deterministic scrim keeps names,
 * frequency, state and navigation readable in every theme.
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
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useSettingsStore } from '@/stores/settingsStore';
import { Spacing, Typography, FontFamily, withAlpha } from '@/constants/theme';
import { useCategoryColors } from '@/hooks/use-theme-colors';
import { FrequencyPreset } from '@/lib/frequencies';
import { Icon, getPresetIcon, IconConfig } from './Icon';
import { EqualizerBars } from './EqualizerBars';
import { ArtBackground } from './ArtBackground';
import { presetArt } from '@/lib/artAssets';

export function presetIcon(preset: FrequencyPreset): IconConfig {
  if (preset.type === 'binaural' && preset.binauralType) {
    return getPresetIcon('binaural', preset.binauralType);
  }
  if (preset.type === 'noise' && preset.noiseType) {
    return getPresetIcon('noise', preset.noiseType);
  }
  return getPresetIcon('solfeggio');
}

interface PresetRowProps {
  preset: FrequencyPreset;
  onPress: () => void;
  isFavorite?: boolean;
  /** This preset is the sound currently coming out of the speaker. */
  isPlaying?: boolean;
  /** Lower-cased search term to emphasise inside the name, so a filtered
   *  list shows *why* each row survived the filter. */
  highlight?: string;
  /** Position in its list. Only used to stagger the entrance — the rows of a
   *  long list arriving together read as one block dropping in, where 40ms
   *  apart reads as a list being dealt out. */
  index?: number;
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

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/** The five binaural bands, in the order the ear climbs them. */
const BINAURAL_BANDS = ['delta', 'theta', 'alpha', 'beta', 'gamma'] as const;

/**
 * Delta → Gamma is a real progression and the list was presenting it as five
 * unrelated names. Five ticks with the current one raised put the row on a
 * scale: you can see at a glance that Theta is near the bottom and Beta near
 * the top without knowing what 6 Hz means.
 */
function BandScale({ preset, color }: { preset: FrequencyPreset; color: string }) {
  const index = BINAURAL_BANDS.indexOf(preset.binauralType as (typeof BINAURAL_BANDS)[number]);
  if (index < 0) return null;
  return (
    <View
      style={styles.bandScale}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {BINAURAL_BANDS.map((band, i) => (
        <View
          key={band}
          style={[
            styles.bandTick,
            { backgroundColor: color, opacity: i === index ? 1 : 0.3 },
            i === index && styles.bandTickActive,
          ]}
        />
      ))}
    </View>
  );
}

/** Splits `text` on the first case-insensitive occurrence of `term`. */
function splitOnMatch(text: string, term: string): [string, string, string] | null {
  if (!term) return null;
  const at = text.toLowerCase().indexOf(term);
  if (at < 0) return null;
  return [text.slice(0, at), text.slice(at, at + term.length), text.slice(at + term.length)];
}

export function PresetRow({
  preset,
  onPress,
  isFavorite = false,
  isPlaying = false,
  highlight,
  index,
  style,
}: PresetRowProps) {
  const { t } = useTranslation();
  const { reduceMotion } = useSettingsStore();
  const categoryColors = useCategoryColors();
  const name = t(preset.nameKey);
  const match = highlight ? splitOnMatch(name, highlight) : null;

  return (
    <AnimatedTouchable
      entering={
        reduceMotion || index === undefined
          ? undefined
          : FadeInDown.duration(220).delay(Math.min(index, 8) * 40)
      }
      onPress={onPress}
      activeOpacity={0.6}
      style={[styles.rowShell, style]}
      accessibilityRole="button"
      // The subline carries the category and the frequency, and the heart
      // carries favourite state. Announcing the name alone dropped both, so a
      // screen reader user could not tell 6 Hz from 40 Hz.
      accessibilityLabel={[
        name,
        getSubline(preset, t),
        // The equalizer is decorative to a screen reader, so the state it
        // stands for has to be spoken here or it is simply missing.
        isPlaying ? t('common.nowPlaying') : null,
        isFavorite ? t('common.addedToFavorites') : null,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      <ArtBackground source={presetArt(preset.id)} style={styles.row} variant="row">
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: withAlpha(categoryColors[preset.type], 0.28) },
          ]}
        >
          <Icon icon={presetIcon(preset)} size={19} color="#FFFFFF" />
        </View>
        <View style={styles.rowText}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: '#FFFFFF' }]}
              numberOfLines={1}
            >
              {match ? (
                <>
                  {match[0]}
                  <Text style={[styles.nameMatch, { color: '#FFFFFF' }]}>{match[1]}</Text>
                  {match[2]}
                </>
              ) : (
                name
              )}
            </Text>
            {isFavorite && (
              <Ionicons
                name="heart"
                size={14}
                color="#FFFFFF"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            )}
          </View>
          <View style={styles.sublineRow}>
            <Subline preset={preset} color="rgba(255,255,255,0.74)" t={t} />
            <BandScale preset={preset} color="rgba(255,255,255,0.82)" />
          </View>
        </View>
        {isPlaying && <EqualizerBars color="#FFFFFF" />}
        <Ionicons
          name="chevron-forward"
          size={17}
          color="rgba(255,255,255,0.82)"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </ArtBackground>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  rowShell: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    minHeight: 92,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  name: {
    ...Typography.headline,
    flexShrink: 1,
  },
  nameMatch: {
    fontFamily: FontFamily.bold,
  },
  sublineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bandScale: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 8,
  },
  bandTick: {
    width: 2,
    height: 4,
    borderRadius: 1,
  },
  bandTickActive: {
    height: 8,
  },
  subline: {
    ...Typography.footnote,
  },
  sublineFreq: {
    ...Typography.numeral,
  },
});
