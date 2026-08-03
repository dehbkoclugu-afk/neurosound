import {
  Colors,
  CategoryColorSets,
  IntentColorSets,
  BADGE_ALPHA,
} from '../theme';

/**
 * The category/intent marker colours are the one part of the palette that is
 * *solved* rather than picked, and both of their thresholds have already been
 * missed once each: the first pass shipped a single flat set, which put the
 * solfeggio icon at 2.88:1 against its own badge and the Home catalog code
 * (coloured 11px text) under AA on 16 of 20 surface/theme combinations.
 *
 * Neither failure was visible enough to catch by eye, so they are pinned here.
 */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrast(a: string, b: string): number {
  const l1 = relativeLuminance(hexToRgb(a));
  const l2 = relativeLuminance(hexToRgb(b));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Composite `fg` over `bg` at `alpha` — what the tinted icon badge actually
 *  resolves to once it is drawn on a surface. */
function composite(fg: string, bg: string, alpha: number): string {
  const f = hexToRgb(fg);
  const b = hexToRgb(bg);
  return (
    '#' +
    f
      .map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0'))
      .join('')
  );
}

// Which palettes take which solved colour set (mirrors use-theme-colors.ts).
const DARK_PALETTES = ['dark', 'lowContrastDark'] as const;
const LIGHT_PALETTES = ['light', 'lowContrastLight'] as const;

/** Every surface a marker badge can be drawn on, per palette. */
function surfacesFor(palette: keyof typeof Colors): string[] {
  const c = Colors[palette];
  return [c.background, c.backgroundSecondary, c.card];
}

const AA_TEXT = 4.5; // WCAG AA, normal-size text
const GRAPHIC = 3; // WCAG AA, non-text graphics

describe('approved light shell tokens', () => {
  it('uses cool fog surfaces instead of the retired warm paper palette', () => {
    expect(Colors.light).toMatchObject({
      text: '#18212B',
      textSecondary: '#566575',
      background: '#F1F4F7',
      backgroundSecondary: '#E8EDF2',
      card: '#F8FAFC',
      cardBorder: '#D5DDE6',
      slider: '#D5DDE6',
      miniPlayer: '#F8FAFC',
    });

    expect(Colors.lowContrastLight).toMatchObject({
      text: '#3F4A56',
      textSecondary: '#596775',
      background: '#EEF2F5',
      backgroundSecondary: '#E3E9EF',
      card: '#F4F7F9',
      cardBorder: '#D2DAE3',
    });
  });
});

describe('marker colour contrast', () => {
  const cases: [string, Record<string, string>, readonly string[]][] = [
    ['category/light', CategoryColorSets.light, LIGHT_PALETTES],
    ['category/dark', CategoryColorSets.dark, DARK_PALETTES],
    ['intent/light', IntentColorSets.light, LIGHT_PALETTES],
    ['intent/dark', IntentColorSets.dark, DARK_PALETTES],
  ];

  it.each(cases)(
    '%s: every marker clears 3:1 against its own tinted badge',
    (_name, set, palettes) => {
      const failures: string[] = [];
      for (const [key, color] of Object.entries(set)) {
        for (const palette of palettes) {
          for (const surface of surfacesFor(palette as keyof typeof Colors)) {
            const badge = composite(color, surface, BADGE_ALPHA);
            const ratio = contrast(color, badge);
            if (ratio < GRAPHIC) {
              failures.push(`${key}@${palette} on ${surface}: ${ratio.toFixed(2)}:1`);
            }
          }
        }
      }
      expect(failures).toEqual([]);
    }
  );

  it.each(cases)(
    '%s: every marker clears 4.5:1 as text (Home catalog code is 11px coloured text)',
    (_name, set, palettes) => {
      const failures: string[] = [];
      for (const [key, color] of Object.entries(set)) {
        for (const palette of palettes) {
          for (const surface of surfacesFor(palette as keyof typeof Colors)) {
            const ratio = contrast(color, surface);
            if (ratio < AA_TEXT) {
              failures.push(`${key}@${palette} on ${surface}: ${ratio.toFixed(2)}:1`);
            }
          }
        }
      }
      expect(failures).toEqual([]);
    }
  );
});

describe('core palette contrast', () => {
  it('text and secondary text clear AA on both surface levels in every palette', () => {
    const failures: string[] = [];
    for (const [name, c] of Object.entries(Colors)) {
      for (const surface of [c.background, c.backgroundSecondary]) {
        for (const [role, value] of [
          ['text', c.text],
          ['textSecondary', c.textSecondary],
          ['accent', c.accent],
        ] as const) {
          const ratio = contrast(value, surface);
          if (ratio < AA_TEXT) {
            failures.push(`${name}.${role} on ${surface}: ${ratio.toFixed(2)}:1`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

/**
 * The mixer's delete button is the only destructive control in the app and it
 * is drawn as a bare icon in `error`. An icon carries no text, so 3:1 is the
 * floor — but a warning colour that only just clears it is a warning nobody
 * reads, so this pins the stricter text threshold it currently satisfies in
 * every palette.
 */
describe('destructive colour', () => {
  it('error reads clearly on both surface levels in every palette', () => {
    const failures: string[] = [];
    for (const [name, c] of Object.entries(Colors)) {
      for (const surface of [c.background, c.backgroundSecondary]) {
        const ratio = contrast(c.error, surface);
        if (ratio < AA_TEXT) {
          failures.push(`${name}.error on ${surface}: ${ratio.toFixed(2)}:1`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

/**
 * The slider thumb has to be findable at every position. It is drawn as a
 * filled knob with a 2px ring in the empty-track colour, so two relationships
 * carry it and both are pinned here:
 *
 *   thumb vs. empty track — reads on the unfilled part of the bar
 *   ring (= track colour) vs. fill — reads on the filled part
 *
 * It failed the first of these outright: in three of the five palettes
 * `sliderThumb` was the same hex as `accent`, so at full volume the knob was
 * drawn in exactly the colour of the fill behind it and disappeared. A drop
 * shadow had been hiding that. 3:1 is the floor — a control is a non-text
 * graphic.
 *
 * No flat colour clears 3:1 against both a near-black track and the mid-tone
 * category fills (those fills are mid-tone *because* they must clear 3:1
 * against the background), which is exactly why the ring exists rather than
 * being decoration.
 */
describe('slider thumb', () => {
  it('separates from the empty track in every palette', () => {
    const failures: string[] = [];
    for (const [name, c] of Object.entries(Colors)) {
      const ratio = contrast(c.sliderThumb, c.slider);
      if (ratio < GRAPHIC) {
        failures.push(`${name}.sliderThumb on track: ${ratio.toFixed(2)}:1`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('its ring separates from every colour that can fill the bar', () => {
    const failures: string[] = [];
    for (const [name, c] of Object.entries(Colors)) {
      const isDark = name === 'dark' || name === 'lowContrastDark';
      const fills = [c.accent, ...Object.values(CategoryColorSets[isDark ? 'dark' : 'light'])];
      for (const fill of fills) {
        // The ring is drawn in the empty-track colour.
        const ratio = contrast(c.slider, fill);
        if (ratio < GRAPHIC) {
          failures.push(`${name} ring on fill ${fill}: ${ratio.toFixed(2)}:1`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
