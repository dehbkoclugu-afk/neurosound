/**
 * THESIS: A sound opens as a place, not a dial; the Player refuses the giant
 * instrument control that used to crowd every state into one viewport.
 * OWN-WORLD: Cinematic preset artwork, neutral near-black graphite, one
 * ink-blue action, solid tonal panels, and Nunito with mono measurements.
 * STORY: Recognize the sound, control playback, understand it, then adjust or
 * layer it without losing place.
 * FIRST VIEWPORT: Artwork owns the upper half; transport bridges into one
 * continuous identity block, followed by error, volume, and two actions.
 * FORM: Immersive scroll, approved comp A; existing preset art is the source.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors, useCategoryColors } from '@/hooks/use-theme-colors';
import {
  Spacing,
  Typography,
  FontFamily,
  withAlpha,
  BADGE_ALPHA,
  Radius,
  ControlSize,
} from '@/constants/theme';
import { contentColumn } from '@/constants/layout';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { Slider } from '@/components/ui/Slider';
import { TimerModal, formatTimerValue } from '@/components/ui/TimerModal';
import { TransportButton } from '@/components/ui/TransportButton';
import { ArtBackground } from '@/components/ui/ArtBackground';
import { useToastStore } from '@/stores/toastStore';
import { presetArt } from '@/lib/artAssets';
import { useArtwork } from '@/hooks/use-artwork';
import * as haptics from '@/lib/haptics';
import { getPresetById, FrequencyPreset } from '@/lib/frequencies';
import { isLockedPreset } from '@/lib/premium';
import { useIsPremium, usePremiumReady } from '@/stores/premiumStore';
import * as playerController from '@/lib/audio/playerController';
import { upper } from '@/lib/upper';

/**
 * Presets a phone speaker cannot deliver: every binaural beat (the effect only
 * exists when each ear gets its own channel) and any tone low enough that a
 * built-in speaker simply does not move air at it. 200 Hz is the generous end
 * of where small speakers give up, and it is also the binaural carrier.
 */
const SPEAKER_FLOOR_HZ = 200;

function needsHeadphones(preset: FrequencyPreset): boolean {
  if (preset.type === 'binaural') return true;
  return preset.type === 'solfeggio' && (preset.frequency ?? Infinity) < SPEAKER_FLOOR_HZ;
}

