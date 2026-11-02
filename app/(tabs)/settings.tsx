/**
 * Settings Screen - User preferences and accessibility
 */

import React, { useCallback, useState } from 'react';
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
import type { TFunction } from 'i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  Spacing,
  Typography,
  FontFamily,
  Radius,
  ControlSize,
  Colors,
  BADGE_ALPHA,
  withAlpha,
} from '@/constants/theme';
import { useSettingsStore, ThemeMode } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { CategoryHeader } from '@/components/ui/CategoryHeader';
import { Slider } from '@/components/ui/Slider';
import { useToastStore } from '@/stores/toastStore';
import { LanguageRow, LanguageSheet } from '@/components/ui/LanguageSheet';
import { Sheet } from '@/components/ui/Sheet';
import { useMiniPlayerInset } from '@/hooks/use-mini-player';
import { contentColumn } from '@/constants/layout';
import i18n from '@/i18n';
import * as playerController from '@/lib/audio/playerController';

/** Each theme shows what it looks like: surface colour on the left half,
 *  accent on the right. `auto` shows both light and dark surfaces. */
/** "6 sa 20 dk" / "48 dk" — hours only once there are any. The units were
 *  hard-coded English ("6h 20m") in every language. */
function formatListened(totalSeconds: number, t: TFunction): string {
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours > 0
    ? t('settings.listenedHours', { h: hours, m: minutes % 60 })
    : t('settings.listenedMinutes', { m: minutes });
}

