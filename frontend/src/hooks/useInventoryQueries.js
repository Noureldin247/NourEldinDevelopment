import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestJson } from '../lib/api';

export function useInventoryItems(filters = {}) {
  const params = new URLSearchParams();
  if (filters.lowStock) params.set('lowStock', 'true');
  if (filters.itemType) params.set('itemType', filters.itemType);

  return useQuery({
    queryKey: ['inventory-items', filters.lowStock ?? false, filters.itemType ?? ''],
    queryFn: () => requestJson(`/inventory-items?${params.toString()}`),
  });
}

function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
}

export function useCreateInventoryItem() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (payload) => requestJson('/inventory-items', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateInventoryItem(id) {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (payload) => requestJson(`/inventory-items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(),
  });
}

export function useRestockInventoryItem(id) {
  const invalidate = useInvalidateInventory();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => requestJson(`/inventory-items/${id}/restock`, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions', id] });
    },
  });
}

export function useInventoryTransactions(id) {
  return useQuery({
    queryKey: ['inventory-transactions', id],
    enabled: Boolean(id),
    queryFn: () => requestJson(`/inventory-items/${id}/transactions`),
  });
}
