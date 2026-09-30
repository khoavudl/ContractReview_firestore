/**
 * Main Application Root
 * Mounts Global Providers (Theme, Toast, Auth) and Application Router
 */

import React from 'react';
import { AppProviders } from './providers';
import { AppRouter } from './routes';

export default function App(): React.ReactElement {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
