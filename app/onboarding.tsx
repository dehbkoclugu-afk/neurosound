/**
 * Onboarding — 3 steps: what the app does, why headphones, sound safety.
 * Sets hasSeenOnboarding + hasSeenEpilepsyWarning on completion.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, AccessibilitySize } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';

const STEPS = [
  {
    icon: 'musical-notes' as const,
    titleKey: 'onboarding.step1Title',
    descKey: 'onboarding.step1Desc',
  },
  {
    icon: 'headset' as const,
    titleKey: 'onboarding.step2Title',
    descKey: 'onboarding.step2Desc',
  },
  {
    icon: 'shield-checkmark' as const,
    titleKey: 'onboarding.step3Title',
    descKey: 'onboarding.step3Desc',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { setHasSeenOnboarding, setHasSeenEpilepsyWarning } = useSettingsStore();

  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const handleNext = () => {
    if (isLast) {
      setHasSeenOnboarding(true);
      setHasSeenEpilepsyWarning(true);
      router.back();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '22' }]}>
          <Ionicons name={current.icon} size={44} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t(current.titleKey)}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t(current.descKey)}
        </Text>
      </View>

      <View style={styles.footer}>
        {/* Step indicator */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === step ? colors.primary : colors.slider,
                  width: i === step ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.button, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={isLast ? t('onboarding.start') : t('onboarding.next')}
        >
          <Text style={styles.buttonText}>
            {isLast ? t('onboarding.start') : t('onboarding.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title1,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    minHeight: AccessibilitySize.minTouchTarget + 4,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...Typography.headline,
    color: '#1A140C',
  },
});
