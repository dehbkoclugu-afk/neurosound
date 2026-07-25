/**
 * Section header — quiet, typographic. Small secondary label, no icons.
 * CategoryCard is a plain text row with a chevron (no icon tiles).
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
import { Spacing, Typography, FontFamily } from '@/constants/theme';

interface CategoryHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  seeAllText?: string;
  iconName?: string; // kept for API compat, unused
  style?: ViewStyle;
}

export function CategoryHeader({
  title,
  subtitle,
  onSeeAll,
  seeAllText = 'See All',
  style,
}: CategoryHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {onSeeAll && (
        <TouchableOpacity
          onPress={onSeeAll}
          activeOpacity={0.6}
          style={styles.seeAllButton}
          accessibilityRole="button"
          accessibilityLabel={seeAllText}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>
            {seeAllText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Plain text row for category navigation
interface CategoryCardProps {
  title: string;
  iconName?: string; // kept for API compat, unused
  color?: string; // kept for API compat, unused
  onPress: () => void;
  style?: ViewStyle;
}

export function CategoryCard({
  title,
  onPress,
  style,
}: CategoryCardProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={[styles.categoryRow, { borderBottomColor: colors.cardBorder }, style]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.categoryTitle, { color: colors.text }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
  },
  subtitle: {
    ...Typography.caption1,
  },
  seeAllButton: {
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  seeAllText: {
    ...Typography.subhead,
    fontFamily: FontFamily.semibold,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  categoryTitle: {
    ...Typography.headline,
  },
});
