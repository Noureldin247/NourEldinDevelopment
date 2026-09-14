import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConsignments } from '../../hooks/useWeighingQueries';
import ConsignmentFormModal from './components/ConsignmentFormModal';
import ConsignmentDetailModal from './components/ConsignmentDetailModal';

const STATUS_FILTERS = ['', 'RECEIVED', 'IN_PRODUCTION', 'READY_FOR_DELIVERY'];
const STATUS_LABEL_KEY = {
  '': 'weighing.filters.all',
  RECEIVED: 'dashboard.stat.received',
  IN_PRODUCTION: 'dashboard.stat.inProduction',
  READY_FOR_DELIVERY: 'dashboard.stat.readyForDelivery',
};
const STATUS_BADGE_TONE = {
  RECEIVED: 'bg-slate-100 text-slate-700',
  IN_PRODUCTION: 'bg-amber-100 text-amber-700',
  READY_FOR_DELIVERY: 'bg-emerald-100 text-emerald-700',
};

export default function WeighingPage() {
  const { t, i18n } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('');
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedConsignmentId, setSelectedConsignmentId] = useState(null);
  const { data, isLoading, isError, refetch } = useConsignments(statusFilter || undefined);

  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{t('nav.weighing')}</h1>
            <p className="mt-1 text-sm text-slate-500">{t('weighing.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {t('weighing.newButton')}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status || 'all'}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-2 text-sm ${
                statusFilter === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {t(STATUS_LABEL_KEY[status])}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? <p className="p-6 text-sm text-slate-500">{t('weighing.table.loading')}</p> : null}
        {isError ? (
          <div className="p-6 text-sm text-rose-600">
            {t('weighing.table.error')}{' '}
            <button type="button" onClick={() => refetch()} className="font-semibold underline">
              {t('common.retry')}
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && data?.data?.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{t('weighing.table.empty')}</p>
        ) : null}

        {!isLoading && !isError && data?.data?.length ? (
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">{t('weighing.table.columns.consignmentNo')}</th>
                <th className="px-4 py-3 text-start">{t('weighing.table.columns.customer')}</th>
                <th className="px-4 py-3 text-start">{t('weighing.table.columns.fabric')}</th>
                <th className="px-4 py-3 text-start">{t('weighing.table.columns.status')}</th>
                <th className="px-4 py-3 text-start">{t('weighing.table.columns.preDyeWeight')}</th>
                <th className="px-4 py-3 text-start">{t('weighing.table.columns.receivedAt')}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((consignment) => (
                <tr
                  key={consignment.id}
                  onClick={() => setSelectedConsignmentId(consignment.id)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">{consignment.consignmentNo}</td>
                  <td className="px-4 py-3 text-slate-600">{consignment.customerName}</td>
                  <td className="px-4 py-3 text-slate-600">{consignment.fabricName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_TONE[consignment.status]}`}>
                      {t(STATUS_LABEL_KEY[consignment.status])}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {Number(consignment.preDyeWeightKg).toLocaleString(numberLocale)} kg
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(consignment.receivedAt).toLocaleDateString(dateLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {isFormOpen ? (
        <ConsignmentFormModal
          onClose={() => setFormOpen(false)}
          onCreated={(created) => {
            setFormOpen(false);
            setSelectedConsignmentId(created.id);
          }}
        />
      ) : null}

      {selectedConsignmentId ? (
        <ConsignmentDetailModal consignmentId={selectedConsignmentId} onClose={() => setSelectedConsignmentId(null)} />
      ) : null}
    </div>
  );
}
