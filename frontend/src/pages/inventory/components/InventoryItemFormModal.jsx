import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import { useCreateInventoryItem, useUpdateInventoryItem } from '../../../hooks/useInventoryQueries';

const ITEM_TYPES = ['FABRIC', 'CHEMICAL'];

export default function InventoryItemFormModal({ mode, item, onClose }) {
  const { t } = useTranslation();
  const [itemType, setItemType] = useState(item?.itemType ?? 'FABRIC');
  const [name, setName] = useState(item?.name ?? '');
  const [unit, setUnit] = useState(item?.unit ?? 'kg');
  const [quantityOnHand, setQuantityOnHand] = useState(item?.quantityOnHand ?? '');
  const [reorderThreshold, setReorderThreshold] = useState(item?.reorderThreshold ?? '');

  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem(item?.id);
  const mutation = mode === 'create' ? createItem : updateItem;

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (mode === 'create') {
        await createItem.mutateAsync({
          itemType,
          name,
          unit,
          quantityOnHand: Number(quantityOnHand),
          reorderThreshold: Number(reorderThreshold),
        });
      } else {
        await updateItem.mutateAsync({ name, unit, reorderThreshold: Number(reorderThreshold) });
      }
      onClose();
    } catch (error) {
      // surfaced via mutation.error below
    }
  }

  return (
    <Modal title={mode === 'create' ? t('inventory.form.createTitle') : t('inventory.form.editTitle')} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('inventory.form.itemType')}</span>
          <select
            value={itemType}
            disabled={mode === 'edit'}
            onChange={(event) => setItemType(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none disabled:opacity-60"
          >
            {ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`inventory.type.${type.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('inventory.form.name')}</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('inventory.form.unit')}</span>
            <input
              required
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>

          {mode === 'create' ? (
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">{t('inventory.form.quantityOnHand')}</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={quantityOnHand}
                onChange={(event) => setQuantityOnHand(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
              />
            </label>
          ) : null}
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('inventory.form.reorderThreshold')}</span>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={reorderThreshold}
            onChange={(event) => setReorderThreshold(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        {mutation.isError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{mutation.error.message}</p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
            {t('inventory.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {mutation.isPending
              ? t('inventory.form.submitting')
              : mode === 'create'
                ? t('inventory.form.submitCreate')
                : t('inventory.form.submitEdit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
