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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, useIntentColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, FontFamily, Radius, BADGE_ALPHA, withAlpha } from '@/constants/theme';
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
  } = useSettingsStore();
  const { favoriteIds, recentlyPlayed } = usePresetsStore();

  const colors = useThemeColors();
  const intentColors = useIntentColors();
  const miniPlayerInset = useMiniPlayerInset();
  const isPresetPlaying = useIsPresetPlaying();
  const [showAllFavorites, setShowAllFavorites] = useState(false);

  // Read once per mount, not on a ticking timer: this is a launcher, not a
  // clock, and re-rendering the list every minute would fight the user's
  // scroll for a change nobody is waiting to see.
  const { intent: suggestedIntent, band } = useMemo(
    () => getSuggestedIntent(new Date().getHours()),
    []
  );
  const otherIntents = useMemo(
    () => intents.filter((i) => i.id !== suggestedIntent.id),
    [suggestedIntent.id]
  );

  // The first id in an intent's list is its recommended sound. Naming it on
  // the card answers "what would this actually play?" before the tap —
  // without playing it. A long-press audio preview (review #24) would have
  // to stop whatever is already running, since a preset and the mixer are
  // mutually exclusive by design, so a preview could silently end the sleep
  // sound it was meant to help you choose.
  const suggestedSound = useMemo(
    () => getPresetById(suggestedIntent.presetIds[0]),
    [suggestedIntent.presetIds]
  );

  // AsyncStorage hydration must finish before the onboarding default is used.
  if (!hasHydrated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
      Alert.alert(
        t('home.headphoneWarning'),
        t('home.headphoneWarningDesc'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              setHasSeenHeadphoneWarning(true);
              router.push(`/player/${presetId}`);
            },
          },
        ]
      );
    } else {
      router.push(`/player/${presetId}`);
    }
  };

  const favoritePresets = favoriteIds
    .map(id => getPresetById(id))
    .filter((p): p is FrequencyPreset => p !== undefined);

  const recentPresets = recentlyPlayed
    .map(r => getPresetById(r.presetId))
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
    (preset) => preset.type === 'binaural'
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          contentColumn,
          { paddingBottom: miniPlayerInset + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intent Section — primary entry, typographic */}
        <View style={styles.section}>
          <Text
            style={[styles.intentsTitle, { color: colors.text }]}
            accessibilityRole="header"
          >
            {t('home.intentsTitle')}
          </Text>
          {/* The clock's answer, given room. Four identical cards asked the
              question and then refused to help answer it; at 2am the app can
              reasonably lead with Sleep. The other three stay one tap away
              below, so the guess is a suggestion, not a decision. */}
          <PressableScale
            onPress={() => router.push(`/intent/${suggestedIntent.id}`)}
            scaleTo={0.99}
            pressedOpacity={0.85}
            style={[
              styles.intentCard,
              {
                backgroundColor: colors.card,
                borderColor: withAlpha(intentColors[suggestedIntent.id], 0.45),
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={[
              t(`home.suggestedFor.${band}`),
              t(suggestedIntent.nameKey),
              t(suggestedIntent.descKey),
              t('home.recommendedMinutes', { minutes: suggestedIntent.recommendedMinutes }),
              suggestedSound ? t(suggestedSound.nameKey) : null,
            ]
              .filter(Boolean)
              .join('. ')}
          >
            <View
              style={[
                styles.intentSpine,
                styles.featuredSpine,
                { backgroundColor: intentColors[suggestedIntent.id] },
              ]}
            />
            <View style={[styles.intentBody, styles.featuredBody]}>
              <View style={styles.intentTopRow}>
                {/* A word, not a catalogue code — so it takes the printed-label
                    style without the tape-counter monospace the codes use. */}
                <Text style={[styles.featuredKicker, { color: intentColors[suggestedIntent.id] }]}>
                  {t(`home.suggestedFor.${band}`)}
                </Text>
                <View
                  style={[
                    styles.intentIconTag,
                    styles.featuredIconTag,
                    { backgroundColor: withAlpha(intentColors[suggestedIntent.id], BADGE_ALPHA) },
                  ]}
                >
                  <Icon icon={suggestedIntent.icon} size={22} color={intentColors[suggestedIntent.id]} />
                </View>
              </View>
              <Text style={[styles.featuredName, { color: colors.text }]}>
                {t(suggestedIntent.nameKey)}
              </Text>
              <Text style={[styles.intentDesc, { color: colors.textSecondary }]}>
                {t(suggestedIntent.descKey)}
              </Text>
              {/* The curated session length was buried on the detail screen;
                  it is the most useful thing to know before tapping in. */}
              <View style={styles.featuredMeta}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text
                  style={[styles.featuredMetaText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  <Text style={styles.featuredMetaNumber}>{suggestedIntent.recommendedMinutes}</Text>
                  {t('home.recommendedMinutesSuffix')}
                  {suggestedSound ? ` · ${t(suggestedSound.nameKey)}` : ''}
                </Text>
                <Text style={[styles.intentCatalog, styles.featuredMetaCode, { color: colors.textSecondary }]}>
                  <Text style={styles.intentCatalogCode}>{suggestedIntent.catalogCode}</Text>
                  {` · ${t('home.soundCount', { n: suggestedIntent.presetIds.length })}`}
                </Text>
              </View>
            </View>
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

          <Text style={[styles.otherIntentsLabel, { color: colors.textSecondary }]}>
            {t('home.otherIntents')}
          </Text>

          <View style={styles.intentStack}>
            {otherIntents.map((intent) => (
              <PressableScale
                key={intent.id}
                onPress={() => router.push(`/intent/${intent.id}`)}
                scaleTo={0.99}
                pressedOpacity={0.85}
                style={[
                  styles.intentCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${t(intent.nameKey)}. ${t(intent.descKey)}`}
              >
                {/* Index-tab spine, like a coloured card-catalogue edge —
                    the one place each intent's own colour still shows. */}
                <View style={[styles.intentSpine, { backgroundColor: intentColors[intent.id] }]} />

                <View style={styles.intentBody}>
                  <View style={styles.intentTopRow}>
                    {/* A catalogue number that indexes nothing is decoration.
                        Pairing it with the size of what it points at makes it
                        a real index entry — and the code keeps the mono face
                        while the words around it stay in Nunito. */}
                    <Text style={[styles.intentCatalog, { color: intentColors[intent.id] }]}>
                      <Text style={styles.intentCatalogCode}>{intent.catalogCode}</Text>
                      {` · ${t('home.soundCount', { n: intent.presetIds.length })}`}
                    </Text>
                    <View
                      style={[styles.intentIconTag, { backgroundColor: withAlpha(intentColors[intent.id], BADGE_ALPHA) }]}
                    >
                      <Icon icon={intent.icon} size={18} color={intentColors[intent.id]} />
                    </View>
                  </View>
                  <Text style={[styles.intentName, { color: colors.text }]}>
                    {t(intent.nameKey)}
                  </Text>
                  <Text
                    style={[styles.intentDesc, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {t(intent.descKey)}
                  </Text>
                </View>
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
            seeAllText={showAllFavorites ? t('common.showLess') : t('common.seeAll')}
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
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {t('home.favoritesEmpty')}
            </Text>
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
  intentsTitle: {
    ...Typography.largeTitle,
    marginBottom: Spacing.lg,
  },
  intentStack: {
    gap: Spacing.sm,
  },
  // A flat printed card, not a photo block: a coloured spine on the left
  // (like a card-catalogue tab) carries the intent's identity instead of a
  // full-bleed gradient photo repeated four times down the page.
  intentCard: {
    flexDirection: 'row',
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  intentSpine: {
    width: 6,
  },
  // The suggested card is the same object at a louder volume: wider spine,
  // roomier body, bigger name — not a different component with different
  // rules.
  featuredSpine: {
    width: 10,
  },
  featuredBody: {
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  featuredMetaText: {
    ...Typography.footnote,
    flexShrink: 1,
  },
  featuredMetaNumber: {
    ...Typography.numeral,
  },
  featuredMetaCode: {
    marginLeft: 'auto',
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
  intentBody: {
    flex: 1,
    padding: Spacing.md,
    gap: 4,
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
  emptyStateText: {
    ...Typography.body,
    lineHeight: 21,
    paddingVertical: Spacing.sm,
  },
  headphoneNote: {
    ...Typography.footnote,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
});
