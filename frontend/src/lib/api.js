import { getSession, clearSession } from './auth';

const basePath = '/api';

// يجهّز أي طلب بالتوكن تلقائيًا، ولو الجلسة منتهية بيرجّع المستخدم لصفحة الدخول
// Attaches the auth token to every request automatically; if the session
// has expired (401), it clears it and sends the user back to the login page.
export async function requestJson(path, options = {}) {
  const session = getSession();

  const response = await fetch(`${basePath}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    clearSession();
    window.location.href = '/';
    throw new Error('انتهت صلاحية الجلسة، برجاء تسجيل الدخول مرة أخرى.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}
