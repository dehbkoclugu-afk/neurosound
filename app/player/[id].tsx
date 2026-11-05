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
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  Spacing,
  Typography,
  FontFamily,
  withAlpha,
  Radius,
  ControlSize,
} from '@/constants/theme';
import { contentColumn } from '@/constants/layout';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { Slider } from '@/components/ui/Slider';
import { TimerModal, formatTimerValue, TIMER_OPTIONS } from '@/components/ui/TimerModal';
import { TransportButton } from '@/components/ui/TransportButton';
import { EqualizerBars } from '@/components/ui/EqualizerBars';
import { BedMode } from '@/components/ui/BedMode';
import { RollingCountdown } from '@/components/ui/RollingCountdown';
import { toneSignature } from '@/lib/toneSignatures';
import { formatPercent } from '@/lib/upper';
import { ArtBackground } from '@/components/ui/ArtBackground';
import { useToastStore } from '@/stores/toastStore';
import { presetArt, presetThumb } from '@/lib/artAssets';
import { useArtwork } from '@/hooks/use-artwork';
import * as haptics from '@/lib/haptics';
import { getPresetById, FrequencyPreset } from '@/lib/frequencies';
import { isLockedPreset } from '@/lib/premium';
import { useIsPremium, usePremiumReady } from '@/stores/premiumStore';
import * as playerController from '@/lib/audio/playerController';

/**
 * Presets a phone speaker cannot deliver: every binaural beat (the effect only
 * exists when each ear gets its own channel) and any tone low enough that a
 * built-in speaker simply does not move air at it. 200 Hz is the generous end
 * of where small speakers give up, and it is also the binaural carrier.
 */
const SPEAKER_FLOOR_HZ = 200;

const SIGNATURE_OPACITY = 0.26;

