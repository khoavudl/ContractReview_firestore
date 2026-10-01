/**
 * Unit Tests for ContractTable
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContractTable } from './ContractTable';
import type { ContractDocument } from '@/shared';

describe('ContractTable', () => {
  const sampleContracts: ContractDocument[] = [
    {
      contractId: 'CTR-2609-0001',
      title: 'Hợp đồng mua bao bì màng nhôm',
      supplier: 'Bao Bì Toàn Cầu',
      description: '',
      status: 'DRAFT',
      currentVersion: 1,
      createdBy: { uid: 'u1', email: 'sales@foodempire.vn', displayName: 'Nguyễn Văn A' },
      rejectCount: 0,
      isArchived: false,
      companyRole: 'BUYER',
      currentVersionFile: { versionNo: 1, originalFileName: '', storagePath: '' },
      createdAt: new Date('2026-09-25T08:00:00Z'),
      updatedAt: new Date('2026-09-25T09:30:00Z'),
    },
    {
      contractId: 'CTR-2609-0002',
      title: 'Hợp đồng hạt cà phê Robusta',
      supplier: 'Đắk Lắk Farm',
      description: '',
      status: 'LEGAL_APPROVED',
      currentVersion: 2,
      createdBy: { uid: 'u2', email: 'sales2@foodempire.vn', displayName: 'Trần Văn B' },
      rejectCount: 1,
      isArchived: false,
      companyRole: 'BUYER',
      currentVersionFile: { versionNo: 2, originalFileName: '', storagePath: '' },
      createdAt: new Date('2026-09-26T08:00:00Z'),
      updatedAt: new Date('2026-09-26T09:30:00Z'),
    },
  ];

  it('renders empty state when contract list is empty', () => {
    const onCreateNew = vi.fn();
    render(
      <ContractTable
        contracts={[]}
        onSelectContract={vi.fn()}
        onCreateNew={onCreateNew}
        canCreate={true}
      />
    );

    expect(screen.getByText('Không có hồ sơ hợp đồng nào')).toBeInTheDocument();
    const createBtn = screen.getByText('Tạo Hồ Sơ Mới');
    fireEvent.click(createBtn);
    expect(onCreateNew).toHaveBeenCalledTimes(1);
  });

  it('renders contracts rows with correct content', () => {
    render(
      <ContractTable
        contracts={sampleContracts}
        onSelectContract={vi.fn()}
      />
    );

    expect(screen.getByText('CTR-2609-0001')).toBeInTheDocument();
    expect(screen.getByText('Hợp đồng mua bao bì màng nhôm')).toBeInTheDocument();
    expect(screen.getByText('Bao Bì Toàn Cầu')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('Bản nháp')).toBeInTheDocument();

    expect(screen.getByText('CTR-2609-0002')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.queryByText('(1 sửa)')).not.toBeInTheDocument();
    expect(screen.queryByText('Thao Tác')).not.toBeInTheDocument();
    expect(screen.queryByText('Mở')).not.toBeInTheDocument();
  });

  it('triggers onSelectContract when clicking row', () => {
    const onSelect = vi.fn();
    render(
      <ContractTable
        contracts={sampleContracts}
        onSelectContract={onSelect}
      />
    );

    const row = screen.getByText('CTR-2609-0001').closest('tr');
    expect(row).not.toBeNull();
    fireEvent.click(row!);

    expect(onSelect).toHaveBeenCalledWith('CTR-2609-0001');
  });
});
