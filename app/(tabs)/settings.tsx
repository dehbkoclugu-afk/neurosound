/**
 * Settings Screen - User preferences and accessibility
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, AccessibilitySize, Typography, FontFamily, onPrimary } from '@/constants/theme';
import { useSettingsStore, ThemeMode, Language } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { Slider } from '@/components/ui/Slider';
import { useMiniPlayerInset } from '@/hooks/use-mini-player';
import { contentColumn } from '@/constants/layout';
import i18n from '@/i18n';
import * as playerController from '@/lib/audio/playerController';

const THEME_OPTIONS: { value: ThemeMode; labelKey: string }[] = [
  { value: 'light', labelKey: 'settings.themes.light' },
  { value: 'dark', labelKey: 'settings.themes.dark' },
  { value: 'night', labelKey: 'settings.themes.night' },
  { value: 'auto', labelKey: 'settings.themes.auto' },
];

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    theme,
    setTheme,
    reduceMotion,
    setReduceMotion,
    lowContrast,
    setLowContrast,
    haptics,
    setHaptics,
    language,
    setLanguage,
    maxVolume,
    setMaxVolume,
    resetSettings,
  } = useSettingsStore();
  const { favoriteIds, customMixes, reset: resetPresets } = usePresetsStore();

  const colors = useThemeColors();
  const miniPlayerInset = useMiniPlayerInset();

  // resetSettings and presetsStore.reset both existed and were wired to
  // nothing — there was no way to undo a bad theme, clear favourites, or hand
  // the phone to someone else.
  const handleReset = useCallback(() => {
    Alert.alert(t('settings.resetTitle'), t('settings.resetConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.reset'),
        style: 'destructive',
        onPress: () => {
          resetPresets();
          resetSettings();
          i18n.changeLanguage(useSettingsStore.getState().language);
        },
      },
    ]);
  }, [t, resetPresets, resetSettings]);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  // The cap is a hearing-safety control — it has to apply to audio that's
  // already playing, not just the next time a player screen happens to
  // mount and re-run its own volume sync.
  const handleMaxVolumeChange = (value: number) => {
    setMaxVolume(value);
    playerController.syncVolume();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          contentColumn,
          { paddingBottom: miniPlayerInset + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            {t('settings.title')}
          </Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
            accessibilityRole="header"
          >
            {t('settings.appearance')}
          </Text>

          {/* Theme */}
          <View style={[styles.card, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.cardTitle, styles.cardTitleSpaced, { color: colors.text }]}>
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
                      { color: theme === option.value ? onPrimary : colors.text },
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reduce Motion */}
          <View style={[styles.card, { borderBottomColor: colors.cardBorder }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Ionicons
                  name="sparkles-outline"
                  size={24}
                  color={colors.icon}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
                <View style={styles.switchText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('settings.reduceMotion')}
                  </Text>
                  <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
                    {t('settings.reduceMotionHint')}
                  </Text>
                </View>
              </View>
              <Switch
                value={reduceMotion}
                onValueChange={setReduceMotion}
                trackColor={{ false: colors.slider, true: colors.accent }}
                thumbColor="#fff"
                // react-native-web's Switch reads *active*ThumbColor/TrackColor
                // for the ON state instead of thumbColor/trackColor.true — not
                // in RN's official type defs (web-only extension, harmless
                // no-op on native), so it needs a cast rather than a prop.
                // Left unset, web falls back to its hardcoded Material teal.
                {...({ activeThumbColor: '#fff', activeTrackColor: colors.accent } as any)}
              />
            </View>
          </View>

          {/* Sits with Reduce Motion because that is the control that
              answers it — the warning is about the breathing ring. */}
          <View style={styles.warningCard}>
            <View style={styles.warningHeading}>
              <Ionicons
                name="warning-outline"
                size={16}
                color={colors.warning}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
              <Text style={[styles.warningTitle, { color: colors.warning }]}>
                {t('settings.epilepsyWarning')}
              </Text>
            </View>
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              {t('settings.epilepsyText')}
            </Text>
          </View>

          {/* Low Contrast */}
          <View style={[styles.card, { borderBottomColor: colors.cardBorder }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Ionicons
                  name="contrast-outline"
                  size={24}
                  color={colors.icon}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
                <View style={styles.switchText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('settings.lowContrast')}
                  </Text>
                  <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
                    {t('settings.lowContrastHint')}
                  </Text>
                </View>
              </View>
              <Switch
                value={lowContrast}
                onValueChange={setLowContrast}
                trackColor={{ false: colors.slider, true: colors.accent }}
                thumbColor="#fff"
                {...({ activeThumbColor: '#fff', activeTrackColor: colors.accent } as any)}
              />
            </View>
          </View>

          {/* Haptics */}
          <View style={[styles.card, { borderBottomColor: colors.cardBorder }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color={colors.icon}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
                <View style={styles.switchText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('settings.haptics')}
                  </Text>
                  <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
                    {t('settings.hapticsHint')}
                  </Text>
                </View>
              </View>
              <Switch
                value={haptics}
                onValueChange={setHaptics}
                trackColor={{ false: colors.slider, true: colors.accent }}
                thumbColor="#fff"
                {...({ activeThumbColor: '#fff', activeTrackColor: colors.accent } as any)}
              />
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
            accessibilityRole="header"
          >
            {t('settings.language')}
          </Text>

          <View style={[styles.card, { borderBottomColor: colors.cardBorder }]}>
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
                      { color: language === option.value ? onPrimary : colors.text },
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
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
            accessibilityRole="header"
          >
            {t('settings.audio')}
          </Text>

          <View style={[styles.card, { borderBottomColor: colors.cardBorder }]}>
            <Slider
              value={maxVolume}
              onValueChange={handleMaxVolumeChange}
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
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
            accessibilityRole="header"
          >
            {t('settings.about')}
          </Text>

          <TouchableOpacity
            onPress={handleReset}
            style={[styles.card, styles.resetRow, { borderBottomColor: colors.cardBorder }]}
            accessibilityRole="button"
            accessibilityLabel={t('settings.reset')}
          >
            <View style={styles.switchText}>
              <Text style={[styles.cardTitle, { color: colors.error }]}>
                {t('settings.reset')}
              </Text>
              <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
                {t('settings.resetHint', {
                  favorites: favoriteIds.length,
                  mixes: customMixes.length,
                })}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/privacy')}
            style={[styles.card, styles.aboutRow, { borderBottomColor: colors.cardBorder }]}
            accessibilityRole="button"
            accessibilityLabel={t('settings.privacyPolicy')}
          >
            <Text style={[styles.aboutLabel, { color: colors.text }]}>
              {t('settings.privacyPolicy')}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.card, { borderBottomColor: colors.cardBorder }]}>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>
                {t('settings.version')}
              </Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>
                {Constants.expoConfig?.version ?? '—'}
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
  // Everything below uses Typography tokens. Raw fontWeight is a silent bug
  // here: React Native does not synthesize weights for the loaded Nunito Sans
  // faces, so `fontWeight: '700'` rendered this whole screen in the system
  // font while every other screen used Nunito.
  title: {
    ...Typography.largeTitle,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.title,
    marginBottom: Spacing.md,
  },
  card: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardTitle: {
    ...Typography.body,
    fontFamily: FontFamily.semibold,
  },
  cardTitleSpaced: {
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
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
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
    paddingRight: Spacing.md,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  cardHint: {
    ...Typography.footnote,
  },
  resetRow: {
    minHeight: AccessibilitySize.minTouchTarget,
    justifyContent: 'center',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutLabel: {
    ...Typography.footnote,
  },
  aboutValue: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
    fontVariant: ['tabular-nums'],
  },
  warningCard: {
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  warningHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  warningTitle: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
  },
  warningText: {
    ...Typography.footnote,
  },
});
