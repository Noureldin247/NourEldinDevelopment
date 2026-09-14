import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Topbar() {
  const { t } = useTranslation();
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div>
        <p className="text-sm font-semibold text-slate-900">{t('app.brandName')}</p>
        {session ? (
          <p className="text-xs text-slate-500">
            {t('app.welcomeUser', { name: session.fullName })} · {t(`roles.${session.role}`)}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <button type="button" onClick={handleLogout} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
          {t('app.logout')}
        </button>
      </div>
    </header>
  );
}
