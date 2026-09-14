import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthContext';
import { canAccessModule } from '../../lib/permissions';
import { navConfig } from '../../routes/navConfig';

export default function Sidebar() {
  const { t } = useTranslation();
  const { session } = useAuth();

  const visibleModules = navConfig.filter((module) => canAccessModule(session?.role, module.allowedRoles));

  return (
    <aside className="w-full shrink-0 border-e border-slate-200 bg-white p-4 sm:w-60">
      <div className="mb-6 flex items-center gap-2 ps-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">WX</div>
        <span className="text-sm font-semibold text-slate-900">{t('app.brandName')}</span>
      </div>
      <nav className="space-y-1">
        {visibleModules.map((module) => (
          <NavLink
            key={module.key}
            to={module.path}
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {t(module.labelKey)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
