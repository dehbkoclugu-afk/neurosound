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

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, AccessibilitySize } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { PresetCard } from '@/components/ui/PresetCard';
import { getIntentById } from '@/lib/intents';
import { getPresetById, FrequencyPreset } from '@/lib/frequencies';

export default function IntentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { hasSeenHeadphoneWarning, setHasSeenHeadphoneWarning } = useSettingsStore();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t(intent.nameKey)}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t(intent.descKey)}
        </Text>

        <View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  backButton: {
    width: AccessibilitySize.minTouchTarget,
    height: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.title1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  description: {
    ...Typography.subhead,
    lineHeight: 21,
    marginBottom: Spacing.lg,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
