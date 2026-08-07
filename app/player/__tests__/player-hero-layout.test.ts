import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.join(process.cwd(), 'app/player/[id].tsx'),
  'utf8',
);

describe('Player hero layout', () => {
  it('keeps controls in the first viewport with a compact hero', () => {
    expect(source).toContain('Math.max(300, Math.min(400, height * 0.4))');
    expect(source).not.toContain('height * 0.54');
  });
});
