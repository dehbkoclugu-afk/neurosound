/**
 * Mount, animate and unmount the MiniPlayer.
 *
 * The bar used to appear and disappear on a single frame, which reads as the
 * interface glitching rather than something arriving. It now slides up from
 * its own height and fades, and — because it is exiting along the path it
 * entered — slides back down on the way out.
 *
 * Exit is faster than enter: entering is the system offering something, exiting
 * is the system getting out of the way. Under reduced motion the travel is
 * dropped and only the cross-fade remains.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { MiniPlayer } from './MiniPlayer';
import { MINI_PLAYER_HEIGHT } from '@/hooks/use-mini-player';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { withAlpha } from '@/constants/theme';

const ENTER_MS = 220;
const EXIT_MS = 160;

interface MiniPlayerHostProps {
  visible: boolean;
  /** Distance from the bottom of the screen — clears the tab bar. */
  bottom: number;
}

export function MiniPlayerHost({ visible, bottom }: MiniPlayerHostProps) {
  const { reduceMotion } = useSettingsStore();
  const colors = useThemeColors();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) setMounted(true);

    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? ENTER_MS : EXIT_MS,
      // ease-out: movement is visible immediately, which is the frame the user
      // is watching most closely.
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      // Keep it mounted through the exit, then drop it.
      if (finished && !visible) setMounted(false);
    });

    return () => animation.stop();
  }, [visible, progress]);

  if (!mounted) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [MINI_PLAYER_HEIGHT, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom,
          opacity: progress,
          transform: reduceMotion ? [] : [{ translateY }],
        },
      ]}
    >
      {/* The list scrolled by right behind the card and showed through the gaps
          around it, cut-off text and all. */}
      <LinearGradient
        pointerEvents="none"
        colors={[withAlpha(colors.background, 0), colors.background]}
        locations={[0, 0.45]}
        style={styles.fade}
      />
      <MiniPlayer />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 108,
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
});
