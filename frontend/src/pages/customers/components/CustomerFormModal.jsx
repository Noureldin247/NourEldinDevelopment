import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import { useCreateCustomer, useUpdateCustomer } from '../../../hooks/useCustomerQueries';

export default function CustomerFormModal({ mode, customer, onClose }) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(customer?.fullName ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [notes, setNotes] = useState(customer?.notes ?? '');

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer(customer?.id);
  const mutation = mode === 'create' ? createCustomer : updateCustomer;

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await mutation.mutateAsync({ fullName, phone, email, address, notes });
      onClose();
    } catch (error) {
      // surfaced via mutation.error below
    }
  }

  return (
    <Modal title={mode === 'create' ? t('customers.form.createTitle') : t('customers.form.editTitle')} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('customers.form.fullName')}</span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('customers.form.phone')}</span>
            <input
              dir="ltr"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('customers.form.email')}</span>
            <input
              dir="ltr"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('customers.form.address')}</span>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('customers.form.notes')}</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        {mutation.isError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{mutation.error.message}</p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
            {t('customers.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {mutation.isPending
              ? t('customers.form.submitting')
              : mode === 'create'
                ? t('customers.form.submitCreate')
                : t('customers.form.submitEdit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
