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

import { Platform } from 'react-native';

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

// Frequency category colors (preset identity coding — not the brand accent)
export const FrequencyColors = {
  binaural: {
    delta: '#3B82F6', // Blue - sleep
    theta: '#8B5CF6', // Purple - meditation
    alpha: '#10B981', // Green - relaxation
    beta: '#F59E0B', // Amber - focus
    gamma: '#EF4444', // Red - cognitive
  },
  solfeggio: '#EC4899', // Pink
  noise: {
    white: '#94A3B8',
    pink: '#F472B6',
    brown: '#A78BFA',
  },
};

// Gradient backgrounds for presets (player screen identity per sound)
export const GradientColors: Record<string, string[]> = {
  // Binaural
  delta: ['#1e3a5f', '#3B82F6'],
  theta: ['#4c1d95', '#8B5CF6'],
  alpha: ['#065f46', '#10B981'],
  beta: ['#92400e', '#F59E0B'],
  gamma: ['#991b1b', '#EF4444'],
  // Solfeggio - each frequency has unique color
  solfeggio: ['#831843', '#EC4899'], // Default fallback
  'solfeggio-40': ['#78350f', '#F59E0B'],    // Amber
  'solfeggio-111': ['#064e3b', '#10B981'],   // Emerald
  'solfeggio-174': ['#7f1d1d', '#EF4444'],   // Red
  'solfeggio-285': ['#7c2d12', '#F97316'],   // Orange
  'solfeggio-396': ['#4c1d95', '#8B5CF6'],   // Violet
  'solfeggio-417': ['#831843', '#F472B6'],   // Pink
  'solfeggio-432': ['#14532d', '#22C55E'],   // Green
  'solfeggio-440': ['#1e3a8a', '#3B82F6'],   // Blue
  'solfeggio-528': ['#831843', '#EC4899'],   // Pink (Love)
  'solfeggio-639': ['#164e63', '#06B6D4'],   // Cyan
  'solfeggio-741': ['#0c4a6e', '#0EA5E9'],   // Sky blue
  'solfeggio-777': ['#78350f', '#FBBF24'],   // Gold
  'solfeggio-852': ['#312e81', '#6366F1'],   // Indigo
  'solfeggio-888': ['#581c87', '#A855F7'],   // Purple
  'solfeggio-963': ['#701a75', '#D946EF'],   // Fuchsia
  // Noise - Classic
  white: ['#475569', '#94A3B8'],
  pink: ['#9d174d', '#F472B6'],
  brown: ['#5b21b6', '#A78BFA'],
  // Noise - Nature
  rain: ['#1e3a5f', '#60A5FA'],
  thunder: ['#312e81', '#6366F1'],
  ocean: ['#164e63', '#06B6D4'],
  wind: ['#4c1d95', '#8B5CF6'],
  fire: ['#7c2d12', '#F97316'],
  forest: ['#14532d', '#22C55E'],
  stream: ['#134e4a', '#14B8A6'],
  // Noise - Machines
  fan: ['#334155', '#64748B'],
  airplane: ['#1e293b', '#475569'],
  train: ['#44403c', '#78716C'],
};

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
    icon: '#6E655A',
    tabIconDefault: '#A99F91',
    tabIconSelected: primaryDark,
    success: '#4C9A57',
    warning: '#C77F2C',
    error: '#C4553B',
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
    // 4.7:1 on #050403 — the smallest bump that clears AA. Night mode stays
    // as dim as compliance allows; footnotes were unreadable at 4.15:1.
    textSecondary: '#827764',
    background: '#050403',
    backgroundSecondary: '#12100D',
    card: '#12100D',
    cardBorder: '#1D1915',
    cardElevated: '#171310',
    tint: '#A87C3F',
    primary: '#A87C3F',
    primaryLight: '#C1954F',
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
    textSecondary: '#756B5D', // 4.8:1 on #F8F5F0 (was #948A7C at 3.1:1)
    background: '#F8F5F0',
    backgroundSecondary: '#F1ECE3',
    card: '#F8F5F0',
    cardBorder: '#E5DFD3',
    cardElevated: '#FFFFFF',
    tint: '#B59B72',
    primary: '#B59B72',
    primaryLight: '#CBB699',
    icon: '#948A7C',
    tabIconDefault: '#C9C0B2',
    tabIconSelected: '#94794F',
    success: '#8FB894',
    warning: '#D6B27C',
    error: '#D19582',
    slider: '#E5DFD3',
    sliderThumb: '#B59B72',
    overlay: 'rgba(0, 0, 0, 0.3)',
    miniPlayer: '#F8F5F0',
  },
  lowContrastDark: {
    text: '#C9C0B2',
    textSecondary: '#8D8478', // 4.8:1 on #1B1815 (was #7D746A at 3.9:1)
    background: '#1B1815',
    backgroundSecondary: '#26221E',
    card: '#26221E',
    cardBorder: '#332E28',
    cardElevated: '#332E28',
    tint: '#8F7A5C',
    primary: '#8F7A5C',
    primaryLight: '#A69072',
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
  iconSize: 24,
  iconSizeLarge: 32,
  borderRadius: 12,
  borderRadiusLarge: 16,
  borderRadiusXL: 24,
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

// Shadow styles for elevation
export const Shadows = {
  small: Platform.select({
    web: { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
  }),
  medium: Platform.select({
    web: { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  }),
  large: Platform.select({
    web: { boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  }),
};

// Font families — Nunito Sans, loaded in app/_layout.tsx via expo-font
export const FontFamily = {
  regular: 'NunitoSans_400Regular',
  semibold: 'NunitoSans_600SemiBold',
  bold: 'NunitoSans_700Bold',
};

// Typography scale (product register: tight ratio, hierarchy via weight)
export const Typography = {
  largeTitle: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
    lineHeight: 39,
  },
  title1: {
    fontSize: 27,
    fontFamily: FontFamily.bold,
    lineHeight: 33,
  },
  title2: {
    fontSize: 22,
    fontFamily: FontFamily.semibold,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontFamily: FontFamily.semibold,
    lineHeight: 25,
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
  callout: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    lineHeight: 21,
  },
  subhead: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    lineHeight: 13,
  },
  // For Hz values, timers, counters — tabular figures
  mono: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    lineHeight: 20,
    fontVariant: ['tabular-nums'] as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
