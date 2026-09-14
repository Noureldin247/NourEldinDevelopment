import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import { useCreateEmployee, useUpdateEmployee } from '../../../hooks/useHrQueries';

export default function EmployeeFormModal({ mode, employee, onClose }) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(employee?.fullName ?? '');
  const [position, setPosition] = useState(employee?.position ?? '');
  const [department, setDepartment] = useState(employee?.department ?? '');
  const [phone, setPhone] = useState(employee?.phone ?? '');
  const [hireDate, setHireDate] = useState(employee?.hireDate?.slice(0, 10) ?? '');
  const [monthlySalary, setMonthlySalary] = useState(employee?.monthlySalary ?? '');

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee(employee?.id);
  const mutation = mode === 'create' ? createEmployee : updateEmployee;

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      fullName,
      position,
      department: department || null,
      phone: phone || null,
      hireDate,
      monthlySalary: Number(monthlySalary),
    };

    try {
      await mutation.mutateAsync(payload);
      onClose();
    } catch (error) {
      // surfaced via mutation.error below
    }
  }

  return (
    <Modal title={mode === 'create' ? t('hr.employees.form.createTitle') : t('hr.employees.form.editTitle')} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('hr.employees.form.fullName')}</span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('hr.employees.form.position')}</span>
            <input
              required
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('hr.employees.form.department')}</span>
            <input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('hr.employees.form.phone')}</span>
            <input
              dir="ltr"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('hr.employees.form.hireDate')}</span>
            <input
              required
              type="date"
              value={hireDate}
              onChange={(event) => setHireDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('hr.employees.form.monthlySalary')}</span>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={monthlySalary}
            onChange={(event) => setMonthlySalary(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        {mutation.isError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{mutation.error.message}</p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
            {t('hr.employees.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {mutation.isPending
              ? t('hr.employees.form.submitting')
              : mode === 'create'
                ? t('hr.employees.form.submitCreate')
                : t('hr.employees.form.submitEdit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
