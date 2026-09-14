import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import { useCreateUser, useUpdateUser } from '../../../hooks/useAdminUsersQueries';

const ROLES = ['admin', 'hr'];

export default function UserFormModal({ mode, user, isSelf, onClose }) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role ?? 'hr');

  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.id);
  const mutation = mode === 'create' ? createUser : updateUser;
  const roleLocked = mode === 'edit' && isSelf;

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (mode === 'create') {
        await createUser.mutateAsync({ fullName, email, password, role });
      } else {
        await updateUser.mutateAsync({ fullName, email, role });
      }
      onClose();
    } catch (error) {
      // surfaced via mutation.error below
    }
  }

  return (
    <Modal title={mode === 'create' ? t('admin.form.createTitle') : t('admin.form.editTitle')} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('admin.form.fullName')}</span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('admin.form.email')}</span>
          <input
            required
            type="email"
            dir="ltr"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        {mode === 'create' ? (
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('admin.form.password')}</span>
            <input
              required
              type="password"
              dir="ltr"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
            <span className="text-xs text-slate-400">{t('admin.form.passwordHint')}</span>
          </label>
        ) : null}

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('admin.form.role')}</span>
          <select
            value={role}
            disabled={roleLocked}
            onChange={(event) => setRole(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none disabled:opacity-60"
          >
            {ROLES.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {t(`roles.${roleOption}`)}
              </option>
            ))}
          </select>
          {roleLocked ? <span className="text-xs text-amber-600">{t('admin.form.roleLockedSelf')}</span> : null}
        </label>

        {mutation.isError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{mutation.error.message}</p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
            {t('admin.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {mutation.isPending
              ? t('admin.form.submitting')
              : mode === 'create'
                ? t('admin.form.submitCreate')
                : t('admin.form.submitEdit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
