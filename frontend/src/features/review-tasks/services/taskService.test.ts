/**
 * Unit Tests for taskService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  subscribeTasks,
  createTask,
  updateTask,
  deleteTask,
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
    serverTimestamp: vi.fn(() => new Date()),
  };
});

vi.mock('firebase/functions', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    httpsCallable: vi.fn(),
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
});
