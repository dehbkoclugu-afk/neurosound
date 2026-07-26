/**
 * Explore Screen - Category-based Grid View
 * 2-column preset grid with category filtering
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, AccessibilitySize, FontFamily } from '@/constants/theme';
import { usePresetsStore } from '@/stores/presetsStore';
import { useSettingsStore } from '@/stores/settingsStore';
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
  const { seenCategoryDescriptions, markCategoryDescriptionSeen } = useSettingsStore();

  // Initialize with params or default
  const [activeCategory, setActiveCategory] = useState<CategoryType>(
    (params.category as CategoryType) || 'binaural'
  );
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [pagerWidth, setPagerWidth] = useState(0);

  const colors = useThemeColors();
  const miniPlayerInset = useMiniPlayerInset();
  const pagerRef = useRef<ScrollView>(null);

  // Deep link / param changes (and the initial layout pass) move the pager
  // without animating — this isn't the user's own swipe finishing, so it
  // doesn't depend on activeCategory or it would fight every swipe update.
  useEffect(() => {
    const paramCategory = params.category as CategoryType | undefined;
    const isValidParam = !!paramCategory && categories.some((c) => c.key === paramCategory);
    const target = isValidParam ? (paramCategory as CategoryType) : activeCategory;

    if (isValidParam && target !== activeCategory) {
      setActiveCategory(target);
    }
    if (pagerWidth) {
      const index = categories.findIndex((c) => c.key === target);
      pagerRef.current?.scrollTo({ x: index * pagerWidth, animated: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.category, pagerWidth]);

  // A category's blurb is shown the first time it's opened, then it gets out
  // of the way — repeating a 3-line paragraph on every visit pushed the list
  // down for no new information.
  useEffect(() => {
    if (!seenCategoryDescriptions[activeCategory]) {
      markCategoryDescriptionSeen(activeCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const handleTabPress = (index: number) => {
    setActiveCategory(categories[index].key);
    pagerRef.current?.scrollTo({ x: index * pagerWidth, animated: true });
  };

  const handlePagerLayout = (e: LayoutChangeEvent) => {
    setPagerWidth(e.nativeEvent.layout.width);
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!pagerWidth) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / pagerWidth);
    const category = categories[index];
    if (category && category.key !== activeCategory) {
      setActiveCategory(category.key);
    }
  };

  const handlePresetPress = (presetId: string) => {
    router.push(`/player/${presetId}`);
  };

  const toggleDescription = (key: CategoryType) => {
    setExpandedDescriptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPresetsByCategory = useMemo(() => {
    const map: Record<CategoryType, FrequencyPreset[]> = {
      binaural: [],
      solfeggio: [],
      noise: [],
    };
    categories.forEach((category) => {
      map[category.key] = category.presets.filter((preset) => {
        if (favoritesOnly && !isFavorite(preset.id)) return false;
        if (normalizedQuery && !t(preset.nameKey).toLowerCase().includes(normalizedQuery)) {
          return false;
        }
        return true;
      });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedQuery, favoritesOnly, isFavorite]);

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

      {/* Category Tabs — text with amber underline. Swipe convention for a
          tab strip matches the pager below, so either gesture works. */}
      <View
        style={[
          styles.tabsContainer,
          contentColumn,
          { borderBottomColor: colors.cardBorder },
        ]}
        accessibilityRole="tablist"
      >
        {categories.map((category, index) => {
          const isActive = category.key === activeCategory;
          return (
            <TouchableOpacity
              key={category.key}
              onPress={() => handleTabPress(index)}
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

      {/* Search + favourites filter — 33 presets across the app had no way
          to narrow the list. */}
      <View style={[styles.toolbar, contentColumn]}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('explore.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
            accessibilityLabel={t('explore.searchPlaceholder')}
          />
        </View>
        <TouchableOpacity
          onPress={() => setFavoritesOnly((v) => !v)}
          style={styles.favoriteFilter}
          accessibilityRole="button"
          accessibilityState={{ selected: favoritesOnly }}
          accessibilityLabel={t('explore.favoritesOnly')}
        >
          <Ionicons
            name={favoritesOnly ? 'heart' : 'heart-outline'}
            size={20}
            color={favoritesOnly ? colors.accent : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Preset pages — one per category, swipeable like any tab strip */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={handlePagerLayout}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {categories.map((category) => {
          const presets = filteredPresetsByCategory[category.key];
          const showDescription =
            !seenCategoryDescriptions[category.key] || expandedDescriptions[category.key];

          return (
            <ScrollView
              key={category.key}
              style={{ width: pagerWidth || undefined }}
              contentContainerStyle={[
                styles.content,
                contentColumn,
                { paddingBottom: miniPlayerInset + Spacing.lg },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.descriptionRow}>
                {showDescription ? (
                  <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                    {t(category.descriptionKey)}
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => toggleDescription(category.key)}
                    style={styles.aboutButton}
                    accessibilityRole="button"
                    accessibilityLabel={t('explore.aboutCategory')}
                  >
                    <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.aboutButtonText, { color: colors.textSecondary }]}>
                      {t('explore.aboutCategory')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View>
                {presets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    onPress={() => handlePresetPress(preset.id)}
                    isFavorite={isFavorite(preset.id)}
                  />
                ))}
              </View>
            </ScrollView>
          );
        })}
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.sm,
  },
  favoriteFilter: {
    width: AccessibilitySize.minTouchTarget,
    height: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 20,
  },
  descriptionRow: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    ...Typography.subhead,
    lineHeight: 22,
  },
  aboutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 32,
  },
  aboutButtonText: {
    ...Typography.footnote,
  },
});
