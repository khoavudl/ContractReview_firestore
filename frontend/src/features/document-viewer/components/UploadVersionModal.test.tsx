/**
 * Unit Tests for UploadVersionModal Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadVersionModal } from './UploadVersionModal';
import type { AuthUser, ContractDocument } from '@/shared';
import * as reviewTasks from '@/features/review-tasks';

vi.mock('@/features/review-tasks', () => ({
  uploadRevisionDocx: vi.fn(),
}));

vi.mock('@/features/comments', () => ({
  addSystemEventComment: vi.fn().mockResolvedValue({}),
}));

describe('UploadVersionModal Component', () => {
  const mockUser: AuthUser = {
    uid: 'u-user-01',
    email: 'user.sales@foodempire.vn',
    displayName: 'Nguyễn Văn Phụ Trách',
    role: 'USER',
    isActive: true,
  };

  const sampleContract: ContractDocument = {
    contractId: 'CTR-2609-0005',
    title: 'Hợp đồng dịch vụ vận tải',
    supplier: 'Vận Tải Con Thoi',
    description: 'Mô tả hợp đồng',
    status: 'DRAFT',
    currentVersion: 1,
    createdBy: { uid: 'u-user-01', email: 'user.sales@foodempire.vn', displayName: 'Nguyễn Văn Phụ Trách' },
    rejectCount: 0,
    isArchived: false,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 1, originalFileName: 'VanTai_v1.docx', storagePath: 'contracts/v1.docx' },
    annexFiles: [
      {
        annexId: 'PL01',
        label: 'Phụ lục 1: Báo giá cước',
        originalFileName: 'Cuoc_v1.docx',
        storagePath: 'contracts/v1_PL01.docx',
        sourceVersionNo: 1,
        order: 1,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnClose = vi.fn();
  const mockOnUploaded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with correct title, banner and current documents list', () => {
    render(
      <UploadVersionModal
        isOpen={true}
        onClose={mockOnClose}
        contract={sampleContract}
        currentUser={mockUser}
        onUploaded={mockOnUploaded}
      />
    );

    expect(screen.getByText(/Nộp Bản Chỉnh Sửa \(Lên Phiên Bản v2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Hợp đồng chính: VanTai_v1\.docx/i)).toBeInTheDocument();
    expect(screen.getByText(/Phụ lục 1: Báo giá cước \(Cuoc_v1\.docx\)/i)).toBeInTheDocument();
  });

  it('shows validation error when submitting without choosing any changes', async () => {
    render(
      <UploadVersionModal
        isOpen={true}
        onClose={mockOnClose}
        contract={sampleContract}
        currentUser={mockUser}
        onUploaded={mockOnUploaded}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Nộp Bản v2/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Vui lòng chọn ít nhất một tệp chỉnh sửa mới hoặc thay đổi phụ lục.')
      ).toBeInTheDocument();
    });
    expect(reviewTasks.uploadRevisionDocx).not.toHaveBeenCalled();
  });

  it('uploads revision when only annex is revised (main contract kept intact)', async () => {
    vi.mocked(reviewTasks.uploadRevisionDocx).mockResolvedValue({
      versionId: 'v2',
      storagePath: 'contracts/CTR-2609-0005/versions/v1.docx',
    });

    render(
      <UploadVersionModal
        isOpen={true}
        onClose={mockOnClose}
        contract={sampleContract}
        currentUser={mockUser}
        onUploaded={mockOnUploaded}
      />
    );

    // Pick file for PL01
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const annexFileInput = fileInputs[1] as HTMLInputElement; // second input is PL01
    const dummyAnnexFile = new File(['new annex content'], 'Cuoc_v2_edited.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    fireEvent.change(annexFileInput, { target: { files: [dummyAnnexFile] } });

    expect(screen.getByText(/Đã chọn bản sửa: Cuoc_v2_edited\.docx/i)).toBeInTheDocument();

    // Fill change summary
    const summaryTextarea = screen.getByPlaceholderText(/Đã sửa lại thời hạn/i);
    fireEvent.change(summaryTextarea, {
      target: { value: 'Cập nhật lại đơn giá cước vận tải km vượt định mức' },
    });

    const submitBtn = screen.getByRole('button', { name: /Nộp Bản v2/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(reviewTasks.uploadRevisionDocx).toHaveBeenCalledWith(
        'CTR-2609-0005',
        mockUser,
        null, // mainFile is null because it was not modified
        2,
        'Cập nhật lại đơn giá cước vận tải km vượt định mức',
        undefined,
        undefined,
        undefined,
        expect.objectContaining({
          annexUpdates: { PL01: dummyAnnexFile },
        })
      );
      expect(mockOnUploaded).toHaveBeenCalledWith(2);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('allows toggling remove on an annex for the new version', async () => {
    render(
      <UploadVersionModal
        isOpen={true}
        onClose={mockOnClose}
        contract={sampleContract}
        currentUser={mockUser}
        onUploaded={mockOnUploaded}
      />
    );

    const deleteBtn = screen.getByTitle('Gỡ bỏ phụ lục này');
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/Đã đánh dấu gỡ bỏ khỏi v2/i)).toBeInTheDocument();
    expect(screen.getByText('Hoàn tác')).toBeInTheDocument();

    // Click Undo
    const undoBtn = screen.getByText('Hoàn tác');
    fireEvent.click(undoBtn);

    expect(screen.queryByText(/Đã đánh dấu gỡ bỏ khỏi v2/i)).not.toBeInTheDocument();
  });
});
