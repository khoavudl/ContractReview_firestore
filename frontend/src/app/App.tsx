/**
 * Main Application Root
 * Mounts Global Providers and Application Router
 */

import React from 'react';
import { AuthProvider } from './providers';
import { AppRouter } from './routes';

export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
