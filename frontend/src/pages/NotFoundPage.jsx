import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">404</h1>
      <p className="mt-2 text-lg font-semibold text-slate-800">{t('errors.notFoundTitle')}</p>
      <p className="mt-2 text-sm text-slate-500">{t('errors.notFoundDescription')}</p>
      <Link to="/dashboard" className="mt-6 inline-block rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
        {t('errors.backToDashboard')}
      </Link>
    </div>
  );
}
