import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES } from '../../locales';

const root = join(__dirname, '../..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('Google Play release content', () => {
  it.each(['tr-TR', 'en-US'])('%s listing stays inside Play field limits', (locale) => {
    const listing = read(`store/google-play/${locale}/listing.md`);
    const short = listing.match(/## (?:Kısa açıklama|Short description)\n([^\n]+)/)?.[1] ?? '';
    const full = listing.match(/## (?:Tam açıklama|Full description)\n([\s\S]+)/)?.[1] ?? '';
    expect(short.length).toBeLessThanOrEqual(80);
    expect(full.length).toBeLessThanOrEqual(4000);
  });

  it('has no unsupported healing wording in locale delta descriptions', () => {
    for (const language of LANGUAGES) {
      const description = String((language.translation as any).explore.binauralTypes.deltaDesc);
      // One healing word per locale — the guard is only as wide as this list,
      // so every language added has to bring its own term with it.
      expect(description).not.toMatch(
        /healing|iyileş|heilung|regeneration|recupera|récup|回復|회복|恢复|восстанов|genezing|uzdrawia|зцілен|penyembuhan|chữa lành|รักษา|उपचार|নিরাময়|läkning|vindecare/i
      );
    }
  });

  it('publishes developer identity and contact in every locale', () => {
    for (const language of LANGUAGES) {
      const privacy = (language.translation as any).privacy;
      expect(privacy.contactBody).toContain('DEHB Koçluğu');
      expect(privacy.contactBody).toContain('dehbkoclugu@gmail.com');
    }
  });

  it('keeps the static privacy policy aligned with developer identity', () => {
    const privacy = read('docs/privacy.html');
    expect(privacy).toContain('DEHB Koçluğu');
    expect(privacy).toContain('dehbkoclugu@gmail.com');
    expect(privacy).toMatch(/cloud backup is disabled|bulut yedeklemesi kapalı/i);
  });
});
