import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestJson } from '../lib/api';

export function useCustomers(search) {
  return useQuery({
    queryKey: ['customers', search ?? ''],
    queryFn: () => requestJson(`/customers?search=${encodeURIComponent(search ?? '')}`),
  });
}

export function useCustomer(id) {
  return useQuery({
    queryKey: ['customer', id],
    enabled: Boolean(id),
    queryFn: () => requestJson(`/customers/${id}`),
  });
}

function useInvalidateCustomers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['customers'] });
}

export function useCreateCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (payload) => requestJson('/customers', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateCustomer(id) {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (payload) => requestJson(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(),
  });
}
