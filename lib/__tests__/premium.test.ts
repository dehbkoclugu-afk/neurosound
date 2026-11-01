import { isLockedPreset } from '../premium';
import { intents } from '../intents';
import { noisePresets, solfeggioPresets } from '../frequencies';

describe('premium gating', () => {
  it("never locks an intent's lead sound, so Home's one-tap start always plays", () => {
    for (const intent of intents) {
      expect(isLockedPreset(intent.presetIds[0])).toBe(false);
    }
  });

  it('keeps every ambient noise free', () => {
    expect(noisePresets.some((p) => isLockedPreset(p.id))).toBe(false);
  });

  it('keeps 852 Hz free and locks the rest of the Solfeggio library', () => {
    expect(isLockedPreset('solfeggio-852')).toBe(false);
    expect(isLockedPreset('solfeggio-963')).toBe(true);
    expect(solfeggioPresets.filter((p) => isLockedPreset(p.id)).length).toBeGreaterThan(5);
  });

  it('treats unknown ids as unlocked rather than throwing', () => {
    expect(isLockedPreset('does-not-exist')).toBe(false);
  });
});
