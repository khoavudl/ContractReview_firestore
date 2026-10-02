import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { FEATURE_FLAGS } from '@/shared';
import { useNotifications } from './useNotifications';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';

vi.mock('../services/notificationService', () => ({
  subscribeToNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

describe('useNotifications hook', () => {
  const sampleNotifs = [
    {
      notifId: 'n1',
      contractId: 'CTR-01',
      title: 'T1',
      message: 'M1',
      type: 'STATUS_CHANGE' as const,
      isRead: false,
      createdAt: new Date(),
    },
    {
      notifId: 'n2',
      contractId: 'CTR-02',
      title: 'T2',
      message: 'M2',
      type: 'NEW_COMMENT' as const,
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

  afterAll(() => {
    FEATURE_FLAGS.ENABLE_NOTIFICATIONS = false;
  });

  it('subscribes and computes unreadCount correctly', async () => {
    const { result } = renderHook(() =>
      useNotifications({
        userId: 'user-01',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications.length).toBe(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it('filters notifications by unread status', async () => {
    const { result } = renderHook(() =>
      useNotifications({
        userId: 'user-01',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filteredNotifications.length).toBe(2);

    act(() => {
      result.current.setFilter('UNREAD');
    });

    expect(result.current.filteredNotifications.length).toBe(1);
    expect(result.current.filteredNotifications[0].notifId).toBe('n1');
  });

  it('calls markNotificationAsRead when markAsRead is called', async () => {
    const { result } = renderHook(() =>
      useNotifications({
        userId: 'user-01',
      })
    );

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(markNotificationAsRead).toHaveBeenCalledWith('user-01', 'n1');
  });

  it('calls markAllNotificationsAsRead when markAllAsRead is called', async () => {
    const { result } = renderHook(() =>
      useNotifications({
        userId: 'user-01',
      })
    );

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(markAllNotificationsAsRead).toHaveBeenCalledWith('user-01');
  });

  it('returns empty notifications and does not subscribe when ENABLE_NOTIFICATIONS is false', async () => {
    FEATURE_FLAGS.ENABLE_NOTIFICATIONS = false;
    const { result } = renderHook(() =>
      useNotifications({
        userId: 'user-01',
      })
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.notifications).toEqual([]);
    expect(subscribeToNotifications).not.toHaveBeenCalled();
  });
});
