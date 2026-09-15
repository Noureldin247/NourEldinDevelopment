import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomers } from '../../hooks/useCustomerQueries';
import CustomerFormModal from './components/CustomerFormModal';
import CustomerDetailModal from './components/CustomerDetailModal';

export default function CustomersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useCustomers(search);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomerId, setViewingCustomerId] = useState(null);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{t('nav.customers')}</h1>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {t('customers.newButton')}
          </button>
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('weighing.form.customerSearchPlaceholder')}
          className="mt-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? <p className="p-6 text-sm text-slate-500">{t('customers.table.loading')}</p> : null}
        {isError ? (
          <div className="p-6 text-sm text-rose-600">
            {t('customers.table.error')}{' '}
            <button type="button" onClick={() => refetch()} className="font-semibold underline">
              {t('common.retry')}
            </button>
          </div>
        ) : null}
        {!isLoading && !isError && data?.data?.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{t('customers.table.empty')}</p>
        ) : null}

        {!isLoading && !isError && data?.data?.length ? (
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">{t('customers.table.columns.code')}</th>
                <th className="px-4 py-3 text-start">{t('customers.table.columns.name')}</th>
                <th className="px-4 py-3 text-start">{t('customers.table.columns.phone')}</th>
                <th className="px-4 py-3 text-start">{t('customers.table.columns.email')}</th>
                <th className="px-4 py-3 text-start">{t('customers.table.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((customer) => (
                <tr key={customer.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-800">{customer.customerCode}</td>
                  <td className="px-4 py-3 text-slate-600">{customer.fullName}</td>
                  <td className="px-4 py-3 text-slate-600" dir="ltr">{customer.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-600" dir="ltr">{customer.email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingCustomerId(customer.id)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {t('customers.table.view')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCustomer(customer)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {t('customers.table.edit')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {isFormOpen ? <CustomerFormModal mode="create" onClose={() => setFormOpen(false)} /> : null}
      {editingCustomer ? (
        <CustomerFormModal mode="edit" customer={editingCustomer} onClose={() => setEditingCustomer(null)} />
      ) : null}
      {viewingCustomerId ? (
        <CustomerDetailModal customerId={viewingCustomerId} onClose={() => setViewingCustomerId(null)} />
      ) : null}
    </div>
  );
}
