import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.join(process.cwd(), 'app/(tabs)/explore.tsx'),
  'utf8',
);

describe('Explore list performance invariants', () => {
  it('virtualizes category pages and artwork rows', () => {
    expect(source).toContain('FlatList');
    expect(source).toContain('initialNumToRender={6}');
    expect(source).toContain('windowSize={5}');
    expect(source).toContain('removeClippedSubviews');
    expect(source).toContain('getItemLayout={getPresetItemLayout}');
  });

  it('does not mount the old nested ScrollView pager', () => {
    expect(source).not.toContain(
      '{/* Preset pages — one per category, swipeable like any tab strip */}',
    );
  });
});
