/**
 * MiniPlayer — quiet flat bar above the tab bar.
 * Hairline top, typographic info, play/pause + dismiss.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, withAlpha } from '@/constants/theme';
import { useAudioStore } from '@/stores/audioStore';
import * as playerController from '@/lib/audio/playerController';
import * as haptics from '@/lib/haptics';
import { TransportButton } from './TransportButton';
import { useTranslation } from 'react-i18next';

interface MiniPlayerProps {
  onPress?: () => void;
}

export function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    currentPreset,
    isPlaying,
    isLoading,
    isMixerPlaying,
    mixerChannels,
    timerRemaining,
    timerDuration,
  } = useAudioStore();

  const colors = useThemeColors();

  // The mixer is a second, independent source of playback. Without this branch
  // it had no global control at all: leaving the Mixer tab mid-playback left
  // the user with no way to pause and no sign that anything was playing.
  const isMixerSession = !currentPreset && mixerChannels.length > 0;

  if (!currentPreset && !isMixerSession) {
    return null;
  }

  const title = currentPreset ? t(currentPreset.nameKey) : t('mixer.title');

  // The number alone takes the tape-counter face; the unit and any prose
  // stay in Nunito (see Typography.numeral).
  const sublineHz = currentPreset
    ? currentPreset.type === 'binaural'
      ? currentPreset.beatFrequency
      : currentPreset.type === 'solfeggio'
        ? currentPreset.frequency
        : null
    : null;
  const sublineText = currentPreset
    ? sublineHz === null
      ? t('explore.categories.noise')
      : null
    : `${mixerChannels.length} ${t('mixer.sounds')}`;

  const playing = currentPreset ? isPlaying : isMixerPlaying;

  // A sleep timer runs across every screen, and the one strip of chrome that
  // is always on screen said nothing about it. A hairline that drains along
  // the top edge is the smallest thing that can: no numbers, no new row.
  const timerFraction =
    timerRemaining !== null && timerDuration
      ? Math.max(0, Math.min(1, timerRemaining / (timerDuration * 60)))
      : null;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (currentPreset) {
      router.push(`/player/${currentPreset.id}`);
    } else {
      router.push('/(tabs)/mixer');
    }
  };

  const handlePlayPause = () => {
    haptics.commit();
    if (currentPreset) {
      playerController.toggle();
    } else if (isMixerPlaying) {
      playerController.mixerStop();
    } else {
      playerController.mixerStart();
    }
  };

  const handleStop = () => {
    if (currentPreset) {
      playerController.unload();
    } else {
      playerController.mixerClear();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.miniPlayer,
          borderTopColor: colors.cardBorder,
        },
      ]}
    >
      {timerFraction !== null && (
        <View
          style={[
            styles.timerTrace,
            {
              width: `${timerFraction * 100}%`,
              backgroundColor: colors.accent,
            },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}
      <View style={styles.content}>
        {/* A pressable row wrapping the play/stop buttons would nest
            interactive elements inside one another — invalid HTML on web
            (React logs a hydration-error warning for it) and an ambiguous
            touch target on native. The expand action is scoped to just the
            info column instead, as a sibling of the buttons, not their
            ancestor. */}
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          style={styles.infoContainer}
          accessibilityRole="button"
          accessibilityLabel={`${t('player.nowPlaying')}: ${title}`}
          accessibilityHint={t('accessibility.expandPlayer')}
        >
          <Text
            style={[styles.presetName, { color: colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[styles.presetType, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {sublineHz !== null ? (
              <>
                <Text style={styles.presetTypeNumeral}>{sublineHz}</Text> Hz
              </>
            ) : (
              sublineText
            )}
          </Text>
        </TouchableOpacity>

        <View style={styles.rightSection}>
          <TransportButton
            playing={playing}
            onPress={handlePlayPause}
            loading={isLoading}
            size={36}
            accessibilityLabel={
              playing
                ? t('accessibility.pauseButton')
                : t('accessibility.playButton')
            }
          />
          {/* Same circular footprint as play, so the two read as one pair of
              transport controls — but a quiet outline rather than a filled
              disc, because this one ends the session and that one does not. */}
          <TouchableOpacity
            onPress={handleStop}
            activeOpacity={0.7}
            style={[
              styles.stopButton,
              {
                borderColor: colors.cardBorder,
                backgroundColor: withAlpha(colors.text, 0.04),
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('common.stop')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={17} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 56,
  },
  infoContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: Spacing.md,
    gap: 1,
  },
  presetName: {
    ...Typography.body,
  },
  presetType: {
    ...Typography.caption,
  },
  presetTypeNumeral: {
    ...Typography.numeral,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTrace: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
  },
});
