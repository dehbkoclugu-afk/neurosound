import { intents } from '../intents';
import { allPresets } from '../frequencies';
import { intentArt, PRESET_ART, presetArt } from '../artAssets';

describe('local artwork registry', () => {
  it('covers every intent', () => {
    expect(intents.every((intent) => intentArt(intent.id))).toBe(true);
  });

  it('covers every preset exactly once', () => {
    expect(allPresets.every((preset) => presetArt(preset.id))).toBe(true);
    expect(Object.keys(PRESET_ART).sort()).toEqual(allPresets.map((preset) => preset.id).sort());
  });
});

