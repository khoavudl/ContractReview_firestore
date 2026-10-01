import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefFileList } from './RefFileList';
import {
  subscribeToReferenceFiles,
  DEV_SAMPLE_REF_FILES,
} from '../services/refFileService';

vi.mock('../services/refFileService', () => ({
  subscribeToReferenceFiles: vi.fn(),
  uploadReferenceFile: vi.fn(),
  deleteReferenceFile: vi.fn(),
  DEV_SAMPLE_REF_FILES: {
    'CTR-2609-0001': [
      {
        fileId: 'ref-001',
        fileName: 'Bao_gia_Cloud_Global.pdf',
        storagePath: 'path/1.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        uploadedBy: { uid: 'user-01', displayName: 'Người Phụ Trách' },
        uploadedAt: new Date('2026-09-28T10:00:00Z'),
      },
    ],
  },
}));

describe('RefFileList Component', () => {
  const mockUser = {
    uid: 'user-01',
    displayName: 'Người Phụ Trách',
    email: 'user@fev.com',
    role: 'USER' as const,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(subscribeToReferenceFiles).mockImplementation((_id, onUpdate) => {
      onUpdate(DEV_SAMPLE_REF_FILES['CTR-2609-0001'] as any);
      return () => {};
    });
  });

  it('renders reference files list and upload dropzone', async () => {
    render(
      <RefFileList
        contractId="CTR-2609-0001"
        currentUser={mockUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tài liệu tham chiếu đính kèm (1)')).toBeInTheDocument();
    });

    expect(screen.getByText('Bao_gia_Cloud_Global.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    expect(screen.getByText(/Kéo thả tệp vào đây hoặc nhấn để chọn/)).toBeInTheDocument();
  });

  it('shows delete button for own files and permits clicking', async () => {
    render(
      <RefFileList
        contractId="CTR-2609-0001"
        currentUser={mockUser} // uid: user-01 matches ref-001 uploader
      />
    );

    await waitFor(() => {
      expect(screen.getByTitle('Xóa tệp đính kèm')).toBeInTheDocument();
    });
  });

  it('hides delete button when current user is not the uploader and not HOL', async () => {
    const otherUser = {
      uid: 'other-user',
      displayName: 'Other',
      email: 'other@fev.com',
      role: 'USER' as const,
      isActive: true,
    };

    render(
      <RefFileList
        contractId="CTR-2609-0001"
        currentUser={otherUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Bao_gia_Cloud_Global.pdf')).toBeInTheDocument();
    });

    expect(screen.queryByTitle('Xóa tệp đính kèm')).not.toBeInTheDocument();
  });

  it('hides upload dropzone and delete buttons when contract is approved', async () => {
    render(
      <RefFileList
        contractId="CTR-2609-0001"
        currentUser={mockUser}
        contractStatus="HOL_APPROVED"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tài liệu tham chiếu đính kèm (1)')).toBeInTheDocument();
    });

    expect(screen.getByText(/Hồ sơ đã duyệt \(Chỉ xem\)/)).toBeInTheDocument();
    expect(screen.queryByText(/Kéo thả tệp vào đây hoặc nhấn để chọn/)).not.toBeInTheDocument();
    expect(screen.queryByTitle('Xóa tệp đính kèm')).not.toBeInTheDocument();
  });

  it('hides upload dropzone when USER views contract at PENDING_LEGAL stage', async () => {
    render(
      <RefFileList
        contractId="CTR-2609-0001"
        currentUser={mockUser}
        contractStatus="PENDING_LEGAL"
        createdByUid="user-01"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tài liệu tham chiếu đính kèm (1)')).toBeInTheDocument();
    });

    expect(screen.getByText(/Chỉ vai trò phụ trách giai đoạn này mới được tải lên/)).toBeInTheDocument();
    expect(screen.queryByText(/Kéo thả tệp vào đây hoặc nhấn để chọn/)).not.toBeInTheDocument();
  });

  it('shows upload dropzone when LEGAL views contract at PENDING_LEGAL stage', async () => {
    const legalUser = {
      uid: 'legal-01',
      displayName: 'Chuyên viên Legal',
      email: 'legal@fev.com',
      role: 'LEGAL' as const,
      isActive: true,
    };

    render(
      <RefFileList
        contractId="CTR-2609-0001"
        currentUser={legalUser}
        contractStatus="PENDING_LEGAL"
        createdByUid="user-01"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tài liệu tham chiếu đính kèm (1)')).toBeInTheDocument();
    });

    expect(screen.getByText(/Kéo thả tệp vào đây hoặc nhấn để chọn/)).toBeInTheDocument();
  });

  it('hides upload dropzone when HOL views contract at PENDING_LEGAL stage', async () => {
    const holUser = {
      uid: 'hol-01',
      displayName: 'Trưởng phòng Pháp chế',
      email: 'hol@fev.com',
      role: 'HOL' as const,
      isActive: true,
    };

    render(
      <RefFileList
        contractId="CTR-2609-0001"
        currentUser={holUser}
        contractStatus="PENDING_LEGAL"
        createdByUid="user-01"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tài liệu tham chiếu đính kèm (1)')).toBeInTheDocument();
    });

    expect(screen.getByText(/Chỉ vai trò phụ trách giai đoạn này mới được tải lên/)).toBeInTheDocument();
    expect(screen.queryByText(/Kéo thả tệp vào đây hoặc nhấn để chọn/)).not.toBeInTheDocument();
  });
});
