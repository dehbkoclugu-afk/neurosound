import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import { LANGUAGES, LANGUAGE_CODES } from '../locales';

const resources = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, { translation: l.translation }])
);

export type SupportedLanguage = string;

// Get device language safely, default to Turkish
let deviceLanguage = 'tr';
try {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0 && locales[0]?.languageCode) {
    deviceLanguage = locales[0].languageCode;
  }
} catch (e) {
  console.log('Localization error:', e);
}

/**
 * Language used before anything is restored from storage. The settings store
 * seeds its default from this too — otherwise a first launch would run i18n in
 * the device language while Settings claimed Turkish was selected.
 *
 * `languageCode` is the bare tag ("pt", "zh"), so a Brazilian phone and a
 * Portuguese one both land on pt, and every Chinese variant lands on zh. That
 * is deliberate: one file per language, not per region.
 */
export const deviceLanguageOrDefault: SupportedLanguage = LANGUAGE_CODES.includes(deviceLanguage)
  ? deviceLanguage
  : 'tr';

const supportedLanguage = deviceLanguageOrDefault;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: supportedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    compatibilityJSON: 'v3', // For React Native compatibility
  })
  .catch((e) => {
    console.log('i18n init error:', e);
  });

export default i18n;