const getFrequencyParts = (preset: FrequencyPreset): number[] | null => {
  if (
    preset.type === 'binaural' &&
    preset.baseFrequency &&
    preset.beatFrequency
  ) {
    return [preset.baseFrequency, preset.beatFrequency];
  }
  if (preset.type === 'solfeggio' && preset.frequency) {
    return [preset.frequency];
  }
  return null;
};

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const categoryColors = useCategoryColors();
  const artwork = useArtwork();
  const { maxVolume, reduceMotion } = useSettingsStore();
  const {
    isPlaying,
    isLoading,
    playbackError,
    volume,
    setVolume,
    timerRemaining,
    timerDuration,
  } = useAudioStore();
  const { favoriteIds, addFavorite, removeFavorite, addRecentlyPlayed } =
    usePresetsStore();
  const isPremium = useIsPremium();
  const premiumReady = usePremiumReady();

  const [preset, setPreset] = useState<FrequencyPreset | null>(null);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const showToast = useToastStore((s) => s.show);
  const heartScale = useRef(new Animated.Value(1)).current;
  const heroScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Wait for the cached entitlement, or a paying user flashes the paywall.
    if (!id || !premiumReady) return;
    // Every route to a sound ends here, so this is the one paywall gate.
    if (isLockedPreset(id) && !isPremium) {
      router.replace('/paywall');
      return;
    }
    const loadedPreset = getPresetById(id);
    if (loadedPreset) {
      setPreset(loadedPreset);
      playerController.loadPreset(loadedPreset);
      addRecentlyPlayed(id);
    }
  }, [id, addRecentlyPlayed, premiumReady, isPremium, router]);

  useEffect(() => {
    playerController.syncVolume();
  }, [volume, maxVolume]);

  useEffect(() => {
    if (reduceMotion) {
      heroScale.setValue(1);
      return;
    }
    Animated.timing(heroScale, {
      toValue: isPlaying ? 1.025 : 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isPlaying, reduceMotion, heroScale]);

  const handlePlayPause = useCallback(async () => {
    haptics.commit();
    await playerController.toggle();
  }, []);

  const handleAddToMixer = useCallback(async () => {
    if (!preset) return;
    const added = await playerController.mixerAddChannel(preset);
    if (!added) {
      Alert.alert(t('mixer.maxChannels'), t('mixer.maxChannelsDesc'));
      return;
    }
    haptics.save();
    showToast(t('mixer.addedToMixer'), 'success');
  }, [preset, t, showToast]);

  const isFavorite = id ? favoriteIds.includes(id) : false;
  const timerActive =
    timerDuration !== null && timerRemaining !== null && timerRemaining > 0;

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
      Animated.timing(heartScale, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [id, favoriteIds, addFavorite, removeFavorite, reduceMotion, heartScale]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  if (!preset) {
    // Still waiting on the entitlement (or about to redirect to the paywall):
    // a blank frame, not a flash of "Error" for a perfectly valid sound.
    const missing = premiumReady && !(id && getPresetById(id));
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {missing && (
          <Text style={[styles.missingText, { color: colors.text }]}>
            {t('common.error')}
          </Text>
        )}
      </View>
    );
  }

  const frequencyParts = getFrequencyParts(preset);
  const heroHeight = Math.max(360, Math.min(500, height * 0.54));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      >
        <View style={[styles.heroShell, { height: heroHeight + 42 }]}>
          <Animated.View
            style={[
              styles.heroClip,
              { backgroundColor: colors.backgroundSecondary },
              { height: heroHeight, transform: [{ scale: heroScale }] },
            ]}
          >
            <ArtBackground
              source={artwork.source(presetArt(preset.id))}
              style={styles.hero}
              variant="hero"
            >
              <View
                style={[
                  styles.heroHeader,
                  { paddingTop: insets.top + Spacing.sm },
                ]}
              >
                <TouchableOpacity
                  onPress={handleClose}
                  style={[
                    styles.heroButton,
                    { backgroundColor: artwork.foreground.badge },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.back')}
                >
                  <Ionicons
                    name="chevron-down"
                    size={26}
                    color={artwork.foreground.primary}
                  />
                </TouchableOpacity>

                <Text
                  style={[
                    styles.heroStatus,
                    { color: artwork.foreground.primary },
                  ]}
                  accessibilityLiveRegion="polite"
                >
                  {isPlaying ? t('player.nowPlaying') : t('player.paused')}
                </Text>

                <TouchableOpacity
                  onPress={handleFavoriteToggle}
                  style={[
                    styles.heroButton,
                    { backgroundColor: artwork.foreground.badge },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isFavorite
                      ? t('common.removeFromFavorites')
                      : t('common.addToFavorites')
                  }
                >
                  <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                    <Ionicons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={23}
                      color={artwork.foreground.primary}
                    />
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </ArtBackground>
          </Animated.View>

          {/* The sleep timer is the reason half the users open this screen;
              it sat below the fold under volume. It now flanks play, with
              add-to-mixer on the other side, all within thumb reach. */}
          <View style={styles.heroTransport}>
            <TouchableOpacity
              onPress={() => setShowTimerModal(true)}
              style={[
                styles.sideControl,
                {
                  backgroundColor: timerActive
                    ? withAlpha(colors.accent, BADGE_ALPHA)
                    : colors.backgroundSecondary,
                  borderColor: timerActive ? colors.accent : colors.cardBorder,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                timerActive
                  ? `${t('player.timer')}, ${formatTimerValue(timerRemaining!)}`
                  : t('player.timer')
              }
            >
              <Ionicons
                name="timer-outline"
                size={24}
                color={timerActive ? colors.accent : colors.text}
              />
            </TouchableOpacity>
            <TransportButton
              playing={isPlaying}
              onPress={handlePlayPause}
              loading={isLoading}
              size={84}
              accessibilityLabel={
                isPlaying
                  ? t('accessibility.pauseButton')
                  : t('accessibility.playButton')
              }
            />
            <TouchableOpacity
              onPress={handleAddToMixer}
              style={[
                styles.sideControl,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.cardBorder,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('mixer.addToMixer')}
            >
              <Ionicons name="layers-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.body, contentColumn]}>
          <View style={styles.identityBlock}>
            <Text
              style={[styles.presetName, { color: colors.text }]}
              accessibilityRole="header"
            >
              {t(preset.nameKey)}
            </Text>

            <View style={styles.metaRow}>
              <View
                style={[
                  styles.categoryTag,
                  {
                    backgroundColor: withAlpha(
                      categoryColors[preset.type],
                      BADGE_ALPHA,
                    ),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryTagText,
                    { color: categoryColors[preset.type] },
                  ]}
                >
                  {upper(t(`explore.categories.${preset.type}`))}
                </Text>
              </View>

              {frequencyParts && (
                <Text
                  style={[
                    styles.frequencyLine,
                    { color: colors.textSecondary },
                  ]}
                >
                  {frequencyParts.map((value, index) => (
                    <Text key={`${value}-${index}`}>
                      {index > 0 ? ' · ' : ''}
                      <Text style={styles.frequencyNumeral}>{value}</Text> Hz
                    </Text>
                  ))}
                </Text>
              )}
            </View>

            {timerActive && (
              <TouchableOpacity
                onPress={() => setShowTimerModal(true)}
                style={styles.timerReadout}
                accessibilityRole="button"
                accessibilityLabel={`${t('player.timer')}, ${formatTimerValue(timerRemaining!)}`}
              >
                <Ionicons name="moon-outline" size={14} color={colors.accent} />
                <Text style={[styles.timerReadoutText, { color: colors.accent }]}>
                  {formatTimerValue(timerRemaining!)}
                </Text>
              </TouchableOpacity>
            )}

            <Text
              style={[
                styles.description,
                { color: colors.textSecondary },
                preset.type === 'solfeggio' && styles.disclaimer,
              ]}
            >
              {t(preset.descriptionKey)}
            </Text>

            {/* The one preset failure that looks identical to a bug: a phone
                speaker rolls off long before 40 Hz, and a binaural pair needs
                two ears fed separately. Both play perfectly and are heard as
                nothing, so the app gets blamed for "this sound doesn't work".
                One line, not a mechanism paragraph stacked on a warning: the
                how-it-works copy already lives in Explore. */}
            {needsHeadphones(preset) && (
              <View style={styles.mechanismRow}>
                <Ionicons name="headset-outline" size={16} color={colors.warning} />
                <Text style={[styles.mechanism, { color: colors.warning }]}>
                  {t('player.headphonesRequired')}
                </Text>
              </View>
            )}
          </View>

          {playbackError && (
            <View
              style={[
                styles.errorPanel,
                {
                  backgroundColor: withAlpha(colors.error, 0.08),
                  borderColor: withAlpha(colors.error, 0.34),
                },
              ]}
              accessibilityLiveRegion="assertive"
            >
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={colors.error}
              />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {t('player.playbackError')}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.volumePanel,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={1}
              cap={maxVolume}
              label={t('mixer.volume')}
              accessibilityLabel={t('accessibility.volumeSlider')}
            />

            {maxVolume < 1 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/settings')}
                style={styles.volumeCap}
                accessibilityRole="button"
                accessibilityLabel={`${t('player.volumeCapped', {
                  percent: Math.round(maxVolume * 100),
                })}. ${t('common.settings')}`}
              >
                <Text
                  style={[
                    styles.volumeCapText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t('player.volumeCapped', {
                    percent: Math.round(maxVolume * 100),
                  })}
                </Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </ScrollView>

      <TimerModal
        visible={showTimerModal}
        onClose={() => setShowTimerModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroShell: {
    width: '100%',
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  heroClip: {
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: Radius.sheet,
    borderBottomRightRadius: Radius.sheet,
  },
  hero: {
    flex: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  heroButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatus: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
  },
  heroTransport: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  body: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  identityBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  presetName: {
    ...Typography.largeTitle,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  categoryTag: {
    borderRadius: Radius.tag,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  categoryTagText: {
    ...Typography.label,
  },
  frequencyLine: {
    ...Typography.body,
  },
  frequencyNumeral: {
    ...Typography.numeral,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 520,
  },
  disclaimer: {
    ...Typography.footnote,
    lineHeight: 19,
  },
  mechanismRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  mechanism: {
    ...Typography.footnote,
    flexShrink: 1,
    maxWidth: 480,
  },
  errorPanel: {
    minHeight: ControlSize.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  volumePanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.md,
  },
  volumeCap: {
    minHeight: 36,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  volumeCapText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  sideControl: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  timerReadout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 36,
    paddingHorizontal: Spacing.sm,
  },
  timerReadoutText: {
    ...Typography.headline,
    ...Typography.numeral,
  },
  missingText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
  },
});
