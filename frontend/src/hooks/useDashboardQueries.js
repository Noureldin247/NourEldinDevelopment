import { useQuery } from '@tanstack/react-query';
import { requestJson } from '../lib/api';

export function useOpenConsignments(status) {
  return useQuery({
    queryKey: ['open-consignments', status],
    queryFn: () => requestJson(`/consignments?status=${status}`),
  });
}

export function useCustodyStock() {
  return useQuery({
    queryKey: ['custody-stock'],
    queryFn: () => requestJson('/reports/custody-stock'),
  });
}

export function useTopCustomers() {
  return useQuery({
    queryKey: ['top-customers'],
    queryFn: () => requestJson('/reports/customer-custody-ranking'),
  });
}

export function useCustomerStatement(customerId) {
  return useQuery({
    queryKey: ['customer-statement', customerId],
    enabled: Boolean(customerId),
    queryFn: () => requestJson(`/reports/customer-statement/${customerId}`),
  });
}

export function useDraftInvoices() {
  return useQuery({
    queryKey: ['draft-invoices'],
    queryFn: () => requestJson('/invoices?status=DRAFT'),
  });
}

export function useOverdueInvoices() {
  return useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: () => requestJson('/invoices?overdue=true'),
  });
}

export function useMonthlyRevenue() {
  return useQuery({
    queryKey: ['monthly-revenue'],
    queryFn: () => requestJson('/reports/monthly-revenue'),
  });
}

export function useOverdueConsignments() {
  return useQuery({
    queryKey: ['overdue-consignments'],
    queryFn: () => requestJson('/reports/open-consignments'),
  });
}

export function useUnpricedLines() {
  return useQuery({
    queryKey: ['unpriced-lines'],
    queryFn: () => requestJson('/reports/unpriced-lines'),
  });
}
