/**
 * Unit Tests for taskService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  subscribeTasks,
  createTask,
  updateTask,
  deleteTask,
  batchSaveTasks,
  executeStatusTransition,
  uploadRevisionDocx,
  resetMockTasksForTesting,
} from './taskService';
import type { AuthUser } from '@/shared';
import * as shared from '@/shared';

vi.mock('@/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof shared>();
  return {
    ...actual,
    isMockDevEnvironment: vi.fn(),
    getFirebaseDb: vi.fn(),
    getFirebaseFunctions: vi.fn(),
    getFirebaseStorage: vi.fn(),
  };
});

export const mockBatch = {
  update: vi.fn(),
  set: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
};

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    collection: vi.fn(() => ({ type: 'collection' })),
    doc: vi.fn(() => ({ type: 'doc' })),
    query: vi.fn(() => ({ type: 'query' })),
    orderBy: vi.fn(),
    onSnapshot: vi.fn((_q, callback) => {
      callback({
        empty: false,
        docs: [
          {
            id: 'task-doc-1',
            data: () => ({
              order: 1,
              clauses: 'Điều 1',
              category: 'LEGAL',
              issueSummary: 'Vấn đề 1',
              legalRecommendation: 'Khuyến nghị 1',
              status: 'OPEN',
              userNotes: '',
              createdBy: { uid: 'u1', displayName: 'Luật sư A' },
              updatedAt: new Date(),
            }),
          },
        ],
      });
      return vi.fn();
    }),
    setDoc: vi.fn().mockResolvedValue(undefined),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    writeBatch: vi.fn(() => mockBatch),
    serverTimestamp: vi.fn(() => new Date()),
  };
});

vi.mock('firebase/storage', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    ref: vi.fn(() => ({ type: 'storageRef' })),
    uploadBytes: vi.fn().mockResolvedValue(undefined),
  };
});

describe('taskService', () => {
  const mockUser: AuthUser = {
    uid: 'u-1',
    email: 'test@example.com',
    displayName: 'Test Legal',
    role: 'LEGAL',
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetMockTasksForTesting();
    vi.mocked(shared.isMockDevEnvironment).mockReturnValue(true);
  });

  describe('Mock Dev Environment Operations', () => {
    it('subscribes to sample tasks in mock mode', () => {
      const onData = vi.fn();
      const unsub = subscribeTasks('CTR-2609-0003', onData);

      expect(onData).toHaveBeenCalled();
      const initialTasks = onData.mock.calls[0][0];
      expect(initialTasks.length).toBeGreaterThanOrEqual(2);
      expect(initialTasks[0].taskId).toBe('task-001');
      unsub();
    });

    it('creates a new task in mock store', async () => {
      const taskId = await createTask(
        'CTR-2609-0003',
        mockUser,
        {
          clauses: 'Điều 10',
          category: 'CONFIDENTIALITY',
          issueSummary: 'Thời hạn bảo mật 1 năm là quá ngắn',
          legalRecommendation: 'Tăng lên 5 năm',
        },
        3
      );

      expect(taskId).toBeTruthy();

      const onData = vi.fn();
      subscribeTasks('CTR-2609-0003', onData);
      const tasks = onData.mock.calls[0][0];
      const created = tasks.find((t: { taskId: string }) => t.taskId === taskId);
      expect(created).toBeDefined();
      expect(created.clauses).toBe('Điều 10');
      expect(created.category).toBe('CONFIDENTIALITY');
    });

    it('updates userNotes and status of a task in mock store', async () => {
      await updateTask('CTR-2609-0003', 'task-001', {
        userNotes: 'Đã giải trình chi tiết',
        status: 'RESOLVED',
      });

      const onData = vi.fn();
      subscribeTasks('CTR-2609-0003', onData);
      const tasks = onData.mock.calls[0][0];
      const updated = tasks.find((t: { taskId: string }) => t.taskId === 'task-001');
      expect(updated.userNotes).toBe('Đã giải trình chi tiết');
      expect(updated.status).toBe('RESOLVED');
    });

    it('deletes a task from mock store', async () => {
      await deleteTask('CTR-2609-0003', 'task-001');

      const onData = vi.fn();
      subscribeTasks('CTR-2609-0003', onData);
      const tasks = onData.mock.calls[0][0];
      const deleted = tasks.find((t: { taskId: string }) => t.taskId === 'task-001');
      expect(deleted).toBeUndefined();
    });

    it('executes status transition instantly in mock mode', async () => {
      const res = await executeStatusTransition('CTR-2609-0003', 'PENDING_LEGAL', {
        changeSummary: 'Nộp bản thảo v2',
      });
      expect(res.success).toBe(true);
      expect(res.newStatus).toBe('PENDING_LEGAL');
    });

    it('uploads revision docx successfully in mock mode', async () => {
      const dummyFile = new File(['dummy content'], 'HopDong_v2.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const res = await uploadRevisionDocx(
        'CTR-2609-0003',
        mockUser,
        dummyFile,
        2,
        'Cập nhật theo ý kiến pháp chế',
        'Đã thống nhất giá mới'
      );

      expect(res.versionId).toBe('v2');
      expect(res.storagePath).toBe('contracts/CTR-2609-0003/versions/v2.docx');
    });
  });

  describe('Real Firestore writeBatch Environment Operations', () => {
    beforeEach(() => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(false);
      mockBatch.update.mockClear();
      mockBatch.set.mockClear();
      mockBatch.commit.mockClear();
    });

    it('executes status transition atomically via writeBatch in real mode', async () => {
      const contract = {
        contractId: 'CTR-2609-0001',
        status: 'PENDING_LEGAL' as const,
        title: 'Hợp đồng mua hàng',
        currentVersion: 1,
        createdBy: { uid: 'u-user-1', email: 'user@test.vn', displayName: 'Người phụ trách' },
      };

      const res = await executeStatusTransition(
        contract,
        'PENDING_HOL',
        mockUser,
        { changeSummary: 'Pháp chế đã duyệt, trình Head' }
      );

      expect(res.success).toBe(true);
      expect(res.newStatus).toBe('PENDING_HOL');

      // 1. Contract update
      expect(mockBatch.update).toHaveBeenCalledTimes(1);
      const updatePayload = mockBatch.update.mock.calls[0][1];
      expect(updatePayload.status).toBe('PENDING_HOL');

      // 2. Activity and Comment
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('increments rejectCount when transitioning to USER_REVISING', async () => {
      const contract = {
        contractId: 'CTR-2609-0001',
        status: 'PENDING_LEGAL' as const,
        title: 'Hợp đồng mua hàng',
        rejectCount: 1,
        currentVersion: 1,
        createdBy: { uid: 'u-user-1', email: 'user@test.vn', displayName: 'Người phụ trách' },
      };

      const res = await executeStatusTransition(
        contract,
        'USER_REVISING',
        mockUser,
        { rejectReason: 'Cần sửa đổi Điều 4.2' }
      );

      expect(res.success).toBe(true);
      const updatePayload = mockBatch.update.mock.calls[0][1];
      expect(updatePayload.status).toBe('USER_REVISING');
      expect(updatePayload.rejectCount).toBe(2);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('marks version as approved when targetStatus is HOL_APPROVED', async () => {
      const contract = {
        contractId: 'CTR-2609-0001',
        status: 'PENDING_HOL' as const,
        title: 'Hợp đồng mua hàng',
        currentVersion: 2,
        currentVersionFile: {
          versionNo: 2,
          originalFileName: 'CTR-2609-0001_v2.docx',
          storagePath: 'contracts/CTR-2609-0001/versions/v2.docx',
        },
        createdBy: { uid: 'u-user-1', email: 'user@test.vn', displayName: 'Người phụ trách' },
      };

      const res = await executeStatusTransition(
        contract,
        'HOL_APPROVED',
        { ...mockUser, role: 'HOL' }
      );

      expect(res.success).toBe(true);
      const updatePayload = mockBatch.update.mock.calls[0][1];
      expect(updatePayload.status).toBe('HOL_APPROVED');
      expect(updatePayload.currentVersionFile.originalFileName).toBe('CTR-2609-0001_approved.docx');

      // Version doc should be set with approved flag
      const versionSetCalls = mockBatch.set.mock.calls.filter(
        (call: unknown[]) => (call[1] as Record<string, unknown>)?.isApprovedVersion === true
      );
      expect(versionSetCalls.length).toBe(1);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('batchSaveTasks commits new drafts and updates atomically via writeBatch in real mode', async () => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(false);

      await batchSaveTasks('CTR-2609-0001', mockUser, {
        draftsToCreate: [
          {
            draftId: 'draft-1',
            order: 3,
            clauses: 'Điều 10 - Bảo mật',
            category: 'CONFIDENTIALITY',
            issueSummary: 'Chưa có điều khoản bảo mật 5 năm',
            legalRecommendation: 'Bổ sung bảo mật 5 năm',
          },
        ],
        tasksToUpdate: [
          {
            taskId: 'task-doc-1',
            updates: {
              clauses: 'Điều 1 sửa đổi',
              issueSummary: 'Vấn đề đã sửa',
            },
          },
        ],
      });

      expect(mockBatch.set).toHaveBeenCalledTimes(1);
      expect(mockBatch.update).toHaveBeenCalledTimes(1);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('batchSaveTasks returns early without committing if no drafts and no updates', async () => {
      vi.mocked(shared.isMockDevEnvironment).mockReturnValue(false);

      await batchSaveTasks('CTR-2609-0001', mockUser, {
        draftsToCreate: [],
        tasksToUpdate: [],
      });

      expect(mockBatch.set).not.toHaveBeenCalled();
      expect(mockBatch.update).not.toHaveBeenCalled();
      expect(mockBatch.commit).not.toHaveBeenCalled();
    });
  });
});
