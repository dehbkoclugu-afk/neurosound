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

// Text/icon colour on a filled primary surface lives in each palette as
// `onPrimary`, since each palette fills its buttons differently.

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
  // Day: a clean, chroma-free off-white (not the cream/sand default), white
  // cards with visible borders, the same violet as the accent. Violet fills
  // only the primary button; selection elsewhere is a pale violet tint.
  light: {
    text: '#1C1A20', // 16:1 on background
    textSecondary: '#57525C', // 7.4:1
    background: '#F7F7F5',
    backgroundSecondary: '#EFEEEB',
    card: '#FFFFFF',
    cardBorder: '#DEDBD6',
    cardElevated: '#FFFFFF',
    tint: '#5B45A8',
    primary: '#5B45A8',
    primaryLight: '#6E58BC',
    onPrimary: '#FFFFFF', // 8:1 on primary
    accent: '#5B45A8', // 7.6:1
    icon: '#57525C',
    tabIconDefault: '#6E6873', // 5.2:1
    tabIconSelected: '#5B45A8',
    tabPill: '#E9E4F5',
    tabPillIcon: '#5B45A8',
    success: '#4C7A4C',
    warning: '#8A5A12',
    error: '#A3452F',
    slider: '#E2DFDA',
    sliderThumb: '#1C1A20',
    overlay: 'rgba(16, 14, 20, 0.42)',
    miniPlayer: '#FFFFFF',
  },
  // "Gece": near-black with a hair of violet, warm paper text (low blue at
  // night), one violet accent. Filled actions use a dim violet (`primary`)
  // so the brightest thing on screen at 1am is never a button.
  dark: {
    text: '#EEE7DC', // 16.6:1 on background
    textSecondary: '#B3AA9F', // 8.9:1
    background: '#0A090D',
    backgroundSecondary: '#131118',
    card: '#131118',
    cardBorder: '#2B2731',
    cardElevated: '#1B1821',
    tint: '#B7A3E8',
    primary: '#3A3060',
    primaryLight: '#4A3E78',
    onPrimary: '#EEE7DC', // 10.9:1 on primary
    accent: '#B7A3E8', // 8.6:1
    icon: '#B3AA9F',
    tabIconDefault: '#8C847A', // 5.3:1, the floor for any text
    tabIconSelected: '#EEE7DC',
    tabPill: '#3A3060',
    tabPillIcon: '#EEE7DC',
    success: '#A9BE8E',
    warning: '#E0B070',
    error: '#E39A86',
    slider: '#2B2731',
    sliderThumb: '#EEE7DC',
    overlay: 'rgba(0, 0, 0, 0.7)',
    miniPlayer: '#1B1821',
  },
  // Low contrast mode for visual sensitivity — accent stays a legible ink
  // blue so selected/active states remain distinguishable (never plain
  // gray). "Low contrast" softens the *ceiling* (no near-black on
  // near-white); it must never push text under AA.
  lowContrastLight: {
    text: '#3D3942',
    textSecondary: '#5E5963',
    background: '#F2F1EF',
    backgroundSecondary: '#E9E8E5',
    card: '#FAFAF8',
    cardBorder: '#DAD7D2',
    cardElevated: '#FFFFFF',
    tint: '#64519F',
    primary: '#64519F',
    primaryLight: '#7563AE',
    onPrimary: '#FFFFFF',
    accent: '#64519F',
    icon: '#5E5963',
    tabIconDefault: '#716B75',
    tabIconSelected: '#64519F',
    tabPill: '#E6E1F0',
    tabPillIcon: '#64519F',
    success: '#5E8A5E',
    warning: '#82591F',
    error: '#96513C',
    slider: '#DAD7D2',
    sliderThumb: '#3D3942',
    overlay: 'rgba(20, 18, 24, 0.3)',
    miniPlayer: '#FAFAF8',
  },
  lowContrastDark: {
    text: '#D6CFC5',
    textSecondary: '#ACA49A',
    background: '#16141B',
    backgroundSecondary: '#1D1A23',
    card: '#1D1A23',
    cardBorder: '#34303B',
    cardElevated: '#24212B',
    tint: '#A595CF',
    primary: '#3B3456',
    primaryLight: '#463E66',
    onPrimary: '#D6CFC5',
    accent: '#A595CF',
    icon: '#ACA49A',
    tabIconDefault: '#948C82',
    tabIconSelected: '#D6CFC5',
    tabPill: '#3B3456',
    tabPillIcon: '#D6CFC5',
    success: '#9CAE86',
    warning: '#D0A86C',
    error: '#D2927F',
    slider: '#34303B',
    sliderThumb: '#D6CFC5',
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

// Font families, loaded in app/_layout.tsx via expo-font. Schibsted Grotesk
// for UI text, Young Serif for display (screen titles, the big frequency or
// sound name), Spline Sans Mono for numerals. None of the three has Cyrillic,
// CJK, Thai, Devanagari or Bengali; Android and iOS fall back to the system
// face per missing glyph, so those scripts still render, in the system font.
export const FontFamily = {
  regular: 'SchibstedGrotesk_400Regular',
  medium: 'SchibstedGrotesk_500Medium',
  semibold: 'SchibstedGrotesk_600SemiBold',
  bold: 'SchibstedGrotesk_700Bold',
  display: 'YoungSerif_400Regular',
  mono: 'SplineSansMono_500Medium',
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
  // Screen titles and section headings are set in the display serif; the
  // UI underneath stays in the grotesk. Floors: 16 for body, 13 for the
  // smallest readable text — someone half asleep is reading this.
  largeTitle: {
    fontSize: 32,
    fontFamily: FontFamily.display,
    lineHeight: 38,
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.display,
    lineHeight: 28,
  },
  headline: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    lineHeight: 22,
  },
  body: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    lineHeight: 23,
  },
  footnote: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 19,
  },
  caption: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 17,
  },
  /** The one oversized moment per screen: the playing frequency or sound
   *  name on the Player, the suggested intent on Home. */
  display: {
    fontSize: 88,
    fontFamily: FontFamily.display,
    lineHeight: 92,
    letterSpacing: -1.5,
  } as TextStyle,
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
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    lineHeight: 15,
    letterSpacing: 0.6,
  },
};
