/**
 * Home Screen - Modern Grid Layout with Categories
 * Spotify/Apple Music inspired design
 */

import React from 'react';
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
import {
  binauralPresets,
  getPresetById,
  FrequencyPreset,
} from '@/lib/frequencies';


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
    iconName: 'water',
    color: '#3B82F6',
  },
];

// Quick start presets - popular choices
const quickStartPresets: FrequencyPreset[] = [
  binauralPresets.find(p => p.binauralType === 'alpha'),
  binauralPresets.find(p => p.binauralType === 'theta'),
].filter((p): p is FrequencyPreset => p !== undefined);

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { hasSeenHeadphoneWarning, setHasSeenHeadphoneWarning } = useSettingsStore();
  const { favoriteIds, recentlyPlayed, isFavorite } = usePresetsStore();

  const colors = useThemeColors();

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

        {/* Categories Section */}
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

        {/* Quick Start Section */}
        <View style={styles.section}>
          <CategoryHeader
            title={t('home.quickStart')}
            subtitle={t('home.quickStartDesc')}
          />
          <View style={styles.presetGrid}>
            {quickStartPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onPress={() => handlePresetPress(preset.id)}
                isFavorite={isFavorite(preset.id)}
                size="medium"
              />
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

        {/* Favorites Section */}
        {favoritePresets.length > 0 && (
          <View style={styles.section}>
            <CategoryHeader
              title={t('home.favorites')}
              iconName="heart"
            />
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
          </View>
        )}

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
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  horizontalList: {
    paddingRight: Spacing.md,
  },
});
