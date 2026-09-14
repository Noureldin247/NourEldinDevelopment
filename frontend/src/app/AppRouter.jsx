import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import RequireAuth from '../routes/RequireAuth';
import RequireRole from '../routes/RequireRole';
import NotFoundPage from '../pages/NotFoundPage';
import ForbiddenPage from '../pages/ForbiddenPage';
import { navConfig } from '../routes/navConfig';

function RootRedirect() {
  const { session } = useAuth();
  return session ? <Navigate to="/dashboard" replace /> : <LoginPage />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<RootRedirect />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            {navConfig.map((module) => (
              <Route
                key={module.key}
                path={module.path}
                element={
                  <RequireRole allowedRoles={module.allowedRoles}>
                    <module.Component />
                  </RequireRole>
                }
              />
            ))}
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
