/**
 * Unit Tests for TaskMatrix Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TaskMatrix } from './TaskMatrix';
import type { UseTaskListReturn } from '../hooks/useTaskList';
import type { TaskItem } from '../types';

describe('TaskMatrix Component', () => {
  const sampleTasks: TaskItem[] = [
    {
      taskId: 'task-1',
      order: 1,
      clauses: 'Điều 4.2 - Thời hạn thanh toán',
      category: 'COMMERCIAL',
      issueSummary: 'Thời hạn 15 ngày quá ngắn',
      legalRecommendation: 'Đổi sang 30 ngày',
      status: 'OPEN',
      userNotes: '',
      createdBy: { uid: 'u-legal', displayName: 'Luật sư Trần' },
      updatedAt: new Date(),
    },
    {
      taskId: 'task-2',
      order: 2,
      clauses: 'Điều 8.1 - Mức phạt vi phạm',
      category: 'PENALTY',
      issueSummary: 'Mức phạt 12% vượt luật',
      legalRecommendation: 'Giảm về 8%',
      status: 'RESOLVED',
      userNotes: 'Đã giảm về 8%',
      createdBy: { uid: 'u-legal', displayName: 'Luật sư Trần' },
      updatedAt: new Date(),
    },
  ];

  const defaultTaskListMock: UseTaskListReturn = {
    tasks: sampleTasks,
    filteredTasks: sampleTasks,
    isLoading: false,
    error: null,
    filterStatus: 'ALL',
    setFilterStatus: vi.fn(),
    totalCount: 2,
    resolvedCount: 1,
    openCount: 1,
    percentComplete: 50,
    canManageTasks: true,
    canRespondTasks: false,
    addTask: vi.fn(),
    editTask: vi.fn(),
    removeTask: vi.fn(),
    saveUserResponse: vi.fn(),
  };

  it('renders progress bar, summary metrics, and task rows', () => {
    render(<TaskMatrix taskList={defaultTaskListMock} />);

    expect(screen.getByText('Tiến độ rà soát điều khoản')).toBeInTheDocument();
    expect(screen.getByText(/1\/2 điều khoản đã phản hồi \(50%\)/)).toBeInTheDocument();
    expect(screen.getByText('Điều 4.2 - Thời hạn thanh toán')).toBeInTheDocument();
    expect(screen.getByText('Điều 8.1 - Mức phạt vi phạm')).toBeInTheDocument();
  });

  it('triggers setFilterStatus when clicking filter tabs', () => {
    render(<TaskMatrix taskList={defaultTaskListMock} />);

    const openFilterBtn = screen.getByText(/Cần giải trình \(1\)/);
    fireEvent.click(openFilterBtn);
    expect(defaultTaskListMock.setFilterStatus).toHaveBeenCalledWith('OPEN');
  });

  it('shows "Thêm điều khoản" button and opens modal when canManageTasks is true', () => {
    render(<TaskMatrix taskList={defaultTaskListMock} />);

    const addBtn = screen.getByText('Thêm điều khoản');
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);
    expect(screen.getByText('Thêm Điều Khoản Rà Soát Mới')).toBeInTheDocument();
  });

  it('hides "Thêm điều khoản" button when canManageTasks is false', () => {
    const readOnlyTaskList = {
      ...defaultTaskListMock,
      canManageTasks: false,
    };
    render(<TaskMatrix taskList={readOnlyTaskList} />);

    expect(screen.queryByText('Thêm điều khoản')).not.toBeInTheDocument();
  });

  it('reopens task with status OPEN when updating a resolved task', async () => {
    render(<TaskMatrix taskList={defaultTaskListMock} />);

    // Click edit button for the second task (task-2, status RESOLVED)
    const editButtons = screen.getAllByTitle('Sửa điều khoản');
    await act(async () => {
      fireEvent.click(editButtons[1]);
    });

    expect(screen.getByText('Chỉnh Sửa Điều Khoản Rà Soát')).toBeInTheDocument();
    expect(screen.getByText(/Điều khoản đang ở trạng thái "Đã phản hồi"/)).toBeInTheDocument();

    const submitBtn = screen.getByText('Cập nhật');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(defaultTaskListMock.editTask).toHaveBeenCalledWith(
      'task-2',
      expect.objectContaining({
        status: 'OPEN',
      })
    );
  });
});
