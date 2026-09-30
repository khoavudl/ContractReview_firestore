/**
 * Unit Tests for useContracts and useCreateContract
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { AuthUser, ContractDocument } from '@/shared';
import { useContracts } from './useContracts';
import { useCreateContract } from './useCreateContract';
import * as contractService from '../services/contractService';

vi.mock('../services/contractService', async (importOriginal) => {
  const actual = await importOriginal<typeof contractService>();
  return {
    ...actual,
    subscribeContracts: vi.fn(),
    createContract: vi.fn(),
  };
});

describe('useContracts & useCreateContract', () => {
  const mockUser: AuthUser = {
    uid: 'u-sales',
    email: 'user@foodempire.vn',
    displayName: 'Sales Specialist',
    role: 'USER',
    isActive: true,
  };

  const sampleContracts: ContractDocument[] = [
    {
      contractId: 'CTR-2609-0001',
      title: 'Hợp đồng mua bao bì',
      supplier: 'Công ty Bao Bì Toàn Cầu',
      description: '',
      status: 'DRAFT',
      currentVersion: 1,
      createdBy: { uid: 'u-sales', email: 'user@foodempire.vn', displayName: 'Sales Specialist' },
      rejectCount: 0,
      isArchived: false,
      companyRole: 'BUYER',
      currentVersionFile: { versionNo: 1, originalFileName: '', storagePath: '', previewPdfPath: '' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      contractId: 'CTR-2609-0002',
      title: 'Hợp đồng mua hạt cà phê',
      supplier: 'Đắk Lắk Farm',
      description: '',
      status: 'PENDING_LEGAL',
      currentVersion: 1,
      createdBy: { uid: 'u-sales', email: 'user@foodempire.vn', displayName: 'Sales Specialist' },
      rejectCount: 0,
      isArchived: false,
      companyRole: 'BUYER',
      currentVersionFile: { versionNo: 1, originalFileName: '', storagePath: '', previewPdfPath: '' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useContracts', () => {
    it('returns empty list when user is null', () => {
      const { result } = renderHook(() => useContracts(null));
      expect(result.current.contracts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('subscribes and updates contracts from service', () => {
      vi.mocked(contractService.subscribeContracts).mockImplementation((_u, onData) => {
        onData(sampleContracts);
        return () => {};
      });

      const { result } = renderHook(() => useContracts(mockUser));

      expect(result.current.contracts.length).toBe(2);
      expect(result.current.metricCounts.all).toBe(2);
      expect(result.current.metricCounts.draft).toBe(1);
      expect(result.current.metricCounts.legal).toBe(1);
    });

    it('toggles metric filter group correctly (Click-to-Filter)', () => {
      vi.mocked(contractService.subscribeContracts).mockImplementation((_u, onData) => {
        onData(sampleContracts);
        return () => {};
      });

      const { result } = renderHook(() => useContracts(mockUser));

      // Click group 'draft'
      act(() => {
        result.current.toggleActiveGroup('draft');
      });
      expect(result.current.filterState.activeGroup).toBe('draft');
      expect(result.current.filteredContracts.length).toBe(1);
      expect(result.current.filteredContracts[0].contractId).toBe('CTR-2609-0001');

      // Click same group 'draft' again -> resets to 'ALL'
      act(() => {
        result.current.toggleActiveGroup('draft');
      });
      expect(result.current.filterState.activeGroup).toBe('ALL');
      expect(result.current.filteredContracts.length).toBe(2);
    });

    it('filters by search keyword', () => {
      vi.mocked(contractService.subscribeContracts).mockImplementation((_u, onData) => {
        onData(sampleContracts);
        return () => {};
      });

      const { result } = renderHook(() => useContracts(mockUser));

      act(() => {
        result.current.setSearchKeyword('cà phê');
      });

      expect(result.current.filteredContracts.length).toBe(1);
      expect(result.current.filteredContracts[0].contractId).toBe('CTR-2609-0002');

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filterState.searchKeyword).toBe('');
      expect(result.current.filteredContracts.length).toBe(2);
    });
  });

  describe('useCreateContract', () => {
    it('validates minimum title length of 5 chars', async () => {
      const { result } = renderHook(() => useCreateContract(mockUser));

      let id: string | null = null;
      await act(async () => {
        id = await result.current.submitContract({
          title: 'Hợp',
          supplier: 'Đối tác A',
          description: '',
        });
      });

      expect(id).toBeNull();
      expect(result.current.error).toContain('ít nhất 5 ký tự');
    });

    it('validates non-empty supplier', async () => {
      const { result } = renderHook(() => useCreateContract(mockUser));

      let id: string | null = null;
      await act(async () => {
        id = await result.current.submitContract({
          title: 'Hợp đồng mua bao bì mẫu',
          supplier: '   ',
          description: 'Cung cấp bao bì chất lượng cao',
        });
      });

      expect(id).toBeNull();
      expect(result.current.error).toContain('nhập tên đối tác');
    });

    it('validates non-empty description', async () => {
      const { result } = renderHook(() => useCreateContract(mockUser));

      let id: string | null = null;
      await act(async () => {
        id = await result.current.submitContract({
          title: 'Hợp đồng mua bao bì mẫu',
          supplier: 'Công ty Bao Bì Toàn Cầu',
          description: '   ',
        });
      });

      expect(id).toBeNull();
      expect(result.current.error).toContain('mô tả tóm tắt nội dung');
    });

    it('validates file is required and must be .docx', async () => {
      const { result } = renderHook(() => useCreateContract(mockUser));

      // Missing file
      let id: string | null = null;
      await act(async () => {
        id = await result.current.submitContract({
          title: 'Hợp đồng dịch vụ bảo vệ nhà máy',
          supplier: 'Bảo Vệ Thăng Long',
          description: 'Cung cấp 4 vị trí trực 24/7',
        });
      });

      expect(id).toBeNull();
      expect(result.current.error).toContain('đính kèm tệp hợp đồng Word (.docx)');

      // Invalid extension (e.g. pdf)
      const pdfFile = new File(['content'], 'hopdong.pdf', { type: 'application/pdf' });
      await act(async () => {
        id = await result.current.submitContract({
          title: 'Hợp đồng dịch vụ bảo vệ nhà máy',
          supplier: 'Bảo Vệ Thăng Long',
          description: 'Cung cấp 4 vị trí trực 24/7',
          file: pdfFile,
        });
      });

      expect(id).toBeNull();
      expect(result.current.error).toContain('chỉ chấp nhận tệp Word định dạng .docx');
    });

    it('creates contract successfully on valid input with .docx file', async () => {
      vi.mocked(contractService.createContract).mockResolvedValueOnce('CTR-2609-8888');

      const { result } = renderHook(() => useCreateContract(mockUser));
      const mockDocxFile = new File(['mock content'], 'Hop_dong_v1.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      let id: string | null = null;
      await act(async () => {
        id = await result.current.submitContract({
          title: 'Hợp đồng dịch vụ bảo vệ nhà máy',
          supplier: 'Bảo Vệ Thăng Long',
          description: 'Cung cấp 4 vị trí trực 24/7',
          file: mockDocxFile,
        });
      });

      expect(id).toBe('CTR-2609-8888');
      expect(result.current.error).toBeNull();
    });
  });
});
