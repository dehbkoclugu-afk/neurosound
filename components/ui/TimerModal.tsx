/**
 * Sleep timer picker, shared by the player and the mixer.
 *
 * It used to live inside the player screen, which is why the mixer — the thing
 * people actually build a sleep sound out of — had no timer at all and played
 * until the battery died.
 */

import React from 'react';
import { Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, FontFamily } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';
import * as playerController from '@/lib/audio/playerController';
import * as haptics from '@/lib/haptics';

/** Minutes. 45 covers a nap and the usual sleep-onset window; 8 hours covers a
 *  night, which is the point of the feature and was previously unreachable —
 *  the longest option was two hours. */
export const TIMER_OPTIONS: { labelKey: string; value: number | null }[] = [
  { labelKey: 'player.timerOptions.none', value: null },
  { labelKey: 'player.timerOptions.15min', value: 15 },
  { labelKey: 'player.timerOptions.30min', value: 30 },
  { labelKey: 'player.timerOptions.45min', value: 45 },
  { labelKey: 'player.timerOptions.1hour', value: 60 },
  { labelKey: 'player.timerOptions.2hours', value: 120 },
  { labelKey: 'player.timerOptions.8hours', value: 480 },
];

/** m:ss under an hour, h:mm:ss past it — a two hour timer used to read
 *  "120:00" in an 11pt badge. */
export function formatTimerValue(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
}

interface TimerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TimerModal({ visible, onClose }: TimerModalProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { reduceMotion } = useSettingsStore();
  const { timerDuration } = useAudioStore();

  const handleSelect = (value: number | null) => {
    haptics.select();
    playerController.startTimer(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      >
        {/* Stops a tap inside the sheet from dismissing it. */}
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.backgroundSecondary }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            {t('player.timer')}
          </Text>

          {TIMER_OPTIONS.map((option) => {
            const isSelected = timerDuration === option.value;
            return (
              <TouchableOpacity
                key={option.labelKey}
                onPress={() => handleSelect(option.value)}
                style={[styles.option, { borderBottomColor: colors.cardBorder }]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isSelected ? colors.primary : colors.text },
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {t(option.labelKey)}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.primary}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  />
                )}
              </TouchableOpacity>
            );
          })}

          {/* Dismissing by tapping the scrim is not discoverable on its own. */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.cancel}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  sheet: {
    borderRadius: 20,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  title: {
    ...Typography.title3,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    ...Typography.body,
  },
  optionTextSelected: {
    fontFamily: FontFamily.semibold,
  },
  cancel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: Spacing.sm,
  },
  cancelText: {
    ...Typography.body,
    fontFamily: FontFamily.semibold,
  },
});
