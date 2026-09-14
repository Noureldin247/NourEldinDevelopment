import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            i18n.language === lang.code ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
