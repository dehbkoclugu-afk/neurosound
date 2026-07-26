/**
 * Mounted once at the root layout, above the Stack navigator, so a toast
 * always floats over whichever screen is active instead of being scoped to
 * one screen's own layout (see stores/toastStore.ts for why).
 */

import React from 'react';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast } from './Toast';
import { useToastStore } from '@/stores/toastStore';
import { MINI_PLAYER_HEIGHT } from '@/hooks/use-mini-player';
import { Spacing } from '@/constants/theme';

// The tab screens share a bottom tab bar, so clearing just above it is
// enough. The player modal has no tab bar but keeps its own tall transport
// row (a 72px button plus padding) at the bottom instead — clearing that
// needs more room. Neither screen's content is otherwise a fixed height, so
// this can only aim for "clears the known bottom chrome", not "never
// overlaps a variable-length scrolling list" — the toast simply doesn't know
// what a given screen scrolls underneath it.
const TAB_SCREEN_CLEARANCE = MINI_PLAYER_HEIGHT + Spacing.sm;
const PLAYER_CLEARANCE = 110;

export function ToastHost() {
  const { visible, message, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const clearance = pathname.startsWith('/player') ? PLAYER_CLEARANCE : TAB_SCREEN_CLEARANCE;

  return (
    <Toast
      message={message}
      visible={visible}
      onHide={hide}
      style={{
        bottom: insets.bottom + clearance,
        zIndex: 1000,
        elevation: 10,
      }}
    />
  );
}
