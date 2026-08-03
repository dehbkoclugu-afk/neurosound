import { normalizeThemeMode, resolvePaletteKey } from '../themeMode';

describe('theme mode', () => {
  it('migrates the removed night mode to dark', () => {
    expect(normalizeThemeMode('night')).toBe('dark');
    expect(normalizeThemeMode('unknown')).toBe('dark');
  });

  it('honors explicit themes and uses the OS only for auto', () => {
    expect(resolvePaletteKey('light', 'dark', false)).toBe('light');
    expect(resolvePaletteKey('dark', 'light', false)).toBe('dark');
    expect(resolvePaletteKey('auto', 'light', false)).toBe('light');
    expect(resolvePaletteKey('auto', 'dark', true)).toBe('lowContrastDark');
  });
});
