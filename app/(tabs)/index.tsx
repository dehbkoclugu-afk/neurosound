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
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { CategoryHeader, CategoryCard } from '@/components/ui/CategoryHeader';
import { PresetCard, PresetCardSmall } from '@/components/ui/PresetCard';
import { Icon } from '@/components/ui/Icon';
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
  const { favoriteIds, recentlyPlayed, isFavorite } = usePresetsStore();

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

        {/* Headphone reminder */}
        <View style={[styles.reminder, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={[styles.reminderIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="headset" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.reminderText, { color: colors.textSecondary }]}>
            {t('home.headphoneWarning')}
          </Text>
        </View>

        {/* Intent Section — primary entry */}
        <View style={styles.section}>
          <CategoryHeader title={t('home.intentsTitle')} />
          <View style={styles.intentGrid}>
            {intents.map((intent) => (
              <TouchableOpacity
                key={intent.id}
                onPress={() => router.push(`/intent/${intent.id}`)}
                activeOpacity={0.85}
                style={styles.intentCard}
                accessibilityRole="button"
                accessibilityLabel={t(intent.nameKey)}
              >
                <LinearGradient
                  colors={intent.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.intentGradient}
                >
                  <Icon icon={intent.icon} size={26} color="rgba(255,255,255,0.95)" />
                  <Text style={styles.intentName}>{t(intent.nameKey)}</Text>
                  <Text style={styles.intentDesc} numberOfLines={2}>
                    {t(intent.descKey)}
                  </Text>
                </LinearGradient>
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
            <View style={styles.presetGrid}>
              {favoritePresets.slice(0, 4).map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onPress={() => handlePresetPress(preset.id)}
                  isFavorite={true}
                  size="medium"
                />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="heart-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {t('home.favoritesEmpty')}
              </Text>
            </View>
          )}
        </View>

        {/* Categories Section — technical taxonomy for power users */}
        <View style={styles.section}>
          <CategoryHeader title={t('home.categories')} />
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <CategoryCard
                key={category.key}
                title={t(category.titleKey)}
                iconName={category.iconName}
                color={category.color}
                onPress={() => handleCategoryPress(category.key)}
              />
            ))}
          </View>
        </View>

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
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.lg,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  reminderText: {
    ...Typography.subhead,
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  categoryGrid: {
    gap: Spacing.sm,
  },
  intentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  intentCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  intentGradient: {
    padding: Spacing.md,
    minHeight: 120,
    justifyContent: 'flex-end',
    gap: 4,
  },
  intentName: {
    ...Typography.headline,
    color: '#FFFFFF',
    marginTop: Spacing.sm,
  },
  intentDesc: {
    ...Typography.caption1,
    color: 'rgba(255,255,255,0.75)',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 16,
  },
  emptyStateText: {
    ...Typography.subhead,
    flex: 1,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  horizontalList: {
    paddingRight: Spacing.md,
  },
});
