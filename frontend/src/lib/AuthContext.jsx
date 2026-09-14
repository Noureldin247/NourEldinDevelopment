import React, { createContext, useContext, useMemo, useState } from 'react';
import { getSession, saveSession, clearSession } from './auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  const value = useMemo(
    () => ({
      session,
      login(newSession) {
        saveSession(newSession);
        setSession(newSession);
      },
      logout() {
        clearSession();
        setSession(null);
      },
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
