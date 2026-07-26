/**
 * NeuroSound Theme Configuration
 *
 * Identity: "Kor" — calm warm amber on deep warm neutrals.
 * Dark-first (primary use case: at night, in a dark room, before sleep).
 * The amber accent is a functional choice: low blue-light stimulation.
 *
 * Variants: light, dark (default), night (OLED, dimmed for bedtime),
 * lowContrastLight / lowContrastDark (visual sensitivity — primary stays
 * a muted amber so selected states remain readable, never gray).
 */

// Primary brand colors — calm amber
const primary = '#D99A4E';
const primaryLight = '#E8B573';
const primaryDark = '#B57C35';

/**
 * Text/icon colour for anything sitting ON a filled primary surface.
 * White on amber is 2.4:1 — well below WCAG AA. This warm near-black is
 * 7.6:1 on #D99A4E and 5.9:1 on the dimmed night amber.
 */
export const onPrimary = '#1A140C';

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

// Category icons for UI (rendered via components/ui/Icon)
export const CategoryIcons: Record<string, { name: string; library: 'ionicon' | 'material' }> = {
  binaural: { name: 'pulse', library: 'ionicon' },
  solfeggio: { name: 'musical-notes', library: 'ionicon' },
  noise: { name: 'volume-medium', library: 'ionicon' },
};

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
 * Category markers — the one place a sound's own colour still shows.
 *
 * The app used to carry 22 distinct preset colours and paint whole screens
 * with them, which fought the single-amber identity this file declares. Colour
 * now identifies the *kind* of sound and nothing more: a tinted row icon, a dot
 * beside the frequency. Everything structural is amber.
 *
 * Each clears 3:1 against all nine surfaces across the five palettes, so one
 * value works everywhere rather than five sets of three.
 */
export const CategoryColors: Record<'binaural' | 'solfeggio' | 'noise', string> = {
  binaural: '#6578AD',
  solfeggio: '#AA6482',
  noise: '#4E8474',
};

/**
 * Accent colour for text and standalone glyphs — links, "See all", the timer
 * badge, secondary button labels.
 *
 * `primary` is a fill colour: it works under `onPrimary` text and as a slider
 * track, but as text on a light background it is 2.3:1. This is the same amber
 * pushed until it clears AA on each palette's background. Fills keep `primary`;
 * anything the user has to read uses this.
 */
export const Colors = {
  light: {
    text: '#201B15',
    textSecondary: '#6E655A',
    background: '#FAF7F2',
    backgroundSecondary: '#F1ECE3',
    card: '#FFFFFF',
    cardBorder: '#E5DFD3',
    cardElevated: '#FFFFFF',
    tint: primary,
    primary: primary,
    primaryLight: primaryLight,
    accent: '#925E1F', // AA on both surface levels
    icon: '#6E655A',
    tabIconDefault: '#A99F91',
    tabIconSelected: primaryDark,
    success: '#4C9A57',
    warning: '#935E20', // AA on both surface levels
    error: '#AE4B34', // AA on both surface levels
    slider: '#E5DFD3',
    sliderThumb: primaryDark,
    overlay: 'rgba(0, 0, 0, 0.5)',
    miniPlayer: '#FFFFFF',
  },
  dark: {
    text: '#F5EFE6',
    textSecondary: '#A69B8C',
    background: '#131110',
    backgroundSecondary: '#1C1917',
    card: '#1C1917',
    cardBorder: '#2A2521',
    cardElevated: '#252019',
    tint: primary,
    primary: primary,
    primaryLight: primaryLight,
    accent: primary, // AA on both surface levels
    icon: '#A69B8C',
    tabIconDefault: '#5C544A',
    tabIconSelected: primary,
    success: '#7FB069',
    warning: '#E8B573',
    error: '#E07A5F',
    slider: '#3A332C',
    sliderThumb: primary,
    overlay: 'rgba(0, 0, 0, 0.7)',
    miniPlayer: '#1C1917',
  },
  // Night mode — OLED true-dark, everything dimmed and amber-shifted for
  // bedtime use. Low-contrast setting is intentionally ignored here.
  night: {
    text: '#CDBFA9',
    // AA on both surface levels
    // as dim as compliance allows; footnotes were unreadable at 4.15:1.
    textSecondary: '#877C68',
    background: '#050403',
    backgroundSecondary: '#12100D',
    card: '#12100D',
    cardBorder: '#1D1915',
    cardElevated: '#171310',
    tint: '#A87C3F',
    primary: '#A87C3F',
    primaryLight: '#C1954F',
    accent: '#A87C3F', // AA on both surface levels
    icon: '#7A6F5F',
    tabIconDefault: '#453E35',
    tabIconSelected: '#A87C3F',
    success: '#6E9463',
    warning: '#C1954F',
    error: '#B56A54',
    slider: '#241F1A',
    sliderThumb: '#A87C3F',
    overlay: 'rgba(0, 0, 0, 0.8)',
    miniPlayer: '#0C0A08',
  },
  // Low contrast mode for visual sensitivity — primary stays a muted amber
  // so selected/active states remain distinguishable (never plain gray).
  // "Low contrast" softens the *ceiling* (no near-black on near-white); it
  // must never push text under AA. Secondary text stays at or above 4.5:1.
  lowContrastLight: {
    text: '#4E463C',
    textSecondary: '#72685B', // AA on both surface levels
    background: '#F8F5F0',
    backgroundSecondary: '#F1ECE3',
    card: '#F8F5F0',
    cardBorder: '#E5DFD3',
    cardElevated: '#FFFFFF',
    tint: '#B59B72',
    primary: '#B59B72',
    primaryLight: '#CBB699',
    accent: '#7E6642', // AA on both surface levels
    icon: '#948A7C',
    tabIconDefault: '#C9C0B2',
    tabIconSelected: '#94794F',
    success: '#8FB894',
    warning: '#88632A', // AA on both surface levels
    error: '#A2543C', // AA on both surface levels
    slider: '#E5DFD3',
    sliderThumb: '#B59B72',
    overlay: 'rgba(0, 0, 0, 0.3)',
    miniPlayer: '#F8F5F0',
  },
  lowContrastDark: {
    text: '#C9C0B2',
    textSecondary: '#928A7E', // AA on both surface levels
    background: '#1B1815',
    backgroundSecondary: '#26221E',
    card: '#26221E',
    cardBorder: '#332E28',
    cardElevated: '#332E28',
    tint: '#8F7A5C',
    primary: '#8F7A5C',
    primaryLight: '#A69072',
    accent: '#9E8868', // AA on both surface levels
    icon: '#7D746A',
    tabIconDefault: '#4A443C',
    tabIconSelected: '#A69072',
    success: '#7F9C7B',
    warning: '#BFA477',
    error: '#B08672',
    slider: '#332E28',
    sliderThumb: '#8F7A5C',
    overlay: 'rgba(0, 0, 0, 0.5)',
    miniPlayer: '#26221E',
  },
};

// Minimum touch target size for accessibility (48x48 dp)
export const AccessibilitySize = {
  minTouchTarget: 48,
  borderRadius: 12,
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
};

