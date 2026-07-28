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
const DARK_PALETTES = ['dark', 'night', 'lowContrastDark'] as const;
const LIGHT_PALETTES = ['light', 'lowContrastLight'] as const;

/** Every surface a marker badge can be drawn on, per palette. */
function surfacesFor(palette: keyof typeof Colors): string[] {
  const c = Colors[palette];
  return [c.background, c.backgroundSecondary, c.card];
}

const AA_TEXT = 4.5; // WCAG AA, normal-size text
const GRAPHIC = 3; // WCAG AA, non-text graphics

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
