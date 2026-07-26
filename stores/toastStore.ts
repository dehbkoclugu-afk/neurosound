/**
 * Global toast — one host mounted at the root layout instead of a copy per
 * screen. A per-screen toast is an absolutely-positioned overlay inside that
 * screen's own layout, so it can only be positioned relative to content it
 * has no knowledge of; it ended up landing on top of a button's border in
 * one screen and directly over the row it was confirming in another. A
 * single host above the navigator has no such competition.
 */

import { create } from 'zustand';

interface ToastState {
  visible: boolean;
  message: string;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  show: (message) => set({ visible: true, message }),
  hide: () => set({ visible: false }),
}));
