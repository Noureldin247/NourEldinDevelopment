import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useEmployees,
  useSetEmployeeStatus,
  useAttendance,
  useMarkAttendance,
  useLeaveRequests,
  useReviewLeaveRequest,
  usePayslips,
  useGeneratePayslip,
} from '../../hooks/useHrQueries';
import EmployeeFormModal from './components/EmployeeFormModal';
import LeaveRequestFormModal from './components/LeaveRequestFormModal';

const TABS = ['employees', 'attendance', 'leave', 'payroll'];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function EmployeeRow({ employee, onEdit, numberLocale }) {
  const { t } = useTranslation();
  const setStatus = useSetEmployeeStatus(employee.id);

  return (
    <tr className="border-t border-slate-100 text-sm">
      <td className="px-4 py-3 font-semibold text-slate-800">{employee.fullName}</td>
      <td className="px-4 py-3 text-slate-600">{employee.position}</td>
      <td className="px-4 py-3 text-slate-600">{employee.department || '—'}</td>
      <td className="px-4 py-3 text-slate-600">{Number(employee.monthlySalary).toLocaleString(numberLocale)}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            employee.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {employee.isActive ? t('hr.employees.table.active') : t('hr.employees.table.inactive')}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {t('hr.employees.table.edit')}
          </button>
          <button
            type="button"
            onClick={() => setStatus.mutate(!employee.isActive)}
            disabled={setStatus.isPending}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              employee.isActive ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {employee.isActive ? t('hr.employees.table.deactivate') : t('hr.employees.table.activate')}
          </button>
        </div>
      </td>
    </tr>
  );
}

