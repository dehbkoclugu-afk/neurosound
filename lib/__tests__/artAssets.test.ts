import { intents } from '../intents';
import { allPresets } from '../frequencies';
import { intentArt, PRESET_ART, presetArt, stateArt } from '../artAssets';

describe('local artwork registry', () => {
  it('covers every intent', () => {
    expect(
      intents.every(
        (intent) => intentArt(intent.id).dark && intentArt(intent.id).light,
      ),
    ).toBe(true);
  });

  it('covers every preset exactly once', () => {
    expect(
      allPresets.every(
        (preset) => presetArt(preset.id)?.dark && presetArt(preset.id)?.light,
      ),
    ).toBe(true);
    expect(Object.keys(PRESET_ART).sort()).toEqual(
      allPresets.map((preset) => preset.id).sort(),
    );
  });

  it('registers the favorites empty state artwork', () => {
    expect(stateArt('favorites-empty').dark).toBeTruthy();
    expect(stateArt('favorites-empty').light).toBeTruthy();
  });
});
