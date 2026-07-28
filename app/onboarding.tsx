/**
 * Onboarding — 3 steps: what the app does, why headphones, sound safety.
 * Sets hasSeenOnboarding + hasSeenEpilepsyWarning on completion.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, AccessibilitySize, FontFamily, onPrimary, Radius, ControlSize, BADGE_ALPHA, withAlpha } from '@/constants/theme';
import { useSettingsStore, Language } from '@/stores/settingsStore';
import i18n from '@/i18n';
import { PressableScale } from '@/components/ui/PressableScale';
import { contentColumn } from '@/constants/layout';

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

/** Ticks around the step icon — the dial's own mark, at the one moment the
 *  user has never seen the dial. A bare 40pt stock glyph was the first thing
 *  the app showed and it belonged to no design in particular. */
const RING_TICKS = 16;

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const {
    setHasSeenOnboarding,
    setHasSeenEpilepsyWarning,
    setHasSeenHeadphoneWarning,
    reduceMotion,
    language,
    setLanguage,
  } = useSettingsStore();

  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  // The PanResponder is built once, so it reads the handlers through a ref
  // rather than closing over stale ones — the same trap the Slider and the
  // Dial each hit before.
  const stepRef = useRef({ next: () => {}, back: () => {} });

  // One value drives every dot; each interpolates its own width from the
  // distance to the current step, so the indicator glides instead of snapping.
  const stepAnim = useRef(new Animated.Value(0)).current;

  // Entering copy: fade up. Enter-only — the outgoing text is already gone by
  // the time this runs, and animating both ways would just add latency to a
  // screen the user wants to get through.
  const contentAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      stepAnim.setValue(step);
      contentAnim.setValue(1);
      return;
    }

    Animated.timing(stepAnim, {
      toValue: step,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width is a layout property
    }).start();

    contentAnim.setValue(0);
    const content = Animated.timing(contentAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    content.start();

    return () => content.stop();
  }, [step, reduceMotion, stepAnim, contentAnim]);

  // Arriving here from a deep link (or a future "replay onboarding" entry
  // point) means there may be no history to pop — back() would exit the app
  // instead of landing on Home.
  const closeOnboarding = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // Skipping still records the flags: the alternative is re-showing all three
  // screens on every launch to someone who has already said no.
  const finish = () => {
    setHasSeenOnboarding(true);
    setHasSeenEpilepsyWarning(true);
    setHasSeenHeadphoneWarning(true);
    closeOnboarding();
  };

  const handleLanguage = (next: Language) => {
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // Three screens with a Next button and no way back is a form, not an
  // introduction. Both the button and the horizontal drag now go both ways.
  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_e, g) => {
        if (g.dx < -40) stepRef.current.next();
        else if (g.dx > 40) stepRef.current.back();
      },
    })
  ).current;

  const handleNext = () => {
    if (isLast) {
      setHasSeenOnboarding(true);
      setHasSeenEpilepsyWarning(true);
      // Step 2 already covered headphones; repeating it in an alert on the
      // first binaural tap is the same sentence three times in two minutes.
      setHasSeenHeadphoneWarning(true);
      closeOnboarding();
    } else {
      setStep(step + 1);
    }
  };

  stepRef.current = { next: handleNext, back: handleBack };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        {/* Language lives here because the very first screen is already text
            the user may not read — asking them to find Settings first is
            backwards. */}
        <View style={styles.languageRow}>
          {(['tr', 'en'] as Language[]).map((code) => (
            <TouchableOpacity
              key={code}
              onPress={() => handleLanguage(code)}
              style={[
                styles.languageButton,
                language === code && {
                  backgroundColor: withAlpha(colors.accent, BADGE_ALPHA),
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: language === code }}
              accessibilityLabel={code === 'tr' ? 'Türkçe' : 'English'}
            >
              <Text
                style={[
                  styles.languageText,
                  {
                    color: language === code ? colors.accent : colors.textSecondary,
                  },
                ]}
              >
                {code.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={finish}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.skip')}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            {t('onboarding.skip')}
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        {...swipe.panHandlers}
        style={[
          styles.content,
          {
            opacity: contentAnim,
            transform: reduceMotion
              ? []
              : [
                  {
                    translateY: contentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
          },
        ]}
      >
        <View
          style={styles.stepMark}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length: RING_TICKS }).map((_, i) => (
            <View
              key={i}
              style={[
                StyleSheet.absoluteFillObject,
                styles.tickPivot,
                { transform: [{ rotate: `${(360 / RING_TICKS) * i}deg` }] },
              ]}
            >
              <View
                style={[
                  styles.tick,
                  { backgroundColor: withAlpha(colors.accent, i % 4 === 0 ? 0.7 : 0.35) },
                ]}
              />
            </View>
          ))}
          <Ionicons name={current.icon} size={36} color={colors.accent} />
        </View>
        <Text
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="header"
        >
          {t(current.titleKey)}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t(current.descKey)}
        </Text>
      </Animated.View>

      <View style={[styles.footer, contentColumn]}>
        {/* Step indicator */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === step ? colors.accent : colors.slider,
                  width: stepAnim.interpolate({
                    inputRange: [i - 1, i, i + 1],
                    outputRange: [8, 22, 8],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonRow}>
          {step > 0 && (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backButton, { borderColor: colors.cardBorder }]}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <PressableScale
            onPress={handleNext}
            style={[styles.button, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={isLast ? t('onboarding.start') : t('onboarding.next')}
          >
            <Text style={styles.buttonText}>
              {isLast ? t('onboarding.start') : t('onboarding.next')}
            </Text>
          </PressableScale>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  languageRow: {
    flexDirection: 'row',
  },
  languageButton: {
    minWidth: AccessibilitySize.minTouchTarget,
    height: ControlSize.field,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageText: {
    ...Typography.body,
    fontFamily: FontFamily.semibold,
  },
  skipButton: {
    height: AccessibilitySize.minTouchTarget,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    ...Typography.body,
  },
  stepMark: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  tickPivot: {
    alignItems: 'center',
  },
  tick: {
    width: 1.5,
    height: 6,
    borderRadius: 1,
  },
  // Was centred in the whole screen, which left a third of the page empty
  // above the title and another third below it. Sitting a little high puts
  // the words where the eye lands.
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  title: {
    ...Typography.largeTitle,
    textAlign: 'center',
    marginBottom: Spacing.lg,
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.sm,
  },
  backButton: {
    width: ControlSize.cta,
    minHeight: ControlSize.cta,
    borderRadius: Radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Radius.card, like every other button in the app. A 26px pill here and on
  // the Intent screen were the only two survivors of the old rounded
  // language.
  button: {
    flex: 1,
    minHeight: ControlSize.cta,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...Typography.headline,
    color: onPrimary,
  },
});
