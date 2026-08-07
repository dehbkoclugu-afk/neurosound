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
 * Then ten more picked for Play install volume rather than store convention:
 * Hindi, Indonesian, Vietnamese, Thai, Bengali, Polish, Ukrainian, Dutch,
 * Swedish, Romanian. Deliberately absent: Arabic and the other RTL languages,
 * which need the layouts checked in both directions before they are worth
 * shipping; Malay, which overlaps Indonesian closely enough that two entries
 * would split the same audience; and Filipino, whose tag is three letters and
 * would break the two-letter assumption below.
 *
 * `code` is the two-letter tag `expo-localization` reports as `languageCode`,
 * so device detection is a plain lookup rather than a locale-matching
 * exercise. `label` is the language's name *in that language* — a picker that
 * lists "Chinese" to someone who only reads Chinese is no use to them.
 *
 * `flag` is a flag of *a* country where the language is spoken, not a claim
 * about who owns it: one flag cannot stand for Spanish or Portuguese or
 * English, so the picker leans on the name and uses the flag only as a
 * colour cue for finding your row quickly. English takes the UK because that
 * is the larger store.
 *
 * Where a language really does ship as one specific variant, the label says
 * so rather than leaving the flag to imply it: Portuguese here is Brazilian
 * (pt-BR, "celular" not "telemóvel") and Chinese is Simplified (zh-Hans,
 * listed as zh-CN). Someone from Portugal or Taiwan should be able to see
 * that before switching, not discover it afterwards.
 *
 * The flags are regional-indicator pairs, which most Android system fonts do
 * not have a glyph for — there they fall back to rendering the two letters,
 * which is exactly the country code, so the column degrades into the thing
 * it replaced rather than into a blank or a tofu box.
 */

import bn from './bn.json';
import de from './de.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import hi from './hi.json';
import id from './id.json';
import it from './it.json';
import ja from './ja.json';
import ko from './ko.json';
import nl from './nl.json';
import pl from './pl.json';
import pt from './pt.json';
import ro from './ro.json';
import ru from './ru.json';
import sv from './sv.json';
import th from './th.json';
import tr from './tr.json';
import uk from './uk.json';
import vi from './vi.json';
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
  // Brazilian, not European: the translation uses Brazilian vocabulary
  // ("celular"), the store listing is pt-BR, and the flag says so too. Naming
  // the variant in the label means a reader from Portugal knows what they are
  // getting before they switch, instead of after.
  { code: 'pt', label: 'Português (Brasil)', flag: '🇧🇷', translation: pt },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', translation: ru },
  // Simplified, matching the zh-Hans bundle and the zh-CN store listing.
  { code: 'zh', label: '中文（简体）', flag: '🇨🇳', translation: zh },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', translation: hi },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩', translation: bn },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩', translation: id },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', translation: vi },
  { code: 'th', label: 'ไทย', flag: '🇹🇭', translation: th },
  { code: 'pl', label: 'Polski', flag: '🇵🇱', translation: pl },
  { code: 'uk', label: 'Українська', flag: '🇺🇦', translation: uk },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱', translation: nl },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪', translation: sv },
  { code: 'ro', label: 'Română', flag: '🇷🇴', translation: ro },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code.toUpperCase();
}

export function languageFlag(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.flag ?? '';
}
