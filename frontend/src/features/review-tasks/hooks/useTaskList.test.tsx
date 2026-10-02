/**
 * Unit Tests for useTaskList Hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskList } from './useTaskList';
import type { AuthUser } from '@/shared';
import * as taskService from '../services/taskService';
import type { TaskItem } from '../types';

vi.mock('../services/taskService', () => ({
  subscribeTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  batchSaveTasks: vi.fn(),
}));

describe('useTaskList Hook', () => {
  const mockLegalUser: AuthUser = {
    uid: 'u-legal-1',
    email: 'legal@foodempire.vn',
    displayName: 'Luật sư Trần',
    role: 'LEGAL',
    isActive: true,
  };

  const mockUser: AuthUser = {
    uid: 'u-sales-1',
    email: 'sales@foodempire.vn',
    displayName: 'Nguyễn Văn Phụ Trách',
    role: 'USER',
    isActive: true,
  };

  const sampleTasks: TaskItem[] = [
    {
      taskId: 't-1',
      order: 1,
      clauses: 'Điều 4.2',
      category: 'COMMERCIAL',
      issueSummary: 'Thời hạn thanh toán',
      legalRecommendation: 'Sửa thành 30 ngày',
      status: 'OPEN',
      userNotes: '',
      createdBy: { uid: 'u-legal-1', displayName: 'Luật sư Trần' },
      updatedAt: new Date(),
    },
    {
      taskId: 't-2',
      order: 2,
      clauses: 'Điều 8.1',
      category: 'PENALTY',
      issueSummary: 'Mức phạt vi phạm',
      legalRecommendation: 'Sửa thành 8%',
      status: 'RESOLVED',
      userNotes: 'Đã thống nhất 8%',
      createdBy: { uid: 'u-legal-1', displayName: 'Luật sư Trần' },
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(taskService.subscribeTasks).mockImplementation((_contractId, onData) => {
      onData(sampleTasks);
      return vi.fn();
    });
  });

  it('subscribes to tasks and computes progress percentages correctly', () => {
    const { result } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockLegalUser, 'PENDING_LEGAL')
    );

    expect(result.current.tasks.length).toBe(2);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.resolvedCount).toBe(1);
    expect(result.current.openCount).toBe(1);
    expect(result.current.percentComplete).toBe(50);
  });

  const mockHolUser: AuthUser = {
    uid: 'u-hol-1',
    email: 'hol@foodempire.vn',
    displayName: 'Trưởng ban Pháp chế',
    role: 'HOL',
    isActive: true,
  };

  it('determines manage and respond permissions based on role and stage', () => {
    const { result: legalResult } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockLegalUser, 'PENDING_LEGAL')
    );
    expect(legalResult.current.canManageTasks).toBe(true);
    expect(legalResult.current.canRespondTasks).toBe(false);

    // HOL cannot manage tasks at PENDING_LEGAL stage (only LEGAL can)
    const { result: holPendingLegal } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockHolUser, 'PENDING_LEGAL')
    );
    expect(holPendingLegal.current.canManageTasks).toBe(false);

    // LEGAL cannot manage tasks at PENDING_HOL stage (only HOL can)
    const { result: legalPendingHol } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockLegalUser, 'PENDING_HOL')
    );
    expect(legalPendingHol.current.canManageTasks).toBe(false);

    // HOL can manage tasks at PENDING_HOL stage
    const { result: holPendingHol } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockHolUser, 'PENDING_HOL')
    );
    expect(holPendingHol.current.canManageTasks).toBe(true);

    // USER cannot manage tasks at any stage
    const { result: userDraft } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockUser, 'DRAFT')
    );
    expect(userDraft.current.canManageTasks).toBe(false);

    const { result: userRevisingResult } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockUser, 'USER_REVISING')
    );
    expect(userRevisingResult.current.canManageTasks).toBe(false);
    expect(userRevisingResult.current.canRespondTasks).toBe(true);

    const { result: userLegalCommented } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockUser, 'LEGAL_COMMENTED')
    );
    expect(userLegalCommented.current.canRespondTasks).toBe(true);

    const { result: userHolCommented } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockUser, 'HOL_COMMENTED')
    );
    expect(userHolCommented.current.canRespondTasks).toBe(true);
  });

  it('filters tasks by OPEN and RESOLVED', () => {
    const { result } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockLegalUser, 'PENDING_LEGAL')
    );

    expect(result.current.filteredTasks.length).toBe(2);

    act(() => {
      result.current.setFilterStatus('OPEN');
    });
    expect(result.current.filteredTasks.length).toBe(1);
    expect(result.current.filteredTasks[0].taskId).toBe('t-1');

    act(() => {
      result.current.setFilterStatus('RESOLVED');
    });
    expect(result.current.filteredTasks.length).toBe(1);
    expect(result.current.filteredTasks[0].taskId).toBe('t-2');
  });

  it('calls createTask service through addTask handler', async () => {
    vi.mocked(taskService.createTask).mockResolvedValue('t-new');
    const { result } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockLegalUser, 'PENDING_LEGAL')
    );

    let newId = '';
    await act(async () => {
      newId = await result.current.addTask({
        clauses: 'Điều 10',
        category: 'CONFIDENTIALITY',
        issueSummary: 'Bảo mật',
        legalRecommendation: 'Khuyến nghị bảo mật',
      });
    });

    expect(newId).toBe('t-new');
    expect(taskService.createTask).toHaveBeenCalledWith(
      'CTR-2609-0003',
      mockLegalUser,
      expect.objectContaining({ clauses: 'Điều 10' }),
      3
    );
  });

  it('calls updateTask service through saveUserResponse handler', async () => {
    const { result } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockUser, 'USER_REVISING')
    );

    await act(async () => {
      await result.current.saveUserResponse('t-1', 'Nội dung phản hồi', 'RESOLVED');
    });

    expect(taskService.updateTask).toHaveBeenCalledWith(
      'CTR-2609-0003',
      't-1',
      {
        userNotes: 'Nội dung phản hồi',
        status: 'RESOLVED',
      }
    );
  });

  it('manages draft tasks and dirty tracking properly', () => {
    const { result } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockLegalUser, 'PENDING_LEGAL')
    );

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.unsavedCount).toBe(0);

    // Add a draft
    act(() => {
      result.current.addNewDraft();
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.unsavedCount).toBe(1);
    expect(result.current.draftTasks.length).toBe(1);
    expect(result.current.draftTasks[0].order).toBe(3);

    // Update draft
    const draftId = result.current.draftTasks[0].draftId;
    act(() => {
      result.current.updateDraft(draftId, { clauses: 'Điều 12 - Thông báo' });
    });
    expect(result.current.draftTasks[0].clauses).toBe('Điều 12 - Thông báo');

    // Remove draft
    act(() => {
      result.current.removeDraft(draftId);
    });
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.draftTasks.length).toBe(0);
  });

  it('saves all changes via batchSaveTasks and resets draft state', async () => {
    vi.mocked(taskService.batchSaveTasks).mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockLegalUser, 'PENDING_LEGAL')
    );

    // Add draft with full data
    act(() => {
      result.current.addNewDraft();
    });
    const draftId = result.current.draftTasks[0].draftId;
    act(() => {
      result.current.updateDraft(draftId, {
        clauses: 'Điều 12',
        issueSummary: 'Vấn đề 12',
        legalRecommendation: 'Khuyến nghị 12',
      });
    });

    // Start editing an existing task
    act(() => {
      result.current.startEditTask(sampleTasks[0]);
    });
    act(() => {
      result.current.updateEditingTask('t-1', {
        clauses: 'Điều 4.2 Sửa',
      });
    });

    expect(result.current.unsavedCount).toBe(2);

    await act(async () => {
      await result.current.saveAllChanges();
    });

    expect(taskService.batchSaveTasks).toHaveBeenCalledTimes(1);
    expect(taskService.batchSaveTasks).toHaveBeenCalledWith(
      'CTR-2609-0003',
      mockLegalUser,
      expect.objectContaining({
        draftsToCreate: expect.arrayContaining([
          expect.objectContaining({ clauses: 'Điều 12' }),
        ]),
        tasksToUpdate: expect.arrayContaining([
          expect.objectContaining({
            taskId: 't-1',
            updates: expect.objectContaining({ clauses: 'Điều 4.2 Sửa' }),
          }),
        ]),
      })
    );

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.draftTasks.length).toBe(0);
    expect(Object.keys(result.current.editingTasks).length).toBe(0);
  });

  it('saveAllChanges returns early without calling batchSaveTasks if no changes exist', async () => {
    const { result } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockLegalUser, 'PENDING_LEGAL')
    );

    await act(async () => {
      await result.current.saveAllChanges();
    });

    expect(taskService.batchSaveTasks).not.toHaveBeenCalled();
  });

  it('manages pending user responses and batch saves them for USER in USER_REVISING', async () => {
    vi.mocked(taskService.batchSaveTasks).mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockUser, 'USER_REVISING')
    );

    expect(result.current.hasUnsavedChanges).toBe(false);

    // User inputs response for t-1
    act(() => {
      result.current.updatePendingResponse('t-1', 'Đã sửa điều khoản theo ý kiến', 'RESOLVED');
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.unsavedCount).toBe(1);
    expect(result.current.pendingResponses['t-1'].userNotes).toBe('Đã sửa điều khoản theo ý kiến');
    expect(result.current.pendingResponses['t-1'].status).toBe('RESOLVED');

    // User also marks t-2 as WAIVED
    act(() => {
      result.current.updatePendingResponse('t-2', 'Đề nghị giữ nguyên', 'WAIVED');
    });

    expect(result.current.unsavedCount).toBe(2);

    await act(async () => {
      await result.current.saveAllChanges();
    });

    expect(taskService.batchSaveTasks).toHaveBeenCalledTimes(1);
    expect(taskService.batchSaveTasks).toHaveBeenCalledWith(
      'CTR-2609-0003',
      mockUser,
      expect.objectContaining({
        tasksToUpdate: expect.arrayContaining([
          expect.objectContaining({
            taskId: 't-1',
            updates: { userNotes: 'Đã sửa điều khoản theo ý kiến', status: 'RESOLVED' },
          }),
          expect.objectContaining({
            taskId: 't-2',
            updates: { userNotes: 'Đề nghị giữ nguyên', status: 'WAIVED' },
          }),
        ]),
      })
    );

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(Object.keys(result.current.pendingResponses).length).toBe(0);
  });
});
