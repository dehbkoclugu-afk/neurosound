import i18n from '@/i18n';

/**
 * Uppercase for the tracked `label` style, in the app's language rather than
 * the device's. `textTransform: 'uppercase'` uses the platform locale (and on
 * web, none at all), so Turkish copy came out as "BAŞKA BIR ŞEY" instead of
 * "BAŞKA BİR ŞEY" whenever the phone itself was set to another language.
 */
/**
 * Case- and accent-insensitive key for search. Plain toLowerCase() turned a
 * Turkish "İ" into "i̇" (i + combining dot), so "isik" never found "Işık" and
 * "Ilik" never found "Ilık"; folding diacritics and the dotless ı fixes both.
 */
export function foldForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i');
}

export function upper(text: string, language: string = i18n.language ?? ''): string {
  const dottedI = language.startsWith('tr') || language.startsWith('az');
  return (dottedI ? text.replace(/i/g, 'İ') : text).toUpperCase();
}

/** A 0-1 fraction as the current language writes it: "%50" in Turkish, "50%" in
 *  English. Hard-coding one form put "50%" next to "%80" on the same screen. */
export function formatPercent(fraction: number): string {
  return new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(fraction);
}
