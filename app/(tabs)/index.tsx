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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, FontFamily, Radius } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { CategoryHeader } from '@/components/ui/CategoryHeader';
import { PresetRow } from '@/components/ui/PresetRow';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { intents, getSuggestedIntent } from '@/lib/intents';
import { useMiniPlayerInset } from '@/hooks/use-mini-player';
import { useIsPresetPlaying } from '@/hooks/use-is-preset-playing';
import { contentColumn } from '@/constants/layout';
import { getPresetById, FrequencyPreset } from '@/lib/frequencies';
import { ArtBackground } from '@/components/ui/ArtBackground';
import { intentArt, stateArt } from '@/lib/artAssets';
import { useArtwork } from '@/hooks/use-artwork';
import { LanguageSheet } from '@/components/ui/LanguageSheet';
import { languageFlag } from '@/locales';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { nextExplicitTheme } from '@/lib/themeMode';

// How many favourites the home screen previews before offering the rest.
const FAVORITES_PREVIEW = 4;

// Recently played is a "pick up where you left off" shortcut, not an archive.
// Three rows keep it above the fold; ten pushed favourites off the page and
// nobody scrolls that far to replay something they can also find in Explore.
const RECENT_PREVIEW = 3;

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    hasHydrated,
    hasSeenHeadphoneWarning,
    setHasSeenHeadphoneWarning,
    hasSeenOnboarding,
    language,
    theme,
    setTheme,
  } = useSettingsStore();
  const { favoriteIds, recentlyPlayed } = usePresetsStore();

  const colors = useThemeColors();
  const artwork = useArtwork();
  const colorScheme = useColorScheme();
  const miniPlayerInset = useMiniPlayerInset();
  const isPresetPlaying = useIsPresetPlaying();
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);

  // Read once per mount, not on a ticking timer: this is a launcher, not a
  // clock, and re-rendering the list every minute would fight the user's
  // scroll for a change nobody is waiting to see.
  const { intent: suggestedIntent, band } = useMemo(
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

  // AsyncStorage hydration must finish before the onboarding default is used.
  if (!hasHydrated) {
    return (
      <SafeAreaView
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
    <SafeAreaView
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
        {/* Intent Section — primary entry, led by cinematic local artwork. */}
        <View style={styles.section}>
          <View style={styles.homeHeader}>
            <Text
              style={[styles.intentsTitle, { color: colors.text }]}
              accessibilityRole="header"
            >
              {t('home.intentsTitle')}
            </Text>
            <View style={styles.quickControls}>
              <TouchableOpacity
                onPress={() => setShowLanguageSheet(true)}
                style={[styles.quickControl, { backgroundColor: colors.backgroundSecondary }]}
                accessibilityRole="button"
                accessibilityLabel={t('settings.language')}
              >
                <Text style={styles.languageFlag}>{languageFlag(language)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTheme(nextExplicitTheme(theme, colorScheme))}
                style={[styles.quickControl, { backgroundColor: colors.backgroundSecondary }]}
                accessibilityRole="button"
                accessibilityLabel={t('settings.theme')}
              >
                <Ionicons
                  name={colorScheme === 'dark' ? 'moon' : 'sunny'}
                  size={19}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
          {/* The clock's answer, given room. Four identical cards asked the
              question and then refused to help answer it; at 2am the app can
              reasonably lead with Sleep. The other three stay one tap away
              below, so the guess is a suggestion, not a decision. */}
          <PressableScale
            onPress={() => router.push(`/intent/${suggestedIntent.id}`)}
            scaleTo={0.99}
            pressedOpacity={0.85}
            style={styles.intentCard}
            accessibilityRole="button"
            accessibilityLabel={[
              t(`home.suggestedFor.${band}`),
              t(suggestedIntent.nameKey),
              t(suggestedIntent.descKey),
              t('home.recommendedMinutes', {
                minutes: suggestedIntent.recommendedMinutes,
              }),
              suggestedSound ? t(suggestedSound.nameKey) : null,
            ]
              .filter(Boolean)
              .join('. ')}
          >
            <ArtBackground
              source={artwork.source(intentArt(suggestedIntent.id))}
              style={[styles.intentSurface, styles.featuredBody]}
              variant="card"
            >
              <View style={styles.intentTopRow}>
                {/* A word, not a catalogue code — so it takes the printed-label
                    style without the tape-counter monospace the codes use. */}
                <Text
                  style={[
                    styles.featuredKicker,
                    { color: artwork.foreground.primary },
                  ]}
                >
                  {t(`home.suggestedFor.${band}`)}
                </Text>
                <View
                  style={[
                    styles.intentIconTag,
                    styles.featuredIconTag,
                    { backgroundColor: artwork.foreground.badge },
                  ]}
                >
                  <Icon
                    icon={suggestedIntent.icon}
                    size={22}
                    color={artwork.foreground.primary}
                  />
                </View>
              </View>
              <Text
                style={[
                  styles.featuredName,
                  { color: artwork.foreground.primary },
                ]}
              >
                {t(suggestedIntent.nameKey)}
              </Text>
              <Text
                style={[
                  styles.intentDesc,
                  { color: artwork.foreground.secondary },
                ]}
              >
                {t(suggestedIntent.descKey)}
              </Text>
              {/* The curated session length was buried on the detail screen;
                  it is the most useful thing to know before tapping in. */}
              <View style={styles.featuredMeta}>
                <View style={styles.featuredMetaLine}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={artwork.foreground.secondary}
                  />
                  <Text
                    style={[
                      styles.featuredMetaText,
                      { color: artwork.foreground.secondary },
                    ]}
                    numberOfLines={1}
                  >
                    <Text style={styles.featuredMetaNumber}>
                      {suggestedIntent.recommendedMinutes}
                    </Text>
                    {t('home.recommendedMinutesSuffix')}
                    {suggestedSound ? ` · ${t(suggestedSound.nameKey)}` : ''}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.intentCatalog,
                    { color: artwork.foreground.secondary },
                  ]}
                >
                  <Text style={styles.intentCatalogCode}>
                    {suggestedIntent.catalogCode}
                  </Text>
                  {` · ${t('home.soundCount', { n: suggestedIntent.presetIds.length })}`}
                </Text>
              </View>
            </ArtBackground>
          </PressableScale>

          {/* Placed between the suggestion and the rest of the intents: a
              returning user's most likely next action is replaying last
              night's sound, and at the bottom of the page — under four
              intent cards — that shortcut was never found. Rendered only
              when there is history; an empty "nothing here yet" panel taught
              nothing and cost the same vertical space. */}
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

          <Text
            style={[styles.otherIntentsLabel, { color: colors.textSecondary }]}
          >
            {t('home.otherIntents')}
          </Text>

          <View style={styles.intentStack}>
            {otherIntents.map((intent) => (
              <PressableScale
                key={intent.id}
                onPress={() => router.push(`/intent/${intent.id}`)}
                scaleTo={0.99}
                pressedOpacity={0.85}
                style={styles.intentCard}
                accessibilityRole="button"
                accessibilityLabel={`${t(intent.nameKey)}. ${t(intent.descKey)}`}
              >
                <ArtBackground
                  source={artwork.source(intentArt(intent.id))}
                  style={styles.intentSurface}
                  variant="card"
                >
                  <View style={styles.intentTopRow}>
                    {/* A catalogue number that indexes nothing is decoration.
                        Pairing it with the size of what it points at makes it
                        a real index entry — and the code keeps the mono face
                        while the words around it stay in Nunito. */}
                    <Text
                      style={[
                        styles.intentCatalog,
                        { color: artwork.foreground.secondary },
                      ]}
                    >
                      <Text style={styles.intentCatalogCode}>
                        {intent.catalogCode}
                      </Text>
                      {` · ${t('home.soundCount', { n: intent.presetIds.length })}`}
                    </Text>
                    <View
                      style={[
                        styles.intentIconTag,
                        { backgroundColor: artwork.foreground.badge },
                      ]}
                    >
                      <Icon
                        icon={intent.icon}
                        size={18}
                        color={artwork.foreground.primary}
                      />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.intentName,
                      { color: artwork.foreground.primary },
                    ]}
                  >
                    {t(intent.nameKey)}
                  </Text>
                  <Text
                    style={[
                      styles.intentDesc,
                      { color: artwork.foreground.secondary },
                    ]}
                    numberOfLines={2}
                  >
                    {t(intent.descKey)}
                  </Text>
                </ArtBackground>
              </PressableScale>
            ))}
          </View>
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
      <LanguageSheet visible={showLanguageSheet} onClose={() => setShowLanguageSheet(false)} />
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
  intentsTitle: {
    ...Typography.largeTitle,
    flex: 1,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickControls: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  quickControl: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageFlag: {
    fontSize: 18,
  },
  intentStack: {
    gap: Spacing.sm,
  },
  intentCard: {
    borderRadius: Radius.card,
    overflow: 'hidden',
    backgroundColor: '#0B1018',
  },
  intentSurface: {
    minHeight: 142,
    padding: Spacing.md,
    gap: 4,
  },
  featuredBody: {
    minHeight: 210,
    padding: Spacing.lg,
    gap: 6,
  },
  featuredKicker: {
    ...Typography.label,
    textTransform: 'uppercase',
  },
  featuredIconTag: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  featuredName: {
    ...Typography.largeTitle,
    fontSize: 28,
    lineHeight: 34,
  },
  featuredMeta: {
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  featuredMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    maxWidth: '100%',
  },
  featuredMetaText: {
    ...Typography.footnote,
    flexShrink: 1,
  },
  featuredMetaNumber: {
    ...Typography.numeral,
  },
  recentSection: {
    marginTop: Spacing.xl,
  },
  otherIntentsLabel: {
    ...Typography.label,
    textTransform: 'uppercase',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  intentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  intentCatalog: {
    ...Typography.label,
    textTransform: 'uppercase',
  },
  intentCatalogCode: {
    fontFamily: FontFamily.mono,
    letterSpacing: 1.2,
  },
  intentIconTag: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentName: {
    ...Typography.title,
  },
  intentDesc: {
    ...Typography.footnote,
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
    maxWidth: '72%',
  },
  headphoneNote: {
    ...Typography.footnote,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
});
