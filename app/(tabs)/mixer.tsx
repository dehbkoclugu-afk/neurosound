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
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, useCategoryColors } from '@/hooks/use-theme-colors';
import { Spacing, Typography, AccessibilitySize, FontFamily, BADGE_ALPHA, withAlpha, Radius, ControlSize } from '@/constants/theme';
import { usePresetsStore } from '@/stores/presetsStore';
import { useAudioStore } from '@/stores/audioStore';
import { CategoryHeader } from '@/components/ui/CategoryHeader';
import { Icon } from '@/components/ui/Icon';
import { presetIcon } from '@/components/ui/PresetRow';
import { Button } from '@/components/ui/Button';
import { TransportButton } from '@/components/ui/TransportButton';
import { Sheet } from '@/components/ui/Sheet';
import { TimerModal, formatTimerValue } from '@/components/ui/TimerModal';
import { useToastStore } from '@/stores/toastStore';
import * as haptics from '@/lib/haptics';
import { Slider } from '@/components/ui/Slider';
import { useMiniPlayerInset } from '@/hooks/use-mini-player';
import { contentColumn } from '@/constants/layout';
import {
  binauralPresets,
  solfeggioPresets,
  noisePresets,
  getPresetById,
  FrequencyPreset,
} from '@/lib/frequencies';
import * as playerController from '@/lib/audio/playerController';

// Preset picker groups — 33 flat items is unusable; group by category
const pickerGroups = [
  { titleKey: 'explore.categories.binaural', presets: binauralPresets },
  { titleKey: 'explore.categories.solfeggio', presets: solfeggioPresets },
  { titleKey: 'explore.categories.noise', presets: noisePresets },
];

// Ghost channel strips shown before the first sound is added — one per
// available channel, so the empty screen states the capacity by shape.
const EMPTY_SLOTS = Array.from(
  { length: playerController.MAX_MIXER_CHANNELS },
  (_, i) => i
);

/** "ND-M03" — the saved-mix half of Home's catalogue codes. Falls back to
 *  list position for mixes saved before catalogue numbers existed. */
function mixCatalogCode(mix: { catalogNumber?: number }, index: number): string {
  return `ND-M${String(mix.catalogNumber ?? index + 1).padStart(2, '0')}`;
}

// A saved mix stores preset ids; the row needs the presets themselves to show
// what it is made of. An id that no longer resolves — a preset removed in a
// later version — is dropped rather than drawn as an empty badge.
function mixPresets(mix: { channels: { presetId: string }[] }): FrequencyPreset[] {
  return mix.channels
    .map((c) => getPresetById(c.presetId))
    .filter((p): p is FrequencyPreset => p !== undefined);
}

// One-tap sample mix for the empty state
const SAMPLE_MIX = [
  { presetId: 'noise-rain', volume: 0.6 },
  { presetId: 'noise-brown', volume: 0.35 },
  { presetId: 'binaural-alpha', volume: 0.5 },
];

