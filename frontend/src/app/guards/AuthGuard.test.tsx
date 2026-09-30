import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../providers';
import { AuthGuard } from './AuthGuard';
import type { AuthUser } from '@/shared';

const activeUser: AuthUser = {
  uid: 'user-1',
  email: 'user@test.com',
  displayName: 'Active User',
  role: 'USER',
  isActive: true,
};

const inactiveUser: AuthUser = {
  uid: 'user-2',
  email: 'inactive@test.com',
  displayName: 'Inactive User',
  role: 'USER',
  isActive: false,
};

describe('AuthGuard', () => {
  it('should render loading spinner when auth is loading', () => {
    render(
      <AuthProvider initialLoading={true}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <AuthGuard>
                  <div>Nội dung được bảo vệ</div>
                </AuthGuard>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    expect(
      screen.queryByText('Nội dung được bảo vệ')
    ).not.toBeInTheDocument();
  });

  it('should redirect to /login when user is not authenticated', () => {
    render(
      <AuthProvider initialUser={null} initialLoading={false}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <AuthGuard>
                  <div>Nội dung được bảo vệ</div>
                </AuthGuard>
              }
            />
            <Route path="/login" element={<div>Trang Đăng Nhập</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Trang Đăng Nhập')).toBeInTheDocument();
    expect(
      screen.queryByText('Nội dung được bảo vệ')
    ).not.toBeInTheDocument();
  });

  it('should redirect to /unauthorized when user is not active in whitelist', () => {
    render(
      <AuthProvider initialUser={inactiveUser} initialLoading={false}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <AuthGuard>
                  <div>Nội dung được bảo vệ</div>
                </AuthGuard>
              }
            />
            <Route
              path="/unauthorized"
              element={<div>Trang 403 Không Được Cấp Quyền</div>}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(
      screen.getByText('Trang 403 Không Được Cấp Quyền')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Nội dung được bảo vệ')
    ).not.toBeInTheDocument();
  });

  it('should render protected content when user is authenticated and active', () => {
    render(
      <AuthProvider initialUser={activeUser} initialLoading={false}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <AuthGuard>
                  <div>Nội dung được bảo vệ thành công</div>
                </AuthGuard>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(
      screen.getByText('Nội dung được bảo vệ thành công')
    ).toBeInTheDocument();
  });
});
