/**
 * Bed mode: a black screen for a phone left on the nightstand. Sound keeps
 * playing, the only thing lit is the time left, and any touch brings the app
 * back. The countdown moves once a minute so nothing burns into an OLED panel.
 */

import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StatusBar, StyleSheet, Text } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useTranslation } from 'react-i18next';

import { Typography } from '@/constants/theme';
import { formatTimerValue } from '@/components/ui/TimerModal';
import { useAudioStore } from '@/stores/audioStore';

const KEEP_AWAKE_TAG = 'bed-mode';
const HINT_MS = 4000;
const MOVE_MS = 60000;
const DIM = '#4A4A4A';

function BedScreen({ onExit }: { onExit: () => void }) {
  const { t } = useTranslation();
  const timerRemaining = useAudioStore((s) => s.timerRemaining);
  const [showHint, setShowHint] = useState(true);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Not the useKeepAwake hook: it leaves a refused wake lock unhandled, and a
  // screen that may dim is no reason to take the app down.
  useEffect(() => {
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, []);

  useEffect(() => {
    const hint = setTimeout(() => setShowHint(false), HINT_MS);
    const move = setInterval(
      () => setOffset({ x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 240 }),
      MOVE_MS,
    );
    return () => {
      clearTimeout(hint);
      clearInterval(move);
    };
  }, []);

  const moved = { transform: [{ translateX: offset.x }, { translateY: offset.y }] };
  return (
    <Pressable
      onPress={onExit}
      style={styles.screen}
      accessibilityRole="button"
      accessibilityLabel={t('player.bedModeExit')}
    >
      <StatusBar hidden />
      {timerRemaining !== null && timerRemaining > 0 && (
        <Text style={[styles.time, moved]}>{formatTimerValue(timerRemaining)}</Text>
      )}
      {showHint && <Text style={styles.hint}>{t('player.bedModeExit')}</Text>}
    </Pressable>
  );
}

export function BedMode({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {visible && <BedScreen onExit={onClose} />}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    ...Typography.numeral,
    fontSize: 32,
    lineHeight: 40,
    color: DIM,
  },
  hint: {
    ...Typography.footnote,
    color: DIM,
    position: 'absolute',
    bottom: 64,
  },
});
