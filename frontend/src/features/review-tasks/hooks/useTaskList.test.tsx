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

  it('determines manage and respond permissions based on role and stage', () => {
    const { result: legalResult } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockLegalUser, 'PENDING_LEGAL')
    );
    expect(legalResult.current.canManageTasks).toBe(true);
    expect(legalResult.current.canRespondTasks).toBe(false);

    const { result: userRevisingResult } = renderHook(() =>
      useTaskList('CTR-2609-0003', mockUser, 'USER_REVISING')
    );
    expect(userRevisingResult.current.canManageTasks).toBe(false);
    expect(userRevisingResult.current.canRespondTasks).toBe(true);
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
});
