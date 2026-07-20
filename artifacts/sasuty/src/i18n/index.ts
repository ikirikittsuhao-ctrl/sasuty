import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ja from './locales/ja.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    fallbackLng: 'ja',
    supportedLngs: ['ja', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'sasuty_lang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

export function setLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem('sasuty_lang', lang);
}