function needsHeadphones(preset: FrequencyPreset): boolean {
  if (preset.type === 'binaural') return true;
  return preset.type === 'solfeggio' && (preset.frequency ?? Infinity) < SPEAKER_FLOOR_HZ;
}

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { t } = useTranslation();
  const colors = useThemeColors();
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
  const [showBedMode, setShowBedMode] = useState(false);
  const showToast = useToastStore((s) => s.show);
  const heartScale = useRef(new Animated.Value(1)).current;
  const heroScale = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const signatureOpacity = useRef(new Animated.Value(SIGNATURE_OPACITY)).current;

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

  // The tone's figure breathes while it plays: twelve seconds a cycle and a small
  // swing in brightness, so it can never read as a flicker.
  useEffect(() => {
    signatureOpacity.stopAnimation();
    if (!isPlaying || reduceMotion) {
      signatureOpacity.setValue(SIGNATURE_OPACITY);
      return;
    }
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(signatureOpacity, {
          toValue: SIGNATURE_OPACITY + 0.14,
          duration: 6000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(signatureOpacity, {
          toValue: SIGNATURE_OPACITY,
          duration: 6000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    breathe.start();
    return () => breathe.stop();
  }, [isPlaying, reduceMotion, signatureOpacity]);

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

  const heroHeight = Math.max(360, Math.min(500, height * 0.54));

  // One layout for every sound: its name is the headline, the measurement sits
  // under it. Binaural shows the beat, since "200 Hz" would be the carrier.
  const heroName = t(preset.nameKey).split(' (')[0];
  const heroMeta =
    preset.type === 'solfeggio' && preset.frequency
      ? `${preset.frequency} Hz · ${t('explore.categories.solfeggio')}`
      : preset.type === 'binaural'
        ? `${preset.beatFrequency} Hz · ${t('explore.categories.binaural')}`
        : t(preset.descriptionKey);
  const timerLabel = TIMER_OPTIONS.find((o) => o.value === timerDuration)?.labelKey;
  const signature = toneSignature(preset.id);
  // The art slides at a third of the scroll speed inside its clipped frame.
  const heroParallax = reduceMotion
    ? undefined
    : scrollY.interpolate({
        inputRange: [0, heroHeight],
        outputRange: [0, heroHeight / 3],
        extrapolate: 'clamp',
      });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: Platform.OS !== 'web',
        })}
      >
        {/* Clipped, so the slower-moving art can never slide behind the page. */}
        <View style={{ height: heroHeight, overflow: 'hidden' }}>
        <Animated.View
          style={{
            height: heroHeight,
            transform: [{ translateY: heroParallax ?? 0 }, { scale: heroScale }],
          }}
        >
          <ArtBackground
            source={artwork.source(presetArt(preset.id))}
            placeholder={artwork.source(presetThumb(preset.id))}
            style={styles.hero}
            variant="hero"
          >
            {signature && (
              <View
                pointerEvents="none"
                style={styles.signatureFrame}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Animated.View style={{ opacity: signatureOpacity }}>
                  <Image source={signature} style={styles.signature} />
                </Animated.View>
              </View>
            )}
            <View style={[styles.heroHeader, { paddingTop: insets.top + Spacing.sm }]}>
              <TouchableOpacity
                onPress={handleClose}
                style={[styles.heroButton, { backgroundColor: artwork.foreground.badge }]}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
              >
                <Ionicons name="chevron-down" size={26} color={artwork.foreground.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFavoriteToggle}
                style={[styles.heroButton, { backgroundColor: artwork.foreground.badge }]}
                accessibilityRole="button"
                accessibilityLabel={
                  isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')
                }
              >
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={23}
                    color={isFavorite ? colors.accent : artwork.foreground.primary}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </ArtBackground>
        </Animated.View>
        {/* Stays put while the art moves: the scrim inside it slides away with
            the parallax, and the clip would otherwise show as a hard edge. */}
        {artwork.scheme !== 'light' && (
          <LinearGradient
            pointerEvents="none"
            colors={[withAlpha(colors.background, 0), colors.background]}
            style={styles.heroFade}
          />
        )}
        </View>

        {/* At night the title overlaps the hero's fade into the page; by day
            the hero keeps a crisp edge, so the title starts below it. */}
        <View
          style={[
            styles.body,
            contentColumn,
            { marginTop: artwork.scheme === 'light' ? Spacing.lg : -150 },
          ]}
        >
          <View style={styles.titleRow}>
            <Text
              // Long names ("Love Frequency", "Cosmic Consciousness") wrap at a
              // smaller size; shrink-to-fit made them tiny or cut them off.
              style={[styles.bigTitle, heroName.length > 8 && styles.bigTitleLong, { color: colors.text }]}
              numberOfLines={2}
              accessibilityRole="header"
              accessibilityLabel={t(preset.nameKey)}
            >
              {heroName}
            </Text>
          </View>
          <View style={styles.metaRow}>
            {isPlaying && !isLoading && <EqualizerBars color={colors.accent} size={14} />}
            <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={2}>
              {heroMeta}
            </Text>
          </View>
          {/* Above the fold: this is the sentence that keeps a tone honest, and
              below the volume slider nobody reached it. */}
          {preset.type !== 'noise' && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {t(preset.descriptionKey)}
            </Text>
          )}

          {/* Play, with the sleep timer's state beside it in words: the
              countdown when one is set, "won't stop" when not. */}
          <View style={styles.ctrl}>
            <View
              style={[
                styles.ring,
                { borderColor: timerActive ? colors.accent : colors.cardBorder },
              ]}
            >
              <TransportButton
                playing={isPlaying}
                onPress={handlePlayPause}
                loading={isLoading}
                size={66}
                accessibilityLabel={
                  isPlaying ? t('accessibility.pauseButton') : t('accessibility.playButton')
                }
              />
            </View>
            <View style={styles.ctrlText} accessibilityLiveRegion="polite">
              {timerActive ? (
                <>
                  <RollingCountdown
                    value={formatTimerValue(timerRemaining!)}
                    style={[styles.countdown, { color: colors.text }]}
                  />
                  <Text style={[styles.ctrlHint, { color: colors.textSecondary }]}>
                    {t('player.untilFade')}
                  </Text>
                </>
              ) : (
                <Text style={[styles.ctrlHint, { color: colors.textSecondary }]}>
                  {t('player.noTimerHint')}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowTimerModal(true)}
            style={[
              styles.timerButton,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder },
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="timer-outline" size={20} color={colors.accent} />
            <Text style={[styles.timerButtonText, { color: colors.text }]}>
              {timerActive && timerLabel
                ? `${t('player.timer')}: ${t(timerLabel)}`
                : t('player.setTimer')}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAddToMixer}
            style={styles.addLink}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={20} color={colors.textSecondary} />
            <Text style={[styles.addLinkText, { color: colors.textSecondary }]}>
              {t('mixer.addToMixer')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowBedMode(true)}
            style={styles.addLink}
            accessibilityRole="button"
          >
            <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.addLinkText, { color: colors.textSecondary }]}>
              {t('player.bedMode')}
            </Text>
          </TouchableOpacity>

          {/* A phone speaker cannot deliver a binaural pair or a very low
              tone: both play and are heard as nothing. Shown only for those. */}
          {needsHeadphones(preset) && (
            <View style={styles.note}>
              <Ionicons name="headset-outline" size={18} color={colors.warning} />
              <Text style={[styles.noteText, { color: colors.warning }]}>
                {preset.type === 'binaural'
                  ? t('player.headphonesBinaural')
                  : t('player.headphonesRequired')}
              </Text>
            </View>
          )}

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
              <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {t('player.playbackError')}
              </Text>
            </View>
          )}

          <View style={[styles.volumePanel, { borderTopColor: colors.cardBorder }]}>
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={1}
              // No `cap`: the safety limit scales the whole range (volume ×
              // maxVolume), it does not clip the top of it.
              label={t('mixer.volume')}
              accessibilityLabel={t('accessibility.volumeSlider')}
            />
            {maxVolume < 1 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/settings')}
                style={styles.volumeCap}
                accessibilityRole="button"
              >
                <Text style={[styles.volumeCapText, { color: colors.textSecondary }]}>
                  {t('player.volumeCapped', { percent: formatPercent(maxVolume) })}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.ScrollView>

      <TimerModal visible={showTimerModal} onClose={() => setShowTimerModal(false)} />
      <BedMode visible={showBedMode} onClose={() => setShowBedMode(false)} />
      {/* The status bar sits on the artwork's darkened top in every theme. */}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    flex: 1,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  signatureFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    // Above centre: at night the title covers the hero's lower part.
    paddingTop: '16%',
  },
  signature: {
    width: 220,
    height: 220,
    tintColor: '#FFFFFF',
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
  body: {
    paddingHorizontal: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  bigTitle: {
    ...Typography.display,
    flexShrink: 1,
  },
  bigTitleLong: {
    fontSize: 44,
    lineHeight: 50,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  meta: {
    ...Typography.body,
    flexShrink: 1,
  },
  ctrl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md + 2,
    marginTop: Spacing.lg,
  },
  ring: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlText: {
    flex: 1,
  },
  countdown: {
    ...Typography.numeral,
    fontSize: 28,
    lineHeight: 34,
  },
  ctrlHint: {
    ...Typography.footnote,
  },
  timerButton: {
    marginTop: Spacing.lg,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
  },
  timerButtonText: {
    ...Typography.body,
    flex: 1,
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    marginTop: Spacing.xs,
  },
  addLinkText: {
    ...Typography.body,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  noteText: {
    ...Typography.footnote,
    flex: 1,
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
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  volumePanel: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  volumeCap: {
    minHeight: 40,
    justifyContent: 'center',
    paddingTop: Spacing.xs,
  },
  volumeCapText: {
    ...Typography.caption,
  },
  description: {
    ...Typography.footnote,
    marginTop: Spacing.xs,
  },
  missingText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
  },
});
