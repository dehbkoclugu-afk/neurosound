/**
 * Resolved theme palette: colour scheme + night mode + low-contrast setting.
 */

import { useColorScheme } from './use-color-scheme';
import { useSettingsStore } from '@/stores/settingsStore';
import { Colors } from '@/constants/theme';

export function useThemeColors() {
  const colorScheme = useColorScheme() ?? 'dark';
  const { theme, lowContrast } = useSettingsStore();

  // Night mode is its own dimmed palette; low-contrast is ignored there
  if (theme === 'night') {
    return Colors.night;
  }

  const themeKey = lowContrast
    ? colorScheme === 'dark'
      ? 'lowContrastDark'
      : 'lowContrastLight'
    : colorScheme;

  return Colors[themeKey];
}
