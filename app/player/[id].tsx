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
  Animated,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { ZoomIn } from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  Spacing,
  Typography,
  FontFamily,
  onPrimary,
  withAlpha,
  CategoryColors,
} from '@/constants/theme';
import { contentColumn } from '@/constants/layout';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { WaveVisualizer } from '@/components/player/WaveVisualizer';
import { Slider } from '@/components/ui/Slider';
import { TimerModal, formatTimerValue } from '@/components/ui/TimerModal';
import { PressableScale } from '@/components/ui/PressableScale';
import { Toast } from '@/components/ui/Toast';
import * as haptics from '@/lib/haptics';
import { getPresetById, FrequencyPreset } from '@/lib/frequencies';
import * as playerController from '@/lib/audio/playerController';

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
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

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

  // The most requested action next to a sound is layering it into a mix —
  // this used to be a decorative empty view "for symmetry".
  const handleAddToMixer = useCallback(async () => {
    if (!preset) return;
    const added = await playerController.mixerAddChannel(preset);
    if (!added) {
      Alert.alert(t('mixer.maxChannels'), t('mixer.maxChannelsDesc'));
      return;
    }
    haptics.save();
    setToast({ visible: true, message: t('mixer.addedToMixer') });
  }, [preset, t]);

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

  // Close only dismisses the modal — audio keeps playing, MiniPlayer takes over.
  // Arriving here from a deep link means there is no history to pop, so back
  // would exit the app instead of returning to it.
  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

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
        colors={[
          withAlpha(colors.primary, 0.16),
          withAlpha(colors.primary, 0.04),
          colors.background,
        ]}
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
        <Text
          style={[styles.headerTitle, { color: colors.textSecondary }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
        >
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
              color={isFavorite ? colors.accent : colors.textSecondary}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Breathing ring — the centerpiece, over a soft radial glow */}
      <View style={styles.content}>
        <View style={styles.visualWrap}>
          <View
            style={[styles.glowOuter, { backgroundColor: withAlpha(colors.primary, 0.05) }]}
          />
          <View
            style={[styles.glowInner, { backgroundColor: withAlpha(colors.primary, 0.09) }]}
          />
          <WaveVisualizer
            isPlaying={isPlaying}
            color={colors.primary}
            intensity={volume}
            tempoMs={getVisualTempoMs(preset)}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text
            style={[styles.presetName, { color: colors.text }]}
            accessibilityRole="header"
          >
            {t(preset.nameKey)}
          </Text>

          <View style={styles.metaRow}>
            {/* The only place the sound's own colour still appears. */}
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: CategoryColors[preset.type] },
              ]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <Text style={[styles.frequencyLine, { color: colors.textSecondary }]}>
              {frequencyLine ?? t(`explore.categories.${preset.type}`)}
            </Text>
          </View>

          <Text
            style={[
              styles.presetDescription,
              { color: colors.textSecondary },
              preset.type === 'solfeggio' && styles.disclaimer,
            ]}
          >
            {t(preset.descriptionKey)}
          </Text>

          {playbackError && (
            <View style={styles.playbackError} accessibilityLiveRegion="assertive">
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={colors.error}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
              <Text style={[styles.playbackErrorText, { color: colors.error }]}>
                {t('player.playbackError')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Controls */}
      <View
        style={[
          styles.controls,
          contentColumn,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.volumeSection}>
          <View style={styles.volumeContainer}>
            <Ionicons
              name="volume-low"
              size={18}
              color={colors.textSecondary}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <View style={styles.sliderWrapper}>
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={1}
                showValue={false}
                accessibilityLabel={t('accessibility.volumeSlider')}
              />
            </View>
            <Ionicons
              name="volume-high"
              size={18}
              color={colors.textSecondary}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          </View>

          {/* The safety cap is invisible otherwise: the slider runs to 100%
              while the output stops at maxVolume, so full travel sounds
              quieter than it looks with no explanation anywhere. */}
          {maxVolume < 1 && (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/settings')}
              style={styles.volumeCap}
              accessibilityRole="button"
              accessibilityLabel={`${t('player.volumeCapped', {
                percent: Math.round(maxVolume * 100),
              })}. ${t('common.settings')}`}
            >
              <Text style={[styles.volumeCapText, { color: colors.textSecondary }]}>
                {t('player.volumeCapped', { percent: Math.round(maxVolume * 100) })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.mainControls}>
          <TouchableOpacity
            onPress={() => setShowTimerModal(true)}
            style={styles.sideButton}
            accessibilityRole="button"
            accessibilityLabel={
              timerRemaining !== null && timerRemaining > 0
                ? `${t('player.timer')}, ${formatTimerValue(timerRemaining)}`
                : t('player.timer')
            }
          >
            <Ionicons
              name="timer-outline"
              size={24}
              color={timerDuration ? colors.accent : colors.textSecondary}
            />
            {timerRemaining !== null && timerRemaining > 0 && (
              <Reanimated.Text
                entering={reduceMotion ? undefined : ZoomIn.duration(200)}
                style={[styles.timerBadge, { color: colors.accent }]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {formatTimerValue(timerRemaining)}
              </Reanimated.Text>
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
            {/* Sound generation isn't a spinner's kind of wait — the ring
                already sits dim and starts breathing the moment it's ready. */}
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={38}
              color={onPrimary}
              style={isPlaying ? undefined : { marginLeft: 3 }}
            />
          </PressableScale>

          <TouchableOpacity
            onPress={handleAddToMixer}
            style={styles.sideButton}
            accessibilityRole="button"
            accessibilityLabel={t('mixer.addToMixer')}
          >
            <Ionicons name="layers-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <TimerModal
        visible={showTimerModal}
        onClose={() => setShowTimerModal(false)}
      />

      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
  // The disclaimer is context, not a claim about the sound — it sits back.
  disclaimer: {
    ...Typography.footnote,
    lineHeight: 18,
    maxWidth: 280,
  },
  playbackError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  playbackErrorText: {
    ...Typography.subhead,
    textAlign: 'center',
  },
  controls: {
    paddingHorizontal: Spacing.xl,
  },
  volumeSection: {
    marginBottom: Spacing.xl,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  volumeCap: {
    alignSelf: 'center',
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    minHeight: 32,
  },
  volumeCapText: {
    ...Typography.caption1,
    fontVariant: ['tabular-nums'],
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
});