export default function MixerScreen() {
  const { t } = useTranslation();
  const { addCustomMix, updateCustomMix, customMixes, deleteCustomMix } = usePresetsStore();
  const {
    mixerChannels: channels,
    isMixerPlaying: isPlaying,
    activeMixId,
    mixerMasterVolume,
    timerDuration,
    timerRemaining,
  } = useAudioStore();

  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [mixName, setMixName] = useState('');
  const [editingMixId, setEditingMixId] = useState<string | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const showToast = useToastStore((s) => s.show);

  const colors = useThemeColors();
  const categoryColors = useCategoryColors();
  const miniPlayerInset = useMiniPlayerInset();

  const isEmpty = channels.length === 0;
  const isFull = channels.length >= playerController.MAX_MIXER_CHANNELS;

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

  const handleMasterVolume = useCallback((volume: number) => {
    playerController.mixerSetMasterVolume(volume);
  }, []);

  const handleToggleMute = useCallback((channelId: string, muted: boolean) => {
    haptics.select();
    playerController.mixerSetChannelMuted(channelId, muted);
  }, []);

  const closePresetPicker = useCallback(() => {
    // Drop the search text with the sheet; a stale filter reappearing next
    // time reads as the picker having lost half the catalogue.
    setPickerQuery('');
    setShowPresetPicker(false);
  }, []);

  const closeSaveDialog = useCallback(() => {
    // Clear the draft on dismiss too, not only on a successful save — stale
    // text reappearing next time reads as a bug.
    setMixName('');
    setEditingMixId(null);
    setShowSaveDialog(false);
  }, []);

  /** "Rain + Alpha (8-14 Hz)" — the mix already describes itself, so the
   *  field opens with that rather than empty. It is prefilled, not forced:
   *  the text is selected-in-place and typing replaces it. */
  const suggestedMixName = useCallback(
    () =>
      channels
        .map((c) => t(c.preset.nameKey))
        .join(' + ')
        // Long enough to name three sounds, short enough that the saved-mix
        // row is not permanently truncated.
        .slice(0, 40),
    [channels, t]
  );

  const openSaveDialog = useCallback(() => {
    setMixName(suggestedMixName());
    setShowSaveDialog(true);
  }, [suggestedMixName]);

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

        {/* Active Channels */}
        <View style={styles.section}>
          <CategoryHeader
            title={t('mixer.activeChannels')}
            counter={`${channels.length}/${playerController.MAX_MIXER_CHANNELS}`}
          />

          {/* Empty state is the mixer itself, not a poster about the mixer:
              four unfilled channel strips where the real ones will land. It
              states the capacity by shape, shows what a channel is made of,
              and fills the page instead of leaving the lower half blank —
              without the centred-icon-and-headline pattern every other app
              reaches for.

              The ghost track is deliberately thinner than the live slider's
              48pt touch target: at full height the four slots push the
              transport row off the first screen, which trades one layout
              problem for a worse one. So the strip previews the arrangement,
              not the exact metrics. */}
          {channels.length === 0 && (
            <View>
              {EMPTY_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  onPress={() => setShowPresetPicker(true)}
                  activeOpacity={0.6}
                  style={[
                    styles.channelRow,
                    styles.slotRow,
                    { borderBottomColor: colors.cardBorder, opacity: 1 - slot * 0.18 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('mixer.addSound')}
                  // Four identical "add sound" targets would be read out four
                  // times over; only the first is exposed.
                  accessibilityElementsHidden={slot > 0}
                  importantForAccessibility={slot > 0 ? 'no-hide-descendants' : 'yes'}
                >
                  <View
                    style={[
                      styles.channelIcon,
                      styles.slotIcon,
                      { borderColor: slot === 0 ? colors.accent : colors.cardBorder },
                    ]}
                  >
                    {slot === 0 && <Ionicons name="add" size={18} color={colors.accent} />}
                  </View>
                  <View style={styles.channelBody}>
                    <View style={styles.channelHeader}>
                      <Text
                        style={[
                          styles.channelName,
                          { color: slot === 0 ? colors.accent : colors.textSecondary },
                        ]}
                      >
                        {slot === 0 ? t('mixer.addSound') : t('mixer.emptySlot')}
                      </Text>
                    </View>
                    {/* A flat, empty track at zero — the same bar the live
                        channel uses, just with nothing in it. */}
                    <View style={[styles.slotTrack, { backgroundColor: colors.slider }]} />
                  </View>
                </TouchableOpacity>
              ))}

              <View style={styles.emptyFooter}>
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
            </View>
          )}

          {channels.map(channel => (
            <View
              key={channel.id}
              style={[styles.channelRow, { borderBottomColor: colors.cardBorder }]}
            >
              <View
                style={[
                  styles.channelIcon,
                  {
                    backgroundColor: withAlpha(categoryColors[channel.preset.type], BADGE_ALPHA),
                    opacity: channel.muted ? 0.5 : 1,
                  },
                ]}
              >
                <Icon icon={presetIcon(channel.preset)} size={18} color={categoryColors[channel.preset.type]} />
              </View>
              <View style={styles.channelBody}>
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
                    // Four stacked sliders in one accent colour read as one
                    // control repeated; tinting each track with its own
                    // category colour makes the strip legible at a glance.
                    fillColor={categoryColors[channel.preset.type]}
                    accessibilityLabel={`${t('mixer.volume')} ${t(channel.preset.nameKey)}`}
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Add Channel — rendered whenever there is at least one channel,
              including at 4/4 where it turns into the "full" notice. Letting
              it vanish at the cap left the user hunting for a button that had
              silently removed itself. It is skipped only in the empty state,
              where the first ghost slot above already is this button. */}
          {!isEmpty && (
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
          )}
        </View>

        {/* One fader over the whole mix. Without it, turning a balanced mix
            down meant dragging four sliders and losing the balance; the
            channel levels are the part the user actually authored. Hidden
            while empty — there is nothing to scale. */}
        {!isEmpty && (
          <View style={[styles.master, { borderTopColor: colors.cardBorder }]}>
            <Slider
              value={mixerMasterVolume}
              onValueChange={handleMasterVolume}
              max={1}
              label={t('mixer.master')}
              accessibilityLabel={t('mixer.master')}
            />
          </View>
        )}

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

            <TransportButton
              playing={isPlaying}
              onPress={handlePlayPause}
              disabled={isEmpty}
              size={72}
              accessibilityLabel={isPlaying ? t('common.pause') : t('common.play')}
              accessibilityHint={isEmpty ? t('mixer.transportDisabled') : undefined}
            />

            {/* Balances the timer slot so play stays centred. */}
            <View style={styles.timerButton} />
          </View>

          <Button
            title={t('mixer.savePreset')}
            onPress={openSaveDialog}
            disabled={isEmpty}
            variant="secondary"
            accessibilityHint={isEmpty ? t('mixer.transportDisabled') : undefined}
          />

          {/* A greyed circle says "not now" and nothing else. Two dead
              controls next to each other without a reason is the point at
              which an interface stops explaining itself. */}
          {isEmpty && (
            <Text style={[styles.transportHint, { color: colors.textSecondary }]}>
              {t('mixer.transportDisabled')}
            </Text>
          )}
        </View>

        {/* Saved Mixes */}
        {customMixes.length > 0 && (
          <View style={styles.section}>
            <CategoryHeader title={t('mixer.myMixes')} />
            {customMixes.map((mix, mixIndex) => {
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
                    accessibilityLabel={[
                      mix.name,
                      mixPresets(mix).map((p) => t(p.nameKey)).join(', '),
                      isActive ? t('mixer.loaded') : null,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  >
                    <View style={styles.mixTextContainer}>
                      <View style={styles.mixNameRow}>
                        <Text
                          style={[
                            styles.mixName,
                            { color: isActive ? colors.accent : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {mix.name}
                        </Text>
                        {/* A rubber stamp, not another line of prose — the
                            loaded mix was marked only by a colour shift and
                            the word "Loaded" in caption grey. */}
                        {isActive && (
                          <View style={[styles.mixStamp, { borderColor: colors.accent }]}>
                            <Text style={[styles.mixStampText, { color: colors.accent }]}>
                              {t('mixer.loaded')}
                            </Text>
                          </View>
                        )}
                      </View>
                      {/* "3 sounds" told you how many, never which. The
                          category badges do both, in the same alphabet the
                          channel rows above use. */}
                      <View style={styles.mixIcons}>
                        <Text style={[styles.mixCatalog, { color: colors.textSecondary }]}>
                          {mixCatalogCode(mix, mixIndex)}
                        </Text>
                        {mixPresets(mix).map((preset, i) => (
                          <View
                            key={`${preset.id}-${i}`}
                            style={[
                              styles.mixIcon,
                              { backgroundColor: withAlpha(categoryColors[preset.type], BADGE_ALPHA) },
                            ]}
                          >
                            <Icon
                              icon={presetIcon(preset)}
                              size={13}
                              color={categoryColors[preset.type]}
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRenameMix(mix)}
                    style={styles.mixAction}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('mixer.renameMix')} ${mix.name}`}
                  >
                    <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {/* Deleting a mix is the only irreversible thing on this
                      screen, and it looked exactly like renaming it: same
                      size, same grey. It now carries the error colour. */}
                  <TouchableOpacity
                    onPress={() => handleDeleteMix(mix.id, mix.name)}
                    style={styles.mixAction}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('common.delete')} ${mix.name}`}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
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

      {/* Preset picker — a tall sheet rather than a full screen. 33 items
          need the height, but taking over the whole display made picking a
          sound feel like leaving the mixer rather than reaching into it. */}
      <Sheet
        visible={showPresetPicker}
        onClose={closePresetPicker}
        title={t('mixer.addSound')}
        tall
      >
        <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={pickerQuery}
            onChangeText={setPickerQuery}
            placeholder={t('explore.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        <ScrollView style={styles.presetList} keyboardShouldPersistTaps="handled">
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
                  <View
                    style={[
                      styles.presetItemIcon,
                      { backgroundColor: withAlpha(categoryColors[preset.type], BADGE_ALPHA) },
                    ]}
                  >
                    <Icon icon={presetIcon(preset)} size={17} color={categoryColors[preset.type]} />
                  </View>
                  <Text style={[styles.presetItemName, { color: colors.text }]}>
                    {t(preset.nameKey)}
                  </Text>
                  <Ionicons name="add" size={22} color={colors.accent} />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </Sheet>

      {/* Save / Rename — a single text field, so a compact sheet. */}
      <Sheet
        visible={showSaveDialog}
        onClose={closeSaveDialog}
        title={editingMixId ? t('mixer.renameMix') : t('mixer.savePreset')}
        avoidKeyboard
      >
        <Text style={[styles.label, { color: colors.text }]}>
          {t('mixer.presetName')}
        </Text>
        <TextInput
          value={mixName}
          onChangeText={setMixName}
          placeholder={t('mixer.namePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          autoFocus
          selectTextOnFocus
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
    paddingHorizontal: Spacing.md,
  },
  header: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.largeTitle,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  channelRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  channelIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  channelBody: {
    flex: 1,
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
    minHeight: ControlSize.row,
  },
  addRowText: {
    ...Typography.headline,
  },
  master: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    // A rule between the parts and their sum — without it the master reads as
    // a fifth channel that happens to be a different colour.
    borderTopWidth: StyleSheet.hairlineWidth,
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
    gap: Spacing.xs,
  },
  mixNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mixName: {
    ...Typography.headline,
    flexShrink: 1,
  },
  mixStamp: {
    borderWidth: 1,
    borderRadius: Radius.tag,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  mixStampText: {
    ...Typography.label,
    textTransform: 'uppercase',
  },
  mixIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  mixCatalog: {
    ...Typography.label,
    fontFamily: FontFamily.mono,
    letterSpacing: 1.2,
    marginRight: 2,
  },
  mixIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mixAction: {
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
  // Ghost slot: the live channel's arrangement (badge, name, track) at a
  // reduced height — see the note at the call site.
  slotRow: {
    alignItems: 'center',
  },
  slotIcon: {
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 0,
  },
  slotTrack: {
    height: 6,
    borderRadius: Radius.tag,
  },
  emptyFooter: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    gap: Spacing.xs,
  },
  transportHint: {
    ...Typography.footnote,
    textAlign: 'center',
  },
  sampleButton: {
    paddingVertical: Spacing.sm,
    minHeight: ControlSize.field,
    justifyContent: 'center',
  },
  sampleButtonText: {
    ...Typography.body,
    fontFamily: FontFamily.semibold,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: ControlSize.row,
  },
  presetItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetItemName: {
    ...Typography.body,
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: ControlSize.field,
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
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Typography.body,
  },
});
