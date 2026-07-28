/**
 * The supported languages, in one place.
 *
 * This list is the single source of truth: i18n's resource bundle, the
 * settings store's `Language` type, the language picker and the parity test
 * all read from it, so adding a language is adding a file and a row here.
 *
 * Which languages: the ten the App Store actually runs on (English, Chinese,
 * Japanese, Spanish, German, French, Korean, Portuguese, Italian, Russian),
 * plus Turkish, which the app started in and which is not going anywhere.
 *
 * `code` is the two-letter tag `expo-localization` reports as `languageCode`,
 * so device detection is a plain lookup rather than a locale-matching
 * exercise. `label` is the language's name *in that language* — a picker that
 * lists "Chinese" to someone who only reads Chinese is no use to them.
 *
 * `flag` is a flag of *a* country where the language is spoken, not a claim
 * about who owns it: one flag cannot stand for Spanish or Portuguese or
 * English, so the picker leans on the name and uses the flag only as a
 * colour cue for finding your row quickly. Portuguese takes Brazil and
 * English takes the UK because those are the larger stores for each.
 *
 * The flags are regional-indicator pairs, which most Android system fonts do
 * not have a glyph for — there they fall back to rendering the two letters,
 * which is exactly the country code, so the column degrades into the thing
 * it replaced rather than into a blank or a tofu box.
 */

import de from './de.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import it from './it.json';
import ja from './ja.json';
import ko from './ko.json';
import pt from './pt.json';
import ru from './ru.json';
import tr from './tr.json';
import zh from './zh.json';

export interface LanguageDef {
  code: string;
  /** Endonym — how speakers write the name of their own language. */
  label: string;
  flag: string;
  translation: object;
}

export const LANGUAGES: LanguageDef[] = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', translation: tr },
  { code: 'en', label: 'English', flag: '🇬🇧', translation: en },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', translation: de },
  { code: 'es', label: 'Español', flag: '🇪🇸', translation: es },
  { code: 'fr', label: 'Français', flag: '🇫🇷', translation: fr },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', translation: it },
  { code: 'ja', label: '日本語', flag: '🇯🇵', translation: ja },
  { code: 'ko', label: '한국어', flag: '🇰🇷', translation: ko },
  { code: 'pt', label: 'Português', flag: '🇧🇷', translation: pt },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', translation: ru },
  { code: 'zh', label: '中文', flag: '🇨🇳', translation: zh },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code.toUpperCase();
}

export function languageFlag(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.flag ?? '';
}