const THEME_OPTIONS: {
  value: ThemeMode;
  labelKey: string;
  swatch: [string, string];
}[] = [
  {
    value: 'light',
    labelKey: 'settings.themes.light',
    swatch: [Colors.light.background, Colors.light.accent],
  },
  {
    value: 'dark',
    labelKey: 'settings.themes.dark',
    swatch: [Colors.dark.background, Colors.dark.accent],
  },
  {
    value: 'auto',
    labelKey: 'settings.themes.auto',
    swatch: [Colors.light.background, Colors.dark.background],
  },
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
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
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
          // The reset restores the 80% safety cap; apply it to sound that is
          // already playing, as the slider itself does.
          playerController.syncVolume();
          // Every other control on this screen confirms itself by moving —
          // a switch flips, a theme repaints the app. Reset is the one that
          // does its work off-screen and left nothing behind to see.
          showToast(t('settings.resetDone'), 'success');
        },
      },
    ]);
  }, [t, resetPresets, resetSettings, showToast]);

  // The cap is a hearing-safety control — it has to apply to audio that's
  // already playing, not just the next time a player screen happens to
  // mount and re-run its own volume sync.
  const handleMaxVolumeChange = (value: number) => {
    setMaxVolume(value);
    playerController.syncVolume();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
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
          <CategoryHeader
            title={t('settings.appearance')}
            style={styles.sectionHeader}
          />

          <View
            style={[
              styles.group,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Theme: a row that states the current choice and opens a sheet,
                like Language. Three large swatch tiles were the heaviest thing
                on a screen of plain switches. */}
            <TouchableOpacity
              onPress={() => setShowThemeSheet(true)}
              style={[styles.card, styles.valueRow, { borderBottomColor: colors.cardBorder }]}
              accessibilityRole="button"
              accessibilityLabel={`${t('settings.theme')}: ${t(THEME_OPTIONS.find((o) => o.value === theme)?.labelKey ?? '')}`}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('settings.theme')}
              </Text>
              <View style={styles.valueRight}>
                <Text style={[styles.valueText, { color: colors.textSecondary }]}>
                  {t(THEME_OPTIONS.find((o) => o.value === theme)?.labelKey ?? '')}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {/* Reduce Motion */}
            <View
              style={[styles.card, { borderBottomColor: colors.cardBorder }]}
            >
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <View style={styles.switchText}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {t('settings.reduceMotion')}
                    </Text>
                    <Text
                      style={[styles.cardHint, { color: colors.textSecondary }]}
                    >
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
                  {...({
                    activeThumbColor: '#fff',
                    activeTrackColor: colors.accent,
                  } as any)}
                />
              </View>
            </View>

            {/* Low Contrast */}
            <View
              style={[styles.card, { borderBottomColor: colors.cardBorder }]}
            >
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <View style={styles.switchText}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {t('settings.lowContrast')}
                    </Text>
                    <Text
                      style={[styles.cardHint, { color: colors.textSecondary }]}
                    >
                      {t('settings.lowContrastHint')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={lowContrast}
                  onValueChange={setLowContrast}
                  trackColor={{ false: colors.slider, true: colors.accent }}
                  thumbColor="#fff"
                  {...({
                    activeThumbColor: '#fff',
                    activeTrackColor: colors.accent,
                  } as any)}
                />
              </View>
            </View>

            {/* Haptics */}
            <View
              style={[
                styles.card,
                styles.lastCard,
                { borderBottomColor: colors.cardBorder },
              ]}
            >
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <View style={styles.switchText}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {t('settings.haptics')}
                    </Text>
                    <Text
                      style={[styles.cardHint, { color: colors.textSecondary }]}
                    >
                      {t('settings.hapticsHint')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={haptics}
                  onValueChange={setHaptics}
                  trackColor={{ false: colors.slider, true: colors.accent }}
                  thumbColor="#fff"
                  {...({
                    activeThumbColor: '#fff',
                    activeTrackColor: colors.accent,
                  } as any)}
                />
              </View>
            </View>
          </View>
          {/* A footnote under the group it concerns, not a tinted row in the
              middle of it: it informs, it is not a setting. */}
          <View style={styles.footnoteRow}>
            <Ionicons name="warning-outline" size={15} color={colors.textSecondary} />
            <Text style={[styles.footnote, { color: colors.textSecondary }]}>
              {t('settings.epilepsyWarning')}: {t('settings.epilepsyText')}
            </Text>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <CategoryHeader
            title={t('settings.language')}
            style={styles.sectionHeader}
          />

          {/* Eleven languages do not fit in a row of pills, and a settings
              screen should not change shape because of what is in the list. */}
          <View
            style={[
              styles.group,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.card,
                styles.lastCard,
                { borderBottomColor: colors.cardBorder, paddingVertical: Spacing.xs },
              ]}
            >
              {/* The row brings its own 48pt height; the card's full padding on
                  top of it made this one row half again as tall as Theme. */}
              <LanguageRow onPress={() => setShowLanguageSheet(true)} />
            </View>
          </View>
        </View>

        {/* Audio Section */}
        <View style={styles.section}>
          <CategoryHeader
            title={t('settings.audio')}
            style={styles.sectionHeader}
          />

          <View
            style={[
              styles.group,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.card,
                styles.lastCard,
                { borderBottomColor: colors.cardBorder },
              ]}
            >
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
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <CategoryHeader
            title={t('settings.about')}
            style={styles.sectionHeader}
          />

          <View
            style={[
              styles.group,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* The one irreversible control in Settings, and the only thing
              separating it from "Privacy policy" was the colour of four
              words. It carries the destructive icon in a tinted badge, the
              same language the mixer's delete uses. */}
            <TouchableOpacity
              onPress={handleReset}
              style={[
                styles.card,
                styles.resetRow,
                { borderBottomColor: colors.cardBorder },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('settings.reset')}
            >
              <View
                style={[
                  styles.resetBadge,
                  { backgroundColor: withAlpha(colors.error, BADGE_ALPHA) },
                ]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </View>
              <View style={styles.switchText}>
                <Text style={[styles.cardTitle, { color: colors.error }]}>
                  {t('settings.reset')}
                </Text>
                <Text
                  style={[styles.cardHint, { color: colors.textSecondary }]}
                >
                  {t('settings.resetHint', {
                    favorites: favoriteIds.length,
                    mixes: customMixes.length,
                  })}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/privacy')}
              style={[
                styles.card,
                styles.aboutRow,
                { borderBottomColor: colors.cardBorder },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('settings.privacyPolicy')}
            >
              <Text style={[styles.aboutLabel, { color: colors.text }]}>
                {t('settings.privacyPolicy')}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {/* The deck's own counter. The app kept a ten-item history and
              otherwise had no idea how much it had been used — in a
              catalogue-and-tape world that is the one number the metaphor was
              already promising. */}
            <View
              style={[styles.card, { borderBottomColor: colors.cardBorder }]}
            >
              <View style={styles.aboutRow}>
                <Text
                  style={[styles.aboutLabel, { color: colors.textSecondary }]}
                >
                  {t('settings.totalListening')}
                </Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>
                  {formatListened(listenedSeconds, t)}
                </Text>
              </View>
              <View style={styles.aboutRow}>
                <Text
                  style={[styles.aboutLabel, { color: colors.textSecondary }]}
                >
                  {t('settings.sessions')}
                </Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>
                  {sessionCount}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.card,
                styles.lastCard,
                { borderBottomColor: colors.cardBorder },
              ]}
            >
              <View style={styles.aboutRow}>
                <Text
                  style={[styles.aboutLabel, { color: colors.textSecondary }]}
                >
                  {t('settings.version')}
                </Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>
                  {Constants.expoConfig?.version ?? '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <LanguageSheet
        visible={showLanguageSheet}
        onClose={() => setShowLanguageSheet(false)}
      />

      <Sheet
        visible={showThemeSheet}
        onClose={() => setShowThemeSheet(false)}
        title={t('settings.theme')}
      >
        {THEME_OPTIONS.map((option) => {
          const selected = theme === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                setTheme(option.value);
                setShowThemeSheet(false);
              }}
              style={[styles.sheetRow, { borderBottomColor: colors.cardBorder }]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.sheetRowText,
                  { color: selected ? colors.accent : colors.text },
                ]}
              >
                {t(option.labelKey)}
              </Text>
              {selected && <Ionicons name="checkmark" size={20} color={colors.accent} />}
            </TouchableOpacity>
          );
        })}
      </Sheet>
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
  group: {
    borderWidth: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  // CategoryHeader already carries the shared label styling and its own
  // vertical rhythm; this only trims its top margin, since a Settings
  // section sits directly under the previous card's divider.
  sectionHeader: {
    marginTop: Spacing.md,
  },
  card: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastCard: {
    borderBottomWidth: 0,
  },
  cardTitle: {
    ...Typography.body,
    fontFamily: FontFamily.semibold,
  },
  resetBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ControlSize.row,
  },
  valueRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  valueText: {
    ...Typography.body,
  },
  footnoteRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.sm,
  },
  footnote: {
    ...Typography.caption,
    flex: 1,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ControlSize.row,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetRowText: {
    ...Typography.body,
  },
});
