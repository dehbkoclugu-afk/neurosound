import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.join(process.cwd(), 'components/ui/PresetRow.tsx'),
  'utf8',
);

describe('PresetRow layout invariants', () => {
  it('keeps a fixed row metric for virtualized lists', () => {
    expect(source).toContain('export const PRESET_ROW_HEIGHT = 92');
    expect(source).toContain('export const PRESET_ROW_GAP = Spacing.sm');
  });

  it('centres the chevron in a fixed trailing rail', () => {
    expect(source).toContain('styles.chevronRail,');
    expect(source).toMatch(/chevronRail:\s*\{[\s\S]*?width: 48,/);
    expect(source).toMatch(/chevronRail:\s*\{[\s\S]*?alignItems: 'center',/);
    expect(source).toMatch(/chevronRail:\s*\{[\s\S]*?justifyContent: 'center',/);
  });
});
