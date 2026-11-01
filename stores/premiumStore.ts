/**
 * Premium entitlement, cached so a purchase keeps working offline. Google Play
 * is the source of truth: PremiumSync refreshes `owned` whenever the store
 * connection comes up.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage, useSettingsStore } from './settingsStore';

interface PremiumState {
  hasHydrated: boolean;
  owned: boolean;
  setOwned: (owned: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      owned: false,
      setOwned: (owned) => set({ owned }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'neurosound-premium',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ owned: state.owned }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

/** Paid, or installed before the paywall existed. */
export function useIsPremium(): boolean {
  const owned = usePremiumStore((s) => s.owned);
  const legacy = useSettingsStore((s) => s.legacyPremium);
  return owned || legacy;
}

/** Both stores restored, so a `false` from useIsPremium is a real answer. */
export function usePremiumReady(): boolean {
  const premium = usePremiumStore((s) => s.hasHydrated);
  const settings = useSettingsStore((s) => s.hasHydrated);
  return premium && settings;
}
