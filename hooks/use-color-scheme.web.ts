import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Same as the native hook (respects the user's theme setting), plus a
 * hydration guard so static web rendering matches the client first paint.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemColorScheme = useRNColorScheme();
  const { theme } = useSettingsStore();

  if (!hasHydrated) {
    return 'dark';
  }

  if (theme === 'auto') {
    return systemColorScheme ?? 'dark';
  }

  return theme;
}
