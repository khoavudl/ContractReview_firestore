/**
 * Unit Tests for ManageViewersModal Component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '@/shared';
import { ManageViewersModal } from './ManageViewersModal';
import * as contractService from '../services/contractService';
import type { ContractDocument } from '@/shared';

describe('ManageViewersModal Component', () => {
  const sampleContract: ContractDocument = {
    contractId: 'CTR-2610-0001',
    title: 'HĐ Mua bán hàng hóa',
    supplier: 'Nhà cung cấp ABC',
    description: 'Mô tả hợp đồng',
    status: 'PENDING_LEGAL',
    currentVersion: 1,
    createdBy: { uid: 'user_sales_01', email: 'owner@foodempire.vn', displayName: 'Owner' },
    viewerEmails: ['manager@foodempire.vn'],
    rejectCount: 0,
    isArchived: false,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 1, originalFileName: 'file.docx', storagePath: '' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const renderWithToast = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
  };

  beforeEach(() => {
    vi.spyOn(contractService, 'fetchActiveUsers').mockResolvedValue([]);
    vi.spyOn(contractService, 'updateContractViewers').mockResolvedValue(undefined);
  });

  it('renders modal with title and existing viewers when open', () => {
    renderWithToast(
      <ManageViewersModal
        isOpen={true}
        onClose={vi.fn()}
        contract={sampleContract}
        isOwner={true}
      />
    );

    expect(screen.getByText(/Người xem hồ sơ \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('manager@foodempire.vn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu Thay Đổi/i })).toBeInTheDocument();
  });

  it('allows owner to save changes and triggers onUpdated', async () => {
    const handleClose = vi.fn();
    const handleUpdated = vi.fn();

    renderWithToast(
      <ManageViewersModal
        isOpen={true}
        onClose={handleClose}
        contract={sampleContract}
        isOwner={true}
        onUpdated={handleUpdated}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Lưu Thay Đổi/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(contractService.updateContractViewers).toHaveBeenCalledWith(
        'CTR-2610-0001',
        ['manager@foodempire.vn']
      );
      expect(handleUpdated).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('shows warning and hides save button when user is not the owner', () => {
    renderWithToast(
      <ManageViewersModal
        isOpen={true}
        onClose={vi.fn()}
        contract={sampleContract}
        isOwner={false}
      />
    );

    expect(screen.getByText(/Chỉ Người tạo hồ sơ \(Owner\) mới có quyền Thêm hoặc Xóa/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Lưu Thay Đổi/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Đóng/i }).length).toBeGreaterThanOrEqual(1);
  });
});
