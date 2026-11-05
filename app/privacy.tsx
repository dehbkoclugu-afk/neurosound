import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, FontFamily, AccessibilitySize } from '@/constants/theme';
import { contentColumn } from '@/constants/layout';

// App never leaves 1.0.0 without a version bump, so this doubles as the
// policy's own "last updated" date without a second constant to keep in sync.
const LAST_UPDATED = '2026-11-04T12:00:00';

// Bodies are read with { context: Platform.OS }: `dataBody_ios` and
// `networkBody_ios` name Apple and iCloud; any platform without its own
// variant falls back to the plain (Play) text.
const SECTIONS = [
  ['summaryTitle', 'summaryBody'],
  ['dataTitle', 'dataBody'],
  ['networkTitle', 'networkBody'],
  ['accountsTitle', 'accountsBody'],
  ['childrenTitle', 'childrenBody'],
  ['changesTitle', 'changesBody'],
  ['contactTitle', 'contactBody'],
] as const;

export default function PrivacyScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const updated = new Date(LAST_UPDATED).toLocaleDateString(i18n.language, { dateStyle: 'long' });

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
          {t('privacy.updated', { date: updated })}
        </Text>

        {SECTIONS.map(([titleKey, bodyKey], index) => (
          <View key={titleKey} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(`privacy.${titleKey}`)}</Text>
            {/* The summary is the page's whole message; the rest is the detail. */}
            <Text
              style={[
                index === 0 ? styles.summaryBody : styles.sectionBody,
                { color: index === 0 ? colors.text : colors.textSecondary },
              ]}
            >
              {t(`privacy.${bodyKey}`, { context: Platform.OS })}
            </Text>
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
  summaryBody: {
    ...Typography.headline,
    lineHeight: 24,
  },
  sectionBody: {
    ...Typography.body,
    lineHeight: 21,
  },
});
