import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  resetMockNotificationsForTesting,
  DEV_SAMPLE_NOTIFICATIONS,
} from './notificationService';

vi.mock('@/shared', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/shared');
  return {
    ...actual,
    isMockDevEnvironment: vi.fn(() => false),
    getFirebaseDb: vi.fn(),
    toValidDate: vi.fn((val) => (val instanceof Date ? val : new Date(val))),
  };
});

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
}));

import { isMockDevEnvironment, FEATURE_FLAGS } from '@/shared';
import { updateDoc, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockNotificationsForTesting();
    FEATURE_FLAGS.ENABLE_NOTIFICATIONS = true;
  });

  afterAll(() => {
    FEATURE_FLAGS.ENABLE_NOTIFICATIONS = false;
  });

  describe('subscribeToNotifications', () => {
    it('should return mock notifications in mock dev environment', () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(true);

      const onUpdate = vi.fn();
      const unsub = subscribeToNotifications('u123', onUpdate);

      expect(onUpdate).toHaveBeenCalledWith(DEV_SAMPLE_NOTIFICATIONS.default);
      unsub();
    });

    it('should attach onSnapshot listener in production environment', () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);

      const mockUnsub = vi.fn();
      vi.mocked(onSnapshot).mockReturnValueOnce(mockUnsub as any);

      const onUpdate = vi.fn();
      const unsub = subscribeToNotifications('u123', onUpdate);

      expect(onSnapshot).toHaveBeenCalled();
      unsub();
      expect(mockUnsub).toHaveBeenCalled();
    });

    it('should immediately return empty list and no-op cleanup when ENABLE_NOTIFICATIONS is false', () => {
      FEATURE_FLAGS.ENABLE_NOTIFICATIONS = false;
      const onUpdate = vi.fn();
      const unsub = subscribeToNotifications('u123', onUpdate);
      expect(onUpdate).toHaveBeenCalledWith([]);
      expect(onSnapshot).not.toHaveBeenCalled();
      unsub();
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark item as read in mock mode', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(true);

      const onUpdate = vi.fn();
      const unsub = subscribeToNotifications('user-test', onUpdate);
      onUpdate.mockClear();

      await markNotificationAsRead('user-test', 'notif-001');

      expect(onUpdate).toHaveBeenCalled();
      const latestList = onUpdate.mock.calls[0][0];
      const target = latestList.find((n: any) => n.notifId === 'notif-001');
      expect(target.isRead).toBe(true);

      unsub();
    });

    it('should call updateDoc with isRead: true in production mode', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);
      vi.mocked(updateDoc).mockResolvedValueOnce(undefined);

      await markNotificationAsRead('u123', 'notif-1');

      expect(updateDoc).toHaveBeenCalledWith(undefined, { isRead: true });
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all items as read in mock mode', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(true);

      const onUpdate = vi.fn();
      const unsub = subscribeToNotifications('user-all', onUpdate);
      onUpdate.mockClear();

      await markAllNotificationsAsRead('user-all');

      expect(onUpdate).toHaveBeenCalled();
      const latestList = onUpdate.mock.calls[0][0];
      expect(latestList.every((n: any) => n.isRead === true)).toBe(true);

      unsub();
    });

    it('should use writeBatch in production mode', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);

      const mockDocs = [{ ref: 'ref1' }, { ref: 'ref2' }];
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: mockDocs,
      } as any);

      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValueOnce(mockBatch as any);

      await markAllNotificationsAsRead('u123');

      expect(mockBatch.update).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });
});
