// يخزن بيانات جلسة الدخول (التوكن والدور والاسم) في المتصفح
// Stores the login session (token, role, name) in the browser.

const SESSION_KEY = 'winitex_session';

export function saveSession({ token, role, fullName }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, role, fullName }));
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
