import { intents, getIntentById } from '../intents';
import { getPresetById } from '../frequencies';

describe('intents', () => {
  it('every intent preset id resolves to a real preset', () => {
    for (const intent of intents) {
      for (const presetId of intent.presetIds) {
        expect(getPresetById(presetId)).toBeDefined();
      }
    }
  });

  it('every intent has at least one preset and a positive recommended duration', () => {
    for (const intent of intents) {
      expect(intent.presetIds.length).toBeGreaterThan(0);
      expect(intent.recommendedMinutes).toBeGreaterThan(0);
    }
  });

  it('getIntentById finds a known intent', () => {
    expect(getIntentById('sleep')?.id).toBe('sleep');
  });

  it('getIntentById returns undefined for an unknown id', () => {
    expect(getIntentById('does-not-exist')).toBeUndefined();
  });
});
