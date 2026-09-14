import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ComingSoonPage({ titleKey }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
      <h1 className="text-xl font-semibold text-slate-800">{t(titleKey)}</h1>
      <p className="mt-3 text-sm text-slate-500">{t('app.comingSoonTitle')} — {t('app.comingSoonDescription')}</p>
    </div>
  );
}
