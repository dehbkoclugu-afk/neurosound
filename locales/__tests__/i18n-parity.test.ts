import en from '../en.json';
import tr from '../tr.json';

// A missing translation key doesn't throw or fail visibly — react-i18next
// just falls back to the key string in the UI. This is the only thing that
// would catch it before someone spots raw "explore.noResults" on screen.
function flattenKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null
      ? flattenKeys(value, path)
      : [path];
  });
}

describe('locale parity', () => {
  const enKeys = flattenKeys(en).sort();
  const trKeys = flattenKeys(tr).sort();

  it('tr.json has every key that en.json has', () => {
    const missing = enKeys.filter((k) => !trKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it('en.json has every key that tr.json has', () => {
    const missing = trKeys.filter((k) => !enKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it('no translation value is an empty string', () => {
    for (const [dict, keys] of [
      [en, enKeys],
      [tr, trKeys],
    ] as const) {
      const empty = keys.filter(
        (key) => key.split('.').reduce((o: any, k) => o?.[k], dict) === ''
      );
      expect(empty).toEqual([]);
    }
  });
});
