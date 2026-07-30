import React, { useEffect, useState } from 'react';
import { getViewFromPath } from './routing';
import { saveSession, getSession, clearSession } from './lib/auth';
import DashboardPage from './DashboardPage';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const [session, setSession] = useState(() => getSession());
  const [view, setView] = useState(() => getViewFromPath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setView(getViewFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // لو مفيش جلسة دخول محفوظة، رجّع المستخدم لصفحة تسجيل الدخول حتى لو
  // كان الرابط بيشاور على /admin أو /hr مباشرة (حماية بسيطة من طرف الواجهة —
  // الحماية الحقيقية تحصل في الـ backend عبر requireAuth/requireRole)
  useEffect(() => {
    if (!session && view !== 'login') {
      window.history.replaceState({}, '', '/');
      setView('login');
    }
  }, [session, view]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل تسجيل الدخول.');
      }

      const newSession = { token: data.token, role: data.role, fullName: data.fullName };
      saveSession(newSession);
      setSession(newSession);
      setStatus('success');
      window.history.pushState({}, '', data.redirectTo);
      setView(getViewFromPath(data.redirectTo));
      setMessage(`${data.message} جاري تحويلك الآن...`);
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    window.history.pushState({}, '', '/');
    setView('login');
    setStatus('idle');
    setMessage('');
    setEmail('');
    setPassword('');
  }

  if (session && view === 'admin') {
    return <DashboardPage title="لوحة الإدارة" userName={session.fullName} onLogout={handleLogout} />;
  }

  if (session && view === 'hr') {
    return <DashboardPage title="لوحة الموارد البشرية" userName={session.fullName} onLogout={handleLogout} />;
  }

  return (
    <main dir="rtl" className="auth-page">
      <section className="auth-shell">
        <div className="auth-brand">
          <div className="brand-badge">WX</div>
          <p className="eyebrow">وينيتكس للنسيج والملابس</p>
          <h1>تسجيل الدخول إلى نظام المصنع</h1>
          <p className="brand-copy">
            سجّل الدخول بحساب موظفك، وسيتم تحويلك تلقائيًا للوحة المناسبة لصلاحيتك.
          </p>

          <div className="feature-list">
            <div>
              <strong>الإدارة</strong>
              <span>متابعة الإرساليات والتوزين والصباغة والفواتير.</span>
            </div>
            <div>
              <strong>الموارد البشرية</strong>
              <span>بيانات الموظفين والحضور والإجازات والرواتب.</span>
            </div>
          </div>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="card-header">
            <p className="card-kicker">تسجيل الدخول</p>
            <h2>ادخل بيانات حسابك</h2>
          </div>

          <label className="field">
            <span>البريد الإلكتروني</span>
            <input
              type="email"
              dir="ltr"
              placeholder="name@winitex-eg.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="field">
            <span>كلمة المرور</span>
            <input
              type="password"
              dir="ltr"
              placeholder="ادخل كلمة المرور"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <div className="auth-row">
            <label className="remember">
              <input type="checkbox" />
              <span>تذكرني</span>
            </label>
            <a href="/" onClick={(event) => event.preventDefault()}>
              نسيت كلمة المرور؟
            </a>
          </div>

          <button type="submit" className="submit-button">
            {status === 'loading' ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>

          {message ? (
            <p className={`status-message ${status}`} aria-live="polite">
              {message}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
