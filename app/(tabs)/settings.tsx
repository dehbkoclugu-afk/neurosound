/**
 * Settings Screen - User preferences and accessibility
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, AccessibilitySize } from '@/constants/theme';
import { useSettingsStore, ThemeMode, Language } from '@/stores/settingsStore';
import { Slider } from '@/components/ui/Slider';
import i18n from '@/i18n';

const THEME_OPTIONS: { value: ThemeMode; labelKey: string }[] = [
  { value: 'light', labelKey: 'settings.themes.light' },
  { value: 'dark', labelKey: 'settings.themes.dark' },
  { value: 'auto', labelKey: 'settings.themes.auto' },
];

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const {
    theme,
    setTheme,
    reduceMotion,
    setReduceMotion,
    lowContrast,
    setLowContrast,
    language,
    setLanguage,
    maxVolume,
    setMaxVolume,
  } = useSettingsStore();

  const colors = useThemeColors();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('settings.title')}
          </Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.appearance')}
          </Text>

          {/* Theme */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t('settings.theme')}
            </Text>
            <View style={styles.optionGroup}>
              {THEME_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setTheme(option.value)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: theme === option.value ? colors.primary : colors.backgroundSecondary,
                      borderColor: theme === option.value ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: theme === option.value }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: theme === option.value ? '#fff' : colors.text },
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reduce Motion */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Ionicons name="sparkles-outline" size={24} color={colors.icon} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {t('settings.reduceMotion')}
                </Text>
              </View>
              <Switch
                value={reduceMotion}
                onValueChange={setReduceMotion}
                trackColor={{ false: colors.slider, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Low Contrast */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Ionicons name="contrast-outline" size={24} color={colors.icon} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {t('settings.lowContrast')}
                </Text>
              </View>
              <Switch
                value={lowContrast}
                onValueChange={setLowContrast}
                trackColor={{ false: colors.slider, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.language')}
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.optionGroup}>
              {LANGUAGE_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleLanguageChange(option.value)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: language === option.value ? colors.primary : colors.backgroundSecondary,
                      borderColor: language === option.value ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: language === option.value }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: language === option.value ? '#fff' : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Audio Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.audio')}
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Slider
              value={maxVolume}
              onValueChange={setMaxVolume}
              min={0.1}
              max={1}
              step={0.1}
              label={t('settings.maxVolume')}
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.about')}
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>
                {t('settings.version')}
              </Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0</Text>
            </View>
          </View>

          {/* Epilepsy Warning */}
          <View style={[styles.warningCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="warning-outline" size={24} color={colors.warning} />
            <View style={styles.warningContent}>
              <Text style={[styles.warningTitle, { color: colors.text }]}>
                {t('settings.epilepsyWarning')}
              </Text>
              <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                {t('settings.epilepsyText')}
              </Text>
            </View>
          </View>
        </View>
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
    padding: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: 20,
  },
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: AccessibilitySize.borderRadiusLarge,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: AccessibilitySize.minTouchTarget,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutLabel: {
    fontSize: 14,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  warningCard: {
    flexDirection: 'row',
    borderRadius: AccessibilitySize.borderRadiusLarge,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
