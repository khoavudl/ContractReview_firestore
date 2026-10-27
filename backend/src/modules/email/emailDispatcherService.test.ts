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

    it('resolves HOL as TO and creator as CC (without LEGAL) for LEGAL_APPROVED and HOL_REMINDER', async () => {
      const legalResult = await resolveRecipients(mockDb, 'LEGAL_APPROVED', 'creator@foodempire.vn');
      expect(legalResult.to).toEqual(['hol@foodempire.vn']);
      expect(legalResult.cc).toEqual(['creator@foodempire.vn']);

      const reminderResult = await resolveRecipients(mockDb, 'HOL_REMINDER', 'creator@foodempire.vn');
      expect(reminderResult.to).toEqual(['hol@foodempire.vn']);
      expect(reminderResult.cc).toEqual(['creator@foodempire.vn']);
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

    it('automatically adds viewers to CC for emails sent or CC-ed to creator', async () => {
      const viewers = ['manager@foodempire.vn', 'colleague@foodempire.vn'];

      // TASK_LIST_ASSIGNED (TO creator, CC viewers)
      const taskResult = await resolveRecipients(mockDb, 'TASK_LIST_ASSIGNED', 'creator@foodempire.vn', viewers);
      expect(taskResult.to).toEqual(['creator@foodempire.vn']);
      expect(taskResult.cc).toEqual(['manager@foodempire.vn', 'colleague@foodempire.vn']);

      // LEGAL_APPROVED (TO HOL, CC creator + viewers)
      const legalResult = await resolveRecipients(mockDb, 'LEGAL_APPROVED', 'creator@foodempire.vn', viewers);
      expect(legalResult.to).toEqual(['hol@foodempire.vn']);
      expect(legalResult.cc).toEqual(['creator@foodempire.vn', 'manager@foodempire.vn', 'colleague@foodempire.vn']);

      // HOL_APPROVED (TO creator, CC legal + viewers)
      const approvedResult = await resolveRecipients(mockDb, 'HOL_APPROVED', 'creator@foodempire.vn', viewers);
      expect(approvedResult.to).toEqual(['creator@foodempire.vn']);
      expect(approvedResult.cc).toEqual([
        'legal1@foodempire.vn',
        'legal2@foodempire.vn',
        'manager@foodempire.vn',
        'colleague@foodempire.vn',
      ]);

      // NEW_SUBMISSION (TO legal, owner not in To or CC -> viewers not CC-ed)
      const newSubResult = await resolveRecipients(mockDb, 'NEW_SUBMISSION', 'creator@foodempire.vn', viewers);
      expect(newSubResult.to).toEqual(['legal1@foodempire.vn', 'legal2@foodempire.vn']);
      expect(newSubResult.cc).toBeUndefined();
    });

    it('deduplicates viewers if already present in TO, CC, or creator list', async () => {
      const duplicateViewers = ['creator@foodempire.vn', 'legal1@foodempire.vn', 'manager@foodempire.vn'];
      const approvedResult = await resolveRecipients(mockDb, 'HOL_APPROVED', 'creator@foodempire.vn', duplicateViewers);

      expect(approvedResult.to).toEqual(['creator@foodempire.vn']);
      // 'creator@foodempire.vn' is in TO, so it should not be in CC
      expect(approvedResult.cc).not.toContain('creator@foodempire.vn');
      // 'legal1@foodempire.vn' appears only once
      expect(approvedResult.cc).toEqual([
        'legal1@foodempire.vn',
        'legal2@foodempire.vn',
        'manager@foodempire.vn',
      ]);
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

    it('passes viewerEmails to CC when dispatching task assignment email', async () => {
      const contractWithViewers = {
        ...sampleContract,
        viewerEmails: ['manager@foodempire.vn'],
      };

      const result = await dispatchContractEmail(
        mockDb,
        mockDispatcher,
        contractWithViewers,
        'TASK_LIST_ASSIGNED',
        'Legal Specialist'
      );

      expect(result.success).toBe(true);
      expect(mockDispatcher.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['creator@foodempire.vn'],
          cc: ['manager@foodempire.vn'],
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
