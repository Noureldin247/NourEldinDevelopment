import React from 'react';
import { AuthProvider } from './lib/AuthContext';
import { useSyncDocumentDirection } from './hooks/useSyncDocumentDirection';
import AppRouter from './app/AppRouter';

function DirectionSync() {
  useSyncDocumentDirection();
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <DirectionSync />
      <AppRouter />
    </AuthProvider>
  );
}
