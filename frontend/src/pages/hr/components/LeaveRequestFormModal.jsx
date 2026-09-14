import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import { useCreateLeaveRequest } from '../../../hooks/useHrQueries';

const LEAVE_TYPES = ['VACATION', 'SICK', 'OTHER'];

export default function LeaveRequestFormModal({ employees, onClose }) {
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? '');
  const [leaveType, setLeaveType] = useState('VACATION');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const createLeaveRequest = useCreateLeaveRequest();

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await createLeaveRequest.mutateAsync({ employeeId: Number(employeeId), leaveType, startDate, endDate, reason });
      onClose();
    } catch (error) {
      // surfaced via createLeaveRequest.error below
    }
  }

  return (
    <Modal title={t('hr.leave.form.title')} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('hr.leave.form.employeeLabel')}</span>
          <select
            required
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          >
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('hr.leave.form.typeLabel')}</span>
          <select
            value={leaveType}
            onChange={(event) => setLeaveType(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          >
            {LEAVE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`hr.leave.type.${type.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('hr.leave.form.startDate')}</span>
            <input
              required
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t('hr.leave.form.endDate')}</span>
            <input
              required
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('hr.leave.form.reason')}</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>

        {createLeaveRequest.isError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {createLeaveRequest.error.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
            {t('hr.leave.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={createLeaveRequest.isPending || !employeeId}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {createLeaveRequest.isPending ? t('hr.leave.form.submitting') : t('hr.leave.form.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
