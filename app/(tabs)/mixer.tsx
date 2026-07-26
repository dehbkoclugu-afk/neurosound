/**
 * Mixer Screen - Create Custom Sound Mixes
 * Modern card-based design with clean UI
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, AccessibilitySize, FontFamily, onPrimary } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePresetsStore } from '@/stores/presetsStore';
import { useAudioStore } from '@/stores/audioStore';
import { CategoryHeader } from '@/components/ui/CategoryHeader';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { TimerModal, formatTimerValue } from '@/components/ui/TimerModal';
import { Toast } from '@/components/ui/Toast';
import * as haptics from '@/lib/haptics';
import { Slider } from '@/components/ui/Slider';
import { useMiniPlayerInset } from '@/hooks/use-mini-player';
import { contentColumn } from '@/constants/layout';
import {
  binauralPresets,
  solfeggioPresets,
  noisePresets,
  FrequencyPreset,
} from '@/lib/frequencies';
import * as playerController from '@/lib/audio/playerController';

// Preset picker groups — 33 flat items is unusable; group by category
const pickerGroups = [
  { titleKey: 'explore.categories.binaural', presets: binauralPresets },
  { titleKey: 'explore.categories.solfeggio', presets: solfeggioPresets },
  { titleKey: 'explore.categories.noise', presets: noisePresets },
];

// One-tap sample mix for the empty state
const SAMPLE_MIX = [
  { presetId: 'noise-rain', volume: 0.6 },
  { presetId: 'noise-brown', volume: 0.35 },
  { presetId: 'binaural-alpha', volume: 0.5 },
];

export default function MixerScreen() {
  const { t } = useTranslation();
  const { reduceMotion } = useSettingsStore();
  const { addCustomMix, updateCustomMix, customMixes, deleteCustomMix } = usePresetsStore();
  const {
    mixerChannels: channels,
    isMixerPlaying: isPlaying,
    activeMixId,
    timerDuration,
    timerRemaining,
  } = useAudioStore();

  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [mixName, setMixName] = useState('');
  const [editingMixId, setEditingMixId] = useState<string | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const colors = useThemeColors();
  const miniPlayerInset = useMiniPlayerInset();

  const isEmpty = channels.length === 0;
  const isFull = channels.length >= playerController.MAX_MIXER_CHANNELS;

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
  }, []);

  // 33 presets in a flat scroll is unusable without a filter.
  const filteredPickerGroups = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    if (!query) return pickerGroups;
    return pickerGroups
      .map((group) => ({
        ...group,
        presets: group.presets.filter((preset) =>
          t(preset.nameKey).toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.presets.length > 0);
  }, [pickerQuery, t]);

  const handlePlayPause = useCallback(async () => {
    haptics.commit();
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
    setPickerQuery('');
    setShowPresetPicker(false);
  }, [t]);

  const handleRemoveChannel = useCallback((channelId: string) => {
    playerController.mixerRemoveChannel(channelId);
  }, []);

  const handleVolumeChange = useCallback((channelId: string, volume: number) => {
    playerController.mixerSetChannelVolume(channelId, volume);
  }, []);

  const handleToggleMute = useCallback((channelId: string, muted: boolean) => {
    haptics.select();
    playerController.mixerSetChannelMuted(channelId, muted);
  }, []);

  const closeSaveDialog = useCallback(() => {
    // Clear the draft on dismiss too, not only on a successful save — stale
    // text reappearing next time reads as a bug.
    setMixName('');
    setEditingMixId(null);
    setShowSaveDialog(false);
  }, []);

  const handleRenameMix = useCallback((mix: typeof customMixes[0]) => {
    setEditingMixId(mix.id);
    setMixName(mix.name);
    setShowSaveDialog(true);
  }, []);

  const handleSaveMix = useCallback(() => {
    if (!mixName.trim()) {
      Alert.alert(t('common.error'), t('mixer.enterName'));
      return;
    }

    if (editingMixId) {
      updateCustomMix(editingMixId, { name: mixName.trim() });
      haptics.save();
      setMixName('');
      setEditingMixId(null);
      setShowSaveDialog(false);
      showToast(t('mixer.mixRenamed'));
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

    haptics.save();
    setMixName('');
    setShowSaveDialog(false);
    showToast(t('mixer.mixSaved'));
  }, [mixName, channels, addCustomMix, updateCustomMix, editingMixId, showToast, t]);

  const handleLoadMix = useCallback(async (mix: typeof customMixes[0]) => {
    haptics.commit();
    await playerController.mixerLoadChannels(mix.channels, mix.id);
  }, []);

  const handleDeleteMix = useCallback(
    (mixId: string, name: string) => {
      Alert.alert(t('common.delete'), `${t('mixer.deleteMix')} "${name}"?`, [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteCustomMix(mixId),
        },
      ]);
    },
    [t, deleteCustomMix]
  );

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
            {t('mixer.title')}
          </Text>
        </View>

        {/* Quiet description */}
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          {t('mixer.description')}
        </Text>

        {/* Active Channels */}
        <View style={styles.section}>
          <CategoryHeader
            title={t('mixer.activeChannels')}
            subtitle={`${channels.length}/${playerController.MAX_MIXER_CHANNELS}`}
          />

          {/* Empty state teaches the mixer with a one-tap sample */}
          {channels.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {t('mixer.emptyDesc')}
              </Text>
              <TouchableOpacity
                onPress={() => playerController.mixerLoadChannels(SAMPLE_MIX)}
                style={styles.sampleButton}
                accessibilityRole="button"
              >
                <Text style={[styles.sampleButtonText, { color: colors.accent }]}>
                  {t('mixer.trySample')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {channels.map(channel => (
            <View
              key={channel.id}
              style={[styles.channelRow, { borderBottomColor: colors.cardBorder }]}
            >
              <View style={styles.channelHeader}>
                <Text
                  style={[
                    styles.channelName,
                    { color: channel.muted ? colors.textSecondary : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {t(channel.preset.nameKey)}
                </Text>
                <View style={styles.channelActions}>
                  <TouchableOpacity
                    onPress={() => handleToggleMute(channel.id, !channel.muted)}
                    style={styles.channelActionButton}
                    accessibilityRole="button"
                    accessibilityState={{ selected: channel.muted }}
                    accessibilityLabel={`${t('mixer.mute')} ${t(channel.preset.nameKey)}`}
                  >
                    <Ionicons
                      name={channel.muted ? 'volume-mute' : 'volume-medium-outline'}
                      size={20}
                      color={channel.muted ? colors.accent : colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveChannel(channel.id)}
                    style={styles.channelActionButton}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('common.delete')} ${t(channel.preset.nameKey)}`}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={channel.muted ? styles.mutedSlider : undefined}>
                <Slider
                  value={channel.volume}
                  onValueChange={(v) => handleVolumeChange(channel.id, v)}
                  max={1}
                  showValue={false}
                  accessibilityLabel={`${t('mixer.volume')} ${t(channel.preset.nameKey)}`}
                />
              </View>
            </View>
          ))}

          {/* Add Channel — always rendered. Letting it vanish at 4/4 left the
              user hunting for a button that had silently removed itself. */}
          <TouchableOpacity
            onPress={() => setShowPresetPicker(true)}
            activeOpacity={0.6}
            disabled={isFull}
            style={styles.addRow}
            accessibilityRole="button"
            accessibilityState={{ disabled: isFull }}
            accessibilityLabel={isFull ? t('mixer.channelsFull') : t('mixer.addSound')}
          >
            <Ionicons
              name={isFull ? 'information-circle-outline' : 'add'}
              size={20}
              color={isFull ? colors.textSecondary : colors.accent}
            />
            <Text
              style={[
                styles.addRowText,
                { color: isFull ? colors.textSecondary : colors.accent },
              ]}
            >
              {isFull ? t('mixer.channelsFull') : t('mixer.addSound')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transport — always present. Showing and hiding play/save as the
            first channel arrived made the whole page jump under the finger. */}
        <View style={styles.transport}>
          <View style={styles.transportRow}>
            {/* A mix is what people actually fall asleep to, and it had no
                timer at all — it played until the battery died. */}
            <TouchableOpacity
              onPress={() => setShowTimerModal(true)}
              disabled={isEmpty}
              style={styles.timerButton}
              accessibilityRole="button"
              accessibilityState={{ disabled: isEmpty }}
              accessibilityLabel={
                timerRemaining !== null && timerRemaining > 0
                  ? `${t('player.timer')}, ${formatTimerValue(timerRemaining)}`
                  : t('player.timer')
              }
            >
              <Ionicons
                name="timer-outline"
                size={24}
                color={
                  isEmpty
                    ? colors.tabIconDefault
                    : timerDuration
                      ? colors.primary
                      : colors.textSecondary
                }
              />
              {timerRemaining !== null && timerRemaining > 0 && (
                <Text
                  style={[styles.timerBadge, { color: colors.accent }]}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  {formatTimerValue(timerRemaining)}
                </Text>
              )}
            </TouchableOpacity>

            <PressableScale
              onPress={handlePlayPause}
              disabled={isEmpty}
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isEmpty }}
              accessibilityLabel={isPlaying ? t('common.pause') : t('common.play')}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color={onPrimary}
                style={isPlaying ? undefined : { marginLeft: 4 }}
              />
            </PressableScale>

            {/* Balances the timer slot so play stays centred. */}
            <View style={styles.timerButton} />
          </View>

          <Button
            title={t('mixer.savePreset')}
            onPress={() => setShowSaveDialog(true)}
            disabled={isEmpty}
            variant="secondary"
          />
        </View>

        {/* Saved Mixes */}
        {customMixes.length > 0 && (
          <View style={styles.section}>
            <CategoryHeader title={t('mixer.myMixes')} />
            {customMixes.map(mix => {
              const isActive = mix.id === activeMixId;
              return (
                /* Row and delete are siblings, not nested touchables — the
                   delete button used to live inside the row's own pressable,
                   so the two targets overlapped. */
                <View
                  key={mix.id}
                  style={[styles.mixRow, { borderBottomColor: colors.cardBorder }]}
                >
                  <TouchableOpacity
                    onPress={() => handleLoadMix(mix)}
                    activeOpacity={0.6}
                    style={styles.mixMain}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`${mix.name}, ${mix.channels.length} ${t('mixer.sounds')}`}
                  >
                    <View style={styles.mixTextContainer}>
                      <Text
                        style={[
                          styles.mixName,
                          { color: isActive ? colors.accent : colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {mix.name}
                      </Text>
                      <Text style={[styles.mixChannels, { color: colors.textSecondary }]}>
                        {isActive
                          ? t('mixer.loaded')
                          : `${mix.channels.length} ${t('mixer.sounds')}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRenameMix(mix)}
                    style={styles.deleteButton}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('mixer.renameMix')} ${mix.name}`}
                  >
                    <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteMix(mix.id, mix.name)}
                    style={styles.deleteButton}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('common.delete')} ${mix.name}`}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      <TimerModal
        visible={showTimerModal}
        onClose={() => setShowTimerModal(false)}
      />

      {/* Preset Picker Modal */}
      <Modal
        visible={showPresetPicker}
        animationType={reduceMotion ? 'none' : 'slide'}
        onRequestClose={() => {
          setPickerQuery('');
          setShowPresetPicker(false);
        }}
        accessibilityViewIsModal
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.modalInner}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('mixer.addSound')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setPickerQuery('');
                  setShowPresetPicker(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                value={pickerQuery}
                onChangeText={setPickerQuery}
                placeholder={t('explore.searchPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>
            <ScrollView style={styles.presetList}>
              {filteredPickerGroups.map(group => (
                <View key={group.titleKey}>
                  <Text style={[styles.pickerGroupTitle, { color: colors.textSecondary }]}>
                    {t(group.titleKey)}
                  </Text>
                  {group.presets.map(preset => (
                    <TouchableOpacity
                      key={preset.id}
                      onPress={() => handleAddChannel(preset)}
                      activeOpacity={0.6}
                      style={[styles.presetItem, { borderBottomColor: colors.cardBorder }]}
                    >
                      <Text style={[styles.presetItemName, { color: colors.text }]}>
                        {t(preset.nameKey)}
                      </Text>
                      <Ionicons name="add" size={22} color={colors.accent} />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Save / Rename Dialog — a single text field doesn't need a full
          screen, so it lives in a bottom sheet like the timer picker. */}
      <Modal
        visible={showSaveDialog}
        transparent
        animationType={reduceMotion ? 'none' : 'slide'}
        onRequestClose={closeSaveDialog}
        accessibilityViewIsModal
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlayWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]}
            onPress={closeSaveDialog}
          >
            <Pressable
              style={[styles.sheet, { backgroundColor: colors.backgroundSecondary }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.text }]} accessibilityRole="header">
                  {editingMixId ? t('mixer.renameMix') : t('mixer.savePreset')}
                </Text>
                <TouchableOpacity
                  onPress={closeSaveDialog}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.cancel')}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('mixer.presetName')}
              </Text>
              <TextInput
                value={mixName}
                onChangeText={setMixName}
                placeholder={t('mixer.namePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                autoFocus
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.cardBorder,
                  },
                ]}
              />
              <Button title={t('common.save')} onPress={handleSaveMix} />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
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
  infoText: {
    ...Typography.body,
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  channelRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelName: {
    ...Typography.headline,
  },
  channelActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelActionButton: {
    width: AccessibilitySize.minTouchTarget,
    height: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Muted reads as "still here, just silent" — dimmed, not removed.
  mutedSlider: {
    opacity: 0.4,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    minHeight: 52,
  },
  addRowText: {
    ...Typography.headline,
  },
  transport: {
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  timerButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    ...Typography.caption,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mixMain: {
    flex: 1,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    minHeight: 56,
  },
  mixTextContainer: {
    flex: 1,
    gap: 2,
  },
  mixName: {
    ...Typography.headline,
  },
  mixChannels: {
    ...Typography.caption,
  },
  deleteButton: {
    width: AccessibilitySize.minTouchTarget,
    height: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...Typography.title,
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
  pickerGroupTitle: {
    ...Typography.footnote,
    fontFamily: FontFamily.semibold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyState: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  emptyStateText: {
    ...Typography.body,
    lineHeight: 21,
  },
  sampleButton: {
    paddingVertical: Spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  sampleButtonText: {
    ...Typography.body,
    fontFamily: FontFamily.semibold,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  presetItemName: {
    ...Typography.body,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.sm,
  },
  label: {
    ...Typography.headline,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Typography.body,
  },
  sheetOverlayWrap: {
    flex: 1,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    ...Typography.title,
  },
});
