import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

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
        throw new Error(data.message || t('auth.genericError'));
      }

      login({ token: data.token, role: data.role, fullName: data.fullName });
      setStatus('success');
      setMessage(`${data.message} ${t('auth.redirectingSuffix')}`);
      navigate(data.redirectTo || '/dashboard');
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-brand">
        <div className="brand-badge">WX</div>
        <p className="eyebrow">{t('auth.eyebrow')}</p>
        <h1>{t('auth.title')}</h1>
        <p className="brand-copy">{t('auth.subtitle')}</p>

        <div className="feature-list">
          <div>
            <strong>{t('auth.featureAdminTitle')}</strong>
            <span>{t('auth.featureAdminDescription')}</span>
          </div>
          <div>
            <strong>{t('auth.featureHrTitle')}</strong>
            <span>{t('auth.featureHrDescription')}</span>
          </div>
        </div>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="card-header">
          <p className="card-kicker">{t('auth.loginKicker')}</p>
          <h2>{t('auth.loginTitle')}</h2>
        </div>

        <label className="field">
          <span>{t('auth.emailLabel')}</span>
          <input
            type="email"
            dir="ltr"
            placeholder={t('auth.emailPlaceholder')}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="field">
          <span>{t('auth.passwordLabel')}</span>
          <input
            type="password"
            dir="ltr"
            placeholder={t('auth.passwordPlaceholder')}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <div className="auth-row">
          <label className="remember">
            <input type="checkbox" />
            <span>{t('auth.rememberMe')}</span>
          </label>
          <a href="/" onClick={(event) => event.preventDefault()}>
            {t('auth.forgotPassword')}
          </a>
        </div>

        <button type="submit" className="submit-button">
          {status === 'loading' ? t('auth.submitLoading') : t('auth.submitIdle')}
        </button>

        {message ? (
          <p className={`status-message ${status}`} aria-live="polite">
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
