import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, FontFamily, AccessibilitySize } from '@/constants/theme';
import { contentColumn } from '@/constants/layout';

// App never leaves 1.0.0 without a version bump, so this doubles as the
// policy's own "last updated" date without a second constant to keep in sync.
const LAST_UPDATED = '2026-07-26';

const SECTIONS = [
  ['summaryTitle', 'summaryBody'],
  ['dataTitle', 'dataBody'],
  ['networkTitle', 'networkBody'],
  ['accountsTitle', 'accountsBody'],
  ['childrenTitle', 'childrenBody'],
  ['changesTitle', 'changesBody'],
] as const;

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/settings'))}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          {t('privacy.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, contentColumn]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: colors.textSecondary }]}>
          {t('privacy.updated', { date: LAST_UPDATED })}
        </Text>

        {SECTIONS.map(([titleKey, bodyKey]) => (
          <View key={titleKey} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(`privacy.${titleKey}`)}</Text>
            <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{t(`privacy.${bodyKey}`)}</Text>
          </View>
        ))}
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  backButton: {
    width: AccessibilitySize.minTouchTarget,
    height: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.sm,
  },
  title: {
    ...Typography.title,
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  updated: {
    ...Typography.footnote,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.headline,
    fontFamily: FontFamily.semibold,
  },
  sectionBody: {
    ...Typography.body,
    lineHeight: 21,
  },
});
