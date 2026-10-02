/**
 * Unit Tests for TaskMatrix Component (Inline Drafts & Icon-Only Actions)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider } from '@/shared';
import { TaskMatrix } from './TaskMatrix';
import type { UseTaskListReturn } from '../hooks/useTaskList';
import type { TaskItem } from '../types';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

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
    isSaving: false,
    error: null,
    filterStatus: 'ALL',
    setFilterStatus: vi.fn(),
    totalCount: 2,
    resolvedCount: 1,
    openCount: 1,
    percentComplete: 50,
    canManageTasks: true,
    canRespondTasks: false,
    currentUser: {
      uid: 'u-legal',
      displayName: 'Luật sư Trần',
      role: 'LEGAL',
      email: 'legal@test.vn',
      isActive: true,
    },
    addTask: vi.fn(),
    editTask: vi.fn(),
    removeTask: vi.fn(),
    saveUserResponse: vi.fn(),
    draftTasks: [],
    editingTasks: {},
    pendingResponses: {},
    hasUnsavedChanges: false,
    unsavedCount: 0,
    addNewDraft: vi.fn(),
    updateDraft: vi.fn(),
    removeDraft: vi.fn(),
    startEditTask: vi.fn(),
    updateEditingTask: vi.fn(),
    cancelEditTask: vi.fn(),
    updatePendingResponse: vi.fn(),
    saveAllChanges: vi.fn(),
  };

  it('renders progress bar, summary metrics, and task rows', () => {
    renderWithProviders(<TaskMatrix taskList={defaultTaskListMock} />);

    expect(screen.getByText('Tiến độ rà soát điều khoản')).toBeInTheDocument();
    expect(screen.getByText(/1\/2 điều khoản đã phản hồi \(50%\)/)).toBeInTheDocument();
    expect(screen.getByText('Điều 4.2 - Thời hạn thanh toán')).toBeInTheDocument();
    expect(screen.getByText('Điều 8.1 - Mức phạt vi phạm')).toBeInTheDocument();
  });

  it('triggers setFilterStatus when clicking filter tabs', () => {
    renderWithProviders(<TaskMatrix taskList={defaultTaskListMock} />);

    const openFilterBtn = screen.getByText(/Cần giải trình \(1\)/);
    fireEvent.click(openFilterBtn);
    expect(defaultTaskListMock.setFilterStatus).toHaveBeenCalledWith('OPEN');
  });

  it('renders Save and Add icon buttons when canManageTasks is true and triggers addNewDraft on click', () => {
    renderWithProviders(<TaskMatrix taskList={defaultTaskListMock} />);

    const addBtn = screen.getByLabelText('Thêm điều khoản');
    const saveBtn = screen.getByLabelText('Lưu điều khoản');

    expect(addBtn).toBeInTheDocument();
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).toBeDisabled(); // Disabled because hasUnsavedChanges is false

    fireEvent.click(addBtn);
    expect(defaultTaskListMock.addNewDraft).toHaveBeenCalledTimes(1);
  });

  it('hides Save and Add buttons when canManageTasks is false', () => {
    const readOnlyTaskList = {
      ...defaultTaskListMock,
      canManageTasks: false,
    };
    renderWithProviders(<TaskMatrix taskList={readOnlyTaskList} />);

    expect(screen.queryByLabelText('Thêm điều khoản')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Lưu điều khoản')).not.toBeInTheDocument();
  });

  it('enables Save button when hasUnsavedChanges is true and calls saveAllChanges on click', async () => {
    const dirtyTaskList = {
      ...defaultTaskListMock,
      hasUnsavedChanges: true,
      unsavedCount: 1,
      saveAllChanges: vi.fn(),
    };
    renderWithProviders(<TaskMatrix taskList={dirtyTaskList} />);

    const saveBtn = screen.getByLabelText('Lưu điều khoản');
    expect(saveBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(dirtyTaskList.saveAllChanges).toHaveBeenCalledTimes(1);
  });

  it('renders inline TaskDraftCard when draftTasks has items', () => {
    const taskListWithDraft = {
      ...defaultTaskListMock,
      draftTasks: [
        {
          draftId: 'draft-1',
          order: 3,
          clauses: 'Điều 15 - Luật áp dụng',
          category: 'LEGAL' as const,
          issueSummary: 'Chưa chỉ định trọng tài',
          legalRecommendation: 'Chỉ định VIAC',
        },
      ],
      totalCount: 3,
      openCount: 2,
    };

    renderWithProviders(<TaskMatrix taskList={taskListWithDraft} />);

    expect(screen.getByDisplayValue('Điều 15 - Luật áp dụng')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Chưa chỉ định trọng tài')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Chỉ định VIAC')).toBeInTheDocument();
  });

  it('renders inline TaskDraftCard for editing existing task when in editingTasks', () => {
    const taskListWithEdit = {
      ...defaultTaskListMock,
      editingTasks: {
        'task-1': {
          clauses: 'Điều 4.2 - Thời hạn thanh toán (Sửa đổi)',
          category: 'COMMERCIAL' as const,
          issueSummary: 'Thời hạn 15 ngày quá ngắn (cập nhật)',
          legalRecommendation: 'Đổi sang 30 ngày',
        },
      },
    };

    renderWithProviders(<TaskMatrix taskList={taskListWithEdit} />);

    expect(screen.getByDisplayValue('Điều 4.2 - Thời hạn thanh toán (Sửa đổi)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Thời hạn 15 ngày quá ngắn (cập nhật)')).toBeInTheDocument();
  });

  it('renders Collapse All button and toggles between "Thu gọn" and "Mở rộng"', () => {
    renderWithProviders(<TaskMatrix taskList={defaultTaskListMock} />);

    const collapseBtn = screen.getByLabelText('Thu gọn tất cả');
    expect(collapseBtn).toBeInTheDocument();
    expect(screen.getByText('Thu gọn')).toBeInTheDocument();

    fireEvent.click(collapseBtn);
    expect(screen.getByText('Mở rộng')).toBeInTheDocument();
  });

  it('renders Save button for USER when canRespondTasks is true and triggers saveAllChanges', async () => {
    const userRevisingMock = {
      ...defaultTaskListMock,
      canManageTasks: false,
      canRespondTasks: true,
      hasUnsavedChanges: true,
      unsavedCount: 1,
      saveAllChanges: vi.fn(),
      currentUser: {
        uid: 'u-sales',
        displayName: 'Nguyễn Văn Phụ Trách',
        role: 'USER' as const,
        email: 'sales@test.vn',
        isActive: true,
      },
    };

    renderWithProviders(<TaskMatrix taskList={userRevisingMock} />);

    // Add button should NOT be visible to USER
    expect(screen.queryByLabelText('Thêm điều khoản')).not.toBeInTheDocument();

    // Save button SHOULD be visible and enabled for USER
    const saveBtn = screen.getByLabelText('Lưu điều khoản');
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(userRevisingMock.saveAllChanges).toHaveBeenCalledTimes(1);
  });
});
