import { nextExplicitTheme } from '../themeMode';

describe('nextExplicitTheme', () => {
  it('toggles explicit themes', () => {
    expect(nextExplicitTheme('light', 'light')).toBe('dark');
    expect(nextExplicitTheme('dark', 'dark')).toBe('light');
  });

  it('toggles away from the resolved system appearance', () => {
    expect(nextExplicitTheme('auto', 'light')).toBe('dark');
    expect(nextExplicitTheme('auto', 'dark')).toBe('light');
  });
});
