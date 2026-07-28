/**
 * MiniPlayer visibility and the space it steals.
 *
 * The bar is absolutely positioned above the tab bar, so the tab navigator's
 * own inset does not account for it. Scroll views have to reserve the height
 * themselves or the last row of every list sits under the bar and is
 * unreachable while something is playing.
 */

import { usePathname } from 'expo-router';

import { useAudioStore } from '@/stores/audioStore';

export const MINI_PLAYER_HEIGHT = 56;

/**
 * Tab bar height. It used to be `MINI_PLAYER_HEIGHT` with `- 14` subtracted
 * in night mode, which made two unrelated pieces of chrome move together and
 * turned a design decision ("the night tab bar is shorter because it drops
 * its labels") into arithmetic on someone else's constant.
 */
export const TAB_BAR_HEIGHT = 56;
export const TAB_BAR_HEIGHT_NIGHT = 42;

/** True when the MiniPlayer has something to show — a loaded preset or a
 *  mixer session.
 *
 *  Visibility keys off the *existence* of a mixer session, not `isMixerPlaying`:
 *  pausing the mixer disposes its generators and flips that flag, so gating on
 *  it would make the bar vanish the moment you paused, with no way to resume.
 *  The Mixer tab owns richer controls for the same session, so the bar stands
 *  down there rather than covering them. */
export function useMiniPlayerVisible(): boolean {
  const { currentPreset, mixerChannels } = useAudioStore();
  const pathname = usePathname();

  if (currentPreset) return true;
  return mixerChannels.length > 0 && !pathname.startsWith('/mixer');
}

/** Bottom padding a scrollable screen should add so its content clears the
 *  MiniPlayer. Returns 0 when the bar is hidden. */
export function useMiniPlayerInset(): number {
  return useMiniPlayerVisible() ? MINI_PLAYER_HEIGHT : 0;
}
