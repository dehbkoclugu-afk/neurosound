/**
 * NeuroSound Theme Configuration — "Night Deck"
 *
 * Direction: the app is already a mixer and a nighttime instrument; this
 * redesign leans into that instead of dressing it as a meditation app. The
 * world is analog hi-fi and record-label print — warm paper neutrals, a
 * single deep ink-blue accent (record-label ink, not amber), tabular
 * "tape-counter" numerals for frequencies and the timer, and a rotary dial
 * as the Player's one authored moment (see components/ui/Dial.tsx).
 *
 * Variants: light, dark (default), night (OLED, dimmed for bedtime),
 * lowContrastLight / lowContrastDark (visual sensitivity — accent stays a
 * legible ink blue so selected states remain readable, never plain gray).
 */

import { Platform } from 'react-native';

// Primary brand colour — deep record-label ink blue, not the old amber.
const inkBlue = '#2F5C8A';
const inkBlueLight = '#7FA8CC';
const inkBlueLighter = '#A6C4DE';
const inkBlueDark = '#1F3F5E';

/**
 * Text/icon colour for anything sitting ON a filled primary surface.
 * Computed against each theme's own primary fill (see constants/__contrast
 * notes in PRODUCT.md/DESIGN.md); every pairing below clears 6:1.
 */
export const onPrimary = '#F7F2E7';
const onPrimaryDark = '#0F1A24';
const onPrimaryNight = '#0A1520';

