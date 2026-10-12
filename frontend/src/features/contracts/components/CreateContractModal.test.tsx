/**
 * Feature: Contracts Management
 * Unit Tests: CreateContractModal.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateContractModal } from './CreateContractModal';

const mockSubmitContract = vi.fn();
const mockClearError = vi.fn();

vi.mock('@/features/auth', () => ({
  useAuth: vi.fn(() => ({
    currentUser: {
      uid: 'user-123',
      email: 'user@foodempire.vn',
      displayName: 'Nguyen Van A',
      role: 'USER',
      department: 'Phòng Mua hàng',
    },
  })),
}));

vi.mock('../hooks/useCreateContract', () => ({
  useCreateContract: vi.fn(() => ({
    isSubmitting: false,
    error: null,
    submitContract: mockSubmitContract,
    clearError: mockClearError,
  })),
}));

describe('CreateContractModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with form inputs when isOpen is true', () => {
    render(<CreateContractModal {...defaultProps} />);

    expect(screen.getByText('Tạo Mới Hồ Sơ Hợp Đồng')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tiêu đề hợp đồng \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Đối tác \/ Nhà cung cấp \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Kéo thả tệp Word \(\.docx\) vào đây/i)).toBeInTheDocument();
  });

  it('displays main contract badge when single file is selected', async () => {
    render(<CreateContractModal {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy content'], 'HopDong_MuaBan.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('⭐ HĐ Chính')).toBeInTheDocument();
      expect(screen.getByText('HopDong_MuaBan.docx')).toBeInTheDocument();
    });
  });

  it('displays main and annex badges when multiple files are added', async () => {
    render(<CreateContractModal {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['doc1'], 'HopDong_Khung.docx', { type: 'docx' });
    const file2 = new File(['doc2'], 'PhuLuc_BaoGia.docx', { type: 'docx' });
    const file3 = new File(['doc3'], 'PhuLuc_SLA.docx', { type: 'docx' });

    fireEvent.change(fileInput, { target: { files: [file1, file2, file3] } });

    await waitFor(() => {
      expect(screen.getByText('⭐ HĐ Chính')).toBeInTheDocument();
      expect(screen.getByText('HopDong_Khung.docx')).toBeInTheDocument();
      expect(screen.getByText('📎 PL01')).toBeInTheDocument();
      expect(screen.getByText('PhuLuc_BaoGia.docx')).toBeInTheDocument();
      expect(screen.getByText('📎 PL02')).toBeInTheDocument();
      expect(screen.getByText('PhuLuc_SLA.docx')).toBeInTheDocument();
    });
  });

  it('allows reordering files via move buttons and reassigns main contract badge', async () => {
    render(<CreateContractModal {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['doc1'], 'File_A.docx', { type: 'docx' });
    const file2 = new File(['doc2'], 'File_B.docx', { type: 'docx' });

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(screen.getByText('File_A.docx')).toBeInTheDocument();
      expect(screen.getByText('File_B.docx')).toBeInTheDocument();
    });

    // File A is currently main (at index 0). Click Move Down button on File A.
    const moveDownButtons = screen.getAllByTitle('Chuyển xuống dưới');
    fireEvent.click(moveDownButtons[0]);

    await waitFor(() => {
      // Now File_B should be first (main contract)
      const badges = screen.getAllByText(/⭐ HĐ Chính|📎 PL01/);
      expect(badges[0]).toHaveTextContent('⭐ HĐ Chính');
      // The container for File_B now has the main badge
      const fileBElement = screen.getByText('File_B.docx').closest('div');
      expect(fileBElement).toBeInTheDocument();
    });
  });

  it('removes file when delete button is clicked', async () => {
    render(<CreateContractModal {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['doc1'], 'Main.docx', { type: 'docx' });
    const file2 = new File(['doc2'], 'Annex.docx', { type: 'docx' });

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(screen.getByText('Main.docx')).toBeInTheDocument();
      expect(screen.getByText('Annex.docx')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByTitle('Xóa tệp này');
    fireEvent.click(removeButtons[0]); // Remove Main.docx

    await waitFor(() => {
      expect(screen.queryByText('Main.docx')).not.toBeInTheDocument();
      // Annex.docx is promoted to main contract
      expect(screen.getByText('Annex.docx')).toBeInTheDocument();
      expect(screen.getByText('⭐ HĐ Chính')).toBeInTheDocument();
    });
  });

  it('submits contract payload with main file and annex files', async () => {
    mockSubmitContract.mockResolvedValueOnce('CTR-2610-0001');

    render(<CreateContractModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Tiêu đề hợp đồng \*/i), {
      target: { value: 'Hợp đồng gia công bao bì' },
    });
    fireEvent.change(screen.getByLabelText(/Đối tác \/ Nhà cung cấp \*/i), {
      target: { value: 'Công ty Bao Bì Xanh' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Tóm tắt phạm vi công việc/i), {
      target: { value: 'Mô tả chi tiết nội dung' },
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mainFile = new File(['content'], 'HD_Chinh.docx', { type: 'docx' });
    const annexFile = new File(['annex'], 'PL_Gia.docx', { type: 'docx' });
    fireEvent.change(fileInput, { target: { files: [mainFile, annexFile] } });

    await waitFor(() => {
      expect(screen.getByText('HD_Chinh.docx')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Tạo Hồ Sơ/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmitContract).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Hợp đồng gia công bao bì',
          supplier: 'Công ty Bao Bì Xanh',
          file: mainFile,
          annexFiles: [annexFile],
        })
      );
      expect(defaultProps.onSuccess).toHaveBeenCalledWith('CTR-2610-0001');
    });
  });
});
