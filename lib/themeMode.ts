export type ThemeMode = 'light' | 'dark' | 'auto';
export type PaletteKey = 'light' | 'dark' | 'lowContrastLight' | 'lowContrastDark';

export function normalizeThemeMode(value: unknown): ThemeMode {
  return value === 'light' || value === 'auto' ? value : 'dark';
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
