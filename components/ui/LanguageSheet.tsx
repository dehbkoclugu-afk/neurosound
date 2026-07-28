/**
 * The language picker, shared by Settings and onboarding.
 *
 * Two languages fitted in a row of pills. Eleven do not — they wrapped into a
 * block that changed shape per language, and in onboarding they would have
 * taken the whole top bar on the one screen that is supposed to say a single
 * thing. So the picker became a sheet (the app's one modal grammar) opened
 * from a row that shows what is currently selected.
 *
 * Each language is listed under its own name. "Chinese" is not much use to
 * someone who only reads Chinese, and the whole reason this list exists is
 * for people who cannot read the language it is currently in.
 */

import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Sheet } from './Sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ControlSize, FontFamily, Spacing, Typography } from '@/constants/theme';
import { LANGUAGES } from '@/locales';
import { useSettingsStore, Language } from '@/stores/settingsStore';
import i18n from '@/i18n';
import * as haptics from '@/lib/haptics';

interface LanguageSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSheet({ visible, onClose }: LanguageSheetProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { language, setLanguage } = useSettingsStore();

  const select = (code: Language) => {
    haptics.select();
    setLanguage(code);
    i18n.changeLanguage(code);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('settings.language')} tall>
      <ScrollView showsVerticalScrollIndicator={false}>
        {LANGUAGES.map((option) => {
          const selected = option.code === language;
          return (
            <TouchableOpacity
              key={option.code}
              onPress={() => select(option.code)}
              style={[styles.row, { borderBottomColor: colors.cardBorder }]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
            >
              {/* Decorative: the row is found by its name, and the flag is
                  only a colour cue. Hidden from screen readers, which would
                  otherwise announce a country before the language. */}
              <Text
                style={styles.flag}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {option.flag}
              </Text>
              <Text
                style={[
                  styles.label,
                  { color: selected ? colors.accent : colors.text },
                  selected && styles.labelSelected,
                ]}
              >
                {option.label}
              </Text>
              {selected && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={colors.accent}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

/** The row that opens the sheet: current language on the right, like every
 *  other "pick one" row in a settings app. */
export function LanguageRow({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { language } = useSettingsStore();
  const current = LANGUAGES.find((l) => l.code === language);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.trigger}
      accessibilityRole="button"
      accessibilityLabel={`${t('settings.language')}: ${current?.label ?? language}`}
    >
      <Text style={[styles.triggerLabel, { color: colors.text }]}>
        {current ? `${current.flag}  ${current.label}` : language}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: ControlSize.row,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flag: {
    fontSize: 20,
    width: 28,
  },
  label: {
    ...Typography.body,
    flex: 1,
  },
  labelSelected: {
    fontFamily: FontFamily.semibold,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ControlSize.row,
  },
  triggerLabel: {
    ...Typography.body,
  },
});
