import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import CatalogPicker from '../../../components/CatalogPicker';
import { useCreateConsignment } from '../../../hooks/useWeighingQueries';
import { useCustomers, useCreateCustomer } from '../../../hooks/useCustomerQueries';
import { useInventoryItems, useCreateInventoryItem } from '../../../hooks/useInventoryQueries';

export default function ConsignmentFormModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [fabricSearch, setFabricSearch] = useState('');
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [preDyeWeightKg, setPreDyeWeightKg] = useState('');
  const [preDyeLengthM, setPreDyeLengthM] = useState('');

  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers(customerSearch);
  const { data: fabricsData, isLoading: isLoadingFabrics } = useInventoryItems({ itemType: 'FABRIC' });
  const createCustomer = useCreateCustomer();
  const createFabricItem = useCreateInventoryItem();
  const createConsignment = useCreateConsignment();

  const filteredFabrics = (fabricsData?.data ?? []).filter((item) =>
    item.name.toLowerCase().includes(fabricSearch.toLowerCase())
  );

  async function handleQuickCreateCustomer(name) {
    const result = await createCustomer.mutateAsync({ fullName: name });
    return result.data;
  }

  async function handleQuickCreateFabric(name) {
    const result = await createFabricItem.mutateAsync({
      itemType: 'FABRIC',
      name,
      unit: 'kg',
      quantityOnHand: 0,
      reorderThreshold: 0,
    });
    return result.data;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedCustomer || !selectedFabric) {
      return;
    }

    try {
      const result = await createConsignment.mutateAsync({
        customerId: selectedCustomer.id,
        fabricItemId: selectedFabric.id,
        preDyeWeightKg: Number(preDyeWeightKg),
        preDyeLengthM: Number(preDyeLengthM),
      });
      onCreated(result.data);
    } catch (error) {
      // error.message is surfaced below via createConsignment.error
    }
  }

  return (
    <Modal title={t('weighing.form.title')} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <CatalogPicker
          label={t('weighing.form.customerName')}
          placeholder={t('weighing.form.customerSearchPlaceholder')}
          selectedLabel={selectedCustomer?.fullName}
          search={customerSearch}
          onSearchChange={(value) => {
            setCustomerSearch(value);
            setSelectedCustomer(null);
          }}
          items={customersData?.data ?? []}
          isLoading={isLoadingCustomers}
          onSelect={setSelectedCustomer}
          getOptionLabel={(item) => item.fullName}
          getOptionSubLabel={(item) => item.customerCode}
          quickCreateLabel={t('weighing.form.addNewCustomer')}
          onQuickCreate={handleQuickCreateCustomer}
          isCreating={createCustomer.isPending}
        />

        <CatalogPicker
          label={t('weighing.form.fabricName')}
          placeholder={t('weighing.form.fabricSearchPlaceholder')}
          selectedLabel={selectedFabric?.name}
          search={fabricSearch}
          onSearchChange={(value) => {
            setFabricSearch(value);
            setSelectedFabric(null);
          }}
          items={filteredFabrics}
          isLoading={isLoadingFabrics}
          onSelect={setSelectedFabric}
          getOptionLabel={(item) => item.name}
          getOptionSubLabel={(item) => item.code}
          quickCreateLabel={t('weighing.form.addNewFabric')}
          onQuickCreate={handleQuickCreateFabric}
          isCreating={createFabricItem.isPending}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('weighing.form.preDyeWeight')}</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={preDyeWeightKg}
              onChange={(event) => setPreDyeWeightKg(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('weighing.form.preDyeLength')}</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={preDyeLengthM}
              onChange={(event) => setPreDyeLengthM(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>

        {createConsignment.isError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {createConsignment.error.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
            {t('weighing.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={!selectedCustomer || !selectedFabric || createConsignment.isPending}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {createConsignment.isPending ? t('weighing.form.submitting') : t('weighing.form.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
