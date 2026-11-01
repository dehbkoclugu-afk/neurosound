import i18n from '@/i18n';

/**
 * Uppercase for the tracked `label` style, in the app's language rather than
 * the device's. `textTransform: 'uppercase'` uses the platform locale (and on
 * web, none at all), so Turkish copy came out as "BAŞKA BIR ŞEY" instead of
 * "BAŞKA BİR ŞEY" whenever the phone itself was set to another language.
 */
export function upper(text: string, language: string = i18n.language ?? ''): string {
  const dottedI = language.startsWith('tr') || language.startsWith('az');
  return (dottedI ? text.replace(/i/g, 'İ') : text).toUpperCase();
}
