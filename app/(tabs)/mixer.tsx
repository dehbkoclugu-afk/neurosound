/**
 * Mixer Screen - Create Custom Sound Mixes
 * Modern card-based design with clean UI
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, AccessibilitySize, Shadows, GradientColors } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { useAudioStore } from '@/stores/audioStore';
import { CategoryHeader } from '@/components/ui/CategoryHeader';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { allPresets, FrequencyPreset } from '@/lib/frequencies';
import * as playerController from '@/lib/audio/playerController';

const getGradientColors = (preset: FrequencyPreset): string[] => {
  if (preset.type === 'binaural' && preset.binauralType) {
    return GradientColors[preset.binauralType] || [preset.color, preset.color];
  }
  if (preset.type === 'noise' && preset.noiseType) {
    return GradientColors[preset.noiseType] || [preset.color, preset.color];
  }
  if (preset.type === 'solfeggio') {
    // Use preset-specific gradient if available
    return GradientColors[preset.id] || GradientColors.solfeggio || [preset.color, preset.color];
  }
  return GradientColors.solfeggio;
};

export default function MixerScreen() {
  const { t } = useTranslation();
  const { reduceMotion } = useSettingsStore();
  const { addCustomMix, customMixes, deleteCustomMix } = usePresetsStore();
  const { mixerChannels: channels, isMixerPlaying: isPlaying } = useAudioStore();

  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [mixName, setMixName] = useState('');

  const colors = useThemeColors();

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      playerController.mixerStop();
    } else {
      await playerController.mixerStart();
    }
  }, [isPlaying]);

  const handleAddChannel = useCallback(async (preset: FrequencyPreset) => {
    const added = await playerController.mixerAddChannel(preset);
    if (!added) {
      Alert.alert(t('mixer.maxChannels'), t('mixer.maxChannelsDesc'));
      return;
    }
    setShowPresetPicker(false);
  }, [t]);

  const handleRemoveChannel = useCallback((channelId: string) => {
    playerController.mixerRemoveChannel(channelId);
  }, []);

  const handleVolumeChange = useCallback((channelId: string, volume: number) => {
    playerController.mixerSetChannelVolume(channelId, volume);
  }, []);

  const handleSaveMix = useCallback(() => {
    if (!mixName.trim()) {
      Alert.alert(t('common.error'), t('mixer.enterName'));
      return;
    }

    if (channels.length === 0) {
      Alert.alert(t('common.error'), t('mixer.addSoundFirst'));
      return;
    }

    addCustomMix({
      name: mixName.trim(),
      channels: channels.map(c => ({
        presetId: c.preset.id,
        volume: c.volume,
      })),
    });

    setMixName('');
    setShowSaveDialog(false);
    Alert.alert(t('common.saved'), t('mixer.mixSaved'));
  }, [mixName, channels, addCustomMix, t]);

  const handleLoadMix = useCallback((mix: typeof customMixes[0]) => {
    playerController.mixerLoadChannels(mix.channels);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('mixer.title')}
          </Text>
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="musical-notes" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {t('mixer.description')}
          </Text>
        </View>

        {/* Active Channels */}
        <View style={styles.section}>
          <CategoryHeader title={t('mixer.activeChannels')} />

          {channels.map(channel => {
            const gradientColors = getGradientColors(channel.preset);
            return (
              <View
                key={channel.id}
                style={[styles.channelCard, Shadows.small]}
              >
                <LinearGradient
                  colors={gradientColors as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.channelGradient}
                >
                  <View style={styles.channelHeader}>
                    <Text style={styles.channelName}>
                      {t(channel.preset.nameKey)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveChannel(channel.id)}
                      style={styles.removeButton}
                      accessibilityLabel={t('common.delete')}
                    >
                      <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.channelSlider}>
                    <Ionicons name="volume-low" size={16} color="rgba(255,255,255,0.7)" />
                    <View style={styles.sliderWrapper}>
                      <Slider
                        value={channel.volume}
                        onValueChange={(v) => handleVolumeChange(channel.id, v)}
                        max={1}
                        accessibilityLabel={`${t('mixer.volume')} ${t(channel.preset.nameKey)}`}
                      />
                    </View>
                    <Ionicons name="volume-high" size={16} color="rgba(255,255,255,0.7)" />
                  </View>
                </LinearGradient>
              </View>
            );
          })}

          {/* Add Channel Button */}
          {channels.length < playerController.MAX_MIXER_CHANNELS && (
            <TouchableOpacity
              onPress={() => setShowPresetPicker(true)}
              activeOpacity={reduceMotion ? 1 : 0.8}
              style={[
                styles.addButton,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + '10',
                },
              ]}
              accessibilityLabel={t('mixer.addSound')}
            >
              <Ionicons name="add-circle" size={32} color={colors.primary} />
              <Text style={[styles.addButtonText, { color: colors.primary }]}>
                {t('mixer.addSound')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Play/Pause Button */}
        {channels.length > 0 && (
          <View style={styles.playSection}>
            <TouchableOpacity
              onPress={handlePlayPause}
              activeOpacity={reduceMotion ? 1 : 0.8}
              style={[
                styles.playButton,
                { backgroundColor: colors.primary },
                Shadows.large,
              ]}
              accessibilityLabel={isPlaying ? t('common.pause') : t('common.play')}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="#FFFFFF"
                style={isPlaying ? undefined : { marginLeft: 4 }}
              />
            </TouchableOpacity>
            <Text style={[styles.playText, { color: colors.textSecondary }]}>
              {isPlaying ? t('common.pause') : t('common.play')}
            </Text>
          </View>
        )}

        {/* Save Button */}
        {channels.length > 0 && (
          <View style={styles.saveSection}>
            <Button
              title={t('mixer.savePreset')}
              onPress={() => setShowSaveDialog(true)}
              variant="secondary"
            />
          </View>
        )}

        {/* Saved Mixes */}
        {customMixes.length > 0 && (
          <View style={styles.section}>
            <CategoryHeader title={t('mixer.myMixes')} />
            {customMixes.map(mix => (
              <TouchableOpacity
                key={mix.id}
                onPress={() => handleLoadMix(mix)}
                activeOpacity={reduceMotion ? 1 : 0.8}
                style={[
                  styles.mixCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.mixInfo}>
                  <Ionicons name="layers" size={24} color={colors.primary} />
                  <View style={styles.mixTextContainer}>
                    <Text style={[styles.mixName, { color: colors.text }]}>
                      {mix.name}
                    </Text>
                    <Text style={[styles.mixChannels, { color: colors.textSecondary }]}>
                      {mix.channels.length} {t('mixer.sounds')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      t('common.delete'),
                      `${t('mixer.deleteMix')} "${mix.name}"?`,
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        {
                          text: t('common.delete'),
                          style: 'destructive',
                          onPress: () => deleteCustomMix(mix.id),
                        },
                      ]
                    );
                  }}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Preset Picker Modal */}
      <Modal
        visible={showPresetPicker}
        animationType={reduceMotion ? 'none' : 'slide'}
        onRequestClose={() => setShowPresetPicker(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.modalInner}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('mixer.addSound')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPresetPicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.presetList}>
              {allPresets.map(preset => {
                const gradientColors = getGradientColors(preset);
                return (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => handleAddChannel(preset)}
                    activeOpacity={reduceMotion ? 1 : 0.8}
                    style={[styles.presetItem, Shadows.small]}
                  >
                    <LinearGradient
                      colors={gradientColors as [string, string, ...string[]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.presetItemGradient}
                    >
                      <Text style={styles.presetItemName}>
                        {t(preset.nameKey)}
                      </Text>
                      <Ionicons name="add-circle" size={24} color="rgba(255,255,255,0.8)" />
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Save Dialog Modal */}
      <Modal
        visible={showSaveDialog}
        animationType={reduceMotion ? 'none' : 'slide'}
        onRequestClose={() => setShowSaveDialog(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.modalInner}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('mixer.savePreset')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowSaveDialog(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.saveForm}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('mixer.presetName')}
              </Text>
              <TextInput
                value={mixName}
                onChangeText={setMixName}
                placeholder={t('mixer.namePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.cardBorder,
                  },
                ]}
              />
              <Button title={t('common.save')} onPress={handleSaveMix} />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
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
    paddingHorizontal: Spacing.md,
    paddingBottom: 20,
  },
  header: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.largeTitle,
  },
  infoBanner: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    ...Typography.subhead,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  channelCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  channelGradient: {
    padding: Spacing.md,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  channelName: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  removeButton: {
    padding: Spacing.xs,
  },
  channelSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sliderWrapper: {
    flex: 1,
  },
  addButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    gap: Spacing.sm,
  },
  addButtonText: {
    ...Typography.headline,
  },
  playSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  playText: {
    ...Typography.subhead,
    fontWeight: '500',
  },
  saveSection: {
    marginBottom: Spacing.xl,
  },
  mixCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  mixInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mixTextContainer: {
    marginLeft: Spacing.md,
  },
  mixName: {
    ...Typography.headline,
  },
  mixChannels: {
    ...Typography.caption1,
    marginTop: 2,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  modal: {
    flex: 1,
  },
  modalInner: {
    flex: 1,
    padding: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  modalTitle: {
    ...Typography.title1,
  },
  closeButton: {
    width: AccessibilitySize.minTouchTarget,
    height: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetList: {
    flex: 1,
  },
  presetItem: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  presetItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  presetItemName: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  saveForm: {
    gap: Spacing.md,
  },
  label: {
    ...Typography.headline,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    ...Typography.body,
  },
});
