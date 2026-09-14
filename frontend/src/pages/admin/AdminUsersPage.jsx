import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useUsers, useSetUserStatus } from '../../hooks/useAdminUsersQueries';
import UserFormModal from './components/UserFormModal';
import ResetPasswordModal from './components/ResetPasswordModal';

function StatusToggleButton({ user, isSelf }) {
  const { t } = useTranslation();
  const setStatus = useSetUserStatus(user.id);
  const wouldSelfDeactivate = isSelf && user.isActive;

  return (
    <button
      type="button"
      disabled={setStatus.isPending || wouldSelfDeactivate}
      title={wouldSelfDeactivate ? t('admin.confirmDeactivateSelf') : undefined}
      onClick={() => setStatus.mutate(!user.isActive)}
      className={`rounded-full px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
        user.isActive ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {user.isActive ? t('admin.table.deactivate') : t('admin.table.activate')}
    </button>
  );
}

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const { data, isLoading, isError, refetch } = useUsers();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resettingUserId, setResettingUserId] = useState(null);

  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{t('nav.admin')}</h1>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {t('admin.newButton')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? <p className="p-6 text-sm text-slate-500">{t('admin.table.loading')}</p> : null}
        {isError ? (
          <div className="p-6 text-sm text-rose-600">
            {t('admin.table.error')}{' '}
            <button type="button" onClick={() => refetch()} className="font-semibold underline">
              {t('common.retry')}
            </button>
          </div>
        ) : null}
        {!isLoading && !isError && data?.data?.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{t('admin.table.empty')}</p>
        ) : null}

        {!isLoading && !isError && data?.data?.length ? (
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">{t('admin.table.columns.fullName')}</th>
                <th className="px-4 py-3 text-start">{t('admin.table.columns.email')}</th>
                <th className="px-4 py-3 text-start">{t('admin.table.columns.role')}</th>
                <th className="px-4 py-3 text-start">{t('admin.table.columns.status')}</th>
                <th className="px-4 py-3 text-start">{t('admin.table.columns.createdAt')}</th>
                <th className="px-4 py-3 text-start">{t('admin.table.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((user) => {
                const isSelf = String(user.id) === String(currentUser?.id ?? '');
                return (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {user.fullName}
                      {isSelf ? (
                        <span className="ms-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          {t('admin.table.youBadge')}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600" dir="ltr">{user.email}</td>
                    <td className="px-4 py-3 text-slate-600">{t(`roles.${user.role}`)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {user.isActive ? t('admin.table.active') : t('admin.table.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{new Date(user.createdAt).toLocaleDateString(dateLocale)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {t('admin.table.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setResettingUserId(user.id)}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {t('admin.table.resetPassword')}
                        </button>
                        <StatusToggleButton user={user} isSelf={isSelf} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </div>

      {isCreateOpen ? <UserFormModal mode="create" onClose={() => setCreateOpen(false)} /> : null}

      {editingUser ? (
        <UserFormModal
          mode="edit"
          user={editingUser}
          isSelf={String(editingUser.id) === String(currentUser?.id ?? '')}
          onClose={() => setEditingUser(null)}
        />
      ) : null}

      {resettingUserId ? <ResetPasswordModal userId={resettingUserId} onClose={() => setResettingUserId(null)} /> : null}
    </div>
  );
}
