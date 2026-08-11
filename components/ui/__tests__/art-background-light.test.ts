import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.join(process.cwd(), 'components/ui/ArtBackground.tsx'),
  'utf8',
);

describe('ArtBackground light artwork', () => {
  it('renders no light-mode scrim over the source image', () => {
    expect(source).not.toContain('LIGHT_SCRIMS');
    expect(source).toContain("scheme === 'dark' &&");
  });
});
