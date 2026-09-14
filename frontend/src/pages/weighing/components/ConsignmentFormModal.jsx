import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import { useCreateConsignment } from '../../../hooks/useWeighingQueries';

export default function ConsignmentFormModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const [customerName, setCustomerName] = useState('');
  const [fabricName, setFabricName] = useState('');
  const [preDyeWeightKg, setPreDyeWeightKg] = useState('');
  const [preDyeLengthM, setPreDyeLengthM] = useState('');
  const createConsignment = useCreateConsignment();

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const result = await createConsignment.mutateAsync({
        customerName,
        fabricName,
        preDyeWeightKg: Number(preDyeWeightKg),
        preDyeLengthM: Number(preDyeLengthM),
      });
      onCreated(result.data);
    } catch (error) {
      // error.message is surfaced below via createConsignment.error
    }
  }

  return (
    <Modal title={t('weighing.form.title')} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('weighing.form.customerName')}</span>
          <input
            required
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder={t('weighing.form.customerNamePlaceholder')}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('weighing.form.fabricName')}</span>
          <input
            required
            value={fabricName}
            onChange={(event) => setFabricName(event.target.value)}
            placeholder={t('weighing.form.fabricNamePlaceholder')}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('weighing.form.preDyeWeight')}</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={preDyeWeightKg}
              onChange={(event) => setPreDyeWeightKg(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('weighing.form.preDyeLength')}</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={preDyeLengthM}
              onChange={(event) => setPreDyeLengthM(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>

        {createConsignment.isError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {createConsignment.error.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
            {t('weighing.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={createConsignment.isPending}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {createConsignment.isPending ? t('weighing.form.submitting') : t('weighing.form.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
