import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import { useCustomer } from '../../../hooks/useCustomerQueries';

const STATUS_LABEL_KEY = {
  RECEIVED: 'dashboard.stat.received',
  IN_PRODUCTION: 'dashboard.stat.inProduction',
  READY_FOR_DELIVERY: 'dashboard.stat.readyForDelivery',
};

export default function CustomerDetailModal({ customerId, onClose }) {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError } = useCustomer(customerId);
  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const customer = data?.data;

  return (
    <Modal title={t('customers.detail.title')} onClose={onClose} widthClassName="max-w-3xl">
      {isLoading ? <p className="text-sm text-slate-500">{t('customers.table.loading')}</p> : null}
      {isError ? <p className="text-sm text-rose-600">{t('customers.table.error')}</p> : null}

      {customer ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{customer.customerCode}</p>
            <p className="text-lg font-semibold text-slate-900">{customer.fullName}</p>
            <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
              {customer.phone ? <p dir="ltr">{t('customers.detail.phone')}: {customer.phone}</p> : null}
              {customer.email ? <p dir="ltr">{t('customers.detail.email')}: {customer.email}</p> : null}
              {customer.address ? <p>{t('customers.detail.address')}: {customer.address}</p> : null}
              {customer.notes ? <p>{t('customers.detail.notes')}: {customer.notes}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700">{t('customers.detail.fabricUsageSection')}</h3>
              {customer.fabricUsage.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">{t('customers.detail.usageEmpty')}</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {customer.fabricUsage.map((usage) => (
                    <li key={usage.fabricName} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{usage.fabricName}</span>
                      <span className="text-xs text-slate-400">
                        {t('customers.detail.usageOrderCount', { count: usage.orderCount })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700">{t('customers.detail.chemicalUsageSection')}</h3>
              {customer.chemicalUsage.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">{t('customers.detail.usageEmpty')}</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {customer.chemicalUsage.map((usage) => (
                    <li key={usage.chemicalName} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{usage.chemicalName}</span>
                      <span className="text-xs text-slate-400">
                        {t('customers.detail.usageOrderCount', { count: usage.usageCount })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">{t('customers.detail.ordersSection')}</h3>
            {customer.orders.length === 0 ? (
              <p className="text-sm text-slate-400">{t('customers.detail.ordersEmpty')}</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-start text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-start">{t('customers.detail.ordersColumns.consignmentNo')}</th>
                      <th className="px-3 py-2 text-start">{t('customers.detail.ordersColumns.fabric')}</th>
                      <th className="px-3 py-2 text-start">{t('customers.detail.ordersColumns.status')}</th>
                      <th className="px-3 py-2 text-start">{t('customers.detail.ordersColumns.weight')}</th>
                      <th className="px-3 py-2 text-start">{t('customers.detail.ordersColumns.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.orders.map((order) => (
                      <tr key={order.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-semibold text-slate-800">{order.consignmentNo}</td>
                        <td className="px-3 py-2 text-slate-600">{order.fabricName}</td>
                        <td className="px-3 py-2 text-slate-600">{t(STATUS_LABEL_KEY[order.status] ?? order.status)}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {Number(order.preDyeWeightKg).toLocaleString(numberLocale)} kg
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {new Date(order.receivedAt).toLocaleDateString(numberLocale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
          {t('customers.detail.close')}
        </button>
      </div>
    </Modal>
  );
}
