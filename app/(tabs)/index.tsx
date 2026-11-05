/**
 * Home Screen — intent-first entry ("what do you need?"), then history
 * and favourites. The technical taxonomy lives in Explore; duplicating it
 * here gave two paths to one destination.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, Radius } from '@/constants/theme';
import * as playerController from '@/lib/audio/playerController';
import * as haptics from '@/lib/haptics';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { CategoryHeader } from '@/components/ui/CategoryHeader';
import { PresetRow } from '@/components/ui/PresetRow';
import { PressableScale } from '@/components/ui/PressableScale';
import { intents, getSuggestedIntent } from '@/lib/intents';
import { useMiniPlayerInset } from '@/hooks/use-mini-player';
import { useIsPresetPlaying } from '@/hooks/use-is-preset-playing';
import { contentColumn } from '@/constants/layout';
import { getPresetById, FrequencyPreset } from '@/lib/frequencies';
import { ArtBackground } from '@/components/ui/ArtBackground';
import { Image } from 'expo-image';
import { intentArt, stateArt } from '@/lib/artAssets';
import { useArtwork } from '@/hooks/use-artwork';
import { lastNightMinutes } from '@/lib/lastNight';

// How many favourites the home screen previews before offering the rest.
const FAVORITES_PREVIEW = 4;

// Recently played is a "pick up where you left off" shortcut, not an archive.
// Three rows keep it above the fold; ten pushed favourites off the page and
// nobody scrolls that far to replay something they can also find in Explore.
const RECENT_PREVIEW = 3;

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const {
    hasHydrated,
    hasSeenHeadphoneWarning,
    setHasSeenHeadphoneWarning,
    hasSeenOnboarding,
  } = useSettingsStore();
  const { favoriteIds, recentlyPlayed, lastSession } = usePresetsStore();

  const colors = useThemeColors();
  const artwork = useArtwork();
  const miniPlayerInset = useMiniPlayerInset();
  const isPresetPlaying = useIsPresetPlaying();
  const [showAllFavorites, setShowAllFavorites] = useState(false);

  // Read once per mount, not on a ticking timer: this is a launcher, not a
  // clock, and re-rendering the list every minute would fight the user's
  // scroll for a change nobody is waiting to see.
  const { intent: suggestedIntent } = useMemo(
    () => getSuggestedIntent(new Date().getHours()),
    [],
  );
  const otherIntents = useMemo(
    () => intents.filter((i) => i.id !== suggestedIntent.id),
    [suggestedIntent.id],
  );

  // The first id in an intent's list is its recommended sound. Naming it on
  // the card answers "what would this actually play?" before the tap —
  // without playing it. A long-press audio preview (review #24) would have
  // to stop whatever is already running, since a preset and the mixer are
  // mutually exclusive by design, so a preview could silently end the sleep
  // sound it was meant to help you choose.
  const suggestedSound = useMemo(
    () => getPresetById(suggestedIntent.presetIds[0]),
    [suggestedIntent.presetIds],
  );

  const today = new Date();
  const lastNight = lastNightMinutes(lastSession, today);
  // The night art in both themes: the washed daylight versions looked like stock
  // photos on a white page.
  const cardShadow = artwork.scheme === 'light' ? styles.cardShadow : undefined;

  // AsyncStorage hydration must finish before the onboarding default is used.
  if (!hasHydrated) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.hydrationLoading}>
          <ActivityIndicator size="small" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  // Route guard, not a post-render push: rendering Home for a frame and then
  // navigating away read as a flash, and left onboarding with no history to
  // pop back into if it were ever reached directly.
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  const handlePresetPress = (presetId: string) => {
    const preset = getPresetById(presetId);
    if (preset?.type === 'binaural' && !hasSeenHeadphoneWarning) {
      Alert.alert(t('home.headphoneWarning'), t('home.headphoneWarningDesc'), [
        {
          text: t('common.ok'),
          onPress: () => {
            setHasSeenHeadphoneWarning(true);
            router.push(`/player/${presetId}`);
          },
        },
      ]);
    } else {
      router.push(`/player/${presetId}`);
    }
  };

  // The suggested card's button: same one-tap session as the Intent screen's
  // (its lead sound, its timer), started straight from Home.
  const handleStartSession = () => {
    const preset = suggestedSound;
    if (!preset) return;
    const start = () => {
      haptics.commit();
      playerController.loadPreset(preset);
      playerController.startTimer(suggestedIntent.recommendedMinutes);
      playerController.play();
      router.push(`/player/${preset.id}`);
    };
    if (preset.type === 'binaural' && !hasSeenHeadphoneWarning) {
      Alert.alert(t('home.headphoneWarning'), t('home.headphoneWarningDesc'), [
        {
          text: t('common.ok'),
          onPress: () => {
            setHasSeenHeadphoneWarning(true);
            start();
          },
        },
      ]);
    } else {
      start();
    }
  };

  const favoritePresets = favoriteIds
    .map((id) => getPresetById(id))
    .filter((p): p is FrequencyPreset => p !== undefined);

  const recentPresets = recentlyPlayed
    .map((r) => getPresetById(r.presetId))
    .filter((p): p is FrequencyPreset => p !== undefined)
    .slice(0, RECENT_PREVIEW);

  const visibleFavorites = showAllFavorites
    ? favoritePresets
    : favoritePresets.slice(0, FAVORITES_PREVIEW);

  // The note only earns its place when a binaural preset is actually on the
  // page. Parked at the foot of every visit it was a permanent warning about
  // nothing in particular, which is the fastest way to teach someone not to
  // read warnings — and the first binaural play already raises a dialog.
  const showsBinaural = [...recentPresets, ...visibleFavorites].some(
    (preset) => preset.type === 'binaural',
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          contentColumn,
          { paddingBottom: miniPlayerInset + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intent first: the question, one suggested answer given room and a
            real start button, then the other three as tiles. The frequency
            behind each is secondary information, not the headline. */}
        <View style={styles.section}>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {today.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <Text
            style={[styles.intentsTitle, { color: colors.text }]}
            accessibilityRole="header"
          >
            {t('home.intentsTitle')}
          </Text>
          {/* A fact, not a score: no streak, no judgement of the number. */}
          {lastNight !== null && (
            <Text style={[styles.lastNight, { color: colors.textSecondary }]}>
              {t('home.lastNight', { minutes: lastNight })}
            </Text>
          )}

          {/* Picture and words apart: a scrim for white text over the photo was what
              turned every image to fog, and hid the Focus one altogether. */}
          <View
            style={[
              styles.leadCard,
              cardShadow,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Image
              source={intentArt(suggestedIntent.id).dark}
              style={styles.leadImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View style={styles.leadBody}>
              <View style={styles.leadTop}>
                <TouchableOpacity
                  onPress={() => router.push(`/intent/${suggestedIntent.id}`)}
                  style={styles.leadLink}
                  accessibilityRole="link"
                  accessibilityLabel={`${t(suggestedIntent.nameKey)}: ${t('home.allSounds')}`}
                >
                  <Text style={[styles.leadLinkText, { color: colors.text }]}>
                    {t('home.allSounds')}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.leadName, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {t(suggestedIntent.nameKey)}
              </Text>
              <Text style={[styles.leadMeta, { color: colors.textSecondary }]} numberOfLines={2}>
                {t(suggestedIntent.descKey)}
              </Text>
              <PressableScale
                onPress={handleStartSession}
                style={[styles.leadButton, { backgroundColor: colors.text }]}
                accessibilityRole="button"
                accessibilityLabel={t('intents.startSession', {
                  minutes: suggestedIntent.recommendedMinutes,
                })}
              >
                <Ionicons name="play" size={18} color={colors.background} />
                <Text style={[styles.leadButtonText, { color: colors.background }]}>
                  {t('intents.startSession', { minutes: suggestedIntent.recommendedMinutes })}
                </Text>
              </PressableScale>
            </View>
          </View>

          <View style={styles.tiles}>
            {otherIntents.map((intent) => (
              <PressableScale
                key={intent.id}
                onPress={() => router.push(`/intent/${intent.id}`)}
                scaleTo={0.97}
                style={styles.tilePress}
                accessibilityRole="button"
                accessibilityLabel={`${t(intent.nameKey)}. ${t(intent.descKey)}`}
              >
                <Image
                  source={intentArt(intent.id).dark}
                  style={styles.tileImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <Text
                  style={[styles.tileName, { color: colors.text }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {t(intent.nameKey)}
                </Text>
                <Text style={[styles.tileMeta, { color: colors.textSecondary }]}>
                  {intent.recommendedMinutes}
                  {t('home.recommendedMinutesSuffix')}
                </Text>
              </PressableScale>
            ))}
          </View>

          {recentPresets.length > 0 && (
            <View style={styles.recentSection}>
              <CategoryHeader title={t('home.recentlyPlayed')} />
              {recentPresets.map((item) => (
                <PresetRow
                  key={item.id}
                  preset={item}
                  onPress={() => handlePresetPress(item.id)}
                  isFavorite={favoriteIds.includes(item.id)}
                  isPlaying={isPresetPlaying(item.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Favorites Section — teaches the heart affordance when empty */}
        <View style={styles.section}>
          <CategoryHeader
            title={t('home.favorites')}
            iconName="heart"
            onSeeAll={
              favoritePresets.length > FAVORITES_PREVIEW
                ? () => setShowAllFavorites((v) => !v)
                : undefined
            }
            seeAllText={
              showAllFavorites ? t('common.showLess') : t('common.seeAll')
            }
          />
          {favoritePresets.length > 0 ? (
            <View>
              {visibleFavorites.map((preset) => (
                <PresetRow
                  key={preset.id}
                  preset={preset}
                  onPress={() => handlePresetPress(preset.id)}
                  isFavorite={true}
                  isPlaying={isPresetPlaying(preset.id)}
                />
              ))}
            </View>
          ) : (
            <ArtBackground
              source={artwork.source(stateArt('favorites-empty'))}
              style={styles.emptyState}
              variant="card"
            >
              <View
                style={[
                  styles.emptyStateIcon,
                  { backgroundColor: artwork.foreground.badge },
                ]}
              >
                <Ionicons
                  name="heart-outline"
                  size={20}
                  color={artwork.foreground.primary}
                />
              </View>
              <Text
                style={[
                  styles.emptyStateText,
                  { color: artwork.foreground.secondary },
                ]}
              >
                {t('home.favoritesEmpty')}
              </Text>
            </ArtBackground>
          )}
        </View>

        {showsBinaural && (
          <Text style={[styles.headphoneNote, { color: colors.warning }]}>
            {t('home.headphoneNote')}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hydrationLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  date: {
    ...Typography.footnote,
    marginBottom: Spacing.xs,
  },
  // One line, not two: the page's weight belongs to the picture below it.
  intentsTitle: {
    ...Typography.largeTitle,
    fontSize: 30,
    lineHeight: 36,
    marginBottom: Spacing.lg,
  },
  // A soft lift on the light page; on the dark one a shadow has nothing to fall on.
  cardShadow: Platform.select({
    web: { boxShadow: '0px 14px 30px rgba(21, 19, 26, 0.22)' },
    default: {
      elevation: 8,
      shadowColor: '#15131A',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.22,
      shadowRadius: 30,
    },
  }) as ViewStyle,
  lastNight: {
    ...Typography.footnote,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  leadCard: {
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  leadImage: {
    height: 230,
    width: '100%',
  },
  leadBody: {
    padding: Spacing.md + 4,
    paddingTop: Spacing.xs,
  },
  leadTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  leadLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
    paddingLeft: Spacing.sm,
  },
  leadLinkText: {
    ...Typography.footnote,
  },
  leadName: {
    fontFamily: Typography.largeTitle.fontFamily,
    fontSize: 44,
    lineHeight: 50,
  },
  leadMeta: {
    ...Typography.footnote,
    marginTop: Spacing.xs,
  },
  leadButton: {
    marginTop: Spacing.md,
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  leadButtonText: {
    ...Typography.headline,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.sm + 4,
    marginTop: Spacing.lg,
  },
  tilePress: {
    flex: 1,
  },
  tileImage: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: 20,
    marginBottom: Spacing.sm,
  },
  tileName: {
    ...Typography.headline,
  },
  tileMeta: {
    ...Typography.caption,
  },
  recentSection: {
    marginTop: Spacing.xl,
  },
  emptyState: {
    minHeight: 142,
    borderRadius: Radius.card,
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  emptyStateIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    ...Typography.body,
    lineHeight: 21,
    // The artwork sits on the right half; copy stops before it.
    maxWidth: '56%',
  },
  headphoneNote: {
    ...Typography.footnote,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
});
