import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveHolReminderReferenceDate,
  buildHolReminderActivity,
  buildHolReminderNotification,
  scanAndSendHolReminders,
} from './holReminderService.js';
import type { EmailDispatcher } from '../email/index.js';

describe('holReminderService', () => {
  describe('resolveHolReminderReferenceDate', () => {
    it('returns holReminderSentAt when present', () => {
      const updatedAt = new Date('2026-10-10T10:00:00Z');
      const reminderSentAt = new Date('2026-10-12T10:00:00Z');
      const result = resolveHolReminderReferenceDate({
        holReminderSentAt: reminderSentAt as any,
        updatedAt: updatedAt as any,
      });
      expect(result).toBe(reminderSentAt);
    });

    it('falls back to updatedAt when holReminderSentAt is undefined', () => {
      const updatedAt = new Date('2026-10-10T10:00:00Z');
      const result = resolveHolReminderReferenceDate({
        updatedAt: updatedAt as any,
      });
      expect(result).toBe(updatedAt);
    });

    it('returns undefined when neither is provided', () => {
      const result = resolveHolReminderReferenceDate({});
      expect(result).toBeUndefined();
    });
  });

  describe('buildHolReminderActivity', () => {
    it('builds an audit activity record with correct count and details', () => {
      const act = buildHolReminderActivity('act-123', 1);
      expect(act.activityId).toBe('act-123');
      expect(act.action).toBe('HOL_REMINDER_SENT');
      expect(act.performedBy.role).toBe('SYSTEM');
      expect(act.details).toContain('lần 1');
      expect(act.details).toContain('2 ngày làm việc');
    });
  });

  describe('buildHolReminderNotification', () => {
    it('builds an in-app notification item with contract info and reminder count', () => {
      const notif = buildHolReminderNotification(
        'notif-1',
        { contractId: 'CTR-2609-0001', title: 'Hợp đồng mua bán thiết bị' },
        2
      );
      expect(notif.notifId).toBe('notif-1');
      expect(notif.contractId).toBe('CTR-2609-0001');
      expect(notif.title).toContain('Nhắc duyệt');
      expect(notif.message).toContain('CTR-2609-0001');
      expect(notif.message).toContain('lần 2');
      expect(notif.isRead).toBe(false);
    });
  });

  describe('scanAndSendHolReminders', () => {
    let mockDb: any;
    let mockDispatcher: EmailDispatcher;
    let mockContractDocRef: any;
    let mockActivityDocRef: any;
    let mockNotifDocRef: any;
    let mockBatch: any;

    beforeEach(() => {
      mockActivityDocRef = {
        id: 'act-auto-1',
        set: vi.fn(async () => undefined),
      };

      mockContractDocRef = {
        id: 'CTR-2609-0001',
        update: vi.fn(async () => undefined),
        collection: vi.fn((name: string) => {
          if (name === 'activities') {
            return {
              doc: vi.fn(() => mockActivityDocRef),
            };
          }
          return {};
        }),
      };

      mockNotifDocRef = {
        id: 'notif-hol-1',
      };

      mockBatch = {
        set: vi.fn(),
        commit: vi.fn(async () => undefined),
      };

      mockDispatcher = {
        send: vi.fn(async () => ({ success: true, messageId: 'msg-reminder-1' })),
      };
    });

    it('returns empty result when no contracts are in PENDING_HOL', async () => {
      mockDb = {
        collection: vi.fn((_colName: string) => ({
          where: vi.fn(() => ({
            where: vi.fn(() => ({
              get: vi.fn(async () => ({ size: 0, docs: [] })),
            })),
          })),
        })),
      };

      const result = await scanAndSendHolReminders(mockDb, mockDispatcher);
      expect(result.scannedCount).toBe(0);
      expect(result.remindedCount).toBe(0);
      expect(result.remindedIds).toEqual([]);
      expect(mockDispatcher.send).not.toHaveBeenCalled();
    });

    it('skips contracts that have not yet reached 2 business days', async () => {
      // Contract submitted 1 day ago (Monday 10:00 to Tuesday 10:00)
      const start = new Date('2026-10-12T10:00:00+07:00');
      const now = new Date('2026-10-13T10:00:00+07:00');

      const mockDoc = {
        id: 'CTR-2609-0001',
        ref: mockContractDocRef,
        data: () => ({
          contractId: 'CTR-2609-0001',
          title: 'Hợp đồng mua bán',
          supplier: 'Đối tác A',
          status: 'PENDING_HOL',
          isArchived: false,
          updatedAt: start,
          createdBy: { uid: 'user-1', email: 'user@foodempire.vn', displayName: 'User 1' },
        }),
      };

      mockDb = {
        collection: vi.fn((_colName: string) => ({
          where: vi.fn(() => ({
            where: vi.fn(() => ({
              get: vi.fn(async () => ({ size: 1, docs: [mockDoc] })),
            })),
          })),
        })),
      };

      const result = await scanAndSendHolReminders(mockDb, mockDispatcher, now);
      expect(result.scannedCount).toBe(1);
      expect(result.remindedCount).toBe(0);
      expect(result.remindedIds).toEqual([]);
      expect(mockDispatcher.send).not.toHaveBeenCalled();
    });

    it('dispatches reminder, updates contract, logs activity, and pushes notification when contract is overdue', async () => {
      // Submitted Monday 10:00, checking Wednesday 10:00 (48 business hours elapsed)
      const start = new Date('2026-10-12T10:00:00+07:00');
      const now = new Date('2026-10-14T10:00:00+07:00');

      const mockDoc = {
        id: 'CTR-2609-0001',
        ref: mockContractDocRef,
        data: () => ({
          contractId: 'CTR-2609-0001',
          title: 'Hợp đồng mua bán thiết bị',
          supplier: 'Đối tác A',
          status: 'PENDING_HOL',
          isArchived: false,
          updatedAt: start,
          createdBy: { uid: 'user-1', email: 'user@foodempire.vn', displayName: 'User 1' },
        }),
      };

      mockDb = {
        batch: vi.fn(() => mockBatch),
        collection: vi.fn((colName: string) => {
          if (colName === 'contracts') {
            return {
              where: vi.fn(() => ({
                where: vi.fn(() => ({
                  get: vi.fn(async () => ({ size: 1, docs: [mockDoc] })),
                })),
              })),
              doc: vi.fn(() => mockContractDocRef),
            };
          }
          if (colName === 'users') {
            return {
              where: vi.fn(() => ({
                where: vi.fn(() => ({
                  get: vi.fn(async () => ({
                    empty: false,
                    docs: [
                      {
                        data: () => ({ uid: 'hol-1', email: 'hol@foodempire.vn', role: 'HOL', isActive: true }),
                      },
                    ],
                  })),
                })),
              })),
            };
          }
          if (colName === 'notifications') {
            return {
              doc: vi.fn(() => ({
                collection: vi.fn(() => ({
                  doc: vi.fn(() => mockNotifDocRef),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const result = await scanAndSendHolReminders(mockDb, mockDispatcher, now);

      expect(result.scannedCount).toBe(1);
      expect(result.remindedCount).toBe(1);
      expect(result.remindedIds).toEqual(['CTR-2609-0001']);

      // Check email sent
      expect(mockDispatcher.send).toHaveBeenCalledTimes(1);
      expect(mockDispatcher.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['hol@foodempire.vn'],
          cc: ['user@foodempire.vn'],
          subject: expect.stringContaining('NHẮC DUYỆT'),
        })
      );

      // Check contract updated with reminder count = 1
      expect(mockContractDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          holReminderCount: 1,
        })
      );

      // Check activity logged
      expect(mockActivityDocRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'HOL_REMINDER_SENT',
          details: expect.stringContaining('lần 1'),
        })
      );

      // Check in-app notification batch committed
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('increments holReminderCount on subsequent reminder scans', async () => {
      // Contract was reminded once on Wednesday 10:00, checking Friday 10:00 (48 business hours later)
      const lastReminder = new Date('2026-10-14T10:00:00+07:00');
      const now = new Date('2026-10-16T10:00:00+07:00');

      const mockDoc = {
        id: 'CTR-2609-0001',
        ref: mockContractDocRef,
        data: () => ({
          contractId: 'CTR-2609-0001',
          title: 'Hợp đồng mua bán thiết bị',
          supplier: 'Đối tác A',
          status: 'PENDING_HOL',
          isArchived: false,
          updatedAt: new Date('2026-10-12T10:00:00+07:00'),
          holReminderSentAt: lastReminder,
          holReminderCount: 1,
          createdBy: { uid: 'user-1', email: 'user@foodempire.vn', displayName: 'User 1' },
        }),
      };

      mockDb = {
        batch: vi.fn(() => mockBatch),
        collection: vi.fn((colName: string) => {
          if (colName === 'contracts') {
            return {
              where: vi.fn(() => ({
                where: vi.fn(() => ({
                  get: vi.fn(async () => ({ size: 1, docs: [mockDoc] })),
                })),
              })),
              doc: vi.fn(() => mockContractDocRef),
            };
          }
          if (colName === 'users') {
            return {
              where: vi.fn(() => ({
                where: vi.fn(() => ({
                  get: vi.fn(async () => ({
                    empty: false,
                    docs: [
                      {
                        data: () => ({ uid: 'hol-1', email: 'hol@foodempire.vn', role: 'HOL', isActive: true }),
                      },
                    ],
                  })),
                })),
              })),
            };
          }
          if (colName === 'notifications') {
            return {
              doc: vi.fn(() => ({
                collection: vi.fn(() => ({
                  doc: vi.fn(() => mockNotifDocRef),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const result = await scanAndSendHolReminders(mockDb, mockDispatcher, now);

      expect(result.remindedCount).toBe(1);
      expect(mockContractDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          holReminderCount: 2,
        })
      );
    });

    it('does not update contract or log activity if email dispatch fails', async () => {
      const start = new Date('2026-10-12T10:00:00+07:00');
      const now = new Date('2026-10-14T10:00:00+07:00');

      const mockDoc = {
        id: 'CTR-2609-0001',
        ref: mockContractDocRef,
        data: () => ({
          contractId: 'CTR-2609-0001',
          title: 'Hợp đồng mua bán',
          supplier: 'Đối tác A',
          status: 'PENDING_HOL',
          isArchived: false,
          updatedAt: start,
          createdBy: { uid: 'user-1', email: 'user@foodempire.vn', displayName: 'User 1' },
        }),
      };

      mockDispatcher = {
        send: vi.fn(async () => ({ success: false, error: 'SMTP connection failed' })),
      };

      mockDb = {
        batch: vi.fn(() => mockBatch),
        collection: vi.fn((colName: string) => {
          if (colName === 'contracts') {
            return {
              where: vi.fn(() => ({
                where: vi.fn(() => ({
                  get: vi.fn(async () => ({ size: 1, docs: [mockDoc] })),
                })),
              })),
              doc: vi.fn(() => mockContractDocRef),
            };
          }
          if (colName === 'users') {
            return {
              where: vi.fn(() => ({
                where: vi.fn(() => ({
                  get: vi.fn(async () => ({
                    empty: false,
                    docs: [{ data: () => ({ uid: 'hol-1', email: 'hol@foodempire.vn', role: 'HOL', isActive: true }) }],
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      };

      const result = await scanAndSendHolReminders(mockDb, mockDispatcher, now);

      expect(result.remindedCount).toBe(0);
      expect(mockContractDocRef.update).not.toHaveBeenCalled();
      expect(mockActivityDocRef.set).not.toHaveBeenCalled();
    });
  });
});
