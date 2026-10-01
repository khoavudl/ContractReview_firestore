/**
 * Unit Tests for ActionButtons Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActionButtons } from './ActionButtons';
import type { UseWorkflowActionsReturn } from '../hooks/useWorkflowActions';
import { ToastProvider, type AuthUser, type ContractDocument } from '@/shared';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/features/contracts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/contracts')>();
  return {
    ...actual,
    deleteContractDoc: vi.fn().mockResolvedValue({ success: true, contractId: 'CTR-2609-0001' }),
  };
});

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when availableActions is empty and user cannot delete (PENDING_LEGAL)', () => {
    const legalContract: ContractDocument = {
      ...sampleContract,
      status: 'PENDING_LEGAL',
    };

    const { container } = renderWithProviders(
      <ActionButtons
        workflowActions={emptyWorkflowActions}
        contract={legalContract}
        currentUser={mockUser}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders action buttons and triggers triggerAction on click', () => {
    const triggerActionMock = vi.fn();
    const workflowActionsMock: UseWorkflowActionsReturn = {
      ...emptyWorkflowActions,
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
      triggerAction: triggerActionMock,
    };

    renderWithProviders(
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
      ...emptyWorkflowActions,
      confirmModalAction: {
        actionType: 'APPROVE_LEGAL',
        label: 'Phê Duyệt Pháp Chế',
        targetStatus: 'LEGAL_APPROVED',
        variant: 'primary',
        iconName: 'check',
        confirmationTitle: 'Xác nhận phê duyệt pháp chế',
        confirmationMessage: 'Bạn có chắc chắn muốn phê duyệt hồ sơ này?',
      },
      handleConfirmAction: handleConfirmMock,
    };

    renderWithProviders(
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
      ...emptyWorkflowActions,
      confirmModalAction: {
        actionType: 'RESUBMIT_REVISION',
        label: 'Nộp Lại Thẩm Định',
        targetStatus: 'PENDING_LEGAL',
        variant: 'primary',
        iconName: 'send',
        confirmationTitle: 'Xác nhận nộp lại hồ sơ thẩm định',
        confirmationMessage: 'Hồ sơ sẽ được chuyển lại tới bộ phận Pháp chế.',
      },
    };

    renderWithProviders(
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

  it('renders Xóa Hồ Sơ button when user is owner and status is DRAFT', () => {
    renderWithProviders(
      <ActionButtons
        workflowActions={emptyWorkflowActions}
        contract={sampleContract}
        currentUser={mockUser}
      />
    );

    expect(screen.getByText('Xóa Hồ Sơ')).toBeInTheDocument();
  });

  it('opens DeleteContractConfirmModal when clicking Xóa Hồ Sơ and handles deletion', async () => {
    const { deleteContractDoc } = await import('@/features/contracts');

    renderWithProviders(
      <ActionButtons
        workflowActions={emptyWorkflowActions}
        contract={sampleContract}
        currentUser={mockUser}
      />
    );

    const deleteBtn = screen.getByText('Xóa Hồ Sơ');
    fireEvent.click(deleteBtn);

    expect(screen.getByText('Xác nhận xóa hồ sơ')).toBeInTheDocument();
    expect(screen.getByText('Hành động nguy hiểm không thể hoàn tác!')).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole('button', { name: /Xác nhận xóa/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(deleteContractDoc).toHaveBeenCalledWith('CTR-2609-0001');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
