import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import {
  useConsignment,
  useAddDyeChemical,
  useRemoveDyeChemical,
  useStartProduction,
  useCompleteConsignment,
} from '../../../hooks/useWeighingQueries';

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const toneByStatus = {
    RECEIVED: 'bg-slate-100 text-slate-700',
    IN_PRODUCTION: 'bg-amber-100 text-amber-700',
    READY_FOR_DELIVERY: 'bg-emerald-100 text-emerald-700',
  };
  const labelKeyByStatus = {
    RECEIVED: 'dashboard.stat.received',
    IN_PRODUCTION: 'dashboard.stat.inProduction',
    READY_FOR_DELIVERY: 'dashboard.stat.readyForDelivery',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneByStatus[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {t(labelKeyByStatus[status] ?? status)}
    </span>
  );
}

function ChemicalsSection({ consignment, isEditable }) {
  const { t, i18n } = useTranslation();
  const [chemicalName, setChemicalName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const addChemical = useAddDyeChemical(consignment.id);
  const removeChemical = useRemoveDyeChemical(consignment.id);
  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  async function handleAdd(event) {
    event.preventDefault();
    try {
      await addChemical.mutateAsync({ chemicalName, quantity: Number(quantity), unit });
      setChemicalName('');
      setQuantity('');
    } catch (error) {
      // surfaced via addChemical.error below
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">{t('weighing.detail.chemicalsSection')}</h3>

      {consignment.chemicals.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          {t('weighing.detail.chemicalsEmpty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {consignment.chemicals.map((chemical) => (
            <li
              key={chemical.id}
              className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <span>
                {chemical.chemicalName} — {Number(chemical.quantity).toLocaleString(numberLocale)} {chemical.unit}
              </span>
              {isEditable ? (
                <button
                  type="button"
                  onClick={() => removeChemical.mutate(chemical.id)}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  {t('weighing.detail.remove')}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {isEditable ? (
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
          <label className="flex-1 space-y-1">
            <span className="text-xs font-medium text-slate-600">{t('weighing.detail.chemicalName')}</span>
            <input
              required
              value={chemicalName}
              onChange={(event) => setChemicalName(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="w-24 space-y-1">
            <span className="text-xs font-medium text-slate-600">{t('weighing.detail.chemicalQuantity')}</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="w-20 space-y-1">
            <span className="text-xs font-medium text-slate-600">{t('weighing.detail.chemicalUnit')}</span>
            <input
              required
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            />
          </label>
          <button type="submit" disabled={addChemical.isPending} className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60">
            {t('weighing.detail.addChemical')}
          </button>
        </form>
      ) : null}

      {addChemical.isError ? <p className="text-sm text-rose-600">{addChemical.error.message}</p> : null}
    </div>
  );
}

export default function ConsignmentDetailModal({ consignmentId, onClose }) {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError } = useConsignment(consignmentId);
  const startProduction = useStartProduction(consignmentId);
  const completeConsignment = useCompleteConsignment(consignmentId);
  const [postDyeWeightKg, setPostDyeWeightKg] = useState('');
  const [postDyeLengthM, setPostDyeLengthM] = useState('');

  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const consignment = data?.data;

  async function handleComplete(event) {
    event.preventDefault();
    try {
      await completeConsignment.mutateAsync({
        postDyeWeightKg: Number(postDyeWeightKg),
        postDyeLengthM: Number(postDyeLengthM),
      });
    } catch (error) {
      // surfaced via completeConsignment.error below
    }
  }

  return (
    <Modal title={t('weighing.detail.title')} onClose={onClose} widthClassName="max-w-2xl">
      {isLoading ? <p className="text-sm text-slate-500">{t('weighing.table.loading')}</p> : null}
      {isError ? <p className="text-sm text-rose-600">{t('weighing.table.error')}</p> : null}

      {consignment ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('weighing.detail.consignmentNo')}</p>
              <p className="text-lg font-semibold text-slate-900">{consignment.consignmentNo}</p>
              <p className="mt-1 text-sm text-slate-600">{consignment.customerName}</p>
              <p className="mt-1 text-sm text-slate-500">{t('weighing.detail.fabric')}: {consignment.fabricName}</p>
            </div>
            <StatusBadge status={consignment.status} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700">{t('weighing.detail.preDyeSection')}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {t('weighing.form.preDyeWeight')}: {Number(consignment.preDyeWeightKg).toLocaleString(numberLocale)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {t('weighing.form.preDyeLength')}: {Number(consignment.preDyeLengthM).toLocaleString(numberLocale)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700">{t('weighing.detail.postDyeSection')}</h3>
              {consignment.postDyeWeightKg != null ? (
                <>
                  <p className="mt-2 text-sm text-slate-600">
                    {t('weighing.detail.postDyeWeight')}: {Number(consignment.postDyeWeightKg).toLocaleString(numberLocale)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {t('weighing.detail.postDyeLength')}: {Number(consignment.postDyeLengthM).toLocaleString(numberLocale)}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400">{t('weighing.detail.notCompletedYet')}</p>
              )}
            </div>
          </div>

          <ChemicalsSection consignment={consignment} isEditable={consignment.status !== 'READY_FOR_DELIVERY'} />

          {consignment.status === 'RECEIVED' ? (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">{t('weighing.detail.startProductionHint')}</p>
              {startProduction.isError ? <p className="text-sm text-rose-600">{startProduction.error.message}</p> : null}
              <button
                type="button"
                onClick={() => startProduction.mutate()}
                disabled={startProduction.isPending}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {t('weighing.detail.startProduction')}
              </button>
            </div>
          ) : null}

          {consignment.status === 'IN_PRODUCTION' ? (
            <form onSubmit={handleComplete} className="space-y-3 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-slate-700">{t('weighing.detail.postDyeWeight')}</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={postDyeWeightKg}
                    onChange={(event) => setPostDyeWeightKg(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-slate-700">{t('weighing.detail.postDyeLength')}</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={postDyeLengthM}
                    onChange={(event) => setPostDyeLengthM(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                  />
                </label>
              </div>
              {completeConsignment.isError ? <p className="text-sm text-rose-600">{completeConsignment.error.message}</p> : null}
              <button
                type="submit"
                disabled={completeConsignment.isPending}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {t('weighing.detail.complete')}
              </button>
            </form>
          ) : null}

          {consignment.status === 'READY_FOR_DELIVERY' ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {t('weighing.detail.readyBanner')}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
          {t('weighing.detail.close')}
        </button>
      </div>
    </Modal>
  );
}
