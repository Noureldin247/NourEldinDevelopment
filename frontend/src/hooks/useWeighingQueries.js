import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestJson } from '../lib/api';

export function useConsignments(status) {
  return useQuery({
    queryKey: ['weighing-consignments', status],
    queryFn: () => requestJson(status ? `/consignments?status=${status}` : '/consignments'),
  });
}

export function useConsignment(id) {
  return useQuery({
    queryKey: ['weighing-consignment', id],
    enabled: Boolean(id),
    queryFn: () => requestJson(`/consignments/${id}`),
  });
}

function useInvalidateWeighing() {
  const queryClient = useQueryClient();
  return (id) => {
    queryClient.invalidateQueries({ queryKey: ['weighing-consignments'] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['weighing-consignment', id] });
    }
  };
}

export function useCreateConsignment() {
  const invalidate = useInvalidateWeighing();

  return useMutation({
    mutationFn: (payload) => requestJson('/consignments', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(),
  });
}

export function useAddDyeChemical(consignmentId) {
  const invalidate = useInvalidateWeighing();

  return useMutation({
    mutationFn: (payload) =>
      requestJson(`/consignments/${consignmentId}/chemicals`, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(consignmentId),
  });
}

export function useRemoveDyeChemical(consignmentId) {
  const invalidate = useInvalidateWeighing();

  return useMutation({
    mutationFn: (chemicalId) =>
      requestJson(`/consignments/${consignmentId}/chemicals/${chemicalId}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(consignmentId),
  });
}

export function useStartProduction(consignmentId) {
  const invalidate = useInvalidateWeighing();

  return useMutation({
    mutationFn: () => requestJson(`/consignments/${consignmentId}/start-production`, { method: 'PATCH' }),
    onSuccess: () => invalidate(consignmentId),
  });
}

export function useCompleteConsignment(consignmentId) {
  const invalidate = useInvalidateWeighing();

  return useMutation({
    mutationFn: (payload) =>
      requestJson(`/consignments/${consignmentId}/complete`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(consignmentId),
  });
}
