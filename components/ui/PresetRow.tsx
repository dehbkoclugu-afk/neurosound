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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useSettingsStore } from '@/stores/settingsStore';
import { Spacing, Typography, FontFamily } from '@/constants/theme';
import { FrequencyPreset } from '@/lib/frequencies';
import { getPresetIcon, IconConfig } from './Icon';
import { EqualizerBars } from './EqualizerBars';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { usePresetsStore } from '@/stores/presetsStore';
import { presetArt } from '@/lib/artAssets';
import { useArtwork } from '@/hooks/use-artwork';
import { isLockedPreset } from '@/lib/premium';
import { foldForSearch } from '@/lib/upper';
import { useIsPremium } from '@/stores/premiumStore';

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
function Subline({
  preset,
  color,
  t,
}: {
  preset: FrequencyPreset;
  color: string;
  t: (k: string) => string;
}) {
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
function BandScale({
  preset,
  color,
}: {
  preset: FrequencyPreset;
  color: string;
}) {
  const index = BINAURAL_BANDS.indexOf(
    preset.binauralType as (typeof BINAURAL_BANDS)[number],
  );
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

/** Splits `text` on the first occurrence of an already-folded `term`
 *  (see foldForSearch). Folded one character at a time so indices into the
 *  folded string still line up with the original. */
function splitOnMatch(
  text: string,
  term: string,
): [string, string, string] | null {
  if (!term) return null;
  const folded = text
    .split('')
    .map((c) => {
      const f = foldForSearch(c);
      return f.length === 1 ? f : c;
    })
    .join('');
  const at = folded.indexOf(term);
  if (at < 0) return null;
  return [
    text.slice(0, at),
    text.slice(at, at + term.length),
    text.slice(at + term.length),
  ];
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
  const colors = useThemeColors();
  const artwork = useArtwork();
  const addFavorite = usePresetsStore((s) => s.addFavorite);
  const removeFavorite = usePresetsStore((s) => s.removeFavorite);
  const name = t(preset.nameKey);
  const match = highlight ? splitOnMatch(name, highlight) : null;
  const isPremium = useIsPremium();
  const locked = !isPremium && isLockedPreset(preset.id);

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
        locked ? t('paywall.locked') : null,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      {/* A list row, not a card: the sound's own art as a thumbnail, name and
          frequency, then one trailing control. Full-bleed art behind every
          row made 33 rows of the same visual weight. */}
      <View style={[styles.row, { borderBottomColor: colors.cardBorder }]}>
        <Image
          source={artwork.source(presetArt(preset.id))}
          style={[
            styles.thumb,
            { backgroundColor: colors.cardBorder },
            locked && styles.thumbLocked,
          ]}
        />
        <View style={styles.rowText}>
          <Text
            style={[
              styles.name,
              { color: isPlaying ? colors.accent : locked ? colors.textSecondary : colors.text },
            ]}
            numberOfLines={1}
          >
            {match ? (
              <>
                {match[0]}
                <Text style={styles.nameMatch}>{match[1]}</Text>
                {match[2]}
              </>
            ) : (
              name
            )}
          </Text>
          <View style={styles.sublineRow}>
            {isPlaying && <EqualizerBars color={colors.accent} size={12} />}
            <Subline preset={preset} color={colors.textSecondary} t={t} />
            <BandScale preset={preset} color={colors.textSecondary} />
          </View>
        </View>
        {locked ? (
          <View style={styles.trailing}>
            <Ionicons name="lock-closed-outline" size={19} color={colors.textSecondary} />
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => (isFavorite ? removeFavorite(preset.id) : addFavorite(preset.id))}
            style={styles.trailing}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')
            }
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={21}
              color={isFavorite ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  rowShell: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: Spacing.md,
    minHeight: 72,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  thumbLocked: {
    opacity: 0.55,
  },
  trailing: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
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
    minWidth: 0,
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
    flexShrink: 1,
  },
  sublineFreq: {
    ...Typography.numeral,
  },
});
