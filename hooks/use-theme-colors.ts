/**
 * Resolved theme palette: colour scheme + night mode + low-contrast setting.
 */

import { useColorScheme } from './use-color-scheme';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  Colors,
  CategoryColorSets,
  IntentColorSets,
  CategoryKey,
  IntentKey,
} from '@/constants/theme';

type PaletteKey = keyof typeof Colors;

/** The one place the theme + colour-scheme + low-contrast rules are applied.
 *  Every hook below reads from this, so a palette can never be resolved two
 *  different ways in two different components. */
function usePaletteKey(): PaletteKey {
  const colorScheme = useColorScheme() ?? 'dark';
  const { theme, lowContrast } = useSettingsStore();

  // Night mode is its own dimmed palette; low-contrast is ignored there
  if (theme === 'night') return 'night';

  return lowContrast
    ? colorScheme === 'dark'
      ? 'lowContrastDark'
      : 'lowContrastLight'
    : colorScheme;
}

/** Whether the resolved palette sits on dark surfaces — the axis the
 *  category/intent colour sets are solved against. */
function isDarkPalette(key: PaletteKey): boolean {
  return key === 'dark' || key === 'night' || key === 'lowContrastDark';
}

export function useThemeColors() {
  return Colors[usePaletteKey()];
}

/** Category marker colours for the active palette. Contrast-solved per
 *  palette group — see the note in constants/theme.ts. */
export function useCategoryColors(): Record<CategoryKey, string> {
  return isDarkPalette(usePaletteKey())
    ? CategoryColorSets.dark
    : CategoryColorSets.light;
}

/** Intent marker colours for the active palette. */
export function useIntentColors(): Record<IntentKey, string> {
  return isDarkPalette(usePaletteKey())
    ? IntentColorSets.dark
    : IntentColorSets.light;
}
