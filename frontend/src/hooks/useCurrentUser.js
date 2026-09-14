import { useQuery } from '@tanstack/react-query';
import { requestJson } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

// بيتأكد إن الجلسة المحفوظة محليًا لسه صالحة عن طريق /api/me
// Confirms the locally cached session is still valid via /api/me.
// لو التوكن منتهي، requestJson بيمسح الجلسة ويرجع المستخدم لصفحة الدخول تلقائيًا.
export function useCurrentUser() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => requestJson('/me'),
    enabled: Boolean(session?.token),
  });
}