function EmployeesTab() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError } = useEmployees();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          {t('hr.employees.newButton')}
        </button>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? <p className="p-6 text-sm text-slate-500">{t('hr.employees.table.loading')}</p> : null}
        {isError ? <p className="p-6 text-sm text-rose-600">{t('hr.employees.table.error')}</p> : null}
        {!isLoading && !isError && data?.data?.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{t('hr.employees.table.empty')}</p>
        ) : null}
        {!isLoading && !isError && data?.data?.length ? (
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">{t('hr.employees.table.columns.fullName')}</th>
                <th className="px-4 py-3 text-start">{t('hr.employees.table.columns.position')}</th>
                <th className="px-4 py-3 text-start">{t('hr.employees.table.columns.department')}</th>
                <th className="px-4 py-3 text-start">{t('hr.employees.table.columns.salary')}</th>
                <th className="px-4 py-3 text-start">{t('hr.employees.table.columns.status')}</th>
                <th className="px-4 py-3 text-start">{t('hr.employees.table.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((employee) => (
                <EmployeeRow
                  key={employee.id}
                  employee={employee}
                  onEdit={() => setEditingEmployee(employee)}
                  numberLocale={numberLocale}
                />
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {isFormOpen ? <EmployeeFormModal mode="create" onClose={() => setFormOpen(false)} /> : null}
      {editingEmployee ? (
        <EmployeeFormModal mode="edit" employee={editingEmployee} onClose={() => setEditingEmployee(null)} />
      ) : null}
    </div>
  );
}

function AttendanceTab() {
  const { t } = useTranslation();
  const [date, setDate] = useState(todayDate());
  const { data, isLoading, isError } = useAttendance(date);
  const markAttendance = useMarkAttendance();
  const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE'];

  return (
    <div className="space-y-4">
      <label className="block max-w-xs space-y-1">
        <span className="text-sm font-medium text-slate-700">{t('hr.attendance.dateLabel')}</span>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
        />
      </label>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? <p className="p-6 text-sm text-slate-500">{t('hr.attendance.loading')}</p> : null}
        {isError ? <p className="p-6 text-sm text-rose-600">{t('hr.attendance.error')}</p> : null}
        {!isLoading && !isError && data?.data?.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{t('hr.attendance.empty')}</p>
        ) : null}
        {!isLoading && !isError && data?.data?.length ? (
          <ul className="divide-y divide-slate-100">
            {data.data.map((row) => (
              <li key={row.employeeId} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{row.fullName}</p>
                  <p className="text-xs text-slate-500">{row.position}</p>
                </div>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => markAttendance.mutate({ employeeId: row.employeeId, date, status })}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        row.status === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t(`hr.attendance.status.${status.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function LeaveRow({ request, dateLocale }) {
  const { t } = useTranslation();
  const reviewLeaveRequest = useReviewLeaveRequest(request.id);
  const STATUS_TONE = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-rose-100 text-rose-700',
  };

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3 font-semibold text-slate-800">{request.employeeName}</td>
      <td className="px-4 py-3 text-slate-600">{t(`hr.leave.type.${request.leaveType.toLowerCase()}`)}</td>
      <td className="px-4 py-3 text-slate-600">{new Date(request.startDate).toLocaleDateString(dateLocale)}</td>
      <td className="px-4 py-3 text-slate-600">{new Date(request.endDate).toLocaleDateString(dateLocale)}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[request.status]}`}>
          {t(`hr.leave.filters.${request.status.toLowerCase()}`)}
        </span>
      </td>
      <td className="px-4 py-3">
        {request.status === 'PENDING' ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => reviewLeaveRequest.mutate('APPROVED')}
              disabled={reviewLeaveRequest.isPending}
              className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
            >
              {t('hr.leave.table.approve')}
            </button>
            <button
              type="button"
              onClick={() => reviewLeaveRequest.mutate('REJECTED')}
              disabled={reviewLeaveRequest.isPending}
              className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"
            >
              {t('hr.leave.table.reject')}
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
    </tr>
  );
}

function LeaveTab() {
  const { t, i18n } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('');
  const [isFormOpen, setFormOpen] = useState(false);
  const { data: employeesData } = useEmployees(true);
  const { data, isLoading, isError } = useLeaveRequests(statusFilter ? { status: statusFilter } : {});
  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const FILTERS = ['', 'PENDING', 'APPROVED', 'REJECTED'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((status) => (
            <button
              key={status || 'all'}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-2 text-sm ${
                statusFilter === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {t(`hr.leave.filters.${status ? status.toLowerCase() : 'all'}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          {t('hr.leave.newButton')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? <p className="p-6 text-sm text-slate-500">{t('hr.leave.table.loading')}</p> : null}
        {isError ? <p className="p-6 text-sm text-rose-600">{t('hr.leave.table.error')}</p> : null}
        {!isLoading && !isError && data?.data?.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{t('hr.leave.table.empty')}</p>
        ) : null}
        {!isLoading && !isError && data?.data?.length ? (
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">{t('hr.leave.table.columns.employee')}</th>
                <th className="px-4 py-3 text-start">{t('hr.leave.table.columns.type')}</th>
                <th className="px-4 py-3 text-start">{t('hr.leave.table.columns.startDate')}</th>
                <th className="px-4 py-3 text-start">{t('hr.leave.table.columns.endDate')}</th>
                <th className="px-4 py-3 text-start">{t('hr.leave.table.columns.status')}</th>
                <th className="px-4 py-3 text-start">{t('hr.leave.table.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((request) => (
                <LeaveRow key={request.id} request={request} dateLocale={dateLocale} />
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {isFormOpen && employeesData?.data?.length ? (
        <LeaveRequestFormModal employees={employeesData.data} onClose={() => setFormOpen(false)} />
      ) : null}
    </div>
  );
}

function PayrollTab() {
  const { t, i18n } = useTranslation();
  const { data: employeesData } = useEmployees(true);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(currentMonthValue());
  const generatePayslip = useGeneratePayslip();
  const [result, setResult] = useState(null);
  const { data: payslipsData, isLoading, isError } = usePayslips(employeeId ? { employeeId } : {});
  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  async function handleGenerate(event) {
    event.preventDefault();
    try {
      const response = await generatePayslip.mutateAsync({ employeeId: Number(employeeId), month });
      setResult(response.data);
    } catch (error) {
      // surfaced via generatePayslip.error below
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('hr.payroll.employeeLabel')}</span>
          <select
            required
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          >
            <option value="" disabled>
              —
            </option>
            {(employeesData?.data ?? []).map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">{t('hr.payroll.monthLabel')}</span>
          <input
            type="month"
            required
            value={month.slice(0, 7)}
            onChange={(event) => setMonth(`${event.target.value}-01`)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={!employeeId || generatePayslip.isPending}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {generatePayslip.isPending ? t('hr.payroll.generating') : t('hr.payroll.generateButton')}
        </button>
      </form>

      {generatePayslip.isError ? <p className="text-sm text-rose-600">{generatePayslip.error.message}</p> : null}

      {result ? (
        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">{t('hr.payroll.baseSalary')}</p>
            <p className="text-lg font-semibold text-slate-900">{Number(result.baseSalary).toLocaleString(numberLocale)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t('hr.payroll.absentDays')}</p>
            <p className="text-lg font-semibold text-slate-900">{result.absentDays}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t('hr.payroll.deduction')}</p>
            <p className="text-lg font-semibold text-rose-600">{Number(result.deduction).toLocaleString(numberLocale)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t('hr.payroll.netPay')}</p>
            <p className="text-lg font-semibold text-emerald-600">{Number(result.netPay).toLocaleString(numberLocale)}</p>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? <p className="p-6 text-sm text-slate-500">{t('hr.payroll.table.loading')}</p> : null}
        {isError ? <p className="p-6 text-sm text-rose-600">{t('hr.payroll.table.error')}</p> : null}
        {!isLoading && !isError && payslipsData?.data?.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{t('hr.payroll.table.empty')}</p>
        ) : null}
        {!isLoading && !isError && payslipsData?.data?.length ? (
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">{t('hr.payroll.table.columns.employee')}</th>
                <th className="px-4 py-3 text-start">{t('hr.payroll.table.columns.month')}</th>
                <th className="px-4 py-3 text-start">{t('hr.payroll.table.columns.baseSalary')}</th>
                <th className="px-4 py-3 text-start">{t('hr.payroll.table.columns.absentDays')}</th>
                <th className="px-4 py-3 text-start">{t('hr.payroll.table.columns.deduction')}</th>
                <th className="px-4 py-3 text-start">{t('hr.payroll.table.columns.netPay')}</th>
              </tr>
            </thead>
            <tbody>
              {payslipsData.data.map((payslip) => (
                <tr key={payslip.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-800">{payslip.employeeName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(payslip.month).toLocaleDateString(numberLocale, { year: 'numeric', month: 'long' })}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{Number(payslip.baseSalary).toLocaleString(numberLocale)}</td>
                  <td className="px-4 py-3 text-slate-600">{payslip.absentDays}</td>
                  <td className="px-4 py-3 text-rose-600">{Number(payslip.deduction).toLocaleString(numberLocale)}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">
                    {Number(payslip.netPay).toLocaleString(numberLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}

export default function HrPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('employees');

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{t('nav.hr')}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-2 text-sm ${activeTab === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {t(`hr.tabs.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'employees' ? <EmployeesTab /> : null}
      {activeTab === 'attendance' ? <AttendanceTab /> : null}
      {activeTab === 'leave' ? <LeaveTab /> : null}
      {activeTab === 'payroll' ? <PayrollTab /> : null}
    </div>
  );
}
