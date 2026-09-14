import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestJson } from '../lib/api';

export function useEmployees(active) {
  const params = active === undefined ? '' : `?active=${active}`;
  return useQuery({
    queryKey: ['employees', active ?? 'all'],
    queryFn: () => requestJson(`/employees${params}`),
  });
}

function useInvalidateEmployees() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['employees'] });
}

export function useCreateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (payload) => requestJson('/employees', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateEmployee(id) {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (payload) => requestJson(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(),
  });
}

export function useSetEmployeeStatus(id) {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (isActive) => requestJson(`/employees/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    onSuccess: () => invalidate(),
  });
}

export function useAttendance(date) {
  return useQuery({
    queryKey: ['attendance', date],
    enabled: Boolean(date),
    queryFn: () => requestJson(`/attendance?date=${date}`),
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => requestJson('/attendance', { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['attendance', variables.date] }),
  });
}

export function useLeaveRequests(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.employeeId) params.set('employeeId', filters.employeeId);

  return useQuery({
    queryKey: ['leave-requests', filters.status ?? '', filters.employeeId ?? ''],
    queryFn: () => requestJson(`/leave-requests?${params.toString()}`),
  });
}

function useInvalidateLeaveRequests() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
}

export function useCreateLeaveRequest() {
  const invalidate = useInvalidateLeaveRequests();
  return useMutation({
    mutationFn: (payload) => requestJson('/leave-requests', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(),
  });
}

export function useReviewLeaveRequest(id) {
  const invalidate = useInvalidateLeaveRequests();
  return useMutation({
    mutationFn: (status) => requestJson(`/leave-requests/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => invalidate(),
  });
}

export function usePayslips(filters = {}) {
  const params = new URLSearchParams();
  if (filters.employeeId) params.set('employeeId', filters.employeeId);
  if (filters.month) params.set('month', filters.month);

  return useQuery({
    queryKey: ['payslips', filters.employeeId ?? '', filters.month ?? ''],
    queryFn: () => requestJson(`/payslips?${params.toString()}`),
  });
}

export function useGeneratePayslip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => requestJson('/payslips/generate', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payslips'] }),
  });
}
