/**
 * Haptic feedback, reserved for moments that mean something.
 *
 * Over-feedback trains people to ignore all of it, so this exposes named
 * moments rather than raw impact styles: a commit (play/pause), a selection
 * (picking a timer), and a save (favouriting). Everything routes through the
 * user's setting, including the tab bar — which used to buzz on every tab
 * press, the least meaningful touch in the app, with no way to turn it off.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/stores/settingsStore';

// expo-haptics is a no-op on web; skip the call rather than catching per-use.
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

function enabled(): boolean {
  return supported && useSettingsStore.getState().haptics;
}

/** A state change the user committed: play, pause, stop. */
export function commit(): void {
  if (!enabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Moving between options: timer choice, tab change. */
export function select(): void {
  if (!enabled()) return;
  Haptics.selectionAsync().catch(() => {});
}

/** Something was kept: favourite added, mix saved. Slightly heavier so it
 *  reads as different from an ordinary commit. */
export function save(): void {
  if (!enabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
