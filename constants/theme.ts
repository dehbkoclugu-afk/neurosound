/**
 * NeuroSound Theme Configuration — "Night Deck"
 *
 * Direction: a cinematic sound atlas inside a neutral near-black instrument
 * shell. Imagery carries discovery and the Player; cool graphite surfaces and
 * one ink-blue accent keep operational controls quiet and legible.
 *
 * Variants: light, dark (default), lowContrastLight / lowContrastDark
 * (visual sensitivity — accent stays a
 * legible ink blue so selected states remain readable, never plain gray).
 */

import { Platform, TextStyle } from 'react-native';

// Primary brand colour — deep record-label ink blue, not the old amber.
const inkBlue = '#2F5C8A';
const inkBlueLight = '#7FA8CC';
const inkBlueLighter = '#A6C4DE';
const inkBlueDark = '#1F3F5E';

/**
 * Text/icon colour for anything sitting ON a filled primary surface.
 * Computed against each theme's own primary fill (see constants/__tests__
 * notes in PRODUCT.md/DESIGN.md); every pairing below clears 6:1.
 */
export const onPrimary = '#F7F9FC';

/**
 * Text/icon colour for anything sitting ON a photograph — the Intent hero,
 * and nowhere else. It is pure white on purpose (the paper neutral loses to
 * a bright image), which is exactly why it needs a name: a bare '#FFFFFF' in
 * a stylesheet reads as somebody forgetting the palette existed. It is only
 * legible because the hero lays a dark scrim under it.
 */
export const onImage = '#FFFFFF';
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
 * Category and intent markers — record-label ink family.
 *
 * These are palette-scoped, not one fixed value each. A single mid-tone
 * cannot clear its threshold against surfaces that span #F1F4F7 to
 * #050403: the first pass shipped one flat set and it failed twice —
 * the solfeggio icon landed at 2.88:1 on its own badge, and the Home
 * catalog code (coloured 11px *text*, so a 4.5:1 case, not 3:1) came in
 * under AA on 16 of 20 surface/theme combinations.
 *
 * Both sets below are solved so every colour clears **3.6:1 against its
 * own 16%-alpha badge** and **4.8:1 as text** on every surface its palette
 * group uses. Light palettes take the darkened set, dark palettes the
 * lightened one; resolve them through `useCategoryColors()` /
 * `useIntentColors()` rather than importing directly.
 */
export type CategoryKey = 'binaural' | 'solfeggio' | 'noise';
export type IntentKey = 'sleep' | 'focus' | 'relax' | 'meditate';

const categoryColorsLight: Record<CategoryKey, string> = {
  binaural: '#4D637E', // cool ink blue-gray — kin to the main accent
  solfeggio: '#8A515F', // dusty maroon — record-label red gone quiet
  noise: '#576644', // moss — the one naturalistic note
};
const categoryColorsDark: Record<CategoryKey, string> = {
  binaural: '#7A91AC',
  solfeggio: '#B2828B',
  noise: '#84946F',
};

const intentColorsLight: Record<IntentKey, string> = {
  sleep: '#49647D',
  focus: '#7B5C2E',
  relax: '#536747',
  meditate: '#755970',
};
const intentColorsDark: Record<IntentKey, string> = {
  sleep: '#7492AD',
  focus: '#AB8A59',
  relax: '#7C966E',
  meditate: '#A3869E',
};

export const CategoryColorSets = { light: categoryColorsLight, dark: categoryColorsDark };
export const IntentColorSets = { light: intentColorsLight, dark: intentColorsDark };

/** Tint strength for the circular icon badge behind a category/intent glyph.
 *  The contrast solve above is pinned to this value — changing it invalidates
 *  both thresholds, so it lives here rather than being retyped at call sites. */
export const BADGE_ALPHA = 0.16;

