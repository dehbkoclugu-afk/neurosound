export type ThemeMode = 'light' | 'dark' | 'auto';
export type PaletteKey = 'light' | 'dark' | 'lowContrastLight' | 'lowContrastDark';

export function normalizeThemeMode(value: unknown): ThemeMode {
  return value === 'light' || value === 'auto' ? value : 'dark';
}

/** Home's compact switch always lands on an explicit theme. */
export function nextExplicitTheme(
  theme: ThemeMode,
  resolvedScheme: 'light' | 'dark',
): 'light' | 'dark' {
  const current = theme === 'auto' ? resolvedScheme : theme;
  return current === 'light' ? 'dark' : 'light';
}

export function resolvePaletteKey(
  theme: ThemeMode,
  systemScheme: 'light' | 'dark' | null | undefined,
  lowContrast: boolean
): PaletteKey {
  const scheme = theme === 'auto' ? systemScheme ?? 'dark' : theme;
  if (!lowContrast) return scheme;
  return scheme === 'light' ? 'lowContrastLight' : 'lowContrastDark';
}
