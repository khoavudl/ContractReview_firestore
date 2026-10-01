/**
 * Unit Tests for SubmitRevisionModal Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmitRevisionModal } from './SubmitRevisionModal';
import type { AuthUser, ContractDocument } from '@/shared';
import * as taskService from '../services/taskService';

vi.mock('../services/taskService', () => ({
  uploadRevisionDocx: vi.fn(),
  executeStatusTransition: vi.fn(),
}));

describe('SubmitRevisionModal Component', () => {
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
    status: 'USER_REVISING',
    currentVersion: 2,
    createdBy: { uid: 'u-user-01', email: 'user.sales@foodempire.vn', displayName: 'Nguyễn Văn Phụ Trách' },
    rejectCount: 1,
    isArchived: false,
    companyRole: 'BUYER',
    currentVersionFile: { versionNo: 2, originalFileName: 'VanTai_v2.docx', storagePath: '' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnClose = vi.fn();
  const mockOnSubmitted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders mode selector and defaults to upload_new mode', () => {
    render(
      <SubmitRevisionModal
        isOpen={true}
        onClose={mockOnClose}
        contract={sampleContract}
        currentUser={mockUser}
        openTasksCount={0}
        onSubmitted={mockOnSubmitted}
      />
    );

    expect(screen.getByText(/Tải bản Word sửa đổi \(v3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Giữ bản hiện tại \(v2\) — Giải trình/i)).toBeInTheDocument();
    expect(screen.getByText(/Tệp tin văn bản Word sửa đổi mới/i)).toBeInTheDocument();
  });

  it('validates file selection in upload_new mode', async () => {
    render(
      <SubmitRevisionModal
        isOpen={true}
        onClose={mockOnClose}
        contract={sampleContract}
        currentUser={mockUser}
        openTasksCount={0}
        onSubmitted={mockOnSubmitted}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Nộp Bản Sửa Đổi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Vui lòng chọn tệp Word (.docx) đã chỉnh sửa.')).toBeInTheDocument();
    });
    expect(taskService.uploadRevisionDocx).not.toHaveBeenCalled();
    expect(taskService.executeStatusTransition).not.toHaveBeenCalled();
  });

  it('allows resubmission in keep_existing mode without requiring a file upload', async () => {
    vi.mocked(taskService.executeStatusTransition).mockResolvedValue({
      success: true,
      newStatus: 'PENDING_LEGAL',
    });

    render(
      <SubmitRevisionModal
        isOpen={true}
        onClose={mockOnClose}
        contract={sampleContract}
        currentUser={mockUser}
        openTasksCount={1}
        onSubmitted={mockOnSubmitted}
      />
    );

    // Switch to keep_existing mode
    const keepModeBtn = screen.getByText(/Giữ bản hiện tại \(v2\) — Giải trình/i);
    fireEvent.click(keepModeBtn);

    // File upload area should be hidden, info banner should appear
    expect(screen.queryByText(/Nhấp để chọn tệp Word/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Giữ nguyên văn bản phiên bản v2/i)).toBeInTheDocument();

    // Type change summary explanation
    const textarea = screen.getByPlaceholderText(/Đã trao đổi với đối tác về điều khoản/i);
    fireEvent.change(textarea, {
      target: { value: 'Đã thống nhất giữ nguyên thời hạn công nợ do quy chế đặc thù của dự án.' },
    });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Gửi Giải Trình & Nộp Lại/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Must NOT upload any new file
      expect(taskService.uploadRevisionDocx).not.toHaveBeenCalled();
      // Must call executeStatusTransition with current version 2
      expect(taskService.executeStatusTransition).toHaveBeenCalledWith(
        'CTR-2609-0005',
        'PENDING_LEGAL',
        {
          changeSummary: 'Đã thống nhất giữ nguyên thời hạn công nợ do quy chế đặc thù của dự án.',
          versionNo: 2,
        }
      );
      expect(mockOnSubmitted).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('uploads file and advances version in upload_new mode when valid file and summary are provided', async () => {
    vi.mocked(taskService.uploadRevisionDocx).mockResolvedValue({
      versionId: 'v3',
      storagePath: 'contracts/CTR-2609-0005/versions/v3.docx',
    });
    vi.mocked(taskService.executeStatusTransition).mockResolvedValue({
      success: true,
      newStatus: 'PENDING_LEGAL',
    });

    const { container } = render(
      <SubmitRevisionModal
        isOpen={true}
        onClose={mockOnClose}
        contract={sampleContract}
        currentUser={mockUser}
        openTasksCount={0}
        onSubmitted={mockOnSubmitted}
      />
    );

    // Provide file
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const dummyFile = new File(['dummy docx content'], 'VanTai_v3.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    // Provide summary
    const textarea = screen.getByPlaceholderText(/Đã sửa thời hạn thanh toán thành 30 ngày/i);
    fireEvent.change(textarea, {
      target: { value: 'Đã cập nhật biểu giá cước vận tải mới theo thỏa thuận.' },
    });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Nộp Bản Sửa Đổi \(v3\)/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(taskService.uploadRevisionDocx).toHaveBeenCalledWith(
        'CTR-2609-0005',
        mockUser,
        dummyFile,
        3,
        'Đã cập nhật biểu giá cước vận tải mới theo thỏa thuận.',
        ''
      );
      expect(taskService.executeStatusTransition).toHaveBeenCalledWith(
        'CTR-2609-0005',
        'PENDING_LEGAL',
        {
          changeSummary: 'Đã cập nhật biểu giá cước vận tải mới theo thỏa thuận.',
          versionNo: 3,
        }
      );
      expect(mockOnSubmitted).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
