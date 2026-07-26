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
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, FontFamily, withAlpha } from '@/constants/theme';
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
      {/* Soft warm atmosphere at the top, fading into the background */}
      <LinearGradient
        colors={[withAlpha(colors.primary, 0.1), colors.background]}
        locations={[0, 0.4]}
        style={styles.atmosphere}
        pointerEvents="none"
      />
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
                // Large surfaces need less travel than buttons to read as
                // pressed rather than shrinking.
                scaleTo={0.985}
                pressedOpacity={0.9}
                style={styles.intentBlock}
                accessibilityRole="button"
                accessibilityLabel={`${t(intent.nameKey)}. ${t(intent.descKey)}`}
              >
                <Image
                  source={intent.image}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={300}
                />
                {/* Tint: decorative, diagonal, carries the intent's colour. */}
                <LinearGradient
                  colors={[withAlpha(intent.color, 0.4), 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {/* Legibility: vertical and separate, so the whole text band
                    darkens evenly. A diagonal scrim left the bottom-LEFT — where
                    the title actually sits — in its lightest stop, which is
                    2.4:1 over a bright photo. Placeholder images are random, so
                    the floor has to be guaranteed, not hoped for. */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.62)']}
                  locations={[0.35, 0.7, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.intentRow}>
                  <View style={styles.intentText}>
                    <Text style={styles.intentName}>{t(intent.nameKey)}</Text>
                    <Text style={styles.intentDesc} numberOfLines={2}>
                      {t(intent.descKey)}
                    </Text>
                  </View>
                  <Icon icon={intent.icon} size={26} color="rgba(255,255,255,0.95)" />
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
  atmosphere: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
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
  intentBlock: {
    // minHeight, not height: the block holds a 22pt title over a 13pt line,
    // and a fixed box clips both once the system text size grows.
    minHeight: 108,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  intentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  intentText: {
    flex: 1,
    gap: 2,
  },
  intentName: {
    ...Typography.title,
    color: '#FFFFFF',
  },
  intentDesc: {
    ...Typography.footnote,
    color: 'rgba(255,255,255,0.85)',
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
