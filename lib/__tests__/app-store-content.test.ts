import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * App Store Connect rejects over-long fields only on save, one field and one
 * language at a time; these limits are Apple's own. Medical wording and other
 * platforms are the two metadata rejections (1.4.1, 2.3.10) this app is most
 * exposed to.
 */
const root = join(__dirname, '../..');
const dir = join(root, 'store/app-store');
const locales = readdirSync(dir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'metadata.md')))
  .map((e) => e.name);

function field(md: string, name: string): string {
  const m = md.match(new RegExp(`## ${name}\\r?\\n([\\s\\S]*?)(?=\\r?\\n## |$)`));
  return (m?.[1] ?? '').trim();
}

describe('App Store metadata', () => {
  it('finds the listings', () => {
    expect(locales).toEqual(expect.arrayContaining(['en-US', 'tr']));
  });

  it.each(locales)('%s fits Apple field limits', (locale) => {
    const md = readFileSync(join(dir, locale, 'metadata.md'), 'utf8');
    const name = field(md, 'Name');
    expect(name.startsWith('852Hz')).toBe(true); // matches the home-screen name (2.3.8)
    expect([...name].length).toBeLessThanOrEqual(30);
    expect([...field(md, 'Subtitle')].length).toBeLessThanOrEqual(30);
    expect([...field(md, 'Promotional text')].length).toBeLessThanOrEqual(170);
    expect(Buffer.byteLength(field(md, 'Keywords'))).toBeLessThanOrEqual(100);
    expect([...field(md, 'Description')].length).toBeLessThanOrEqual(4000);
    expect(field(md, 'Support URL')).toMatch(/^https:\/\//);
    expect(field(md, 'Privacy Policy URL')).toMatch(/^https:\/\//);
  });

  it.each(locales)('%s names no other platform and makes no medical claim', (locale) => {
    const md = readFileSync(join(dir, locale, 'metadata.md'), 'utf8');
    expect(md).not.toMatch(/Android|Google|Play Store/);
    expect(md).not.toMatch(/\b(cure|heal|healing|treats?|DNA|anxiety|insomnia)\b|tedavi eder|iyileştirir|şifa/i);
  });

  it.each(locales)('%s links Terms of Use and privacy for subscriptions (3.1.2)', (locale) => {
    const description = field(readFileSync(join(dir, locale, 'metadata.md'), 'utf8'), 'Description');
    expect(description).toContain('apple.com/legal/internet-services/itunes/dev/stdeula');
    expect(description).toContain('privacy.html');
  });
});
