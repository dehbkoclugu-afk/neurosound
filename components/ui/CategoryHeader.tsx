/**
 * CategoryHeader Component - Section Title with Modern Styling
 * - Bold section title
 * - Optional "See All" button
 * - Clean minimalist design
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';

interface CategoryHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  seeAllText?: string;
  iconName?: string;
  style?: ViewStyle;
}

export function CategoryHeader({
  title,
  subtitle,
  onSeeAll,
  seeAllText = 'See All',
  iconName,
  style,
}: CategoryHeaderProps) {
  const { reduceMotion } = useSettingsStore();

  const colors = useThemeColors();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        {iconName && (
          <Ionicons
            name={iconName as any}
            size={22}
            color={colors.primary}
            style={styles.icon}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {onSeeAll && (
        <TouchableOpacity
          onPress={onSeeAll}
          activeOpacity={reduceMotion ? 1 : 0.7}
          style={styles.seeAllButton}
          accessibilityRole="button"
          accessibilityLabel={seeAllText}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>
            {seeAllText}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Large category card for homepage
interface CategoryCardProps {
  title: string;
  iconName: string;
  color: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function CategoryCard({
  title,
  iconName,
  color,
  onPress,
  style,
}: CategoryCardProps) {
  const { reduceMotion } = useSettingsStore();

  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={reduceMotion ? 1 : 0.8}
      style={[
        styles.categoryCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={iconName as any} size={24} color={color} />
      </View>
      <Text style={[styles.categoryTitle, { color: colors.text }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.title2,
  },
  subtitle: {
    ...Typography.subhead,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  seeAllText: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  // Category card styles
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryTitle: {
    ...Typography.headline,
    flex: 1,
  },
});
