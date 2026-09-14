import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import { useSetUserPassword } from '../../../hooks/useAdminUsersQueries';

export default function ResetPasswordModal({ userId, onClose }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const setUserPassword = useSetUserPassword(userId);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await setUserPassword.mutateAsync(password);
      setSuccess(true);
      setPassword('');
    } catch (error) {
      // surfaced via setUserPassword.error below
    }
  }

  return (
    <Modal title={t('admin.resetPasswordModal.title')} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('admin.resetPasswordModal.newPassword')}</span>
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

        {setUserPassword.isError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {setUserPassword.error.message}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {t('admin.resetPasswordModal.success')}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
            {t('admin.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={setUserPassword.isPending}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {setUserPassword.isPending ? t('admin.resetPasswordModal.submitting') : t('admin.resetPasswordModal.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
