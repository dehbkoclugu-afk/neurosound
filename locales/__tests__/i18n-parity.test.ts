import { LANGUAGES } from '..';
import en from '../en.json';

/**
 * A missing translation key doesn't throw or fail visibly — react-i18next
 * just falls back to the key string in the UI. With two locales that was a
 * risk; with eleven it is a certainty without this test, since every new
 * string has to land in eleven files at once.
 *
 * English is the structural reference: `scripts/build-locale.py` generates
 * the other files from its shape, and this checks that nothing has drifted
 * since.
 */
function flattenKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null ? flattenKeys(value, path) : [path];
  });
}

function valueAt(dict: object, key: string): unknown {
  return key.split('.').reduce<any>((o, k) => o?.[k], dict);
}

/** {{minutes}}, {{n}}, … — the one thing a translation can silently break. */
function placeholders(value: string): string[] {
  return (value.match(/\{\{(\w+)\}\}/g) ?? []).sort();
}

const enKeys = flattenKeys(en).sort();

describe('locale parity', () => {
  it('registers every locale file exactly once', () => {
    const codes = LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain('en');
    expect(codes).toContain('tr');
  });

  it.each(LANGUAGES.map((l) => [l.code, l.translation] as const))(
    '%s has exactly the keys en.json has',
    (_code, translation) => {
      expect(flattenKeys(translation).sort()).toEqual(enKeys);
    }
  );

  it.each(LANGUAGES.map((l) => [l.code, l.translation] as const))(
    '%s has no empty values',
    (_code, translation) => {
      const empty = enKeys.filter((key) => valueAt(translation, key) === '');
      expect(empty).toEqual([]);
    }
  );

  it.each(LANGUAGES.map((l) => [l.code, l.translation] as const))(
    '%s keeps every interpolation placeholder',
    (_code, translation) => {
      const broken = enKeys.filter(
        (key) =>
          placeholders(String(valueAt(en, key))).join() !==
          placeholders(String(valueAt(translation, key))).join()
      );
      expect(broken).toEqual([]);
    }
  );

  /**
   * A translation left in English is invisible to every check above: right
   * key, right placeholders, not empty. This catches whole strings that were
   * never touched. Proper nouns, the app's own name and abbreviations are
   * legitimately identical, so only longer prose is compared — and the bar is
   * a count, since a handful of shared words ("OK", "Solfeggio") is normal.
   */
  it.each(LANGUAGES.filter((l) => l.code !== 'en').map((l) => [l.code, l.translation] as const))(
    '%s is not silently still English',
    (_code, translation) => {
      const prose = enKeys.filter((key) => String(valueAt(en, key)).length > 25);
      const untouched = prose.filter(
        (key) => valueAt(translation, key) === valueAt(en, key)
      );
      expect(untouched).toEqual([]);
    }
  );
});
