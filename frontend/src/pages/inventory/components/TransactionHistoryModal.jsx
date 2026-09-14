import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import { useInventoryTransactions } from '../../../hooks/useInventoryQueries';

export default function TransactionHistoryModal({ item, onClose }) {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError } = useInventoryTransactions(item.id);
  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  return (
    <Modal title={`${t('inventory.transactionsModal.title')} — ${item.name}`} onClose={onClose} widthClassName="max-w-2xl">
      {isLoading ? <p className="text-sm text-slate-500">{t('inventory.transactionsModal.loading')}</p> : null}
      {isError ? <p className="text-sm text-rose-600">{t('inventory.transactionsModal.error')}</p> : null}
      {!isLoading && !isError && data?.data?.length === 0 ? (
        <p className="text-sm text-slate-500">{t('inventory.transactionsModal.empty')}</p>
      ) : null}

      {!isLoading && !isError && data?.data?.length ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-start">{t('inventory.transactionsModal.columns.type')}</th>
                <th className="px-3 py-2 text-start">{t('inventory.transactionsModal.columns.quantity')}</th>
                <th className="px-3 py-2 text-start">{t('inventory.transactionsModal.columns.consignment')}</th>
                <th className="px-3 py-2 text-start">{t('inventory.transactionsModal.columns.date')}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((transaction) => (
                <tr key={transaction.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-600">
                    {t(`inventory.transactionsModal.type.${transaction.changeType.toLowerCase()}`)}
                  </td>
                  <td className={`px-3 py-2 font-semibold ${transaction.quantity < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {Number(transaction.quantity).toLocaleString(numberLocale)}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {transaction.consignmentId ? `CN-${String(transaction.consignmentId).padStart(6, '0')}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(transaction.createdAt).toLocaleDateString(numberLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
          {t('inventory.transactionsModal.close')}
        </button>
      </div>
    </Modal>
  );
}
