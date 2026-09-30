import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../providers';
import { RoleGuard } from './RoleGuard';
import type { AuthUser } from '@/shared';

const normalUser: AuthUser = {
  uid: 'user-1',
  email: 'user@test.com',
  displayName: 'User',
  role: 'USER',
  isActive: true,
};

const legalUser: AuthUser = {
  uid: 'legal-1',
  email: 'legal@test.com',
  displayName: 'Legal Staff',
  role: 'LEGAL',
  isActive: true,
};

const holUser: AuthUser = {
  uid: 'hol-1',
  email: 'hol@test.com',
  displayName: 'Head of Legal',
  role: 'HOL',
  isActive: true,
};

describe('RoleGuard', () => {
  it('should allow access when user role is included in allowedRoles', () => {
    render(
      <AuthProvider initialUser={legalUser}>
        <MemoryRouter initialEntries={['/legal-only']}>
          <Routes>
            <Route
              path="/legal-only"
              element={
                <RoleGuard allowedRoles={['LEGAL', 'HOL']}>
                  <div>Khu vực Pháp chế</div>
                </RoleGuard>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Khu vực Pháp chế')).toBeInTheDocument();
  });

  it('should allow HOL access when HOL is included in allowedRoles', () => {
    render(
      <AuthProvider initialUser={holUser}>
        <MemoryRouter initialEntries={['/legal-only']}>
          <Routes>
            <Route
              path="/legal-only"
              element={
                <RoleGuard allowedRoles={['LEGAL', 'HOL']}>
                  <div>Khu vực Pháp chế</div>
                </RoleGuard>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Khu vực Pháp chế')).toBeInTheDocument();
  });

  it('should redirect to /unauthorized when user role is not allowed', () => {
    render(
      <AuthProvider initialUser={normalUser}>
        <MemoryRouter initialEntries={['/legal-only']}>
          <Routes>
            <Route
              path="/legal-only"
              element={
                <RoleGuard allowedRoles={['LEGAL', 'HOL']}>
                  <div>Khu vực Pháp chế</div>
                </RoleGuard>
              }
            />
            <Route
              path="/unauthorized"
              element={<div>Trang 403 Bị Từ Chối</div>}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Trang 403 Bị Từ Chối')).toBeInTheDocument();
    expect(screen.queryByText('Khu vực Pháp chế')).not.toBeInTheDocument();
  });

  it('should redirect to /unauthorized when currentUser is null', () => {
    render(
      <AuthProvider initialUser={null}>
        <MemoryRouter initialEntries={['/legal-only']}>
          <Routes>
            <Route
              path="/legal-only"
              element={
                <RoleGuard allowedRoles={['LEGAL', 'HOL']}>
                  <div>Khu vực Pháp chế</div>
                </RoleGuard>
              }
            />
            <Route
              path="/unauthorized"
              element={<div>Trang 403 Bị Từ Chối</div>}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Trang 403 Bị Từ Chối')).toBeInTheDocument();
    expect(screen.queryByText('Khu vực Pháp chế')).not.toBeInTheDocument();
  });
});
