import { allPresets, binauralPresets, solfeggioPresets, noisePresets, getPresetById } from '../frequencies';

describe('frequencies', () => {
  it('combines every category into allPresets with no loss', () => {
    expect(allPresets.length).toBe(
      binauralPresets.length + solfeggioPresets.length + noisePresets.length
    );
  });

  it('has no duplicate preset ids', () => {
    const ids = allPresets.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every preset has a non-empty id, name and nameKey', () => {
    for (const preset of allPresets) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.nameKey).toBeTruthy();
    }
  });

  it('getPresetById finds a known preset', () => {
    expect(getPresetById('binaural-delta')?.binauralType).toBe('delta');
  });

  it('getPresetById returns undefined for an unknown id', () => {
    expect(getPresetById('does-not-exist')).toBeUndefined();
  });
});
