/**
 * Is this preset the sound currently coming out of the speaker?
 *
 * Three list screens needed the same answer and would otherwise have grown
 * three copies of the same store read — including, inevitably, three chances
 * to forget that a loaded mixer means no single preset is playing.
 */

import { useAudioStore } from '@/stores/audioStore';

export function useIsPresetPlaying(): (presetId: string) => boolean {
  const currentPreset = useAudioStore((s) => s.currentPreset);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  return (presetId: string) => isPlaying && currentPreset?.id === presetId;
}
