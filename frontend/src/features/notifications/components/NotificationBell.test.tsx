import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { FEATURE_FLAGS } from '@/shared';
import { NotificationBell } from './NotificationBell';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../services/notificationService', () => ({
  subscribeToNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

describe('NotificationBell Component', () => {
  const sampleNotifs = [
    {
      notifId: 'n-1',
      contractId: 'CTR-2609-0001',
      title: 'Có ý kiến mới từ Pháp chế',
      message: 'Nội dung chi tiết góp ý',
      type: 'NEW_COMMENT' as const,
      isRead: false,
      createdAt: new Date(),
    },
    {
      notifId: 'n-2',
      contractId: 'CTR-2609-0002',
      title: 'Đổi trạng thái hồ sơ',
      message: 'Hồ sơ đã được duyệt',
      type: 'STATUS_CHANGE' as const,
      isRead: true,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    FEATURE_FLAGS.ENABLE_NOTIFICATIONS = true;
    vi.mocked(subscribeToNotifications).mockImplementation((_uid, onUpdate) => {
      onUpdate(sampleNotifs as any);
      return () => {};
    });
  });

  it('renders bell button and badge with unread count', async () => {
    render(
      <BrowserRouter>
        <NotificationBell userId="user-01" />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('toggles dropdown and shows notifications on bell click', async () => {
    render(
      <BrowserRouter>
        <NotificationBell userId="user-01" />
      </BrowserRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /Thông báo/ });
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByText('Thông báo (2)')).toBeInTheDocument();
      expect(screen.getByText('Có ý kiến mới từ Pháp chế')).toBeInTheDocument();
    });
  });

  it('clicking notification marks as read and navigates to contract', async () => {
    render(
      <BrowserRouter>
        <NotificationBell userId="user-01" />
      </BrowserRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /Thông báo/ });
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByText('Có ý kiến mới từ Pháp chế')).toBeInTheDocument();
    });

    const notifItem = screen.getByText('Có ý kiến mới từ Pháp chế');
    fireEvent.click(notifItem);

    await waitFor(() => {
      expect(markNotificationAsRead).toHaveBeenCalledWith('user-01', 'n-1');
      expect(mockNavigate).toHaveBeenCalledWith('/contracts/CTR-2609-0001');
    });
  });

  it('clicking "Đọc tất cả" marks all notifications as read', async () => {
    render(
      <BrowserRouter>
        <NotificationBell userId="user-01" />
      </BrowserRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /Thông báo/ });
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByText('Đọc tất cả')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Đọc tất cả'));

    await waitFor(() => {
      expect(markAllNotificationsAsRead).toHaveBeenCalledWith('user-01');
    });
  });

  it('renders null when ENABLE_NOTIFICATIONS is false', async () => {
    FEATURE_FLAGS.ENABLE_NOTIFICATIONS = false;
    const { container } = render(
      <BrowserRouter>
        <NotificationBell userId="user-01" />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  afterAll(() => {
    FEATURE_FLAGS.ENABLE_NOTIFICATIONS = false;
  });
});
