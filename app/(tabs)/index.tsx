/**
 * Home Screen - Intent-first entry ("what do you need?"), then history,
 * favorites, and the technical categories for power users.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { CategoryHeader, CategoryCard } from '@/components/ui/CategoryHeader';
import { PresetCard, PresetCardSmall } from '@/components/ui/PresetCard';
import { intents } from '@/lib/intents';
import { getPresetById, FrequencyPreset } from '@/lib/frequencies';


// Category data for grid cards
const categories = [
  {
    key: 'binaural',
    titleKey: 'explore.categories.binaural',
    iconName: 'pulse',
    color: '#8B5CF6',
  },
  {
    key: 'solfeggio',
    titleKey: 'explore.categories.solfeggio',
    iconName: 'musical-notes',
    color: '#EC4899',
  },
  {
    key: 'noise',
    titleKey: 'explore.categories.noise',
    iconName: 'volume-medium',
    color: '#3B82F6',
  },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { hasSeenHeadphoneWarning, setHasSeenHeadphoneWarning, hasSeenOnboarding } = useSettingsStore();
  const { favoriteIds, recentlyPlayed } = usePresetsStore();

  const colors = useThemeColors();

  // First run: route into onboarding once
  useEffect(() => {
    if (!hasSeenOnboarding) {
      router.push('/onboarding');
    }
  }, [hasSeenOnboarding, router]);

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

  const handleCategoryPress = (categoryKey: string) => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { category: categoryKey },
    });
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with proper spacing */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            NeuroSound
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            style={styles.headerButton}
            accessibilityLabel={t('common.settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Intent Section — primary entry, typographic */}
        <View style={styles.section}>
          <Text style={[styles.intentsTitle, { color: colors.text }]}>
            {t('home.intentsTitle')}
          </Text>
          <View>
            {intents.map((intent, index) => (
              <TouchableOpacity
                key={intent.id}
                onPress={() => router.push(`/intent/${intent.id}`)}
                activeOpacity={0.6}
                style={[
                  styles.intentRow,
                  { borderBottomColor: colors.cardBorder },
                  index === 0 && { borderTopColor: colors.cardBorder, borderTopWidth: StyleSheet.hairlineWidth },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t(intent.nameKey)}
              >
                <View style={styles.intentText}>
                  <Text style={[styles.intentName, { color: colors.text }]}>
                    {t(intent.nameKey)}
                  </Text>
                  <Text style={[styles.intentDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                    {t(intent.descKey)}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recently Played Section */}
        {recentPresets.length > 0 && (
          <View style={styles.section}>
            <CategoryHeader title={t('home.recentlyPlayed')} />
            <FlatList
              data={recentPresets}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PresetCardSmall
                  preset={item}
                  name={t(item.nameKey)}
                  onPress={() => handlePresetPress(item.id)}
                />
              )}
            />
          </View>
        )}

        {/* Favorites Section — teaches the heart affordance when empty */}
        <View style={styles.section}>
          <CategoryHeader title={t('home.favorites')} iconName="heart" />
          {favoritePresets.length > 0 ? (
            <View>
              {favoritePresets.slice(0, 4).map((preset) => (
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

        {/* Categories Section — technical taxonomy for power users */}
        <View style={styles.section}>
          <CategoryHeader title={t('home.categories')} />
          <View>
            {categories.map((category) => (
              <CategoryCard
                key={category.key}
                title={t(category.titleKey)}
                onPress={() => handleCategoryPress(category.key)}
              />
            ))}
          </View>
        </View>

        {/* Quiet headphone note */}
        <Text style={[styles.headphoneNote, { color: colors.textSecondary }]}>
          {t('home.headphoneWarning')}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.largeTitle,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  intentsTitle: {
    ...Typography.title1,
    marginBottom: Spacing.lg,
  },
  intentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  intentText: {
    flex: 1,
    gap: 4,
  },
  intentName: {
    ...Typography.title2,
  },
  intentDesc: {
    ...Typography.footnote,
  },
  emptyStateText: {
    ...Typography.subhead,
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
