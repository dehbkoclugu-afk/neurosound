/**
 * Global toast — one host mounted at the root layout instead of a copy per
 * screen. A per-screen toast is an absolutely-positioned overlay inside that
 * screen's own layout, so it can only be positioned relative to content it
 * has no knowledge of; it ended up landing on top of a button's border in
 * one screen and directly over the row it was confirming in another. A
 * single host above the navigator has no such competition.
 */

import { create } from 'zustand';

/** Every toast looked identical, so "Mix saved" and a failure would have
 *  arrived in the same grey slab. `info` stays the default because most of
 *  them are neither good news nor bad. */
export type ToastVariant = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  variant: ToastVariant;
  /** Bumped on every show(). `visible` alone could not restart the timer: a
   *  second toast while one was up kept the first one's countdown and was
   *  cut short, and the same toast twice in a row never re-appeared. */
  id: number;
  show: (message: string, variant?: ToastVariant) => void;
  hide: (id?: number) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  visible: false,
  message: '',
  variant: 'info',
  id: 0,
  show: (message, variant = 'info') =>
    set((s) => ({ visible: true, message, variant, id: s.id + 1 })),
  // A stale fade-out finishing must not hide the toast that replaced it.
  hide: (id) => {
    if (id !== undefined && id !== get().id) return;
    set({ visible: false });
  },
}));
