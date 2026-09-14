import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInvoices } from '../../hooks/useInvoiceQueries';
import NewInvoiceModal from './components/NewInvoiceModal';
import InvoiceDetailModal from './components/InvoiceDetailModal';

const FILTERS = [
  { key: 'all', query: {} },
  { key: 'draft', query: { status: 'DRAFT' } },
  { key: 'issued', query: { status: 'ISSUED' } },
  { key: 'paid', query: { status: 'PAID' } },
  { key: 'overdue', query: { overdue: true } },
];

const STATUS_BADGE_TONE = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ISSUED: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
};

export default function AccountingPage() {
  const { t, i18n } = useTranslation();
  const [filterKey, setFilterKey] = useState('all');
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const activeFilter = FILTERS.find((filter) => filter.key === filterKey);
  const { data, isLoading, isError, refetch } = useInvoices(activeFilter.query);

  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{t('nav.accounting')}</h1>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {t('accounting.newButton')}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setFilterKey(filter.key)}
              className={`rounded-full px-3 py-2 text-sm ${
                filterKey === filter.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {t(`accounting.filters.${filter.key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? <p className="p-6 text-sm text-slate-500">{t('accounting.table.loading')}</p> : null}
        {isError ? (
          <div className="p-6 text-sm text-rose-600">
            {t('accounting.table.error')}{' '}
            <button type="button" onClick={() => refetch()} className="font-semibold underline">
              {t('common.retry')}
            </button>
          </div>
        ) : null}
        {!isLoading && !isError && data?.data?.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{t('accounting.table.empty')}</p>
        ) : null}

        {!isLoading && !isError && data?.data?.length ? (
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">{t('accounting.table.columns.invoiceNo')}</th>
                <th className="px-4 py-3 text-start">{t('accounting.table.columns.customer')}</th>
                <th className="px-4 py-3 text-start">{t('accounting.table.columns.status')}</th>
                <th className="px-4 py-3 text-start">{t('accounting.table.columns.total')}</th>
                <th className="px-4 py-3 text-start">{t('accounting.table.columns.dueDate')}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">{invoice.invoiceNo}</td>
                  <td className="px-4 py-3 text-slate-600">{invoice.customerName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_TONE[invoice.status]}`}>
                      {t(`accounting.status.${invoice.status.toLowerCase()}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{Number(invoice.total).toLocaleString(numberLocale)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString(dateLocale) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {isFormOpen ? (
        <NewInvoiceModal
          onClose={() => setFormOpen(false)}
          onCreated={(created) => {
            setFormOpen(false);
            setSelectedInvoiceId(created.id);
          }}
        />
      ) : null}

      {selectedInvoiceId ? (
        <InvoiceDetailModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
      ) : null}
    </div>
  );
}
