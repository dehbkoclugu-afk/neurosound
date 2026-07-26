import { usePresetsStore } from '../presetsStore';

beforeEach(() => {
  usePresetsStore.getState().reset();
});

describe('presetsStore favorites', () => {
  it('adds a favorite', () => {
    usePresetsStore.getState().addFavorite('binaural-delta');
    expect(usePresetsStore.getState().isFavorite('binaural-delta')).toBe(true);
  });

  it('does not duplicate a favorite added twice', () => {
    usePresetsStore.getState().addFavorite('binaural-delta');
    usePresetsStore.getState().addFavorite('binaural-delta');
    expect(usePresetsStore.getState().favoriteIds).toEqual(['binaural-delta']);
  });

  it('removes a favorite', () => {
    usePresetsStore.getState().addFavorite('binaural-delta');
    usePresetsStore.getState().removeFavorite('binaural-delta');
    expect(usePresetsStore.getState().isFavorite('binaural-delta')).toBe(false);
  });
});

describe('presetsStore recently played', () => {
  it('moves a re-played preset back to the front instead of duplicating it', () => {
    const { addRecentlyPlayed } = usePresetsStore.getState();
    addRecentlyPlayed('a');
    addRecentlyPlayed('b');
    addRecentlyPlayed('a');
    const ids = usePresetsStore.getState().recentlyPlayed.map((r) => r.presetId);
    expect(ids).toEqual(['a', 'b']);
  });

  it('caps history at 10 entries, keeping the most recent', () => {
    const { addRecentlyPlayed } = usePresetsStore.getState();
    for (let i = 0; i < 15; i++) addRecentlyPlayed(`preset-${i}`);
    const ids = usePresetsStore.getState().recentlyPlayed.map((r) => r.presetId);
    expect(ids).toHaveLength(10);
    expect(ids[0]).toBe('preset-14');
  });
});

describe('presetsStore custom mixes', () => {
  it('adds a mix and returns a usable id', () => {
    const id = usePresetsStore.getState().addCustomMix({
      name: 'Test Mix',
      channels: [{ presetId: 'binaural-delta', volume: 0.5 }],
    });
    const mix = usePresetsStore.getState().customMixes.find((m) => m.id === id);
    expect(mix?.name).toBe('Test Mix');
  });

  it('deletes a mix by id', () => {
    const id = usePresetsStore.getState().addCustomMix({ name: 'Temp', channels: [] });
    usePresetsStore.getState().deleteCustomMix(id);
    expect(usePresetsStore.getState().customMixes.find((m) => m.id === id)).toBeUndefined();
  });
});
