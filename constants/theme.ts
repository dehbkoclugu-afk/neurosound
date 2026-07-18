/**
 * NeuroSound Theme Configuration
 * Modern Minimalist Design - Spotify/Apple Music Style
 * Accessibility-friendly colors with support for reduced contrast mode
 */

import { Platform } from 'react-native';

// Primary brand colors - Modern Minimalist
const primary = '#1DB954'; // Spotify green (or keep #6366F1 for indigo)
const primaryLight = '#1ED760';
const primaryDark = '#1AA34A';

// Category icons for UI (using Ionicons names)
export const CategoryIcons: Record<string, { name: string; library: 'ionicon' | 'material' }> = {
  binaural: { name: 'pulse', library: 'ionicon' },
  solfeggio: { name: 'musical-notes', library: 'ionicon' },
  noise: { name: 'water', library: 'ionicon' },
};

// Binaural type icons (using Ionicons/MaterialCommunityIcons names)
export const BinauralIcons: Record<string, { name: string; library: 'ionicon' | 'material' }> = {
  delta: { name: 'moon', library: 'ionicon' },
  theta: { name: 'meditation', library: 'material' },
  alpha: { name: 'leaf', library: 'ionicon' },
  beta: { name: 'flash', library: 'ionicon' },
  gamma: { name: 'trending-up', library: 'ionicon' },
};

// Noise type icons
export const NoiseIcons: Record<string, { name: string; library: 'ionicon' | 'material' }> = {
  white: { name: 'radio', library: 'ionicon' },
  pink: { name: 'flower', library: 'ionicon' },
  brown: { name: 'cloudy', library: 'ionicon' },
  rain: { name: 'rainy', library: 'ionicon' },
  thunder: { name: 'thunderstorm', library: 'ionicon' },
  ocean: { name: 'water', library: 'ionicon' },
  wind: { name: 'leaf', library: 'ionicon' },
  fire: { name: 'flame', library: 'ionicon' },
  forest: { name: 'leaf', library: 'ionicon' },
  stream: { name: 'water', library: 'ionicon' },
  fan: { name: 'sync', library: 'ionicon' },
  airplane: { name: 'airplane', library: 'ionicon' },
  train: { name: 'train', library: 'ionicon' },
};

// Solfeggio icon
export const SolfeggioIcon = { name: 'musical-note', library: 'ionicon' as const };

// Frequency category colors
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

// Gradient backgrounds for presets
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
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    background: '#FAFAFA',
    backgroundSecondary: '#F3F4F6',
    card: '#FFFFFF',
    cardBorder: '#E5E7EB',
    cardElevated: '#FFFFFF',
    tint: primary,
    primary: primary,
    primaryLight: primaryLight,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primary,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    slider: '#E5E7EB',
    sliderThumb: primary,
    overlay: 'rgba(0, 0, 0, 0.5)',
    miniPlayer: '#FFFFFF',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    card: '#1E1E1E',
    cardBorder: '#282828',
    cardElevated: '#282828',
    tint: primary,
    primary: primary,
    primaryLight: primaryLight,
    icon: '#B3B3B3',
    tabIconDefault: '#535353',
    tabIconSelected: primary,
    success: '#1DB954',
    warning: '#FBBF24',
    error: '#F87171',
    slider: '#535353',
    sliderThumb: primary,
    overlay: 'rgba(0, 0, 0, 0.7)',
    miniPlayer: '#282828',
  },
  // Low contrast mode for visual sensitivity
  lowContrastLight: {
    text: '#4B5563',
    textSecondary: '#9CA3AF',
    background: '#F9FAFB',
    backgroundSecondary: '#F3F4F6',
    card: '#F9FAFB',
    cardBorder: '#E5E7EB',
    cardElevated: '#FFFFFF',
    tint: '#9CA3AF',
    primary: '#9CA3AF',
    primaryLight: '#D1D5DB',
    icon: '#9CA3AF',
    tabIconDefault: '#D1D5DB',
    tabIconSelected: '#6B7280',
    success: '#6EE7B7',
    warning: '#FCD34D',
    error: '#FCA5A5',
    slider: '#E5E7EB',
    sliderThumb: '#9CA3AF',
    overlay: 'rgba(0, 0, 0, 0.3)',
    miniPlayer: '#F9FAFB',
  },
  lowContrastDark: {
    text: '#D1D5DB',
    textSecondary: '#6B7280',
    background: '#1F2937',
    backgroundSecondary: '#374151',
    card: '#374151',
    cardBorder: '#4B5563',
    cardElevated: '#4B5563',
    tint: '#6B7280',
    primary: '#6B7280',
    primaryLight: '#9CA3AF',
    icon: '#6B7280',
    tabIconDefault: '#4B5563',
    tabIconSelected: '#9CA3AF',
    success: '#6EE7B7',
    warning: '#FCD34D',
    error: '#FCA5A5',
    slider: '#4B5563',
    sliderThumb: '#6B7280',
    overlay: 'rgba(0, 0, 0, 0.5)',
    miniPlayer: '#374151',
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

// Typography scale
export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
