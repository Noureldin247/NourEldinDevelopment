import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestJson } from '../lib/api';

export function useAvailableConsignments(customerName) {
  return useQuery({
    queryKey: ['available-consignments', customerName],
    enabled: Boolean(customerName),
    queryFn: () => requestJson(`/invoices/available-consignments?customerName=${encodeURIComponent(customerName)}`),
  });
}

export function useCustomerNames(search) {
  return useQuery({
    queryKey: ['customer-names', search],
    queryFn: () => requestJson(`/reports/customer-names?search=${encodeURIComponent(search ?? '')}`),
  });
}

export function useInvoices(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.overdue) params.set('overdue', 'true');

  return useQuery({
    queryKey: ['invoices', filters.status ?? '', filters.overdue ?? false],
    queryFn: () => requestJson(`/invoices?${params.toString()}`),
  });
}

export function useInvoice(id) {
  return useQuery({
    queryKey: ['invoice', id],
    enabled: Boolean(id),
    queryFn: () => requestJson(`/invoices/${id}`),
  });
}

export function usePriceSuggestion(lineType, description) {
  return useQuery({
    queryKey: ['price-suggestion', lineType, description],
    enabled: Boolean(lineType && description),
    queryFn: () =>
      requestJson(`/invoices/price-suggestion?lineType=${lineType}&description=${encodeURIComponent(description)}`),
  });
}

function useInvalidateInvoices() {
  const queryClient = useQueryClient();
  return (id) => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['available-consignments'] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    }
  };
}

export function useCreateInvoice() {
  const invalidate = useInvalidateInvoices();

  return useMutation({
    mutationFn: (payload) => requestJson('/invoices', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(),
  });
}

export function useSetLinePrice(invoiceId, lineId) {
  const invalidate = useInvalidateInvoices();

  return useMutation({
    mutationFn: (unitPrice) =>
      requestJson(`/invoices/${invoiceId}/lines/${lineId}`, { method: 'PATCH', body: JSON.stringify({ unitPrice }) }),
    onSuccess: () => invalidate(invoiceId),
  });
}

export function useIssueInvoice(invoiceId) {
  const invalidate = useInvalidateInvoices();

  return useMutation({
    mutationFn: (dueDate) =>
      requestJson(`/invoices/${invoiceId}/issue`, { method: 'PATCH', body: JSON.stringify({ dueDate }) }),
    onSuccess: () => invalidate(invoiceId),
  });
}

export function useMarkInvoicePaid(invoiceId) {
  const invalidate = useInvalidateInvoices();

  return useMutation({
    mutationFn: () => requestJson(`/invoices/${invoiceId}/mark-paid`, { method: 'PATCH' }),
    onSuccess: () => invalidate(invoiceId),
  });
}
