/**
 * Player Screen - Full-screen Spotify-style Audio Player
 * Large gradient background, centered visual, bottom controls
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, Shadows, GradientColors } from '@/constants/theme';
import { Icon, getPresetIcon as getPresetIconConfig, IconConfig } from '@/components/ui/Icon';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { WaveVisualizer } from '@/components/player/WaveVisualizer';
import { Slider } from '@/components/ui/Slider';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getGradientColors = (preset: FrequencyPreset): string[] => {
  if (preset.type === 'binaural' && preset.binauralType) {
    const colors = GradientColors[preset.binauralType];
    return [colors[0], colors[1], '#000000'];
  }
  if (preset.type === 'noise' && preset.noiseType) {
    const colors = GradientColors[preset.noiseType];
    return [colors[0], colors[1], '#000000'];
  }
  if (preset.type === 'solfeggio') {
    // Use preset-specific gradient if available
    const colors = GradientColors[preset.id] || GradientColors.solfeggio;
    return [colors[0], colors[1], '#000000'];
  }
  return [GradientColors.solfeggio[0], GradientColors.solfeggio[1], '#000000'];
};

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

const getPlayerPresetIcon = (preset: FrequencyPreset): IconConfig => {
  if (preset.type === 'binaural' && preset.binauralType) {
    return getPresetIconConfig('binaural', preset.binauralType);
  }
  if (preset.type === 'noise' && preset.noiseType) {
    return getPresetIconConfig('noise', preset.noiseType);
  }
  return getPresetIconConfig('solfeggio');
};

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { maxVolume, reduceMotion } = useSettingsStore();
  const { isPlaying, isLoading, playbackError, volume, setVolume, timerRemaining, timerDuration } = useAudioStore();
  const { favoriteIds, addFavorite, removeFavorite, addRecentlyPlayed } = usePresetsStore();

  const [preset, setPreset] = useState<FrequencyPreset | null>(null);
  const [showTimerModal, setShowTimerModal] = useState(false);

  const colors = useThemeColors();

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
    await playerController.toggle();
  }, []);

  const handleSelectTimer = useCallback((value: number | null) => {
    playerController.startTimer(value);
    setShowTimerModal(false);
  }, []);

  const isFavorite = id ? favoriteIds.includes(id) : false;

  const handleFavoriteToggle = useCallback(() => {
    if (!id) return;
    if (favoriteIds.includes(id)) {
      removeFavorite(id);
    } else {
      addFavorite(id);
    }
  }, [id, favoriteIds, addFavorite, removeFavorite]);

  // Close only dismisses the modal — audio keeps playing, MiniPlayer takes over
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Format timer
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!preset) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Preset not found
        </Text>
      </View>
    );
  }

  const gradientColors = getGradientColors(preset);
  const presetIconConfig = getPlayerPresetIcon(preset);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gradient Background */}
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header with extra top padding */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.headerButton}
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isPlaying ? t('player.nowPlaying') : t('player.paused')}
          </Text>
          <TouchableOpacity
            onPress={handleFavoriteToggle}
            style={styles.headerButton}
            accessibilityLabel={isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#FF4B4B' : 'rgba(255,255,255,0.8)'}
            />
          </TouchableOpacity>
        </View>

        {/* Main Content - More spacious */}
        <View style={styles.content}>
          {/* Large Visual Card with Glow Effect */}
          <View style={styles.visualCardContainer}>
            {/* Outermost separator ring with dark background for contrast */}
            <View style={[styles.outerSeparator, { borderColor: preset.color + '60', backgroundColor: 'rgba(0,0,0,0.3)' }]} />
            {/* Outer glow ring */}
            <View style={[styles.glowRing, { backgroundColor: preset.color + '15' }]} />
            <View style={[styles.glowRingInner, { backgroundColor: preset.color + '25' }]} />

            {/* Main card */}
            <View style={[styles.visualCard, { borderColor: preset.color + '40' }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.1)']}
                style={styles.visualCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <WaveVisualizer
                  isPlaying={isPlaying}
                  color={preset.color}
                  intensity={volume}
                  tempoMs={getVisualTempoMs(preset)}
                  style={styles.visualizer}
                />
                <Icon
                  icon={presetIconConfig}
                  size={72}
                  color="rgba(255, 255, 255, 0.95)"
                />
              </LinearGradient>
            </View>
          </View>

          {/* Preset Info - More spacious */}
          <View style={styles.infoContainer}>
            <Text style={styles.presetName}>{t(preset.nameKey)}</Text>

            {/* Description - only show if different from name (not for solfeggio) */}
            {preset.type !== 'solfeggio' && (
              <Text style={styles.presetDescription}>
                {t(preset.descriptionKey)}
              </Text>
            )}

            {playbackError && (
              <Text style={styles.playbackError}>{t('player.playbackError')}</Text>
            )}
          </View>
        </View>

        {/* Bottom Controls - More spacious */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}>
          {/* Volume Slider */}
          <View style={styles.volumeContainer}>
            <Ionicons name="volume-low" size={22} color="rgba(255,255,255,0.7)" />
            <View style={styles.sliderWrapper}>
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={1}
                accessibilityLabel={t('accessibility.volumeSlider')}
              />
            </View>
            <Ionicons name="volume-high" size={22} color="rgba(255,255,255,0.7)" />
          </View>

          {/* Main Controls Row */}
          <View style={styles.mainControls}>
            {/* Timer Icon Button */}
            <TouchableOpacity
              onPress={() => setShowTimerModal(true)}
              style={styles.sideButton}
              accessibilityLabel={t('player.timer')}
            >
              <Ionicons
                name="timer-outline"
                size={28}
                color={timerDuration ? '#FFFFFF' : 'rgba(255,255,255,0.6)'}
              />
              {timerRemaining !== null && timerRemaining > 0 && (
                <Text style={styles.timerBadge}>{formatTime(timerRemaining)}</Text>
              )}
            </TouchableOpacity>

            {/* Play Button */}
            <TouchableOpacity
              onPress={handlePlayPause}
              disabled={isLoading}
              activeOpacity={reduceMotion ? 1 : 0.8}
              style={[styles.playButton, Shadows.large]}
              accessibilityLabel={isPlaying ? t('accessibility.pauseButton') : t('accessibility.playButton')}
              accessibilityState={{ busy: isLoading }}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#000000" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={44}
                  color="#000000"
                  style={isPlaying ? undefined : { marginLeft: 4 }}
                />
              )}
            </TouchableOpacity>

            {/* Placeholder for symmetry */}
            <View style={styles.sideButton} />
          </View>
        </View>
      </LinearGradient>

      {/* Timer Modal */}
      <Modal
        visible={showTimerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimerModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowTimerModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('player.timer')}</Text>
            {TIMER_OPTIONS.map((option) => {
              const isSelected = timerDuration === option.value;
              return (
                <TouchableOpacity
                  key={option.labelKey}
                  onPress={() => handleSelectTimer(option.value)}
                  style={[
                    styles.timerOption,
                    isSelected && styles.timerOptionSelected,
                  ]}
                >
                  <Text style={[
                    styles.timerOptionText,
                    isSelected && styles.timerOptionTextSelected,
                  ]}>
                    {t(option.labelKey)}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={24} color="#D99A4E" />
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
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.subhead,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  visualCardContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  outerSeparator: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 2.5,
  },
  glowRing: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  glowRingInner: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  visualCard: {
    width: SCREEN_WIDTH - Spacing.xl * 2,
    aspectRatio: 1,
    maxWidth: 260,
    maxHeight: 260,
    borderRadius: 130,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  visualCardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualizer: {
    position: 'absolute',
  },
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  presetName: {
    ...Typography.title1,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  presetDescription: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  playbackError: {
    ...Typography.subhead,
    color: '#E07A5F',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  controls: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
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
    color: '#FFFFFF',
    marginTop: 2,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    ...Typography.title2,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  timerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.xs,
  },
  timerOptionSelected: {
    backgroundColor: 'rgba(217, 154, 78, 0.15)',
  },
  timerOptionText: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
  },
  timerOptionTextSelected: {
    color: '#D99A4E',
    fontWeight: '600',
  },
});
