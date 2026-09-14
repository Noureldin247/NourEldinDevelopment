import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventoryItems } from '../../hooks/useInventoryQueries';
import InventoryItemFormModal from './components/InventoryItemFormModal';
import RestockModal from './components/RestockModal';
import TransactionHistoryModal from './components/TransactionHistoryModal';

export default function InventoryPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError, refetch } = useInventoryItems();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [restockingItem, setRestockingItem] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);

  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{t('nav.inventory')}</h1>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {t('inventory.newButton')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? <p className="p-6 text-sm text-slate-500">{t('inventory.table.loading')}</p> : null}
        {isError ? (
          <div className="p-6 text-sm text-rose-600">
            {t('inventory.table.error')}{' '}
            <button type="button" onClick={() => refetch()} className="font-semibold underline">
              {t('common.retry')}
            </button>
          </div>
        ) : null}
        {!isLoading && !isError && data?.data?.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{t('inventory.table.empty')}</p>
        ) : null}

        {!isLoading && !isError && data?.data?.length ? (
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">{t('inventory.table.columns.type')}</th>
                <th className="px-4 py-3 text-start">{t('inventory.table.columns.name')}</th>
                <th className="px-4 py-3 text-start">{t('inventory.table.columns.quantity')}</th>
                <th className="px-4 py-3 text-start">{t('inventory.table.columns.reorderThreshold')}</th>
                <th className="px-4 py-3 text-start">{t('inventory.table.columns.status')}</th>
                <th className="px-4 py-3 text-start">{t('inventory.table.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((item) => {
                const isLow = Number(item.quantityOnHand) <= Number(item.reorderThreshold);
                return (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-600">{t(`inventory.type.${item.itemType.toLowerCase()}`)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className={`px-4 py-3 ${isLow ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>
                      {Number(item.quantityOnHand).toLocaleString(numberLocale)} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {Number(item.reorderThreshold).toLocaleString(numberLocale)} {item.unit}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isLow ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isLow ? t('inventory.table.low') : t('inventory.table.ok')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setRestockingItem(item)}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {t('inventory.table.restock')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {t('inventory.table.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryItem(item)}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {t('inventory.table.history')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </div>

      {isFormOpen ? <InventoryItemFormModal mode="create" onClose={() => setFormOpen(false)} /> : null}
      {editingItem ? (
        <InventoryItemFormModal mode="edit" item={editingItem} onClose={() => setEditingItem(null)} />
      ) : null}
      {restockingItem ? <RestockModal item={restockingItem} onClose={() => setRestockingItem(null)} /> : null}
      {historyItem ? <TransactionHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} /> : null}
    </div>
  );
}
