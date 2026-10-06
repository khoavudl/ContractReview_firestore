import { describe, it, expect, vi } from 'vitest';
import {
  isExpiredApprovedContract,
  buildAutoArchiveActivity,
  autoArchiveExpiredContracts,
  MS_PER_DAY,
} from './autoArchiveService.js';

describe('autoArchiveService', () => {
  describe('isExpiredApprovedContract', () => {
    const now = new Date('2026-10-01T00:00:00Z');

    it('returns false when updatedAt is undefined', () => {
      expect(isExpiredApprovedContract(undefined, now, 45)).toBe(false);
    });

    it('returns false when contract was updated 44 days ago', () => {
      const updatedAt = new Date(now.getTime() - 44 * MS_PER_DAY);
      expect(isExpiredApprovedContract(updatedAt, now, 45)).toBe(false);
    });

    it('returns true when contract was updated exactly 45 days ago', () => {
      const updatedAt = new Date(now.getTime() - 45 * MS_PER_DAY);
      expect(isExpiredApprovedContract(updatedAt, now, 45)).toBe(true);
    });

    it('returns true when contract was updated 60 days ago', () => {
      const updatedAt = new Date(now.getTime() - 60 * MS_PER_DAY);
      expect(isExpiredApprovedContract(updatedAt, now, 45)).toBe(true);
    });

    it('correctly handles Timestamp object with toDate method', () => {
      const mockTimestamp = {
        toDate: () => new Date(now.getTime() - 46 * MS_PER_DAY),
      } as unknown as FirebaseFirestore.Timestamp;
      expect(isExpiredApprovedContract(mockTimestamp, now, 45)).toBe(true);
    });
  });

  describe('buildAutoArchiveActivity', () => {
    it('creates standardized system audit activity log', () => {
      const activity = buildAutoArchiveActivity('act-auto-01');
      expect(activity.activityId).toBe('act-auto-01');
      expect(activity.action).toBe('STATUS_CHANGE');
      expect(activity.performedBy.role).toBe('SYSTEM');
      expect(activity.performedBy.uid).toBe('system');
      expect(activity.details).toContain('45 ngày');
      expect(activity.timestamp).toBeDefined();
    });
  });

  describe('autoArchiveExpiredContracts', () => {
    const now = new Date('2026-10-01T00:00:00Z');

    it('returns 0 archived when no contracts are expired', async () => {
      const mockBatch = {
        update: vi.fn(),
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue([]),
      };

      const mockDb = {
        collection: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({
            size: 2,
            docs: [
              {
                id: 'CTR-001',
                ref: { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue({ id: 'act-1' }) }) },
                data: () => ({
                  updatedAt: new Date(now.getTime() - 10 * MS_PER_DAY),
                }),
              },
              {
                id: 'CTR-002',
                ref: { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue({ id: 'act-2' }) }) },
                data: () => ({
                  updatedAt: new Date(now.getTime() - 30 * MS_PER_DAY),
                }),
              },
            ],
          }),
        }),
        batch: vi.fn().mockReturnValue(mockBatch),
      } as unknown as FirebaseFirestore.Firestore;

      const result = await autoArchiveExpiredContracts(mockDb, now, 45);
      expect(result.scannedCount).toBe(2);
      expect(result.archivedCount).toBe(0);
      expect(result.archivedIds).toEqual([]);
      expect(mockBatch.commit).not.toHaveBeenCalled();
    });

    it('atomically archives contracts that exceed 45 days', async () => {
      const mockBatch = {
        update: vi.fn(),
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue([]),
      };

      const mockDocRef = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({ id: 'act-expired-1' }),
        }),
      };

      const mockDb = {
        collection: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({
            size: 2,
            docs: [
              {
                id: 'CTR-RECENT',
                ref: mockDocRef,
                data: () => ({
                  updatedAt: new Date(now.getTime() - 10 * MS_PER_DAY),
                }),
              },
              {
                id: 'CTR-EXPIRED',
                ref: mockDocRef,
                data: () => ({
                  updatedAt: new Date(now.getTime() - 50 * MS_PER_DAY),
                }),
              },
            ],
          }),
        }),
        batch: vi.fn().mockReturnValue(mockBatch),
      } as unknown as FirebaseFirestore.Firestore;

      const result = await autoArchiveExpiredContracts(mockDb, now, 45);
      expect(result.scannedCount).toBe(2);
      expect(result.archivedCount).toBe(1);
      expect(result.archivedIds).toEqual(['CTR-EXPIRED']);

      expect(mockBatch.update).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          status: 'COMPLETED',
          isArchived: true,
        })
      );
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });
  });
});
