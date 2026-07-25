/**
 * MiniPlayer — quiet flat bar above the tab bar.
 * Hairline top, typographic info, play/pause + dismiss.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, onPrimary } from '@/constants/theme';
import { useAudioStore } from '@/stores/audioStore';
import * as playerController from '@/lib/audio/playerController';
import { useTranslation } from 'react-i18next';

interface MiniPlayerProps {
  onPress?: () => void;
}

export function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentPreset, isPlaying, isLoading, isMixerPlaying, mixerChannels } =
    useAudioStore();

  const colors = useThemeColors();

  // The mixer is a second, independent source of playback. Without this branch
  // it had no global control at all: leaving the Mixer tab mid-playback left
  // the user with no way to pause and no sign that anything was playing.
  const isMixerSession = !currentPreset && mixerChannels.length > 0;

  if (!currentPreset && !isMixerSession) {
    return null;
  }

  const title = currentPreset ? t(currentPreset.nameKey) : t('mixer.title');

  const subline = currentPreset
    ? currentPreset.type === 'binaural'
      ? `${currentPreset.beatFrequency} Hz`
      : currentPreset.type === 'solfeggio'
        ? `${currentPreset.frequency} Hz`
        : t('explore.categories.noise')
    : `${mixerChannels.length} ${t('mixer.sounds')}`;

  const playing = currentPreset ? isPlaying : isMixerPlaying;

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
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.cardBorder,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${t('player.nowPlaying')}: ${title}`}
      accessibilityHint={t('accessibility.expandPlayer')}
    >
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <Text style={[styles.presetName, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text
            style={[styles.presetType, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subline}
          </Text>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            onPress={handlePlayPause}
            disabled={isLoading}
            activeOpacity={0.7}
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={playing ? t('accessibility.pauseButton') : t('accessibility.playButton')}
            accessibilityState={{ busy: isLoading }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={onPrimary} />
            ) : (
              <Ionicons
                name={playing ? 'pause' : 'play'}
                size={18}
                color={onPrimary}
                style={playing ? undefined : { marginLeft: 2 }}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleStop}
            activeOpacity={0.7}
            style={styles.stopButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.stop')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
    marginRight: Spacing.md,
    gap: 1,
  },
  presetName: {
    ...Typography.subhead,
  },
  presetType: {
    ...Typography.caption1,
    fontVariant: ['tabular-nums'],
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
