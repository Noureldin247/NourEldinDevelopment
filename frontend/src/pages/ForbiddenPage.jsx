import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
      <h1 className="text-2xl font-semibold text-rose-800">403</h1>
      <p className="mt-2 text-lg font-semibold text-rose-800">{t('errors.forbiddenTitle')}</p>
      <p className="mt-2 text-sm text-rose-700">{t('errors.forbiddenDescription')}</p>
      <Link to="/dashboard" className="mt-6 inline-block rounded-full bg-rose-600 px-4 py-2 text-sm text-white">
        {t('errors.backToDashboard')}
      </Link>
    </div>
  );
}
