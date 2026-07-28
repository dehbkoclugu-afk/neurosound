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
import { Spacing, Typography, FontFamily, onPrimary, Radius, ControlSize, Colors, BADGE_ALPHA, withAlpha } from '@/constants/theme';
import { useSettingsStore, ThemeMode, Language } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { CategoryHeader } from '@/components/ui/CategoryHeader';
import { Slider } from '@/components/ui/Slider';
import { useToastStore } from '@/stores/toastStore';
import { useMiniPlayerInset } from '@/hooks/use-mini-player';
import { contentColumn } from '@/constants/layout';
import i18n from '@/i18n';
import * as playerController from '@/lib/audio/playerController';

/** Each theme shows what it looks like: paper colour on the left half, ink
 *  on the right. Four names in four identical pills told the user nothing
 *  about the difference between "dark" and "night", which is the entire
 *  reason both exist. `auto` shows both, because that is what it does. */
/** "6h 20m" / "48m" — hours only once there are any, and the tape-counter
 *  face makes the digits line up between the two rows. */
function formatListened(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

const THEME_OPTIONS: {
  value: ThemeMode;
  labelKey: string;
  swatch: [string, string];
}[] = [
  { value: 'light', labelKey: 'settings.themes.light', swatch: [Colors.light.background, Colors.light.accent] },
  { value: 'dark', labelKey: 'settings.themes.dark', swatch: [Colors.dark.background, Colors.dark.accent] },
  { value: 'night', labelKey: 'settings.themes.night', swatch: [Colors.night.background, Colors.night.accent] },
  { value: 'auto', labelKey: 'settings.themes.auto', swatch: [Colors.light.background, Colors.dark.background] },
];

/** The two-letter code is the catalogue register the rest of the app uses for
 *  identifiers; the name is what a person reads. */
const LANGUAGE_OPTIONS: { value: Language; label: string; code: string }[] = [
  { value: 'tr', label: 'Türkçe', code: 'TR' },
  { value: 'en', label: 'English', code: 'EN' },
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
  const {
    favoriteIds,
    customMixes,
    listenedSeconds,
    sessionCount,
    reset: resetPresets,
  } = usePresetsStore();

  const colors = useThemeColors();

  const showToast = useToastStore((st) => st.show);
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
          // Every other control on this screen confirms itself by moving —
          // a switch flips, a theme repaints the app. Reset is the one that
          // does its work off-screen and left nothing behind to see.
          showToast(t('settings.resetDone'), 'success');
        },
      },
    ]);
  }, [t, resetPresets, resetSettings, showToast]);

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
          <CategoryHeader title={t('settings.appearance')} style={styles.sectionHeader} />

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
                    styles.optionButtonHalf,
                    {
                      backgroundColor: theme === option.value ? colors.primary : colors.backgroundSecondary,
                      borderColor: theme === option.value ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: theme === option.value }}
                >
                  <View
                    style={[styles.swatch, { borderColor: colors.cardBorder }]}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <View style={[styles.swatchHalf, { backgroundColor: option.swatch[0] }]} />
                    <View style={[styles.swatchHalf, { backgroundColor: option.swatch[1] }]} />
                  </View>
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
          <View
            style={[
              styles.warningCard,
              {
                borderColor: withAlpha(colors.warning, 0.35),
                backgroundColor: withAlpha(colors.warning, 0.07),
              },
            ]}
          >
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
          <CategoryHeader title={t('settings.language')} style={styles.sectionHeader} />

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
                      styles.optionCode,
                      { color: language === option.value ? onPrimary : colors.textSecondary },
                    ]}
                  >
                    {option.code}
                  </Text>
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
          <CategoryHeader title={t('settings.audio')} style={styles.sectionHeader} />

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
          <CategoryHeader title={t('settings.about')} style={styles.sectionHeader} />

          {/* The one irreversible control in Settings, and the only thing
              separating it from "Privacy policy" was the colour of four
              words. It carries the destructive icon in a tinted badge, the
              same language the mixer's delete uses. */}
          <TouchableOpacity
            onPress={handleReset}
            style={[styles.card, styles.resetRow, { borderBottomColor: colors.cardBorder }]}
            accessibilityRole="button"
            accessibilityLabel={t('settings.reset')}
          >
            <View
              style={[styles.resetBadge, { backgroundColor: withAlpha(colors.error, BADGE_ALPHA) }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </View>
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

          {/* The deck's own counter. The app kept a ten-item history and
              otherwise had no idea how much it had been used — in a
              catalogue-and-tape world that is the one number the metaphor was
              already promising. */}
          <View style={[styles.card, { borderBottomColor: colors.cardBorder }]}>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>
                {t('settings.totalListening')}
              </Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>
                {formatListened(listenedSeconds)}
              </Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>
                {t('settings.sessions')}
              </Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>
                {sessionCount}
              </Text>
            </View>
          </View>

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
  // CategoryHeader already carries the shared label styling and its own
  // vertical rhythm; this only trims its top margin, since a Settings
  // section sits directly under the previous card's divider.
  sectionHeader: {
    marginTop: Spacing.md,
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
  // Two per row, equal width: four pills wrapping on their own put three on
  // one line and one orphan below in English and two-and-two in Turkish, so
  // the same control had a different shape per language.
  optionButtonHalf: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  swatch: {
    flexDirection: 'row',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    overflow: 'hidden',
  },
  swatchHalf: {
    flex: 1,
  },
  optionCode: {
    ...Typography.label,
    fontFamily: FontFamily.mono,
    letterSpacing: 1,
    marginRight: Spacing.xs,
  },
  resetBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: ControlSize.row,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: ControlSize.row,
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
    ...Typography.numeral,
  },
  // It sat between two switch rows with nothing but whitespace around it,
  // so it read as a stray paragraph rather than a notice.
  warningCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
