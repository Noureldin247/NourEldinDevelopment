import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import { useRestockInventoryItem } from '../../../hooks/useInventoryQueries';

export default function RestockModal({ item, onClose }) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const restock = useRestockInventoryItem(item.id);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await restock.mutateAsync({ quantity: Number(quantity), note: note || null });
      onClose();
    } catch (error) {
      // surfaced via restock.error below
    }
  }

  return (
    <Modal title={`${t('inventory.restockModal.title')} — ${item.name}`} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('inventory.restockModal.quantity')}</span>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('inventory.restockModal.note')}</span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        {restock.isError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{restock.error.message}</p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
            {t('inventory.restockModal.cancel')}
          </button>
          <button
            type="submit"
            disabled={restock.isPending}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {restock.isPending ? t('inventory.restockModal.submitting') : t('inventory.restockModal.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
