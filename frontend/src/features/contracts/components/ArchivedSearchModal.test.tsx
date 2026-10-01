import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArchivedSearchModal } from './ArchivedSearchModal';
import * as archivedService from '../services/archivedContractService';
import type { AuthUser, ContractDocument } from '@/shared';

const mockUser: AuthUser = {
  uid: 'u-1',
  email: 'u1@fev.com',
  displayName: 'User 1',
  role: 'LEGAL',
  isActive: true,
};

const sampleArchived: ContractDocument[] = [
  {
    contractId: 'CTR-2609-0001',
    title: 'Hợp đồng mua bao bì màng nhôm',
    supplier: 'Công ty Bao Bì Toàn Cầu',
    description: 'Bao bì màng nhôm',
    status: 'HOL_APPROVED',
    companyRole: 'BUYER',
    currentVersion: 2,
    currentVersionFile: { versionNo: 2, originalFileName: 'v2.docx', storagePath: '' },
    rejectCount: 1,
    isArchived: true,
    createdBy: { uid: 'u-1', email: 'u1@fev.com', displayName: 'User 1' },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    contractId: 'CTR-2609-0002',
    title: 'Hợp đồng logistics vận chuyển đường biển',
    supplier: 'Hãng tàu Biển Đông Logistics',
    description: 'Vận chuyển hàng hóa',
    status: 'COMPLETED',
    companyRole: 'BUYER',
    currentVersion: 1,
    currentVersionFile: { versionNo: 1, originalFileName: 'v1.docx', storagePath: '' },
    rejectCount: 0,
    isArchived: true,
    createdBy: { uid: 'u-2', email: 'u2@fev.com', displayName: 'User 2' },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('ArchivedSearchModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(archivedService, 'fetchArchivedContracts').mockResolvedValue(sampleArchived);
  });

  it('renders search modal and displays archived contracts list', async () => {
    render(
      <ArchivedSearchModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockUser}
        onSelectContract={vi.fn()}
      />
    );

    expect(screen.getByText('Tra Cứu Hồ Sơ Lưu Trữ')).toBeInTheDocument();
    expect(screen.queryByText('Các hợp đồng đã hoàn tất và lưu trữ trong hệ thống')).not.toBeInTheDocument();
    expect(screen.queryByText(/Tìm kiếm tức thì trong bộ nhớ RAM/i)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Tìm theo mã hợp đồng/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Hợp đồng mua bao bì màng nhôm')).toBeInTheDocument();
      expect(screen.getByText('Hợp đồng logistics vận chuyển đường biển')).toBeInTheDocument();
      // Badges should not be present
      expect(screen.queryByText(/Lần review thứ/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^v[0-9]+$/)).not.toBeInTheDocument();
      expect(screen.queryByText('Done WeSign')).not.toBeInTheDocument();
      expect(screen.queryByText('Approved')).not.toBeInTheDocument();
    });
  });

  it('filters contracts instantly on client-side when typing keyword', async () => {
    render(
      <ArchivedSearchModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockUser}
        onSelectContract={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Hợp đồng mua bao bì màng nhôm')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm theo mã hợp đồng/i);
    fireEvent.change(searchInput, { target: { value: 'logistics' } });

    expect(screen.queryByText('Hợp đồng mua bao bì màng nhôm')).not.toBeInTheDocument();
    expect(screen.getByText('Hợp đồng logistics vận chuyển đường biển')).toBeInTheDocument();
  });

  it('calls onSelectContract and onClose when clicking a contract card', async () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <ArchivedSearchModal
        isOpen={true}
        onClose={handleClose}
        currentUser={mockUser}
        onSelectContract={handleSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Hợp đồng mua bao bì màng nhôm')).toBeInTheDocument();
    });

    const contractCard = screen.getByText('Hợp đồng mua bao bì màng nhôm');
    fireEvent.click(contractCard);

    expect(handleSelect).toHaveBeenCalledWith('CTR-2609-0001');
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders contract ID and title inline without version, review count, or status badges', async () => {
    render(
      <ArchivedSearchModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockUser}
        onSelectContract={vi.fn()}
      />
    );

    await waitFor(() => {
      const contractCode = screen.getByText('CTR-2609-0001');
      const contractTitle = screen.getByText('Hợp đồng mua bao bì màng nhôm');
      expect(contractCode).toBeInTheDocument();
      expect(contractTitle).toBeInTheDocument();
      // Verify parent container holds both contractId and title inline
      expect(contractCode.parentElement).toContainElement(contractTitle);
    });

    // Ensure no badges exist
    expect(screen.queryByText('v2')).not.toBeInTheDocument();
    expect(screen.queryByText(/Lần review thứ/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
    expect(screen.queryByText('Done WeSign')).not.toBeInTheDocument();
  });
});
