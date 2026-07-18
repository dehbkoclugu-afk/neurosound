/**
 * Custom useColorScheme hook that respects the user's theme preference.
 * 'night' resolves to 'dark' here; the dedicated night palette is applied
 * by useThemeColors.
 */

import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

export function useColorScheme(): 'light' | 'dark' {
  const systemColorScheme = useSystemColorScheme();
  const { theme } = useSettingsStore();

  if (theme === 'auto') {
    return systemColorScheme ?? 'dark';
  }

  if (theme === 'night') {
    return 'dark';
  }

  return theme;
}
