/**
 * Home Screen — intent-first entry ("what do you need?"), then history
 * and favourites. The technical taxonomy lives in Explore; duplicating it
 * here gave two paths to one destination.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, FontFamily, Radius, withAlpha } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { CategoryHeader } from '@/components/ui/CategoryHeader';
import { PresetCard, PresetCardSmall } from '@/components/ui/PresetCard';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { intents } from '@/lib/intents';
import { useMiniPlayerInset } from '@/hooks/use-mini-player';
import { contentColumn } from '@/constants/layout';
import { getPresetById, FrequencyPreset } from '@/lib/frequencies';


// Category data for grid cards
// How many favourites the home screen previews before offering the rest.
const FAVORITES_PREVIEW = 4;

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { hasSeenHeadphoneWarning, setHasSeenHeadphoneWarning, hasSeenOnboarding } = useSettingsStore();
  const { favoriteIds, recentlyPlayed } = usePresetsStore();

  const colors = useThemeColors();
  const miniPlayerInset = useMiniPlayerInset();
  const [showAllFavorites, setShowAllFavorites] = useState(false);

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
    .slice(0, 10)
    .map(r => getPresetById(r.presetId))
    .filter((p): p is FrequencyPreset => p !== undefined);

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
        {/* Brand presence without a second settings entry point — the tab
            already gives access, so this row only carries the wordmark. */}
        <View style={styles.header}>
          <Text style={[styles.wordmark, { color: colors.textSecondary }]}>
            NeuroSound
          </Text>
        </View>

        {/* Intent Section — primary entry, typographic */}
        <View style={styles.section}>
          <Text
            style={[styles.intentsTitle, { color: colors.text }]}
            accessibilityRole="header"
          >
            {t('home.intentsTitle')}
          </Text>
          <View style={styles.intentStack}>
            {intents.map((intent) => (
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
                <View style={[styles.intentSpine, { backgroundColor: intent.color }]} />

                <View style={styles.intentBody}>
                  <View style={styles.intentTopRow}>
                    <Text style={[styles.intentCatalog, { color: intent.color }]}>
                      {intent.catalogCode}
                    </Text>
                    <View
                      style={[styles.intentIconTag, { backgroundColor: withAlpha(intent.color, 0.16) }]}
                    >
                      <Icon icon={intent.icon} size={18} color={intent.color} />
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

        {/* Recently Played Section */}
        <View style={styles.section}>
          <CategoryHeader title={t('home.recentlyPlayed')} />
          {recentPresets.length > 0 ? (
            /* A horizontal FlatList nested in a ScrollView cancels its own
               virtualisation; ten chips do not need it. */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {recentPresets.map((item) => (
                <PresetCardSmall
                  key={item.id}
                  preset={item}
                  name={t(item.nameKey)}
                  onPress={() => handlePresetPress(item.id)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {t('home.recentlyPlayedEmpty')}
            </Text>
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
            seeAllText={showAllFavorites ? t('common.showLess') : t('common.seeAll')}
          />
          {favoritePresets.length > 0 ? (
            <View>
              {(showAllFavorites
                ? favoritePresets
                : favoritePresets.slice(0, FAVORITES_PREVIEW)
              ).map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onPress={() => handlePresetPress(preset.id)}
                  isFavorite={true}
                />
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {t('home.favoritesEmpty')}
            </Text>
          )}
        </View>

        {/* Quiet headphone note */}
        <Text style={[styles.headphoneNote, { color: colors.warning }]}>
          {t('home.headphoneNote')}
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: 20,
  },
  header: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  // Brand presence without spending the H1 on it.
  wordmark: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.4,
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
  horizontalList: {
    paddingRight: Spacing.md,
  },
});
