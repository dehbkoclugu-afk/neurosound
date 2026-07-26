import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import tr from '../locales/tr.json';
import en from '../locales/en.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

export type SupportedLanguage = 'tr' | 'en';

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
 */
export const deviceLanguageOrDefault: SupportedLanguage = ['tr', 'en'].includes(deviceLanguage)
  ? (deviceLanguage as SupportedLanguage)
  : 'tr';

const supportedLanguage = deviceLanguageOrDefault;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: supportedLanguage,
    fallbackLng: 'tr',
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
