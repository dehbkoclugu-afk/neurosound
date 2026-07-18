import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import tr from '../locales/tr.json';
import en from '../locales/en.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

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

const supportedLanguage = ['tr', 'en'].includes(deviceLanguage) ? deviceLanguage : 'tr';

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
