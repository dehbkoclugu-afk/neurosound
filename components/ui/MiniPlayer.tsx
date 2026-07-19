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
import { Spacing, Typography } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';
import * as playerController from '@/lib/audio/playerController';
import { useTranslation } from 'react-i18next';

interface MiniPlayerProps {
  onPress?: () => void;
}

export function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { reduceMotion } = useSettingsStore();
  const { currentPreset, isPlaying, isLoading } = useAudioStore();

  const colors = useThemeColors();

  if (!currentPreset) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/player/${currentPreset.id}`);
    }
  };

  const handlePlayPause = () => {
    playerController.toggle();
  };

  const handleStop = () => {
    playerController.unload();
  };

  const subline =
    currentPreset.type === 'binaural'
      ? `${currentPreset.beatFrequency} Hz`
      : currentPreset.type === 'solfeggio'
        ? `${currentPreset.frequency} Hz`
        : t('explore.categories.noise');

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={reduceMotion ? 1 : 0.9}
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.cardBorder,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${t('player.nowPlaying')}: ${t(currentPreset.nameKey)}`}
      accessibilityHint={t('accessibility.expandPlayer')}
    >
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <Text style={[styles.presetName, { color: colors.text }]} numberOfLines={1}>
            {t(currentPreset.nameKey)}
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
            activeOpacity={reduceMotion ? 1 : 0.7}
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? t('accessibility.pauseButton') : t('accessibility.playButton')}
            accessibilityState={{ busy: isLoading }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#1A140C" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={18}
                color="#1A140C"
                style={isPlaying ? undefined : { marginLeft: 2 }}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleStop}
            activeOpacity={reduceMotion ? 1 : 0.7}
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
