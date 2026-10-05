import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveRecipients,
  dispatchContractEmail,
} from './emailDispatcherService.js';
import type { EmailDispatcher } from './emailTypes.js';

describe('emailDispatcherService', () => {
  let mockDb: any;
  let mockDispatcher: EmailDispatcher;
  let mockActivityDoc: any;
  let mockContractDoc: any;

  beforeEach(() => {
    mockActivityDoc = {
      id: 'activity-email-1',
      set: vi.fn(async () => undefined),
    };

    mockContractDoc = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => mockActivityDoc),
      })),
    };

    mockDb = {
      collection: vi.fn((colName: string) => {
        if (colName === 'users') {
          return {
            where: vi.fn((field: string, _op: string, val: any) => ({
              where: vi.fn(() => ({
                get: vi.fn(async () => {
                  if (field === 'role' && val === 'LEGAL') {
                    return {
                      docs: [
                        { data: () => ({ email: 'legal1@foodempire.vn', role: 'LEGAL' }) },
                        { data: () => ({ email: 'legal2@foodempire.vn', role: 'LEGAL' }) },
                      ],
                    };
                  }
                  if (field === 'role' && val === 'HOL') {
                    return {
                      docs: [{ data: () => ({ email: 'hol@foodempire.vn', role: 'HOL' }) }],
                    };
                  }
                  return { docs: [] };
                }),
              })),
            })),
          };
        }
        if (colName === 'contracts') {
          return {
            doc: vi.fn(() => mockContractDoc),
          };
        }
        return {};
      }),
    };

    mockDispatcher = {
      send: vi.fn(async () => ({ success: true, messageId: 'msg-123' })),
    };
  });

  describe('resolveRecipients', () => {
    it('resolves LEGAL team only (no CC) for NEW_SUBMISSION and RESUBMISSION', async () => {
      const newSubResult = await resolveRecipients(mockDb, 'NEW_SUBMISSION', 'creator@foodempire.vn');
      expect(newSubResult.to).toEqual(['legal1@foodempire.vn', 'legal2@foodempire.vn']);
      expect(newSubResult.cc).toBeUndefined();

      const resubResult = await resolveRecipients(mockDb, 'RESUBMISSION', 'creator@foodempire.vn');
      expect(resubResult.to).toEqual(['legal1@foodempire.vn', 'legal2@foodempire.vn']);
      expect(resubResult.cc).toBeUndefined();
    });

    it('resolves creator only (no CC) for TASK_LIST_ASSIGNED', async () => {
      const result = await resolveRecipients(mockDb, 'TASK_LIST_ASSIGNED', 'creator@foodempire.vn');
      expect(result.to).toEqual(['creator@foodempire.vn']);
      expect(result.cc).toBeUndefined();
    });

    it('resolves HOL as TO and creator as CC (without LEGAL) for LEGAL_APPROVED', async () => {
      const result = await resolveRecipients(mockDb, 'LEGAL_APPROVED', 'creator@foodempire.vn');
      expect(result.to).toEqual(['hol@foodempire.vn']);
      expect(result.cc).toEqual(['creator@foodempire.vn']);
    });

    it('resolves creator as TO and LEGAL team as CC for HOL_APPROVED and HOL_COMMENTED', async () => {
      const approvedResult = await resolveRecipients(mockDb, 'HOL_APPROVED', 'creator@foodempire.vn');
      expect(approvedResult.to).toEqual(['creator@foodempire.vn']);
      expect(approvedResult.cc).toEqual(['legal1@foodempire.vn', 'legal2@foodempire.vn']);
      expect(approvedResult.cc).not.toContain('hol@foodempire.vn');

      const commentedResult = await resolveRecipients(mockDb, 'HOL_COMMENTED', 'creator@foodempire.vn');
      expect(commentedResult.to).toEqual(['creator@foodempire.vn']);
      expect(commentedResult.cc).toEqual(['legal1@foodempire.vn', 'legal2@foodempire.vn']);
      expect(commentedResult.cc).not.toContain('hol@foodempire.vn');
    });

    it('handles cases when creatorEmail is empty', async () => {
      const taskResult = await resolveRecipients(mockDb, 'TASK_LIST_ASSIGNED', '');
      expect(taskResult.to).toEqual(['legal1@foodempire.vn', 'legal2@foodempire.vn']);
      expect(taskResult.cc).toBeUndefined();

      const holResult = await resolveRecipients(mockDb, 'HOL_APPROVED', '');
      expect(holResult.to).toEqual(['hol@foodempire.vn']);
      expect(holResult.cc).toEqual(['legal1@foodempire.vn', 'legal2@foodempire.vn']);
      expect(holResult.cc).not.toContain('hol@foodempire.vn');
    });
  });

  describe('dispatchContractEmail', () => {
    const sampleContract = {
      contractId: 'CTR-2609-0001',
      title: 'Hợp đồng mua hàng',
      supplier: 'Công ty ABC',
      createdBy: { uid: 'user-1', email: 'creator@foodempire.vn', displayName: 'User One' },
    };

    it('successfully dispatches email and logs activity in Firestore', async () => {
      const result = await dispatchContractEmail(
        mockDb,
        mockDispatcher,
        sampleContract,
        'NEW_SUBMISSION',
        'User One'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockDispatcher.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['legal1@foodempire.vn', 'legal2@foodempire.vn'],
          cc: undefined,
          subject: expect.stringContaining('Hồ sơ mới cần thẩm định'),
        })
      );
      expect(mockActivityDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EMAIL_SENT',
          details: expect.stringContaining('NEW_SUBMISSION'),
        })
      );
    });

    it('returns error result when no recipients are found', async () => {
      const emptyDb = {
        collection: vi.fn(() => ({
          where: vi.fn(() => ({
            where: vi.fn(() => ({
              get: vi.fn(async () => ({ docs: [] })),
            })),
          })),
        })),
      };

      const result = await dispatchContractEmail(
        emptyDb as any,
        mockDispatcher,
        { ...sampleContract, createdBy: { uid: 'u', email: '', displayName: 'U' } },
        'NEW_SUBMISSION',
        'User One'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('NO_VALID_RECIPIENTS');
      expect(mockDispatcher.send).not.toHaveBeenCalled();
    });
  });
});
