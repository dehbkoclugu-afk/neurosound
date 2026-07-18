/**
 * Explore Screen - Category-based Grid View
 * 2-column preset grid with category filtering
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, AccessibilitySize } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { PresetCard } from '@/components/ui/PresetCard';
import {
  binauralPresets,
  solfeggioPresets,
  noisePresets,
  FrequencyPreset,
} from '@/lib/frequencies';


type CategoryType = 'binaural' | 'solfeggio' | 'noise';

interface CategoryTab {
  key: CategoryType;
  labelKey: string;
  descriptionKey: string;
  iconName: string;
  presets: FrequencyPreset[];
}

const categories: CategoryTab[] = [
  {
    key: 'binaural',
    labelKey: 'explore.categories.binaural',
    descriptionKey: 'explore.binauralDescription',
    iconName: 'pulse',
    presets: binauralPresets,
  },
  {
    key: 'solfeggio',
    labelKey: 'explore.categories.solfeggio',
    descriptionKey: 'explore.solfeggioDescription',
    iconName: 'musical-notes',
    presets: solfeggioPresets,
  },
  {
    key: 'noise',
    labelKey: 'explore.categories.noise',
    descriptionKey: 'explore.noiseDescription',
    iconName: 'water',
    presets: noisePresets,
  },
];

export default function ExploreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { reduceMotion } = useSettingsStore();
  const { isFavorite } = usePresetsStore();

  // Initialize with params or default
  const [activeCategory, setActiveCategory] = useState<CategoryType>(
    (params.category as CategoryType) || 'binaural'
  );

  // Update category when params change
  useEffect(() => {
    if (params.category && categories.find(c => c.key === params.category)) {
      setActiveCategory(params.category as CategoryType);
    }
  }, [params.category]);

  const colors = useThemeColors();

  const activeTab = categories.find(c => c.key === activeCategory)!;

  const handlePresetPress = (presetId: string) => {
    router.push(`/player/${presetId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with category title — Explore is a tab, so no back button */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Ionicons
            name={activeTab.iconName as any}
            size={24}
            color={colors.primary}
            style={styles.headerIcon}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            {t(activeTab.labelKey)}
          </Text>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {categories.map(category => {
            const isActive = category.key === activeCategory;
            return (
              <TouchableOpacity
                key={category.key}
                onPress={() => setActiveCategory(category.key)}
                activeOpacity={reduceMotion ? 1 : 0.7}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive ? colors.primary : colors.backgroundSecondary,
                    borderColor: isActive ? colors.primary : colors.cardBorder,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Ionicons
                  name={category.iconName as any}
                  size={16}
                  color={isActive ? '#fff' : colors.text}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? '#fff' : colors.text },
                  ]}
                >
                  {t(category.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Preset Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Description */}
        <View style={[styles.descriptionCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {t(activeTab.descriptionKey)}
          </Text>
        </View>

        {/* 2-Column Grid */}
        <View style={styles.presetGrid}>
          {activeTab.presets.map(preset => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onPress={() => handlePresetPress(preset.id)}
              isFavorite={isFavorite(preset.id)}
              showFrequency={true}
              size="medium"
            />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: Spacing.sm,
  },
  title: {
    ...Typography.title1,
  },
  tabsContainer: {
    paddingBottom: Spacing.md,
  },
  tabs: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: AccessibilitySize.minTouchTarget,
    gap: Spacing.xs,
  },
  tabText: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 20,
  },
  descriptionCard: {
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  descriptionText: {
    ...Typography.subhead,
    lineHeight: 22,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
});
