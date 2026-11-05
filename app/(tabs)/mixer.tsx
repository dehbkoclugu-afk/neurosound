/**
 * Mixer Screen - Create Custom Sound Mixes
 * Modern card-based design with clean UI
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useThemeColors, useCategoryColors } from '@/hooks/use-theme-colors';
import {
  Spacing,
  Typography,
  AccessibilitySize,
  FontFamily,
  BADGE_ALPHA,
  withAlpha,
  Radius,
  ControlSize,
} from '@/constants/theme';
import { usePresetsStore } from '@/stores/presetsStore';
import { useAudioStore } from '@/stores/audioStore';
import { CategoryHeader } from '@/components/ui/CategoryHeader';
import { Icon } from '@/components/ui/Icon';
import { presetIcon } from '@/components/ui/PresetRow';
import { Button } from '@/components/ui/Button';
import { TransportButton } from '@/components/ui/TransportButton';
import { EqualizerBars } from '@/components/ui/EqualizerBars';
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
import { isLockedPreset } from '@/lib/premium';
import { useIsPremium } from '@/stores/premiumStore';
import { ArtBackground } from '@/components/ui/ArtBackground';
import { BedMode } from '@/components/ui/BedMode';
import { MixCollage } from '@/components/ui/MixCollage';
import { MixShareSheet, type ShareableMix } from '@/components/ui/MixShareSheet';
import { useSettingsStore } from '@/stores/settingsStore';
import { presetArt, presetThumb } from '@/lib/artAssets';
import { useArtwork } from '@/hooks/use-artwork';
import { upper, foldForSearch } from '@/lib/upper';

// Preset picker groups — 33 flat items is unusable; group by category
const pickerGroups = [
  { titleKey: 'explore.categories.binaural', presets: binauralPresets },
  { titleKey: 'explore.categories.solfeggio', presets: solfeggioPresets },
  { titleKey: 'explore.categories.noise', presets: noisePresets },
];

// A saved mix stores preset ids; the row needs the presets themselves to show
// what it is made of. An id that no longer resolves — a preset removed in a
// later version — is dropped rather than drawn as an empty badge.
function mixPresets(mix: {
  channels: { presetId: string }[];
}): FrequencyPreset[] {
  return mix.channels
    .map((c) => getPresetById(c.presetId))
    .filter((p): p is FrequencyPreset => p !== undefined);
}

// One-tap starter mixes for the empty state. Free presets only — a starter
// that opens the paywall is bait. The row is named by its own sounds and the
// intent it serves, so no extra strings per mix.
const SUGGESTED_MIXES = [
  {
    intentKey: 'intents.sleep',
    channels: [
      { presetId: 'noise-rain', volume: 0.6 },
      { presetId: 'noise-brown', volume: 0.35 },
      { presetId: 'binaural-delta', volume: 0.5 },
    ],
  },
  {
    intentKey: 'intents.relax',
    channels: [
      { presetId: 'noise-forest', volume: 0.6 },
      { presetId: 'solfeggio-432', volume: 0.4 },
    ],
  },
  {
    intentKey: 'intents.focus',
    channels: [
      { presetId: 'noise-white', volume: 0.3 },
      { presetId: 'binaural-beta', volume: 0.5 },
    ],
  },
];

export default function MixerScreen() {
  const { t } = useTranslation();
  const { addCustomMix, updateCustomMix, customMixes, deleteCustomMix } =
    usePresetsStore();
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
  const [showBedMode, setShowBedMode] = useState(false);
  const [sharingMix, setSharingMix] = useState<ShareableMix | null>(null);
  const livingMix = useSettingsStore((s) => s.livingMix);
  const setLivingMix = useSettingsStore((s) => s.setLivingMix);
  const [mixName, setMixName] = useState('');
  const [editingMixId, setEditingMixId] = useState<string | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const showToast = useToastStore((s) => s.show);
  const router = useRouter();
  const isPremium = useIsPremium();

  const colors = useThemeColors();
  const categoryColors = useCategoryColors();
  const artwork = useArtwork();
  const miniPlayerInset = useMiniPlayerInset();

  // Removing a channel throws away a level the user set by ear, and it sits
  // next to the mute button in a dark room. So it can be taken back for a moment.
  const [lastRemoved, setLastRemoved] = useState<{
    preset: FrequencyPreset;
    volume: number;
  } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  const isEmpty = channels.length === 0;
  const isFull = channels.length >= playerController.MAX_MIXER_CHANNELS;

  // 33 presets in a flat scroll is unusable without a filter.
  const filteredPickerGroups = useMemo(() => {
    const query = foldForSearch(pickerQuery.trim());
    if (!query) return pickerGroups;
    return pickerGroups
      .map((group) => ({
        ...group,
        presets: group.presets.filter((preset) =>
          foldForSearch(t(preset.nameKey)).includes(query),
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

  const handleAddChannel = useCallback(
    async (preset: FrequencyPreset) => {
      if (isLockedPreset(preset.id) && !isPremium) {
        setShowPresetPicker(false);
        router.push('/paywall');
        return;
      }
      const added = await playerController.mixerAddChannel(preset);
      if (!added) {
        Alert.alert(t('mixer.maxChannels'), t('mixer.maxChannelsDesc'));
        return;
      }
      setPickerQuery('');
      setShowPresetPicker(false);
    },
    [t, isPremium, router],
  );

  const handleRemoveChannel = useCallback(
    (channel: (typeof channels)[number]) => {
      haptics.select();
      playerController.mixerRemoveChannel(channel.id);
      setLastRemoved({ preset: channel.preset, volume: channel.volume });
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setLastRemoved(null), 5000);
    },
    [],
  );

  const handleUndoRemove = useCallback(async () => {
    if (!lastRemoved) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const added = await playerController.mixerAddChannel(lastRemoved.preset);
    if (added) {
      const restored = useAudioStore.getState().mixerChannels.at(-1);
      if (restored) playerController.mixerSetChannelVolume(restored.id, lastRemoved.volume);
    }
    setLastRemoved(null);
  }, [lastRemoved]);

  const handleVolumeChange = useCallback(
    (channelId: string, volume: number) => {
      playerController.mixerSetChannelVolume(channelId, volume);
    },
    [],
  );

  const handleMasterVolume = useCallback((volume: number) => {
    playerController.mixerSetMasterVolume(volume);
  }, []);

  const handleLivingMix = useCallback(
    (enabled: boolean) => {
      if (enabled && !isPremium) {
        router.push('/paywall');
        return;
      }
      haptics.select();
      setLivingMix(enabled);
      playerController.syncVolume();
    },
    [isPremium, router, setLivingMix],
  );

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
    [channels, t],
  );

  const openSaveDialog = useCallback(() => {
    setMixName(suggestedMixName());
    setShowSaveDialog(true);
  }, [suggestedMixName]);

  const handleRenameMix = useCallback((mix: (typeof customMixes)[0]) => {
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
      showToast(t('mixer.mixRenamed'), 'success');
      return;
    }

    if (channels.length === 0) {
      Alert.alert(t('common.error'), t('mixer.addSoundFirst'));
      return;
    }

    addCustomMix({
      name: mixName.trim(),
      channels: channels.map((c) => ({
        presetId: c.preset.id,
        volume: c.volume,
      })),
    });

    haptics.save();
    setMixName('');
    setShowSaveDialog(false);
    showToast(t('mixer.mixSaved'), 'success');
  }, [
    mixName,
    channels,
    addCustomMix,
    updateCustomMix,
    editingMixId,
    showToast,
    t,
  ]);

  const handleLoadMix = useCallback(async (mix: (typeof customMixes)[0]) => {
    // A mix saved while subscribed must not keep playing locked sounds after
    // the subscription lapses — the same gate the picker and Player apply.
    if (!isPremium && mix.channels.some((c) => isLockedPreset(c.presetId))) {
      router.push('/paywall');
      return;
    }
    haptics.commit();
    await playerController.mixerLoadChannels(mix.channels, mix.id);
  }, [isPremium, router]);

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
    [t, deleteCustomMix],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          contentColumn,
          { paddingBottom: (isEmpty ? miniPlayerInset : 0) + Spacing.lg },
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
          {!isEmpty && (
            <CategoryHeader
              title={t('mixer.activeChannels')}
              counter={`${channels.length}/${playerController.MAX_MIXER_CHANNELS}`}
            />
          )}

          {/* One invitation, not four ghost strips: "Empty channel" ×3 under
              a greyed play button read as a broken screen. */}
          {isEmpty && (
            <ArtBackground
              source={artwork.source(presetArt('noise-rain'))}
              placeholder={artwork.source(presetThumb('noise-rain'))}
              style={styles.emptyCard}
              variant="card"
            >
              <Text
                style={[styles.emptyTitle, { color: artwork.foreground.primary }]}
              >
                {t('mixer.emptyTitle')}
              </Text>
              <Text
                style={[styles.emptyDesc, { color: artwork.foreground.secondary }]}
              >
                {t('mixer.emptyDesc')}
              </Text>
              <View style={styles.emptyActions}>
                <Button
                  title={t('mixer.addSound')}
                  onPress={() => setShowPresetPicker(true)}
                  icon={<Ionicons name="add" size={18} color={colors.onPrimary} />}
                />
              </View>
            </ArtBackground>
          )}

          {isEmpty && (
            <View style={styles.suggested}>
              <Text style={[styles.suggestedHeading, { color: colors.text }]}>
                {t('mixer.suggested')}
              </Text>
              {SUGGESTED_MIXES.map((mix) => {
                const presets = mixPresets(mix);
                const contents = presets.map((p) => t(p.nameKey).split(' (')[0]).join(' + ');
                return (
                  <TouchableOpacity
                    key={mix.intentKey}
                    onPress={() => {
                      haptics.commit();
                      playerController.mixerLoadChannels(mix.channels);
                    }}
                    activeOpacity={0.6}
                    style={[
                      styles.suggestedRow,
                      { borderBottomColor: colors.cardBorder },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${t(mix.intentKey)}, ${contents}`}
                  >
                    <Image
                      source={artwork.source(presetThumb(mix.channels[0].presetId))}
                      cachePolicy="memory-disk"
                      style={[
                        styles.suggestedThumb,
                        { backgroundColor: colors.cardBorder },
                      ]}
                    />
                    <View style={styles.mixTextContainer}>
                      <Text style={[styles.mixName, { color: colors.text }]}>
                        {t(mix.intentKey)}
                      </Text>
                      <Text
                        style={[styles.suggestedIntent, { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {contents}
                      </Text>
                    </View>
                    <Ionicons name="play" size={20} color={colors.accent} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Thin rows, not photo cards: at four sounds the cards pushed play off
              the screen, and a slider over a photograph is hard to see in a dark
              room. The photo is still there, as the thumbnail. */}
          {channels.map((channel) => (
            <View
              key={channel.id}
              style={[styles.channelRow, { borderBottomColor: colors.cardBorder }]}
            >
              <Image
                source={artwork.source(presetThumb(channel.preset.id))}
                cachePolicy="memory-disk"
                style={[
                  styles.channelThumb,
                  { backgroundColor: colors.cardBorder, opacity: channel.muted ? 0.4 : 1 },
                ]}
              />
              <View style={styles.channelBody}>
                <View style={styles.channelHeader}>
                  <Text
                    style={[
                      styles.channelName,
                      { color: channel.muted ? colors.textSecondary : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {t(channel.preset.nameKey).split(' (')[0]}
                  </Text>
                  {isPlaying && !channel.muted && (
                    <EqualizerBars color={colors.accent} size={12} />
                  )}
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
                        color={channel.muted ? colors.textSecondary : colors.text}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemoveChannel(channel)}
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
            </View>
          ))}

          {lastRemoved && (
            <View style={styles.undoRow} accessibilityLiveRegion="polite">
              <Text style={[styles.undoText, { color: colors.textSecondary }]} numberOfLines={1}>
                {t('mixer.removed', { name: t(lastRemoved.preset.nameKey).split(' (')[0] })}
              </Text>
              <TouchableOpacity
                onPress={handleUndoRemove}
                style={styles.undoButton}
                accessibilityRole="button"
              >
                <Text style={[styles.undoAction, { color: colors.accent }]}>{t('common.undo')}</Text>
              </TouchableOpacity>
            </View>
          )}

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
              accessibilityLabel={
                isFull ? t('mixer.channelsFull') : t('mixer.addSound')
              }
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
              showValue={false}
              accessibilityLabel={t('mixer.master')}
            />
            <View style={styles.livingRow}>
              <View style={styles.livingText}>
                <Text style={[styles.livingTitle, { color: colors.text }]}>
                  {t('mixer.livingMix')}
                </Text>
                <Text style={[styles.suggestedIntent, { color: colors.textSecondary }]}>
                  {t('mixer.livingMixHint')}
                </Text>
              </View>
              <Switch
                value={livingMix && isPremium}
                onValueChange={handleLivingMix}
                trackColor={{ false: colors.slider, true: colors.accent }}
                thumbColor="#fff"
                accessibilityLabel={t('mixer.livingMix')}
                {...({
                  activeThumbColor: '#fff',
                  activeTrackColor: colors.accent,
                } as any)}
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowBedMode(true)}
              style={styles.addRow}
              accessibilityRole="button"
            >
              <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.addRowText, { color: colors.textSecondary }]}>
                {t('player.bedMode')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
                  style={[
                    styles.mixRow,
                    { borderBottomColor: colors.cardBorder },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleLoadMix(mix)}
                    activeOpacity={0.6}
                    style={styles.mixMain}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={[
                      mix.name,
                      mixPresets(mix)
                        .map((p) => t(p.nameKey))
                        .join(', '),
                      isActive ? t('mixer.loaded') : null,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  >
                    <MixCollage
                      images={mixPresets(mix)
                        .map((p) => artwork.source(presetThumb(p.id)))
                        .filter((source) => source !== undefined)}
                      style={styles.mixCover}
                    />
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
                          <View
                            style={[
                              styles.mixStamp,
                              { borderColor: colors.accent },
                            ]}
                          >
                            <Text
                              style={[
                                styles.mixStampText,
                                { color: colors.accent },
                              ]}
                            >
                              {upper(t('mixer.loaded'))}
                            </Text>
                          </View>
                        )}
                      </View>
                      {/* "3 sounds" told you how many, never which. The
                          category badges do both, in the same alphabet the
                          channel rows above use. */}
                      <View style={styles.mixIcons}>
                        {mixPresets(mix).map((preset, i) => (
                          <View
                            key={`${preset.id}-${i}`}
                            style={[
                              styles.mixIcon,
                              {
                                backgroundColor: withAlpha(
                                  categoryColors[preset.type],
                                  BADGE_ALPHA,
                                ),
                              },
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
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity
                      onPress={() => setSharingMix(mix)}
                      style={styles.mixAction}
                      accessibilityRole="button"
                      accessibilityLabel={`${t('mixer.share')} ${mix.name}`}
                    >
                      <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleRenameMix(mix)}
                    style={styles.mixAction}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('mixer.renameMix')} ${mix.name}`}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
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
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Fixed, so play is on screen however many sounds are stacked above it.
          It used to scroll away below the fourth channel. The timer gets a word
          as well as an icon: it is why people use this app at night. */}
      {!isEmpty && (
        <View
          style={[
            styles.controlBar,
            contentColumn,
            {
              borderTopColor: colors.cardBorder,
              backgroundColor: colors.background,
              marginBottom: miniPlayerInset,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setShowTimerModal(true)}
            style={styles.controlSide}
            accessibilityRole="button"
            accessibilityLabel={
              timerRemaining !== null && timerRemaining > 0
                ? `${t('player.timer')}, ${formatTimerValue(timerRemaining)}`
                : t('player.timer')
            }
          >
            <Ionicons
              name="timer-outline"
              size={24}
              color={timerDuration ? colors.accent : colors.text}
            />
            <Text
              style={[styles.controlLabel, { color: timerDuration ? colors.accent : colors.textSecondary }]}
              numberOfLines={1}
            >
              {timerRemaining !== null && timerRemaining > 0
                ? formatTimerValue(timerRemaining)
                : t('player.timer')}
            </Text>
          </TouchableOpacity>

          <TransportButton
            playing={isPlaying}
            onPress={handlePlayPause}
            size={64}
            accessibilityLabel={isPlaying ? t('common.pause') : t('common.play')}
          />

          <TouchableOpacity
            onPress={openSaveDialog}
            style={styles.controlSide}
            accessibilityRole="button"
            accessibilityLabel={t('mixer.savePreset')}
          >
            <Ionicons name="bookmark-outline" size={24} color={colors.text} />
            <Text style={[styles.controlLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              {t('common.save')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TimerModal
        visible={showTimerModal}
        onClose={() => setShowTimerModal(false)}
      />

      <BedMode visible={showBedMode} onClose={() => setShowBedMode(false)} />
      <MixShareSheet mix={sharingMix} onClose={() => setSharingMix(null)} />

      {/* Preset picker — a tall sheet rather than a full screen. 33 items
          need the height, but taking over the whole display made picking a
          sound feel like leaving the mixer rather than reaching into it. */}
      <Sheet
        visible={showPresetPicker}
        onClose={closePresetPicker}
        title={t('mixer.addSound')}
        tall
      >
        <View
          style={[styles.searchBar, { backgroundColor: colors.background }]}
        >
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={pickerQuery}
            onChangeText={setPickerQuery}
            placeholder={t('explore.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        <ScrollView
          style={styles.presetList}
          keyboardShouldPersistTaps="handled"
        >
          {filteredPickerGroups.map((group) => (
            <View key={group.titleKey}>
              <Text
                style={[
                  styles.pickerGroupTitle,
                  { color: colors.textSecondary },
                ]}
              >
                {t(group.titleKey)}
              </Text>
              {group.presets.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => handleAddChannel(preset)}
                  activeOpacity={0.6}
                  style={[
                    styles.presetItem,
                    { borderBottomColor: colors.cardBorder },
                  ]}
                >
                  <View
                    style={[
                      styles.presetItemIcon,
                      {
                        backgroundColor: withAlpha(
                          categoryColors[preset.type],
                          BADGE_ALPHA,
                        ),
                      },
                    ]}
                  >
                    <Icon
                      icon={presetIcon(preset)}
                      size={17}
                      color={categoryColors[preset.type]}
                    />
                  </View>
                  <Text style={[styles.presetItemName, { color: colors.text }]}>
                    {t(preset.nameKey)}
                  </Text>
                  <Ionicons
                    name={isLockedPreset(preset.id) && !isPremium ? 'lock-closed' : 'add'}
                    size={22}
                    color={colors.accent}
                    accessibilityLabel={
                      isLockedPreset(preset.id) && !isPremium ? t('paywall.locked') : undefined
                    }
                  />
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.largeTitle,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  channelRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginTop: 2,
  },
  channelBody: {
    flex: 1,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  channelName: {
    ...Typography.headline,
    flexShrink: 1,
  },
  channelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  undoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    minHeight: AccessibilitySize.minTouchTarget,
  },
  undoText: {
    ...Typography.footnote,
    flexShrink: 1,
  },
  undoButton: {
    minHeight: AccessibilitySize.minTouchTarget,
    minWidth: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoAction: {
    ...Typography.headline,
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
  // flex: 1 — Android measures the label in Nunito but draws Bengali/Thai
  // with a wider fallback face, so a content-sized label wrapped mid-word.
  addRowText: {
    ...Typography.headline,
    flex: 1,
  },
  master: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    // A rule between the parts and their sum — without it the master reads as
    // a fifth channel that happens to be a different colour.
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  controlSide: {
    width: 88,
    minHeight: AccessibilitySize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  controlLabel: {
    ...Typography.caption,
    fontVariant: ['tabular-nums'],
  },
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mixMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  mixCover: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  livingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  livingText: {
    flex: 1,
    gap: 2,
  },
  livingTitle: {
    ...Typography.headline,
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
  emptyCard: {
    minHeight: 260,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.title,
  },
  emptyDesc: {
    ...Typography.body,
    maxWidth: '85%',
  },
  emptyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  suggested: {
    marginTop: Spacing.xl,
  },
  suggestedHeading: {
    ...Typography.headline,
    marginBottom: Spacing.xs,
  },
  suggestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 72,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestedThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  suggestedIntent: {
    ...Typography.footnote,
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
    // Same web flexbox release valve as Explore's field — see the note there.
    minWidth: 0,
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
