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
    <AppProviders initialUser={user} skipAuthListener={true}>
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
      screen.getByPlaceholderText(/Tìm theo mã hợp đồng, tiêu đề, đối tác/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Tạo Hồ Sơ Mới/i })
    ).toBeInTheDocument();
  });

  it('should render ContractDetailView with contract id parameter', async () => {
    renderWithRouter('/contracts/CTR-2609-0001', testUser);
    expect(
      await screen.findByText(/Hợp đồng mua bao bì màng nhôm/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Task list')).toBeInTheDocument();
    expect(screen.queryByText(/Người tạo:/i)).not.toBeInTheDocument();

    const aiTabBtn = screen.getByRole('button', { name: /Trợ lý AI/i });
    expect(aiTabBtn).toBeDisabled();
    expect(aiTabBtn).toHaveTextContent('Trợ lý AI (Tạm tắt)');
  });

  it('should render NotFoundView when accessing an invalid route', () => {
    renderWithRouter('/some-invalid-path-that-does-not-exist', testUser);
    expect(screen.getByText('404 - Không Tìm Thấy Trang')).toBeInTheDocument();
  });
});
