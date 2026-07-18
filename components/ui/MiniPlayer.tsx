/**
 * MiniPlayer Component - Compact Player Bar
 * - Shows above tab bar when audio is playing
 * - Displays current preset with progress
 * - Tap to expand to full player
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Shadows } from '@/constants/theme';
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

  // Don't render if no preset is playing
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

  const presetColor = currentPreset.color || colors.primary;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={reduceMotion ? 1 : 0.95}
      style={[
        styles.container,
        {
          backgroundColor: colors.miniPlayer,
          borderTopColor: colors.cardBorder,
        },
        Shadows.medium,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${t('player.nowPlaying')}: ${t(currentPreset.nameKey)}`}
      accessibilityHint={t('accessibility.expandPlayer')}
    >
      {/* Progress indicator line */}
      <View style={[styles.progressLine, { backgroundColor: presetColor }]} />

      <View style={styles.content}>
        {/* Left: Playing indicator and title */}
        <View style={styles.leftSection}>
          {/* Animated playing indicator */}
          <View style={[styles.playingIndicator, { backgroundColor: presetColor }]}>
            {isPlaying ? (
              <View style={styles.barsContainer}>
                <Animated.View style={[styles.bar, { backgroundColor: '#fff' }]} />
                <Animated.View style={[styles.bar, styles.barMedium, { backgroundColor: '#fff' }]} />
                <Animated.View style={[styles.bar, styles.barShort, { backgroundColor: '#fff' }]} />
              </View>
            ) : (
              <Ionicons name="musical-notes" size={16} color="#fff" />
            )}
          </View>

          {/* Preset info */}
          <View style={styles.infoContainer}>
            <Text
              style={[styles.presetName, { color: colors.text }]}
              numberOfLines={1}
            >
              {t(currentPreset.nameKey)}
            </Text>
            <Text
              style={[styles.presetType, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {currentPreset.type === 'binaural' && `${currentPreset.beatFrequency} Hz`}
              {currentPreset.type === 'solfeggio' && `${currentPreset.frequency} Hz`}
              {currentPreset.type === 'noise' && currentPreset.noiseType}
            </Text>
          </View>
        </View>

        {/* Right: Play/Pause + Stop buttons */}
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
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color="#FFFFFF"
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
            <Ionicons name="close" size={22} color={colors.textSecondary} />
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
    overflow: 'hidden',
  },
  progressLine: {
    height: 2,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 56,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  playingIndicator: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
  },
  bar: {
    width: 3,
    height: 16,
    borderRadius: 1.5,
  },
  barMedium: {
    height: 10,
  },
  barShort: {
    height: 6,
  },
  infoContainer: {
    flex: 1,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetType: {
    fontSize: 12,
    marginTop: 1,
    textTransform: 'capitalize',
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
