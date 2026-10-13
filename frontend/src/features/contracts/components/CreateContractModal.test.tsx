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

  it('renders modal with form inputs and 2 separate upload boxes when isOpen is true', () => {
    render(<CreateContractModal {...defaultProps} />);

    expect(screen.getByText('Tạo Mới Hồ Sơ Hợp Đồng')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tiêu đề hợp đồng \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Đối tác \/ Nhà cung cấp \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Kéo thả hoặc chọn Hợp đồng chính/i)).toBeInTheDocument();
    expect(screen.getByText(/Kéo thả hoặc chọn Phụ lục \(nếu có\)/i)).toBeInTheDocument();

    // Create button is disabled when main contract file is not selected yet
    const submitBtn = screen.getByRole('button', { name: /Tạo Hồ Sơ/i });
    expect(submitBtn).toBeDisabled();
  });

  it('displays main contract badge and full filename tooltip when main file is selected', async () => {
    render(<CreateContractModal {...defaultProps} />);

    const mainInput = screen.getByTestId('main-file-input') as HTMLInputElement;
    const longFileName =
      'HopDong_MuaBan_BaoBi_MangNhom_NienVu_2026_PhienBan_ChinhThuc_RatDai.docx';
    const file = new File(['dummy content'], longFileName, {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    fireEvent.change(mainInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('⭐ HĐ Chính')).toBeInTheDocument();
      const fileNameEl = screen.getByText(longFileName);
      expect(fileNameEl).toBeInTheDocument();
      expect(fileNameEl).toHaveAttribute('title', longFileName);
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(longFileName);
    });

    // Up/down reorder buttons should not exist
    expect(screen.queryByTitle('Chuyển lên trên')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Chuyển xuống dưới')).not.toBeInTheDocument();
  });

  it('rejects dropping multiple files into the Main Contract box', async () => {
    render(<CreateContractModal {...defaultProps} />);

    const mainDropzone = screen.getByTestId('main-contract-dropzone');
    const file1 = new File(['doc1'], 'HD_1.docx', { type: 'docx' });
    const file2 = new File(['doc2'], 'HD_2.docx', { type: 'docx' });

    fireEvent.drop(mainDropzone, {
      dataTransfer: { files: [file1, file2] },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Khung Hợp đồng chính chỉ cho phép đính kèm duy nhất 1 tệp/i)
      ).toBeInTheDocument();
    });
  });

  it('displays annex badges and filename tooltips when one or multiple annexes are added', async () => {
    render(<CreateContractModal {...defaultProps} />);

    const annexInput = screen.getByTestId('annex-file-input') as HTMLInputElement;
    const annex1 = new File(['doc2'], 'PhuLuc_01_BangBaoGiaChiTiet_2026.docx', { type: 'docx' });
    const annex2 = new File(['doc3'], 'PhuLuc_02_CamKetChatLuong_SLA.docx', { type: 'docx' });

    fireEvent.change(annexInput, { target: { files: [annex1, annex2] } });

    await waitFor(() => {
      expect(screen.getByText('📎 PL01')).toBeInTheDocument();
      const a1El = screen.getByText('PhuLuc_01_BangBaoGiaChiTiet_2026.docx');
      expect(a1El).toHaveAttribute('title', 'PhuLuc_01_BangBaoGiaChiTiet_2026.docx');

      expect(screen.getByText('📎 PL02')).toBeInTheDocument();
      const a2El = screen.getByText('PhuLuc_02_CamKetChatLuong_SLA.docx');
      expect(a2El).toHaveAttribute('title', 'PhuLuc_02_CamKetChatLuong_SLA.docx');

      const tooltips = screen.getAllByRole('tooltip', { hidden: true });
      expect(tooltips).toHaveLength(2);
      expect(tooltips[0]).toHaveTextContent('PhuLuc_01_BangBaoGiaChiTiet_2026.docx');
      expect(tooltips[1]).toHaveTextContent('PhuLuc_02_CamKetChatLuong_SLA.docx');
    });
  });

  it('removes main file and annex files independently without promoting annex to main', async () => {
    render(<CreateContractModal {...defaultProps} />);

    const mainInput = screen.getByTestId('main-file-input') as HTMLInputElement;
    const annexInput = screen.getByTestId('annex-file-input') as HTMLInputElement;

    const mainFile = new File(['doc1'], 'Main.docx', { type: 'docx' });
    const annexFile = new File(['doc2'], 'Annex.docx', { type: 'docx' });

    fireEvent.change(mainInput, { target: { files: [mainFile] } });
    fireEvent.change(annexInput, { target: { files: [annexFile] } });

    await waitFor(() => {
      expect(screen.getByText('Main.docx')).toBeInTheDocument();
      expect(screen.getByText('Annex.docx')).toBeInTheDocument();
    });

    // Remove Main.docx
    fireEvent.click(screen.getByTitle('Xóa Hợp đồng chính'));

    await waitFor(() => {
      expect(screen.queryByText('Main.docx')).not.toBeInTheDocument();
      // Annex remains in Annex box as PL01 (never promoted to Main)
      expect(screen.getByText('Annex.docx')).toBeInTheDocument();
      expect(screen.getByText('📎 PL01')).toBeInTheDocument();
      expect(screen.queryByText('⭐ HĐ Chính')).not.toBeInTheDocument();
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

    const mainInput = screen.getByTestId('main-file-input') as HTMLInputElement;
    const annexInput = screen.getByTestId('annex-file-input') as HTMLInputElement;
    const mainFile = new File(['content'], 'HD_Chinh.docx', { type: 'docx' });
    const annexFile = new File(['annex'], 'PL_Gia.docx', { type: 'docx' });

    fireEvent.change(mainInput, { target: { files: [mainFile] } });
    fireEvent.change(annexInput, { target: { files: [annexFile] } });

    await waitFor(() => {
      expect(screen.getByText('HD_Chinh.docx')).toBeInTheDocument();
      expect(screen.getByText('PL_Gia.docx')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Tạo Hồ Sơ/i });
    expect(submitBtn).not.toBeDisabled();
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

  it('blocks duplicate filenames between Main Contract and Annexes and among Annexes', async () => {
    render(<CreateContractModal {...defaultProps} />);

    const mainInput = screen.getByTestId('main-file-input') as HTMLInputElement;
    const annexInput = screen.getByTestId('annex-file-input') as HTMLInputElement;

    const mainFile = new File(['content'], 'HopDong_Goc.docx', { type: 'docx' });
    fireEvent.change(mainInput, { target: { files: [mainFile] } });

    await waitFor(() => {
      expect(screen.getByText('HopDong_Goc.docx')).toBeInTheDocument();
    });

    // 1. Try adding an annex with the same name as Main Contract (case-insensitive)
    const dupWithMain = new File(['dup'], 'hopdong_goc.docx', { type: 'docx' });
    fireEvent.change(annexInput, { target: { files: [dupWithMain] } });

    await waitFor(() => {
      expect(
        screen.getByText(/trùng tên với Hợp đồng chính\. Vui lòng không chọn các tệp trùng tên/i)
      ).toBeInTheDocument();
    });

    // 2. Add a valid annex, then try adding another annex with the same name
    const validAnnex = new File(['annex1'], 'PhuLuc_01.docx', { type: 'docx' });
    fireEvent.change(annexInput, { target: { files: [validAnnex] } });

    await waitFor(() => {
      expect(screen.getByText('PhuLuc_01.docx')).toBeInTheDocument();
    });

    const dupAnnex = new File(['annex2'], 'PHULUC_01.docx', { type: 'docx' });
    fireEvent.change(annexInput, { target: { files: [dupAnnex] } });

    await waitFor(() => {
      expect(
        screen.getByText(/đã được đính kèm trước đó\. Vui lòng không chọn các tệp trùng tên/i)
      ).toBeInTheDocument();
    });

    // 3. Remove Main Contract and try selecting PhuLuc_01.docx as Main Contract
    fireEvent.click(screen.getByTitle('Xóa Hợp đồng chính'));
    const conflictMain = new File(['main'], 'PhuLuc_01.docx', { type: 'docx' });
    fireEvent.change(mainInput, { target: { files: [conflictMain] } });

    await waitFor(() => {
      expect(
        screen.getByText(/đã có trong danh sách Phụ lục đính kèm\. Vui lòng không chọn các tệp trùng tên/i)
      ).toBeInTheDocument();
    });
  });
});
