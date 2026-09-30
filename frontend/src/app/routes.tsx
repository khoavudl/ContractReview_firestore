/**
 * Application Routes Configuration
 * Enterprise Route Tree with Guards and Nested Shell Layout
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './guards/AuthGuard';
import { AppLayout } from './components/AppLayout';
import {
  LoginView,
  DashboardView,
  ContractDetailView,
  UnauthorizedView,
  NotFoundView,
} from './components/PlaceholderPages';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CONTRACT_DETAIL: '/contracts/:id',
  UNAUTHORIZED: '/unauthorized',
} as const;

export function AppRoutes(): React.ReactElement {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginView />} />
      <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedView />} />
      <Route
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >
        <Route
          path={ROUTES.HOME}
          element={<Navigate to={ROUTES.DASHBOARD} replace />}
        />
        <Route path={ROUTES.DASHBOARD} element={<DashboardView />} />
        <Route path={ROUTES.CONTRACT_DETAIL} element={<ContractDetailView />} />
        <Route path="*" element={<NotFoundView />} />
      </Route>
    </Routes>
  );
}

export function AppRouter(): React.ReactElement {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