export const Colors = {
  light: {
    text: '#18212B',
    textSecondary: '#566575',
    background: '#F1F4F7',
    backgroundSecondary: '#E8EDF2',
    card: '#F8FAFC',
    cardBorder: '#D5DDE6',
    cardElevated: '#FFFFFF',
    tint: inkBlue,
    primary: inkBlue,
    primaryLight: '#5C82AA',
    accent: inkBlue, // 6.23:1 on both surface levels
    icon: '#566575',
    tabIconDefault: '#8A98A8',
    tabIconSelected: inkBlueDark,
    success: '#4C7A4C',
    warning: '#8A5A1E', // AA on both surface levels
    error: '#A34B37', // AA on both surface levels
    slider: '#D5DDE6',
    // Foreground on track: the thumb used to be the accent colour
    // in every palette — in three of them literally the same hex — so at full
    // value it sat invisible on its own fill. Matching `text` gives it
    // contrast against both the empty track and every fill by construction.
    sliderThumb: '#18212B',
    overlay: 'rgba(16, 24, 32, 0.42)',
    miniPlayer: '#F8FAFC',
  },
  dark: {
    text: '#F2F5F8',
    textSecondary: '#A6B0BD',
    background: '#080B10',
    backgroundSecondary: '#10151D',
    card: '#10151D',
    cardBorder: '#26303C',
    cardElevated: '#171E28',
    tint: inkBlueLight,
    primary: inkBlueLight,
    primaryLight: inkBlueLighter,
    accent: inkBlueLight, // 7.40:1 on both surface levels
    icon: '#9AA6B5',
    tabIconDefault: '#657181',
    tabIconSelected: inkBlueLight,
    success: '#8FB27A',
    warning: '#D9A253',
    error: '#D98267',
    slider: '#273140',
    sliderThumb: '#F2F5F8',
    overlay: 'rgba(0, 0, 0, 0.7)',
    miniPlayer: '#0D1219',
  },
  // Low contrast mode for visual sensitivity — accent stays a legible ink
  // blue so selected/active states remain distinguishable (never plain
  // gray). "Low contrast" softens the *ceiling* (no near-black on
  // near-white); it must never push text under AA.
  lowContrastLight: {
    text: '#3F4A56',
    textSecondary: '#596775',
    background: '#EEF2F5',
    backgroundSecondary: '#E3E9EF',
    card: '#F4F7F9',
    cardBorder: '#D2DAE3',
    cardElevated: '#FFFFFF',
    tint: '#3F6690',
    primary: '#3F6690',
    primaryLight: '#6D8CAC',
    accent: '#3F6690', // AA on both surface levels
    icon: '#687686',
    tabIconDefault: '#9AA7B4',
    tabIconSelected: '#33547A',
    success: '#6D946D',
    warning: '#82591F', // AA on both surface levels
    error: '#96513C', // AA on both surface levels
    slider: '#D2DAE3',
    sliderThumb: '#3F4A56',
    overlay: 'rgba(20, 30, 40, 0.3)',
    miniPlayer: '#F4F7F9',
  },
  lowContrastDark: {
    text: '#D9E0E8',
    textSecondary: '#9EA9B6',
    background: '#10151B',
    backgroundSecondary: '#18212B',
    card: '#18212B',
    cardBorder: '#303B49',
    cardElevated: '#202A35',
    tint: '#7FA8CC',
    primary: '#7FA8CC',
    primaryLight: '#A0BFDA',
    accent: '#7FA8CC',
    icon: '#8C98A6',
    tabIconDefault: '#596574',
    tabIconSelected: '#A0BFDA',
    success: '#8CA97D',
    warning: '#C7A166',
    error: '#BD826C',
    slider: '#303B49',
    sliderThumb: '#D9E0E8',
    overlay: 'rgba(0, 0, 0, 0.5)',
    miniPlayer: '#18212B',
  },
};

/**
 * The accessibility floor, and nothing else.
 *
 * `minTouchTarget` is a guarantee — no tappable thing may be smaller. Reading
 * it as a layout measure made it load-bearing in two unrelated ways at once:
 * raising the floor (a pure accessibility win) would have silently resized
 * chips, rows and buttons across the app, and `minTouchTarget + 4` was
 * arithmetic on a constant that is not a scale. Layout heights live in
 * `ControlSize` below; use this only where the number exists to keep a finger
 * target big enough.
 */
export const AccessibilitySize = {
  minTouchTarget: 48,
};

/**
 * The only elevation in the app, and the rule for it: a control that the
 * finger *moves along a surface* has to read as sitting on top of that
 * surface. Nothing else is raised — no raised cards, no floating sheets, no
 * elevated buttons. The interface is die-cut print with exactly one knob on
 * it.
 *
 * This started as an unnamed shadow on the slider thumb, the app's only one.
 * Removing it (rather than naming it) looked correct in the stylesheet and
 * was wrong on screen: at full volume the thumb sits on the accent fill,
 * which is its own colour family, and with nothing lifting it off the bar it
 * read as a hole punched through the track.
 */
export const Elevation = {
  control: Platform.select({
    web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)' },
    default: {
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
  }),
};

/** Chosen control heights — design decisions, free to change without touching
 *  the accessibility floor (and, being >= it, never violating it). */
export const ControlSize = {
  /** List rows, option chips, icon-button rows. */
  row: 48,
  /** Primary calls to action: a step taller than a row, so the main button on
   *  a screen is not the same size as the things it sits among. */
  cta: 52,
  /** Text fields and search bars — shorter than a row on purpose: an input
   *  sits inside a layout rather than being one of its rows. */
  field: 44,
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
  /** Fully rounded ends. Only for genuinely capsule-shaped controls (the
   *  onboarding/intent primary buttons, filter chips) — a circle whose
   *  radius is simply half its own size stays inline as `size / 2` rather
   *  than pretending to be a token. */
  pill: 999,
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
  /** Tape-counter numerals. Apply to the **number only**, as a nested
   *  `<Text>`, never to the phrase around it: the monospace space glyph is
   *  far wider than Nunito's, so styling "2 Hz" wholesale renders as
   *  "2␣␣Hz", and a whole sentence ("Volume capped at 80%") comes out
   *  looking like a terminal dump rather than a readout. */
  numeral: {
    fontFamily: FontFamily.mono,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  } as TextStyle,
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
