import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveStatusChangeEmailTemplate,
  extractTransitionMetadata,
  onContractStatusChanged,
} from './onContractStatusChanged.js';
import * as emailDispatcherModule from '../../modules/email/index.js';

describe('onContractStatusChanged', () => {
  describe('resolveStatusChangeEmailTemplate', () => {
    it('maps DRAFT -> PENDING_LEGAL to NEW_SUBMISSION', () => {
      expect(resolveStatusChangeEmailTemplate('DRAFT', 'PENDING_LEGAL')).toBe('NEW_SUBMISSION');
    });

    it('maps PENDING_LEGAL -> USER_REVISING to TASK_LIST_ASSIGNED', () => {
      expect(resolveStatusChangeEmailTemplate('PENDING_LEGAL', 'USER_REVISING')).toBe(
        'TASK_LIST_ASSIGNED'
      );
      expect(resolveStatusChangeEmailTemplate('PENDING_LEGAL', 'LEGAL_COMMENTED')).toBe(
        'TASK_LIST_ASSIGNED'
      );
    });

    it('maps USER_REVISING -> PENDING_LEGAL to RESUBMISSION', () => {
      expect(resolveStatusChangeEmailTemplate('USER_REVISING', 'PENDING_LEGAL')).toBe(
        'RESUBMISSION'
      );
      expect(resolveStatusChangeEmailTemplate('LEGAL_COMMENTED', 'PENDING_LEGAL')).toBe(
        'RESUBMISSION'
      );
      expect(resolveStatusChangeEmailTemplate('HOL_COMMENTED', 'PENDING_LEGAL')).toBe(
        'RESUBMISSION'
      );
    });

    it('maps PENDING_LEGAL -> PENDING_HOL to LEGAL_APPROVED', () => {
      expect(resolveStatusChangeEmailTemplate('PENDING_LEGAL', 'PENDING_HOL')).toBe(
        'LEGAL_APPROVED'
      );
      expect(resolveStatusChangeEmailTemplate('PENDING_LEGAL', 'LEGAL_APPROVED')).toBe(
        'LEGAL_APPROVED'
      );
    });

    it('maps PENDING_HOL -> USER_REVISING to HOL_COMMENTED', () => {
      expect(resolveStatusChangeEmailTemplate('PENDING_HOL', 'USER_REVISING')).toBe('HOL_COMMENTED');
      expect(resolveStatusChangeEmailTemplate('PENDING_HOL', 'HOL_COMMENTED')).toBe('HOL_COMMENTED');
    });

    it('maps PENDING_HOL -> HOL_APPROVED to HOL_APPROVED', () => {
      expect(resolveStatusChangeEmailTemplate('PENDING_HOL', 'HOL_APPROVED')).toBe('HOL_APPROVED');
    });

    it('returns null for unchanged status or irrelevant transitions', () => {
      expect(resolveStatusChangeEmailTemplate('DRAFT', 'DRAFT')).toBeNull();
      expect(resolveStatusChangeEmailTemplate('HOL_APPROVED', 'COMPLETED')).toBeNull();
      expect(resolveStatusChangeEmailTemplate(undefined, 'PENDING_LEGAL')).toBeNull();
    });
  });

  describe('extractTransitionMetadata', () => {
    it('extracts author name and extra note from latest SYSTEM_STATUS_CHANGE comment', async () => {
      const mockContractRef = {
        collection: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                get: vi.fn(async () => ({
                  empty: false,
                  docs: [
                    {
                      data: () => ({
                        author: { displayName: 'Trần Văn Legal' },
                        rejectReason: 'Cần sửa điều khoản bảo hành',
                      }),
                    },
                  ],
                })),
              })),
            })),
          })),
        })),
      } as any;

      const meta = await extractTransitionMetadata(mockContractRef);
      expect(meta.actorName).toBe('Trần Văn Legal');
      expect(meta.extraNote).toBe('Cần sửa điều khoản bảo hành');
    });

    it('falls back to default actorName when no comment exists or on query error', async () => {
      const mockContractRef = {
        collection: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                get: vi.fn(async () => ({ empty: true, docs: [] })),
              })),
            })),
          })),
        })),
      } as any;

      const meta = await extractTransitionMetadata(mockContractRef);
      expect(meta.actorName).toBe('Người dùng hệ thống');
      expect(meta.extraNote).toBeUndefined();
    });
  });

  describe('trigger function execution', () => {
    let dispatchSpy: any;

    beforeEach(() => {
      vi.clearAllMocks();
      dispatchSpy = vi
        .spyOn(emailDispatcherModule, 'dispatchContractEmail')
        .mockResolvedValue({ success: true, messageId: 'test-123' });
    });

    it('dispatches email on valid contract status transition', async () => {
      const contractDataBefore = {
        contractId: 'CTR-2610-0001',
        title: 'Hợp đồng mua bán',
        supplier: 'Đối tác ABC',
        status: 'DRAFT',
        createdBy: { uid: 'u1', email: 'creator@foodempire.vn', displayName: 'Creator' },
      };

      const contractDataAfter = {
        ...contractDataBefore,
        status: 'PENDING_LEGAL',
      };

      const mockEvent = {
        data: {
          before: {
            exists: true,
            data: () => contractDataBefore,
          },
          after: {
            exists: true,
            ref: {
              collection: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      get: vi.fn(async () => ({ empty: true, docs: [] })),
                    })),
                  })),
                })),
              })),
            },
            data: () => contractDataAfter,
          },
        },
      } as any;

      // Invoke Cloud Function trigger directly
      await (onContractStatusChanged as any).run(mockEvent);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ contractId: 'CTR-2610-0001' }),
        'NEW_SUBMISSION',
        'Người dùng hệ thống',
        undefined
      );
    });

    it('ignores updates when status does not change', async () => {
      const contractData = {
        contractId: 'CTR-2610-0001',
        title: 'Hợp đồng mua bán',
        status: 'PENDING_LEGAL',
      };

      const mockEvent = {
        data: {
          before: {
            exists: true,
            data: () => contractData,
          },
          after: {
            exists: true,
            ref: {},
            data: () => ({ ...contractData, title: 'Tiêu đề mới' }),
          },
        },
      } as any;

      await (onContractStatusChanged as any).run(mockEvent);
      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });
});
