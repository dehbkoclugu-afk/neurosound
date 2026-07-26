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

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, AccessibilitySize, FontFamily } from '@/constants/theme';
import { usePresetsStore } from '@/stores/presetsStore';
import { PresetCard } from '@/components/ui/PresetCard';
import { useMiniPlayerInset } from '@/hooks/use-mini-player';
import { contentColumn } from '@/constants/layout';
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
    iconName: 'volume-medium',
    presets: noisePresets,
  },
];

export default function ExploreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
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
  const miniPlayerInset = useMiniPlayerInset();

  const activeTab = categories.find(c => c.key === activeCategory)!;

  const handlePresetPress = (presetId: string) => {
    router.push(`/player/${presetId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with category title — Explore is a tab, so no back button */}
      <View style={[styles.header, contentColumn]}>
        <Text
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="header"
        >
          {t('explore.title')}
        </Text>
      </View>

      {/* Category Tabs — text with amber underline */}
      <View
        style={[
          styles.tabsContainer,
          contentColumn,
          { borderBottomColor: colors.cardBorder },
        ]}
        accessibilityRole="tablist"
      >
        {categories.map(category => {
          const isActive = category.key === activeCategory;
          return (
            <TouchableOpacity
              key={category.key}
              onPress={() => setActiveCategory(category.key)}
              activeOpacity={0.6}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.accent : colors.textSecondary },
                  isActive && styles.tabTextActive,
                ]}
              >
                {t(category.labelKey)}
              </Text>
              <View
                style={[
                  styles.tabUnderline,
                  { backgroundColor: isActive ? colors.accent : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Preset Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          contentColumn,
          { paddingBottom: miniPlayerInset + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Description — plain paragraph, no box */}
        <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
          {t(activeTab.descriptionKey)}
        </Text>

        {/* Preset list */}
        <View>
          {activeTab.presets.map(preset => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onPress={() => handlePresetPress(preset.id)}
              isFavorite={isFavorite(preset.id)}
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.largeTitle,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    paddingTop: Spacing.sm,
    minHeight: AccessibilitySize.minTouchTarget,
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  tabText: {
    ...Typography.subhead,
  },
  tabTextActive: {
    fontFamily: FontFamily.semibold,
  },
  tabUnderline: {
    height: 2,
    borderRadius: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 20,
  },
  descriptionText: {
    ...Typography.subhead,
    lineHeight: 22,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
});
