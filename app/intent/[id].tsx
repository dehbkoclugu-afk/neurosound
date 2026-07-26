/**
 * Intent Screen — curated presets for one goal (sleep, focus, relax, meditate)
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, AccessibilitySize, withAlpha } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { PresetCard } from '@/components/ui/PresetCard';
import { useMiniPlayerInset } from '@/hooks/use-mini-player';
import { contentColumn } from '@/constants/layout';
import { getIntentById } from '@/lib/intents';
import { getPresetById, FrequencyPreset } from '@/lib/frequencies';

export default function IntentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const miniPlayerInset = useMiniPlayerInset();
  const { hasSeenHeadphoneWarning, setHasSeenHeadphoneWarning, reduceMotion } = useSettingsStore();
  const { isFavorite } = usePresetsStore();

  const intent = id ? getIntentById(id) : undefined;

  const presets = (intent?.presetIds ?? [])
    .map((presetId) => getPresetById(presetId))
    .filter((p): p is FrequencyPreset => p !== undefined);

  const handlePresetPress = (presetId: string) => {
    const preset = getPresetById(presetId);
    if (preset?.type === 'binaural' && !hasSeenHeadphoneWarning) {
      Alert.alert(t('home.headphoneWarning'), t('home.headphoneWarningDesc'), [
        {
          text: t('common.ok'),
          onPress: () => {
            setHasSeenHeadphoneWarning(true);
            router.push(`/player/${presetId}`);
          },
        },
      ]);
    } else {
      router.push(`/player/${presetId}`);
    }
  };

  if (!intent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>{t('common.error')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: miniPlayerInset + Spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-bleed hero — image, scrim, title overlaid. Fades in as one
            surface rather than snapping in under the screen's own fade
            transition, echoing the block that was just tapped on Home. */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(350)}
          style={styles.hero}
        >
          <Image
            source={{ uri: intent.image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
          {/* Same split as the home blocks: colour is decorative, the
              legibility floor is its own vertical pass. */}
          <LinearGradient
            colors={[withAlpha(intent.color, 0.33), 'transparent']}
            locations={[0, 0.6]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)', colors.background]}
            locations={[0.3, 0.72, 1]}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { top: insets.top + Spacing.sm }]}
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle} accessibilityRole="header">
              {t(intent.nameKey)}
            </Text>
            <Text style={styles.heroDesc}>{t(intent.descKey)}</Text>
          </View>
        </Animated.View>

        <View style={[styles.list, contentColumn]}>
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onPress={() => handlePresetPress(preset.id)}
              isFavorite={isFavorite(preset.id)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: Spacing.xl,
  },
  hero: {
    height: 260,
    justifyContent: 'flex-end',
    marginBottom: Spacing.md,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.sm,
    width: AccessibilitySize.minTouchTarget,
    height: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  heroTitle: {
    ...Typography.largeTitle,
    color: '#FFFFFF',
  },
  heroDesc: {
    ...Typography.subhead,
    color: 'rgba(255,255,255,0.85)',
    maxWidth: 320,
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
