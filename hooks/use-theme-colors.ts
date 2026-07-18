/**
 * Resolved theme palette: colour scheme + low-contrast setting in one place.
 */

import { useColorScheme } from './use-color-scheme';
import { useSettingsStore } from '@/stores/settingsStore';
import { Colors } from '@/constants/theme';

export function useThemeColors() {
  const colorScheme = useColorScheme() ?? 'light';
  const { lowContrast } = useSettingsStore();

  const themeKey = lowContrast
    ? colorScheme === 'dark'
      ? 'lowContrastDark'
      : 'lowContrastLight'
    : colorScheme;

  return Colors[themeKey];
}
