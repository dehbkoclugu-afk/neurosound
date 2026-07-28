/**
 * The one modal grammar in the app.
 *
 * There were three: the timer was a centred dialog capped at 320pt, saving a
 * mix was a bottom sheet, and picking a sound was a full-screen modal — three
 * ways of saying "a thing has come forward, deal with it and go back". Two of
 * them lived on the same screen.
 *
 * Everything now arrives from the bottom edge. Compact sheets hug their
 * content; `tall` is for content that scrolls (the 33-preset picker), and is
 * still a sheet — the background stays visible so it reads as a layer over
 * the screen, not a new screen.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { AccessibilitySize, Radius, Spacing, Typography } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Fixed-height, for content that scrolls. Compact sheets size to content. */
  tall?: boolean;
  /** Lift the sheet above the keyboard. Only the sheets with a text field
   *  need it; switching it on everywhere adds a layout pass for nothing. */
  avoidKeyboard?: boolean;
  children: React.ReactNode;
}

export function Sheet({
  visible,
  onClose,
  title,
  tall = false,
  avoidKeyboard = false,
  children,
}: SheetProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { reduceMotion } = useSettingsStore();

  const body = (
    <Pressable
      style={[styles.overlay, { backgroundColor: colors.overlay }]}
      onPress={onClose}
    >
      {/* Stops a tap inside the sheet from dismissing it. */}
      <Pressable
        style={[
          styles.sheet,
          tall && styles.sheetTall,
          { backgroundColor: colors.backgroundSecondary },
        ]}
        onPress={(e) => e.stopPropagation()}
      >
        {/* Grabber: the one mark that says "this came from the bottom edge
            and goes back there". It is decorative — the close button is the
            accessible control. */}
        <View
          style={[styles.grabber, { backgroundColor: colors.cardBorder }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            {title}
          </Text>
          {/* Dismissing by tapping the scrim is not discoverable on its own. */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.close}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {children}
      </Pressable>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    // Clears the home indicator without a safe-area subscription inside a
    // modal, which is unreliable across platforms.
    paddingBottom: Spacing.xxl,
    maxHeight: '90%',
  },
  sheetTall: {
    height: '85%',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: Radius.pill,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title,
    flex: 1,
  },
  close: {
    width: AccessibilitySize.minTouchTarget,
    height: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    // Pull the icon to the sheet's optical edge without shrinking its target.
    marginRight: -Spacing.sm,
  },
});
