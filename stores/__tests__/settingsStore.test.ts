import { useSettingsStore } from '../settingsStore';

describe('settings hydration', () => {
  it('starts unhydrated and exposes an explicit hydration transition', () => {
    useSettingsStore.setState({ hasHydrated: false });
    expect(useSettingsStore.getState().hasHydrated).toBe(false);
    useSettingsStore.getState().setHasHydrated(true);
    expect(useSettingsStore.getState().hasHydrated).toBe(true);
  });

  it('keeps hydration state when user settings are reset', () => {
    useSettingsStore.setState({ hasHydrated: true, hasSeenOnboarding: true });
    useSettingsStore.getState().resetSettings();
    expect(useSettingsStore.getState().hasHydrated).toBe(true);
    expect(useSettingsStore.getState().hasSeenOnboarding).toBe(false);
  });
});
