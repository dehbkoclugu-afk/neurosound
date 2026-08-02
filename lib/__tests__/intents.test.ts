import { intents, getIntentById, getTimeBand, getSuggestedIntent } from '../intents';
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

describe('time-of-day suggestion', () => {
  it('assigns a band to every hour of the clock', () => {
    for (let hour = 0; hour < 24; hour++) {
      expect(['night', 'morning', 'day', 'evening']).toContain(getTimeBand(hour));
    }
  });

  it('wraps midnight into the night band', () => {
    expect(getTimeBand(22)).toBe('night');
    expect(getTimeBand(0)).toBe('night');
    expect(getTimeBand(5)).toBe('night');
  });

  it('puts the boundaries where the printed labels claim they are', () => {
    expect(getTimeBand(6)).toBe('morning');
    expect(getTimeBand(8)).toBe('morning');
    expect(getTimeBand(9)).toBe('day');
    expect(getTimeBand(16)).toBe('day');
    expect(getTimeBand(17)).toBe('evening');
    expect(getTimeBand(21)).toBe('evening');
  });

  // Home dereferences the result without a null check, so every hour must
  // land on an intent that actually exists in the list.
  it('resolves to a real intent for every hour', () => {
    for (let hour = 0; hour < 24; hour++) {
      expect(intents).toContain(getSuggestedIntent(hour).intent);
    }
  });

  it('leads with sleep at night and focus in working hours', () => {
    expect(getSuggestedIntent(2).intent.id).toBe('sleep');
    expect(getSuggestedIntent(23).intent.id).toBe('sleep');
    expect(getSuggestedIntent(7).intent.id).toBe('meditate');
    expect(getSuggestedIntent(14).intent.id).toBe('focus');
    expect(getSuggestedIntent(19).intent.id).toBe('relax');
  });
});
