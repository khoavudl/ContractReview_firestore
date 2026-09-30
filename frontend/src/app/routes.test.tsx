import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from './providers';
import { AppRoutes } from './routes';
import type { AuthUser } from '@/shared';

const testUser: AuthUser = {
  uid: 'usr-100',
  email: 'test@foodempire.com',
  displayName: 'Nguyễn Văn Test',
  role: 'USER',
  isActive: true,
};

function renderWithRouter(initialEntry: string, user: AuthUser | null = testUser) {
  return render(
    <AppProviders initialUser={user}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>
  );
}

describe('Application Routes', () => {
  it('should render LoginView when accessing /login', () => {
    renderWithRouter('/login', null);
    expect(screen.getByText('Contract Review v2.0')).toBeInTheDocument();
    expect(
      screen.getByText(/Cổng rà soát hợp đồng tập trung/i)
    ).toBeInTheDocument();
  });

  it('should render UnauthorizedView when accessing /unauthorized', () => {
    renderWithRouter('/unauthorized', null);
    expect(screen.getByText('403 - Chưa Được Cấp Quyền')).toBeInTheDocument();
  });

  it('should redirect unauthenticated user from /dashboard to /login', () => {
    renderWithRouter('/dashboard', null);
    expect(
      screen.getByText(/Cổng rà soát hợp đồng tập trung/i)
    ).toBeInTheDocument();
  });

  it('should render DashboardView when authenticated user accesses /dashboard', () => {
    renderWithRouter('/dashboard', testUser);
    expect(
      screen.getByText('Bảng Điều Khiển Hợp Đồng')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Xin chào Nguyễn Văn Test/i)
    ).toBeInTheDocument();
  });

  it('should render ContractDetailView with contract id parameter', () => {
    renderWithRouter('/contracts/CTR-2026-001', testUser);
    expect(
      screen.getByText('Chi tiết Hợp đồng: CTR-2026-001')
    ).toBeInTheDocument();
  });

  it('should render NotFoundView when accessing an invalid route', () => {
    renderWithRouter('/some-invalid-path-that-does-not-exist', testUser);
    expect(screen.getByText('404 - Không Tìm Thấy Trang')).toBeInTheDocument();
  });
});
