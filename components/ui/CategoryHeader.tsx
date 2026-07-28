/**
 * Section header — quiet, typographic. Small secondary label, no icons.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, FontFamily } from '@/constants/theme';

interface CategoryHeaderProps {
  title: string;
  subtitle?: string;
  /** A readout, not a caption: "3/4". Set in the tape-counter face and sized
   *  a step above `subtitle`, which left the mixer's channel count looking
   *  like fine print rather than a gauge. */
  counter?: string;
  onSeeAll?: () => void;
  seeAllText?: string;
  iconName?: string; // kept for API compat, unused
  style?: ViewStyle;
}

export function CategoryHeader({
  title,
  subtitle,
  counter,
  onSeeAll,
  seeAllText = 'See All',
  style,
}: CategoryHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text
          style={[styles.title, { color: colors.textSecondary }]}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {counter && (
        <Text style={[styles.counter, { color: colors.textSecondary }]}>
          {counter}
        </Text>
      )}
      {onSeeAll && (
        <TouchableOpacity
          onPress={onSeeAll}
          activeOpacity={0.6}
          style={styles.seeAllButton}
          accessibilityRole="button"
          accessibilityLabel={seeAllText}
        >
          <Text style={[styles.seeAllText, { color: colors.accent }]}>
            {seeAllText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
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
    ...Typography.label,
    textTransform: 'uppercase',
  },
  subtitle: {
    ...Typography.caption,
  },
  counter: {
    ...Typography.footnote,
    ...Typography.numeral,
    paddingLeft: Spacing.sm,
  },
  seeAllButton: {
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  seeAllText: {
    ...Typography.body,
    fontFamily: FontFamily.semibold,
  },
});
