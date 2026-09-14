import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ar from './locales/ar/common.json';
import en from './locales/en/common.json';

export const RTL_LANGUAGES = ['ar'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { common: ar },
      en: { common: en },
    },
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    // العربية هي اللغة الافتراضية دائمًا ما لم يختر المستخدم صراحةً غير ذلك —
    // متعمدين عدم اعتماد لغة المتصفح/النظام حتى لا تتغير اللغة الافتراضية بدون طلب المستخدم.
    // Arabic is always the default unless the user explicitly chose otherwise —
    // deliberately NOT trusting the browser/OS locale so the default never shifts without a user action.
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'winitex_language',
    },
  });

export default i18n;
