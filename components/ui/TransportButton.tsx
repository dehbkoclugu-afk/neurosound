/**
 * The one play/pause button shape in the app.
 *
 * There were three: the Player's dial, the Mixer's 72pt filled circle, and
 * the MiniPlayer's 36pt rounded square. The dial is a different object —
 * it is an instrument you also drag — but the other two are the same
 * control at two sizes and had no business being two shapes. Both now
 * render this, so "press play" looks like one thing wherever it appears.
 */

import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PressableScale } from './PressableScale';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { onPrimary } from '@/constants/theme';

interface TransportButtonProps {
  playing: boolean;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Diameter. The two call sites use 36 (MiniPlayer) and 72 (Mixer). */
  size?: number;
  accessibilityLabel: string;
  /** Why the button is disabled. A greyed circle says "not now" but never
   *  says what would change that, and a screen reader gets nothing at all. */
  accessibilityHint?: string;
}

export function TransportButton({
  playing,
  onPress,
  disabled = false,
  loading = false,
  size = 56,
  accessibilityLabel,
  accessibilityHint,
}: TransportButtonProps) {
  const colors = useThemeColors();
  const iconSize = Math.round(size * 0.45);

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={onPrimary} />
      ) : (
        <Ionicons
          name={playing ? 'pause' : 'play'}
          size={iconSize}
          color={onPrimary}
          // A play triangle's optical centre sits left of its bounding box;
          // nudging it right centres it in the circle. Pause is symmetric.
          style={playing ? undefined : { marginLeft: iconSize * 0.09 }}
        />
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