/**
 * Overlay a colour at a given alpha.
 *
 * Call sites were building `preset.color + '2E'` by hand, which silently
 * produces garbage for a 3-digit hex or an rgb() string and gives no hint
 * about what "2E" means. Takes 0-1 and expands shorthand.
 */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  if (full.length !== 6) return color; // not a hex we can extend — leave it alone
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${full}${a}`;
}

// Binaural type icons — each unique
export const BinauralIcons: Record<string, { name: string; library: 'ionicon' | 'material' }> = {
  delta: { name: 'moon', library: 'ionicon' },
  theta: { name: 'meditation', library: 'material' },
  alpha: { name: 'leaf', library: 'ionicon' },
  beta: { name: 'flash', library: 'ionicon' },
  gamma: { name: 'trending-up', library: 'ionicon' },
};

// Noise type icons — no icon reused across meanings
export const NoiseIcons: Record<string, { name: string; library: 'ionicon' | 'material' }> = {
  white: { name: 'radio', library: 'ionicon' },
  pink: { name: 'flower', library: 'ionicon' },
  brown: { name: 'cloudy', library: 'ionicon' },
  rain: { name: 'rainy', library: 'ionicon' },
  thunder: { name: 'thunderstorm', library: 'ionicon' },
  ocean: { name: 'water', library: 'ionicon' },
  wind: { name: 'weather-windy', library: 'material' },
  fire: { name: 'flame', library: 'ionicon' },
  forest: { name: 'pine-tree', library: 'material' },
  stream: { name: 'waves', library: 'material' },
  fan: { name: 'fan', library: 'material' },
  airplane: { name: 'airplane', library: 'ionicon' },
  train: { name: 'train', library: 'ionicon' },
};

// Solfeggio icon
export const SolfeggioIcon = { name: 'musical-note', library: 'ionicon' as const };

/**
 * Category markers — record-label ink family, not the old blue/plum/green.
 * Decorative only (icon tint, a small index-tab swatch): each clears 3:1
 * against every surface in every palette below, the bar for non-text
 * graphics, not the 4.5:1 bar for text.
 */
export const CategoryColors: Record<'binaural' | 'solfeggio' | 'noise', string> = {
  binaural: '#5D7A9E', // cool ink blue-gray — kin to the main accent
  solfeggio: '#9A5A6B', // dusty maroon — record-label red gone quiet
  noise: '#6B7F55', // moss — the one naturalistic note
};

export const Colors = {
  light: {
    text: '#231F17',
    textSecondary: '#6B6153',
    background: '#F7F2E7',
    backgroundSecondary: '#EFE7D6',
    card: '#FBF8F1',
    cardBorder: '#E2D8C3',
    cardElevated: '#FFFFFF',
    tint: inkBlue,
    primary: inkBlue,
    primaryLight: '#5C82AA',
    accent: inkBlue, // 6.23:1 on both surface levels
    icon: '#6B6153',
    tabIconDefault: '#B0A48C',
    tabIconSelected: inkBlueDark,
    success: '#4C7A4C',
    warning: '#8A5A1E', // AA on both surface levels
    error: '#A34B37', // AA on both surface levels
    slider: '#E2D8C3',
    sliderThumb: inkBlueDark,
    overlay: 'rgba(20, 16, 8, 0.5)',
    miniPlayer: '#FBF8F1',
  },
  dark: {
    text: '#F2EBDD',
    textSecondary: '#A79C87',
    background: '#15130F',
    backgroundSecondary: '#1D1A14',
    card: '#1D1A14',
    cardBorder: '#2E2A21',
    cardElevated: '#26221A',
    tint: inkBlueLight,
    primary: inkBlueLight,
    primaryLight: inkBlueLighter,
    accent: inkBlueLight, // 7.40:1 on both surface levels
    icon: '#A79C87',
    tabIconDefault: '#5C5548',
    tabIconSelected: inkBlueLight,
    success: '#8FB27A',
    warning: '#D9A253',
    error: '#D98267',
    slider: '#332D22',
    sliderThumb: inkBlueLight,
    overlay: 'rgba(0, 0, 0, 0.7)',
    miniPlayer: '#1D1A14',
  },
  // Night mode — OLED true-dark, everything dimmed for bedtime use. Low
  // contrast setting is intentionally ignored here.
  night: {
    text: '#C7BCA5',
    textSecondary: '#847A69', // AA on both surface levels
    background: '#050403',
    backgroundSecondary: '#0E0C09',
    card: '#0E0C09',
    cardBorder: '#191510',
    cardElevated: '#14100B',
    tint: '#6F98BE',
    primary: '#6F98BE',
    primaryLight: '#8FB0CE',
    accent: '#6F98BE', // 6.74:1 on both surface levels
    icon: '#786F5E',
    tabIconDefault: '#3E382E',
    tabIconSelected: '#6F98BE',
    success: '#7DA06C',
    warning: '#C1954F',
    error: '#B56A54',
    slider: '#1E1A14',
    sliderThumb: '#6F98BE',
    overlay: 'rgba(0, 0, 0, 0.8)',
    miniPlayer: '#0A0806',
  },
  // Low contrast mode for visual sensitivity — accent stays a legible ink
  // blue so selected/active states remain distinguishable (never plain
  // gray). "Low contrast" softens the *ceiling* (no near-black on
  // near-white); it must never push text under AA.
  lowContrastLight: {
    text: '#4A4436',
    textSecondary: '#726B5A', // AA on both surface levels
    background: '#F4EFE3',
    backgroundSecondary: '#EBE3D2',
    card: '#F8F4EA',
    cardBorder: '#DED4BE',
    cardElevated: '#FFFFFF',
    tint: '#3F6690',
    primary: '#3F6690',
    primaryLight: '#6D8CAC',
    accent: '#3F6690', // AA on both surface levels
    icon: '#7C725F',
    tabIconDefault: '#C7BCA2',
    tabIconSelected: '#33547A',
    success: '#6D946D',
    warning: '#82591F', // AA on both surface levels
    error: '#96513C', // AA on both surface levels
    slider: '#DED4BE',
    sliderThumb: '#3F6690',
    overlay: 'rgba(20, 16, 8, 0.3)',
    miniPlayer: '#F8F4EA',
  },
  lowContrastDark: {
    text: '#D6CDB9',
    textSecondary: '#A89C87', // AA on both surface levels
    background: '#1C1914',
    backgroundSecondary: '#27231B',
    card: '#27231B',
    cardBorder: '#352F24',
    cardElevated: '#352F24',
    tint: '#7FA8CC',
    primary: '#7FA8CC',
    primaryLight: '#A0BFDA',
    accent: '#7FA8CC',
    icon: '#8D8270',
    tabIconDefault: '#4E4738',
    tabIconSelected: '#A0BFDA',
    success: '#8CA97D',
    warning: '#C7A166',
    error: '#BD826C',
    slider: '#352F24',
    sliderThumb: '#7FA8CC',
    overlay: 'rgba(0, 0, 0, 0.5)',
    miniPlayer: '#27231B',
  },
};

// Minimum touch target size for accessibility (48x48 dp)
export const AccessibilitySize = {
  minTouchTarget: 48,
};

/**
 * Corner radii — the print/label world reads flatter and more die-cut than
 * the old pill-and-circle language. Small tags stay near-square; the few
 * genuinely circular elements (the dial, round icon badges) opt in
 * explicitly rather than inheriting a default pill radius.
 */
export const Radius = {
  tag: 4,
  card: 10,
  sheet: 20,
};

// Spacing constants - Modern generous spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Font families — Nunito Sans, loaded in app/_layout.tsx via expo-font
export const FontFamily = {
  regular: 'NunitoSans_400Regular',
  semibold: 'NunitoSans_600SemiBold',
  bold: 'NunitoSans_700Bold',
  /** Tape-counter numerals: the one authored display moment, reserved for
   *  Hz/frequency values and the sleep timer. Platform monospace, not a new
   *  font asset — the point is the tabular rhythm, not a display face. */
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};

// Typography scale (product register: tight ratio, hierarchy via weight).
// Tracking is size-specific: negative as type grows, slightly open as it
// shrinks. One value for every size is wrong somewhere.
// Six levels, not eleven: title1/2/3 were three sizes for one job (a
// prominent-but-not-largeTitle heading) and callout/subhead sat 1-2px from
// body and each other — distinctions that don't survive contact with a real
// screen. headline and body both stay at 17 and lean on weight, not size, to
// separate — the same trick Apple's own type scale uses at this step.
export const Typography = {
  largeTitle: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
    lineHeight: 39,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.semibold,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  headline: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontFamily: FontFamily.regular,
    lineHeight: 23,
  },
  footnote: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
    letterSpacing: 0.15,
  },
  /** Small printed-label caption: category tags, index tabs. Tracked
   *  uppercase is otherwise banned (craft-floor) — this is the one named
   *  system use, not a decoration sprinkled per-section. */
  label: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    lineHeight: 14,
    letterSpacing: 0.6,
  },
};
