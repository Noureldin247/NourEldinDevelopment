import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import { useCustomerNames, useAvailableConsignments, useCreateInvoice } from '../../../hooks/useInvoiceQueries';

export default function NewInvoiceModal({ onClose, onCreated }) {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: customerNames } = useCustomerNames(search);
  const { data: consignments, isLoading: isLoadingConsignments } = useAvailableConsignments(selectedCustomer);
  const createInvoice = useCreateInvoice();

  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  function toggleConsignment(id) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id]));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const result = await createInvoice.mutateAsync({ consignmentIds: selectedIds });
      onCreated(result.data);
    } catch (error) {
      // surfaced via createInvoice.error below
    }
  }

  return (
    <Modal title={t('accounting.newInvoiceModal.title')} onClose={onClose} widthClassName="max-w-xl">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('accounting.newInvoiceModal.customerLabel')}</span>
          <input
            value={selectedCustomer || search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSelectedCustomer('');
            }}
            placeholder={t('accounting.newInvoiceModal.customerPlaceholder')}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
          {!selectedCustomer && search && customerNames?.data?.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {customerNames.data.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(name);
                    setSelectedIds([]);
                  }}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  {name}
                </button>
              ))}
            </div>
          ) : null}
        </label>

        {selectedCustomer ? (
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">{t('accounting.newInvoiceModal.consignmentsLabel')}</span>
            {isLoadingConsignments ? <p className="text-sm text-slate-500">{t('accounting.table.loading')}</p> : null}
            {!isLoadingConsignments && consignments?.data?.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                {t('accounting.newInvoiceModal.consignmentsEmpty')}
              </p>
            ) : null}
            {!isLoadingConsignments && consignments?.data?.length ? (
              <ul className="max-h-56 space-y-2 overflow-y-auto">
                {consignments.data.map((consignment) => (
                  <li key={consignment.id}>
                    <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(consignment.id)}
                        onChange={() => toggleConsignment(consignment.id)}
                      />
                      <span className="font-semibold">{consignment.consignmentNo}</span>
                      <span className="text-slate-500">{consignment.fabricName}</span>
                      <span className="ms-auto text-slate-600">
                        {Number(consignment.postDyeWeightKg).toLocaleString(numberLocale)} kg
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {createInvoice.isError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{createInvoice.error.message}</p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
            {t('accounting.newInvoiceModal.cancel')}
          </button>
          <button
            type="submit"
            disabled={selectedIds.length === 0 || createInvoice.isPending}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {createInvoice.isPending ? t('accounting.newInvoiceModal.submitting') : t('accounting.newInvoiceModal.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
