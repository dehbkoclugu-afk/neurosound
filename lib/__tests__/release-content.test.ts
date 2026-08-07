import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES } from '../../locales';

const root = join(__dirname, '../..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

/**
 * Every listing that exists on disk, found rather than listed: a locale added
 * to `store/google-play/` without being added here would ship unchecked, and
 * an over-long short description is rejected by Play at upload time, after
 * the build.
 */
const listingLocales = readdirSync(join(root, 'store/google-play'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(root, 'store/google-play', entry.name, 'listing.md')))
  .map((entry) => entry.name);

describe('Google Play release content', () => {
  it('finds the listings it is supposed to check', () => {
    expect(listingLocales).toContain('tr-TR');
    expect(listingLocales).toContain('en-US');
  });

  it.each(listingLocales)('%s listing stays inside Play field limits', (locale) => {
    const listing = read(`store/google-play/${locale}/listing.md`);
    // `\r?\n`, not `\n`: on a Windows checkout git hands these files back with
    // CRLF, the heading stopped matching, both fields read as '' and the
    // length checks below passed on nothing at all.
    const short = listing.match(/## (?:Kısa açıklama|Short description)\r?\n([^\r\n]+)/)?.[1] ?? '';
    const full = listing.match(/## (?:Tam açıklama|Full description)\r?\n([\s\S]+)/)?.[1] ?? '';
    // Non-empty as well as short enough — a heading typo would otherwise make
    // both fields read as '' and sail through the length checks.
    expect(short.length).toBeGreaterThan(0);
    expect(short.length).toBeLessThanOrEqual(80);
    expect(full.length).toBeGreaterThan(0);
    expect(full.length).toBeLessThanOrEqual(4000);
  });

  /** Bengali and Devanagari have their own digits, and the locales that use
   *  those scripts use them throughout — bn.json counts channels in Bengali
   *  numerals, so its listing does too. Fold them back to ASCII rather than
   *  forcing Western digits into copy that reads wrong with them. */
  const DIGIT_ZEROS = [0x09e6 /* Bengali ০ */, 0x0966 /* Devanagari ० */];
  const asciiDigits = (text: string) =>
    text.replace(/[০-৯०-९]/g, (d) => {
      const code = d.codePointAt(0) as number;
      const zero = DIGIT_ZEROS.find((base) => code >= base && code <= base + 9);
      return zero === undefined ? d : String(code - zero);
    });

  it.each(listingLocales)('%s listing states the current language count', (locale) => {
    const listing = asciiDigits(read(`store/google-play/${locale}/listing.md`));
    expect(listing).toContain(String(LANGUAGES.length));
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
