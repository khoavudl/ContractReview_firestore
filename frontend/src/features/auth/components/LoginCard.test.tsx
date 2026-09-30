/**
 * Unit Tests for LoginCard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginCard } from './LoginCard';
import * as useAuthModule from '../hooks/useAuth';

vi.mock('../hooks/useAuth');

describe('LoginCard', () => {
  const mockSignIn = vi.fn();
  const mockClearError = vi.fn();
  const mockClearBlockedUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      currentUser: null,
      isLoading: false,
      isLoggingIn: false,
      isAuthenticated: false,
      error: null,
      blockedUser: null,
      login: vi.fn(),
      logout: vi.fn(),
      signIn: mockSignIn,
      clearError: mockClearError,
      clearBlockedUser: mockClearBlockedUser,
      permissions: {
        user: null,
        uid: null,
        email: '',
        displayName: '',
        role: null,
        department: undefined,
        isAuthenticated: false,
        isActive: false,
        isStaff: false,
        isLegal: false,
        isHOL: false,
        isUser: false,
      },
    });
  });

  it('renders login card with Microsoft and Google buttons', () => {
    render(<LoginCard />);

    expect(screen.getByText('Contract Review v2.0')).toBeInTheDocument();
    expect(screen.getByText('Đăng nhập với Microsoft 365')).toBeInTheDocument();
    expect(screen.getByText('Đăng nhập với Google')).toBeInTheDocument();
  });

  it('triggers signIn with microsoft on button click', async () => {
    mockSignIn.mockResolvedValueOnce(true);
    const onSuccess = vi.fn();

    render(<LoginCard onSuccess={onSuccess} />);

    const msButton = screen.getByText('Đăng nhập với Microsoft 365');
    fireEvent.click(msButton);

    expect(mockSignIn).toHaveBeenCalledWith('microsoft');
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('triggers signIn with google on button click', async () => {
    mockSignIn.mockResolvedValueOnce(true);

    render(<LoginCard />);

    const googleButton = screen.getByText('Đăng nhập với Google');
    fireEvent.click(googleButton);

    expect(mockSignIn).toHaveBeenCalledWith('google');
  });

  it('renders error message and dismisses when clicked', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      currentUser: null,
      isLoading: false,
      isLoggingIn: false,
      isAuthenticated: false,
      error: {
        type: 'POPUP_CLOSED',
        message: 'Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất.',
      },
      blockedUser: null,
      login: vi.fn(),
      logout: vi.fn(),
      signIn: mockSignIn,
      clearError: mockClearError,
      clearBlockedUser: mockClearBlockedUser,
      permissions: {} as never,
    });

    render(<LoginCard />);

    expect(
      screen.getByText('Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất.')
    ).toBeInTheDocument();

    const closeBtn = screen.getByLabelText('Đóng thông báo lỗi');
    fireEvent.click(closeBtn);
    expect(mockClearError).toHaveBeenCalledTimes(1);
  });
});
