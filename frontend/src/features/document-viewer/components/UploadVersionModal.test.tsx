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
    currentVersionFile: { versionNo: 1, originalFileName: 'VanTai_v1.docx', storagePath: '' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnClose = vi.fn();
  const mockOnUploaded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with correct title, banner and next version number', () => {
    render(
      <UploadVersionModal
        isOpen={true}
        onClose={mockOnClose}
        contract={sampleContract}
        currentUser={mockUser}
        onUploaded={mockOnUploaded}
      />
    );

    expect(screen.getByText(/Tải Lên Phiên Bản Mới \(v2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Giữ nguyên trạng thái: Bản nháp/i)).toBeInTheDocument();
    expect(screen.getByText(/Nhấp để chọn tệp Word \(\.docx\)/i)).toBeInTheDocument();
  });

  it('shows validation error when submitting without selecting a file', async () => {
    render(
      <UploadVersionModal
        isOpen={true}
        onClose={mockOnClose}
        contract={sampleContract}
        currentUser={mockUser}
        onUploaded={mockOnUploaded}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Tải Lên Phiên Bản \(v2\)/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Vui lòng chọn tệp Word (.docx) phiên bản mới.')).toBeInTheDocument();
    });
    expect(reviewTasks.uploadRevisionDocx).not.toHaveBeenCalled();
  });

  it('uploads file and advances version successfully with default summary if omitted', async () => {
    vi.mocked(reviewTasks.uploadRevisionDocx).mockResolvedValue({
      versionId: 'v2',
      storagePath: 'contracts/CTR-2609-0005/versions/v2.docx',
    });

    const { container } = render(
      <UploadVersionModal
        isOpen={true}
        onClose={mockOnClose}
        contract={sampleContract}
        currentUser={mockUser}
        onUploaded={mockOnUploaded}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const dummyFile = new File(['dummy docx content'], 'VanTai_v2.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    expect(screen.getByText('VanTai_v2.docx')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Tải Lên Phiên Bản \(v2\)/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(reviewTasks.uploadRevisionDocx).toHaveBeenCalledWith(
        'CTR-2609-0005',
        mockUser,
        dummyFile,
        2,
        'Tải lên phiên bản mới v2'
      );
      expect(mockOnUploaded).toHaveBeenCalledWith(2);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('uses custom change summary when provided by user', async () => {
    vi.mocked(reviewTasks.uploadRevisionDocx).mockResolvedValue({
      versionId: 'v2',
      storagePath: 'contracts/CTR-2609-0005/versions/v2.docx',
    });

    const { container } = render(
      <UploadVersionModal
        isOpen={true}
        onClose={mockOnClose}
        contract={sampleContract}
        currentUser={mockUser}
        onUploaded={mockOnUploaded}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const dummyFile = new File(['dummy content'], 'VanTai_revised.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    const textarea = screen.getByPlaceholderText(/Cập nhật điều khoản thanh toán/i);
    fireEvent.change(textarea, {
      target: { value: 'Sửa điều khoản phạt thanh toán chậm' },
    });

    const submitBtn = screen.getByRole('button', { name: /Tải Lên Phiên Bản \(v2\)/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(reviewTasks.uploadRevisionDocx).toHaveBeenCalledWith(
        'CTR-2609-0005',
        mockUser,
        dummyFile,
        2,
        'Sửa điều khoản phạt thanh toán chậm'
      );
      expect(mockOnUploaded).toHaveBeenCalledWith(2);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
