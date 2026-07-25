/**
 * Player Screen — quiet instrument.
 * Flat surface, one breathing ring, typographic info, single amber accent.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, FontFamily, onPrimary } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { WaveVisualizer } from '@/components/player/WaveVisualizer';
import { Slider } from '@/components/ui/Slider';
import { PressableScale } from '@/components/ui/PressableScale';
import * as haptics from '@/lib/haptics';
import { getPresetById, FrequencyPreset } from '@/lib/frequencies';
import * as playerController from '@/lib/audio/playerController';

// Timer options
const TIMER_OPTIONS = [
  { labelKey: 'player.timerOptions.none', value: null },
  { labelKey: 'player.timerOptions.15min', value: 15 },
  { labelKey: 'player.timerOptions.30min', value: 30 },
  { labelKey: 'player.timerOptions.1hour', value: 60 },
  { labelKey: 'player.timerOptions.2hours', value: 120 },
];

// Visual pulse tempo follows the sound: slow breathing for delta,
// fine shimmer for gamma, slow drift for ambient noise, steady for tones.
const getVisualTempoMs = (preset: FrequencyPreset): number => {
  if (preset.type === 'binaural' && preset.beatFrequency) {
    return 2000 + 8000 / preset.beatFrequency;
  }
  if (preset.type === 'noise') {
    return 4500;
  }
  return 3000;
};

const getFrequencyLine = (preset: FrequencyPreset): string | null => {
  if (preset.type === 'binaural' && preset.baseFrequency && preset.beatFrequency) {
    return `${preset.baseFrequency} Hz · ${preset.beatFrequency} Hz`;
  }
  if (preset.type === 'solfeggio' && preset.frequency) {
    return `${preset.frequency} Hz`;
  }
  return null;
};

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { maxVolume, reduceMotion } = useSettingsStore();
  const { isPlaying, isLoading, playbackError, volume, setVolume, timerRemaining, timerDuration } = useAudioStore();
  const { favoriteIds, addFavorite, removeFavorite, addRecentlyPlayed } = usePresetsStore();

  const [preset, setPreset] = useState<FrequencyPreset | null>(null);
  const [showTimerModal, setShowTimerModal] = useState(false);

  // Load preset into the global controller (same preset = keeps playing)
  useEffect(() => {
    if (!id) return;
    const loadedPreset = getPresetById(id);
    if (loadedPreset) {
      setPreset(loadedPreset);
      playerController.loadPreset(loadedPreset);
      addRecentlyPlayed(id);
    }
  }, [id, addRecentlyPlayed]);

  // Update volume
  useEffect(() => {
    playerController.syncVolume();
  }, [volume, maxVolume]);

  const handlePlayPause = useCallback(async () => {
    haptics.commit();
    await playerController.toggle();
  }, []);

  const handleSelectTimer = useCallback((value: number | null) => {
    haptics.select();
    playerController.startTimer(value);
    setShowTimerModal(false);
  }, []);

  const isFavorite = id ? favoriteIds.includes(id) : false;

  // Favouriting is rare and rewarding — the one place a little delight earns
  // its keep. Removing gets no pop; it is not an achievement.
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleFavoriteToggle = useCallback(() => {
    if (!id) return;
    if (favoriteIds.includes(id)) {
      haptics.commit();
      removeFavorite(id);
      return;
    }

    haptics.save();
    addFavorite(id);

    if (reduceMotion) return;
    heartScale.setValue(1);
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [id, favoriteIds, addFavorite, removeFavorite, reduceMotion, heartScale]);

  // Close only dismisses the modal — audio keeps playing, MiniPlayer takes over
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!preset) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {t('common.error')}
        </Text>
      </View>
    );
  }

  const frequencyLine = getFrequencyLine(preset);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Atmospheric wash — the sound's colour bleeds softly from the top */}
      <LinearGradient
        colors={[preset.color + '2E', preset.color + '0D', colors.background]}
        locations={[0, 0.42, 0.82]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.headerButton}
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="chevron-down" size={26} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
          {isPlaying ? t('player.nowPlaying') : t('player.paused')}
        </Text>
        <TouchableOpacity
          onPress={handleFavoriteToggle}
          style={styles.headerButton}
          accessibilityLabel={isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? colors.primary : colors.textSecondary}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Breathing ring — the centerpiece, over a soft radial glow */}
      <View style={styles.content}>
        <View style={styles.visualWrap}>
          <View style={[styles.glowOuter, { backgroundColor: preset.color + '0F' }]} />
          <View style={[styles.glowMid, { backgroundColor: preset.color + '14' }]} />
          <View style={[styles.glowInner, { backgroundColor: preset.color + '1C' }]} />
          <WaveVisualizer
            isPlaying={isPlaying}
            color={preset.color}
            intensity={volume}
            tempoMs={getVisualTempoMs(preset)}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.presetName, { color: colors.text }]}>
            {t(preset.nameKey)}
          </Text>

          {frequencyLine && (
            <Text style={[styles.frequencyLine, { color: colors.textSecondary }]}>
              {frequencyLine}
            </Text>
          )}

          {preset.type !== 'solfeggio' && (
            <Text style={[styles.presetDescription, { color: colors.textSecondary }]}>
              {t(preset.descriptionKey)}
            </Text>
          )}

          {playbackError && (
            <Text style={[styles.playbackError, { color: colors.error }]}>
              {t('player.playbackError')}
            </Text>
          )}
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.volumeContainer}>
          <Ionicons name="volume-low" size={18} color={colors.textSecondary} />
          <View style={styles.sliderWrapper}>
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={1}
              showValue={false}
              accessibilityLabel={t('accessibility.volumeSlider')}
            />
          </View>
          <Ionicons name="volume-high" size={18} color={colors.textSecondary} />
        </View>

        <View style={styles.mainControls}>
          <TouchableOpacity
            onPress={() => setShowTimerModal(true)}
            style={styles.sideButton}
            accessibilityLabel={t('player.timer')}
          >
            <Ionicons
              name="timer-outline"
              size={24}
              color={timerDuration ? colors.primary : colors.textSecondary}
            />
            {timerRemaining !== null && timerRemaining > 0 && (
              <Text style={[styles.timerBadge, { color: colors.primary }]}>
                {formatTime(timerRemaining)}
              </Text>
            )}
          </TouchableOpacity>

          <PressableScale
            onPress={handlePlayPause}
            disabled={isLoading}
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? t('accessibility.pauseButton') : t('accessibility.playButton')}
            accessibilityState={{ busy: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color={onPrimary} />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={38}
                color={onPrimary}
                style={isPlaying ? undefined : { marginLeft: 3 }}
              />
            )}
          </PressableScale>

          {/* Placeholder for symmetry */}
          <View style={styles.sideButton} />
        </View>
      </View>

      {/* Timer Modal */}
      <Modal
        visible={showTimerModal}
        transparent
        animationType={reduceMotion ? 'none' : 'fade'}
        onRequestClose={() => setShowTimerModal(false)}
        accessibilityViewIsModal
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setShowTimerModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('player.timer')}</Text>
            {TIMER_OPTIONS.map((option) => {
              const isSelected = timerDuration === option.value;
              return (
                <TouchableOpacity
                  key={option.labelKey}
                  onPress={() => handleSelectTimer(option.value)}
                  style={[styles.timerOption, { borderBottomColor: colors.cardBorder }]}
                >
                  <Text
                    style={[
                      styles.timerOptionText,
                      { color: isSelected ? colors.primary : colors.text },
                      isSelected && styles.timerOptionTextSelected,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xxl,
  },
  visualWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  glowMid: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  glowInner: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
  },
  infoContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  presetName: {
    ...Typography.title1,
    textAlign: 'center',
  },
  frequencyLine: {
    ...Typography.subhead,
    fontVariant: ['tabular-nums'],
  },
  presetDescription: {
    ...Typography.subhead,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  playbackError: {
    ...Typography.subhead,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  controls: {
    paddingHorizontal: Spacing.xl,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  sliderWrapper: {
    flex: 1,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  sideButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    ...Typography.caption2,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    borderRadius: 20,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    ...Typography.title3,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  timerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timerOptionText: {
    ...Typography.body,
  },
  timerOptionTextSelected: {
    fontFamily: FontFamily.semibold,
  },
});
