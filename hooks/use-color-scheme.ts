/**
 * Custom useColorScheme hook that respects user's theme preference
 */

import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

export function useColorScheme(): 'light' | 'dark' {
  const systemColorScheme = useSystemColorScheme();
  const { theme } = useSettingsStore();

  // If user selected auto, use system preference
  if (theme === 'auto') {
    return systemColorScheme ?? 'light';
  }

  // Otherwise use user's explicit choice
  return theme;
}
