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
  TouchableOpacity,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, useCategoryColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, AccessibilitySize, FontFamily, Radius, ControlSize, BADGE_ALPHA, withAlpha } from '@/constants/theme';
import { usePresetsStore } from '@/stores/presetsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { PresetRow } from '@/components/ui/PresetRow';
import { useMiniPlayerInset } from '@/hooks/use-mini-player';
import { useIsPresetPlaying } from '@/hooks/use-is-preset-playing';
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
  const { isFavorite, favoriteIds } = usePresetsStore();
  const { seenCategoryDescriptions, markCategoryDescriptionSeen } = useSettingsStore();

  // Initialize with params or default
  const [activeCategory, setActiveCategory] = useState<CategoryType>(
    (params.category as CategoryType) || 'binaural'
  );
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [pagerWidth, setPagerWidth] = useState(0);
  // Web draws its own focus ring on a text input, ignoring every border this
  // design owns. Suppressing it without replacing it would leave keyboard
  // users with no focus indication at all, so the field draws its own.
  const [searchFocused, setSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'name'>('default');

  const colors = useThemeColors();
  const categoryColors = useCategoryColors();
  const miniPlayerInset = useMiniPlayerInset();
  const isPresetPlaying = useIsPresetPlaying();
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
  // down for no new information. Marking it seen has to happen when the user
  // *leaves* the category, not the moment it arrives: doing it on arrival
  // collapsed the paragraph out from under the user almost as soon as it
  // rendered, on the very next effect tick.
  useEffect(() => {
    return () => {
      if (!useSettingsStore.getState().seenCategoryDescriptions[activeCategory]) {
        markCategoryDescriptionSeen(activeCategory);
      }
    };
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

  const clearFilters = () => {
    setQuery('');
    setFavoritesOnly(false);
  };

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPresetsByCategory = useMemo(() => {
    const map: Record<CategoryType, FrequencyPreset[]> = {
      binaural: [],
      solfeggio: [],
      noise: [],
    };
    categories.forEach((category) => {
      const matching = category.presets.filter((preset) => {
        if (favoritesOnly && !isFavorite(preset.id)) return false;
        if (normalizedQuery && !t(preset.nameKey).toLowerCase().includes(normalizedQuery)) {
          return false;
        }
        return true;
      });
      // The default order is ascending frequency, which is the catalogue's
      // own order and carries real meaning (Delta at the bottom, Gamma at the
      // top). A–Z is the alternative for when you know the name already.
      map[category.key] =
        sortBy === 'name'
          ? [...matching].sort((a, b) => t(a.nameKey).localeCompare(t(b.nameKey)))
          : matching;
    });
    return map;
    // isFavorite is a stable function reference (it reads favoriteIds via
    // get() internally), so it never changes and never invalidates this
    // memo on its own — favoriteIds is the dependency that actually moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedQuery, favoritesOnly, favoriteIds, sortBy]);

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

      {/* Category Tabs — text with an accent underline. Horizontally
          scrollable: three fixed-width tabs already reach the right edge in
          English, and Turkish labels ("Binaural Vuruşlar / Ortam Sesleri")
          plus a large system font size push them off-screen entirely. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsScroll, { borderBottomColor: colors.cardBorder }]}
        contentContainerStyle={[styles.tabsContainer, contentColumn]}
        accessibilityRole="tablist"
      >
        {categories.map((category, index) => {
          const isActive = category.key === activeCategory;
          // The tab is the index tab for its category, so it wears that
          // category's colour rather than the app accent — the same colour
          // the rows below it are about to use.
          const tint = categoryColors[category.key];
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
                  { color: isActive ? tint : colors.textSecondary },
                  isActive && styles.tabTextActive,
                ]}
              >
                {t(category.labelKey)}
              </Text>
              <View
                style={[
                  styles.tabUnderline,
                  { backgroundColor: isActive ? tint : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search + favourites filter — 33 presets across the app had no way
          to narrow the list. */}
      <View style={[styles.toolbar, contentColumn]}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: searchFocused ? colors.accent : 'transparent',
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={t('explore.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
            accessibilityLabel={t('explore.searchPlaceholder')}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              // Without flexShrink: 0 the flex:1 input next to it squeezes
              // this to zero width and the button renders invisibly.
              style={styles.searchClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('explore.clearSearch')}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {/* Both toggles were bare icons floating next to a filled search
            field, which read as decoration rather than controls. They now
            sit in the same box the field does, and fill in when they are on. */}
        <TouchableOpacity
          onPress={() => setSortBy((v) => (v === 'name' ? 'default' : 'name'))}
          style={[
            styles.toolbarToggle,
            {
              backgroundColor:
                sortBy === 'name'
                  ? withAlpha(colors.accent, BADGE_ALPHA)
                  : colors.backgroundSecondary,
            },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: sortBy === 'name' }}
          accessibilityLabel={t('explore.sortByName')}
        >
          <Ionicons
            name="text-outline"
            size={19}
            color={sortBy === 'name' ? colors.accent : colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFavoritesOnly((v) => !v)}
          style={[
            styles.toolbarToggle,
            {
              backgroundColor: favoritesOnly
                ? withAlpha(colors.accent, BADGE_ALPHA)
                : colors.backgroundSecondary,
            },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: favoritesOnly }}
          accessibilityLabel={t('explore.favoritesOnly')}
        >
          <Ionicons
            name={favoritesOnly ? 'heart' : 'heart-outline'}
            size={19}
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
                <View style={styles.descriptionMain}>
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
                {/* 33 sounds behind a search box and a filter, and the list
                    never said how many survived either one. */}
                <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                  <Text style={styles.resultCountNumber}>{presets.length}</Text>
                  {presets.length === category.presets.length
                    ? ''
                    : `/${category.presets.length}`}
                </Text>
              </View>

              <View>
                {presets.length > 0 ? (
                  presets.map((preset, i) => (
                    <PresetRow
                      key={preset.id}
                      preset={preset}
                      onPress={() => handlePresetPress(preset.id)}
                      isFavorite={isFavorite(preset.id)}
                      isPlaying={isPresetPlaying(preset.id)}
                      highlight={normalizedQuery}
                      index={i}
                    />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                      {t('explore.noResults')}
                    </Text>
                    {/* A dead end told the user what happened and gave them no
                        way out of it. */}
                    <TouchableOpacity
                      onPress={clearFilters}
                      style={styles.clearFilters}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.clearFiltersText, { color: colors.accent }]}>
                        {t('explore.clearFilters')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
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
  // flexGrow: 0 stops the horizontal ScrollView from claiming the vertical
  // space the pager below it needs.
  tabsScroll: {
    flexGrow: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
  },
  tab: {
    paddingTop: Spacing.sm,
    minHeight: ControlSize.row,
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  tabText: {
    ...Typography.body,
  },
  tabTextActive: {
    fontFamily: FontFamily.semibold,
  },
  emptyState: {
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  emptyStateText: {
    ...Typography.body,
    lineHeight: 21,
  },
  clearFilters: {
    minHeight: ControlSize.row,
    justifyContent: 'center',
  },
  clearFiltersText: {
    ...Typography.body,
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
    borderRadius: Radius.card,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    minHeight: ControlSize.field,
  },
  searchClear: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    // A flex item's default min-width is its content width, so on web the
    // input refused to shrink, overflowed its own rounded box by ~13px and
    // shoved the clear button out past the sort toggle. minWidth: 0 is the
    // standard release valve; RN's Yoga does not need it, web does.
    minWidth: 0,
    ...Typography.body,
    paddingVertical: Spacing.sm,
    // Kills the browser's own focus ring on web; the container's accent
    // border replaces it. `outlineStyle` is react-native-web only, hence the
    // cast — RN's own types have no such property.
    ...({ outlineStyle: 'none' } as object),
  },
  toolbarToggle: {
    width: AccessibilitySize.minTouchTarget,
    height: ControlSize.field,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.md,
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  descriptionMain: {
    flex: 1,
  },
  // Footnote, not body: three or four lines of 17pt explanation pushed the
  // list itself below the fold on first visit to every category.
  descriptionText: {
    ...Typography.footnote,
    lineHeight: 19,
  },
  resultCount: {
    ...Typography.footnote,
    ...Typography.numeral,
    paddingTop: 2,
  },
  resultCountNumber: {
    ...Typography.numeral,
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
