/**
 * Unit Tests for ActionButtons Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionButtons } from './ActionButtons';
import type { UseWorkflowActionsReturn } from '../hooks/useWorkflowActions';
import type { AuthUser, ContractDocument } from '@/shared';

describe('ActionButtons Component', () => {
  const mockUser: AuthUser = {
    uid: 'u-user',
    email: 'user@foodempire.vn',
    displayName: 'Nguyễn Văn Phụ Trách',
    role: 'USER',
    isActive: true,
  };

  const sampleContract: ContractDocument = {
    contractId: 'CTR-2609-0001',
    title: 'Hợp đồng mua bao bì',
    supplier: 'Bao Bì Toàn Cầu',
    description: 'Mô tả',
    status: 'DRAFT',
    currentVersion: 1,
    createdBy: { uid: 'u-user', email: 'user@foodempire.vn', displayName: 'Nguyễn Văn Phụ Trách' },
    rejectCount: 0,
    isArchived: false,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 1, originalFileName: '', storagePath: '' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders nothing when availableActions is empty', () => {
    const emptyWorkflowActions: UseWorkflowActionsReturn = {
      availableActions: [],
      isExecuting: false,
      error: null,
      isRevisionModalOpen: false,
      openRevisionModal: vi.fn(),
      closeRevisionModal: vi.fn(),
      confirmModalAction: null,
      closeConfirmModal: vi.fn(),
      triggerAction: vi.fn(),
      handleConfirmAction: vi.fn(),
    };

    const { container } = render(
      <ActionButtons
        workflowActions={emptyWorkflowActions}
        contract={sampleContract}
        currentUser={mockUser}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders action buttons and triggers triggerAction on click', () => {
    const triggerActionMock = vi.fn();
    const workflowActionsMock: UseWorkflowActionsReturn = {
      availableActions: [
        {
          actionType: 'SUBMIT_TO_LEGAL',
          label: 'Nộp Thẩm Định',
          targetStatus: 'PENDING_LEGAL',
          variant: 'primary',
          iconName: 'send',
          requireConfirmation: true,
          confirmationTitle: 'Nộp hồ sơ thẩm định',
          confirmationMessage: 'Chuyển hồ sơ sang Pháp chế.',
        },
      ],
      isExecuting: false,
      error: null,
      isRevisionModalOpen: false,
      openRevisionModal: vi.fn(),
      closeRevisionModal: vi.fn(),
      confirmModalAction: null,
      closeConfirmModal: vi.fn(),
      triggerAction: triggerActionMock,
      handleConfirmAction: vi.fn(),
    };

    render(
      <ActionButtons
        workflowActions={workflowActionsMock}
        contract={sampleContract}
        currentUser={mockUser}
      />
    );

    const btn = screen.getByText('Nộp Thẩm Định');
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(triggerActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'SUBMIT_TO_LEGAL' })
    );
  });

  it('renders confirmation modal when confirmModalAction is present', () => {
    const handleConfirmMock = vi.fn();
    const workflowActionsMock: UseWorkflowActionsReturn = {
      availableActions: [],
      isExecuting: false,
      error: null,
      isRevisionModalOpen: false,
      openRevisionModal: vi.fn(),
      closeRevisionModal: vi.fn(),
      confirmModalAction: {
        actionType: 'APPROVE_LEGAL',
        label: 'Phê Duyệt Pháp Chế',
        targetStatus: 'LEGAL_APPROVED',
        variant: 'primary',
        iconName: 'check',
        confirmationTitle: 'Xác nhận phê duyệt pháp chế',
        confirmationMessage: 'Bạn có chắc chắn muốn phê duyệt hồ sơ này?',
      },
      closeConfirmModal: vi.fn(),
      triggerAction: vi.fn(),
      handleConfirmAction: handleConfirmMock,
    };

    render(
      <ActionButtons
        workflowActions={workflowActionsMock}
        contract={sampleContract}
        currentUser={mockUser}
      />
    );

    expect(screen.getByText('Xác nhận phê duyệt pháp chế')).toBeInTheDocument();
    expect(screen.getByText('Bạn có chắc chắn muốn phê duyệt hồ sơ này?')).toBeInTheDocument();

    const confirmBtn = screen.getByText('Xác nhận');
    fireEvent.click(confirmBtn);
    expect(handleConfirmMock).toHaveBeenCalled();
  });

  it('renders open tasks warning banner when resubmitting with unresolved tasks', () => {
    const workflowActionsMock: UseWorkflowActionsReturn = {
      availableActions: [],
      isExecuting: false,
      error: null,
      isRevisionModalOpen: false,
      openRevisionModal: vi.fn(),
      closeRevisionModal: vi.fn(),
      confirmModalAction: {
        actionType: 'RESUBMIT_REVISION',
        label: 'Nộp Lại Thẩm Định',
        targetStatus: 'PENDING_LEGAL',
        variant: 'primary',
        iconName: 'send',
        confirmationTitle: 'Xác nhận nộp lại hồ sơ thẩm định',
        confirmationMessage: 'Hồ sơ sẽ được chuyển lại tới bộ phận Pháp chế.',
      },
      closeConfirmModal: vi.fn(),
      triggerAction: vi.fn(),
      handleConfirmAction: vi.fn(),
    };

    render(
      <ActionButtons
        workflowActions={workflowActionsMock}
        contract={sampleContract}
        currentUser={mockUser}
        openTasksCount={3}
      />
    );

    expect(screen.getByText(/Hiện còn/i)).toBeInTheDocument();
    expect(screen.getByText(/3 điều khoản/i)).toBeInTheDocument();
  });
});
