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
  show: (message: string, variant?: ToastVariant) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  variant: 'info',
  show: (message, variant = 'info') => set({ visible: true, message, variant }),
  hide: () => set({ visible: false }),
}));
