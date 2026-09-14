import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestJson } from '../lib/api';

export function useUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: () => requestJson('/admin/users'),
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (payload) => requestJson('/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateUser(id) {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (payload) => requestJson(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => invalidate(),
  });
}

export function useSetUserPassword(id) {
  return useMutation({
    mutationFn: (password) =>
      requestJson(`/admin/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  });
}

export function useSetUserStatus(id) {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (isActive) =>
      requestJson(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    onSuccess: () => invalidate(),
  });
}
