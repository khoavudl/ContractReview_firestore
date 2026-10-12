/**
 * Unit Tests for useDocumentViewer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ContractVersionItem } from '../types';
import { useDocumentViewer } from './useDocumentViewer';
import * as storageService from '../services/storageService';

vi.mock('../services/storageService', () => ({
  fetchDocumentArrayBuffer: vi.fn(),
  fetchSignedDocumentUrl: vi.fn(),
  fetchDocxArrayBuffer: vi.fn(),
}));

describe('useDocumentViewer', () => {
  const mockBuffer = new ArrayBuffer(16);
  const mockVersions: ContractVersionItem[] = [
    {
      versionNo: 1,
      versionId: 'v1',
      originalFileName: 'HopDong_v1.docx',
      storagePath: 'contracts/CTR-2609-0001/versions/v1.docx',
      uploadedBy: { uid: 'u1', email: 'user@test.vn', displayName: 'User 1' },
      changeSummary: 'Bản thảo ban đầu',
      uploadedAt: new Date(),
    },
    {
      versionNo: 2,
      versionId: 'v2',
      originalFileName: 'HopDong_v2.docx',
      storagePath: 'contracts/CTR-2609-0001/versions/v2.docx',
      uploadedBy: { uid: 'u1', email: 'user@test.vn', displayName: 'User 1' },
      changeSummary: 'Sửa điều khoản 4 & 5',
      uploadedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storageService.fetchDocumentArrayBuffer).mockResolvedValue(mockBuffer);
  });

  it('initializes with the latest version when none specified', async () => {
    let result!: { current: ReturnType<typeof useDocumentViewer> };
    await act(async () => {
      const rendered = renderHook(() =>
        useDocumentViewer('CTR-2609-0001', mockVersions)
      );
      result = rendered.result;
    });

    expect(result.current.selectedVersion?.versionNo).toBe(2);
    expect(result.current.zoomLevel).toBe(75);
    expect(result.current.isFullscreen).toBe(false);
    expect(result.current.docxUrl).toBe('direct://array-buffer');
    expect(result.current.docxBuffer).toBe(mockBuffer);
  });

  it('handles zoom in and zoom out within defined boundaries', async () => {
    let result!: { current: ReturnType<typeof useDocumentViewer> };
    await act(async () => {
      const rendered = renderHook(() =>
        useDocumentViewer('CTR-2609-0001', mockVersions, 1)
      );
      result = rendered.result;
    });

    expect(result.current.zoomLevel).toBe(75);

    // Zoom out at min boundary (75%) should stay 75%
    act(() => {
      result.current.zoomOut();
    });
    expect(result.current.zoomLevel).toBe(75);

    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.zoomLevel).toBe(100);

    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.zoomLevel).toBe(125);

    act(() => {
      result.current.zoomIn();
      result.current.zoomIn();
      result.current.zoomIn(); // exceeds max 200
    });
    expect(result.current.zoomLevel).toBe(200);

    act(() => {
      result.current.zoomOut();
    });
    expect(result.current.zoomLevel).toBe(150);
  });

  it('respects custom initialZoom parameter', async () => {
    let result!: { current: ReturnType<typeof useDocumentViewer> };
    await act(async () => {
      const rendered = renderHook(() =>
        useDocumentViewer('CTR-2609-0001', mockVersions, 1, undefined, 125)
      );
      result = rendered.result;
    });

    expect(result.current.zoomLevel).toBe(125);
  });

  it('toggles fullscreen state', async () => {
    let result!: { current: ReturnType<typeof useDocumentViewer> };
    await act(async () => {
      const rendered = renderHook(() =>
        useDocumentViewer('CTR-2609-0001', mockVersions)
      );
      result = rendered.result;
    });

    expect(result.current.isFullscreen).toBe(false);

    act(() => {
      result.current.toggleFullscreen();
    });
    expect(result.current.isFullscreen).toBe(true);

    act(() => {
      result.current.toggleFullscreen();
    });
    expect(result.current.isFullscreen).toBe(false);
  });

  it('switches version via selectVersion', async () => {
    let result!: { current: ReturnType<typeof useDocumentViewer> };
    await act(async () => {
      const rendered = renderHook(() =>
        useDocumentViewer('CTR-2609-0001', mockVersions, 2)
      );
      result = rendered.result;
    });

    expect(result.current.selectedVersion?.versionNo).toBe(2);

    await act(async () => {
      result.current.selectVersion(1);
    });

    expect(result.current.selectedVersion?.versionNo).toBe(1);
  });

  it('sets error and FILE_NOT_FOUND when storagePath is missing', async () => {
    const versionsWithoutPath: ContractVersionItem[] = [
      {
        versionNo: 1,
        versionId: 'v1',
        originalFileName: 'Missing.docx',
        storagePath: '',
        uploadedBy: { uid: 'u1', email: 'user@test.vn', displayName: 'User 1' },
        uploadedAt: new Date(),
      },
    ];

    let result!: { current: ReturnType<typeof useDocumentViewer> };
    await act(async () => {
      const rendered = renderHook(() =>
        useDocumentViewer('CTR-1', versionsWithoutPath, 1)
      );
      result = rendered.result;
    });

    expect(result.current.errorType).toBe('FILE_NOT_FOUND');
    expect(result.current.error).toContain('chưa sẵn sàng');
    expect(result.current.docxBuffer).toBeNull();
  });

  it('builds document tabs including annexes from version snapshot', async () => {
    const versionsWithAnnexes: ContractVersionItem[] = [
      {
        versionNo: 1,
        versionId: 'v1',
        originalFileName: 'HD_Chinh.docx',
        storagePath: 'contracts/CTR-1/versions/v1.docx',
        annexFiles: [
          {
            annexId: 'PL01',
            label: 'Phụ lục 1: Báo giá',
            originalFileName: 'PL01_Gia.docx',
            storagePath: 'contracts/CTR-1/versions/v1_PL01.docx',
            sourceVersionNo: 1,
            order: 1,
          },
        ],
        uploadedBy: { uid: 'u1', email: 'user@test.vn', displayName: 'User 1' },
        uploadedAt: new Date(),
      },
    ];

    let result!: { current: ReturnType<typeof useDocumentViewer> };
    await act(async () => {
      const rendered = renderHook(() =>
        useDocumentViewer('CTR-1', versionsWithAnnexes, 1)
      );
      result = rendered.result;
    });

    expect(result.current.documentTabs).toHaveLength(2);
    expect(result.current.documentTabs[0].id).toBe('MAIN');
    expect(result.current.documentTabs[1].id).toBe('PL01');
    expect(result.current.activeDocumentId).toBe('MAIN');
  });

  it('switches active document and loads buffer for selected annex', async () => {
    const versionsWithAnnexes: ContractVersionItem[] = [
      {
        versionNo: 1,
        versionId: 'v1',
        originalFileName: 'HD_Chinh.docx',
        storagePath: 'contracts/CTR-1/versions/v1.docx',
        annexFiles: [
          {
            annexId: 'PL01',
            label: 'Phụ lục 1: Báo giá',
            originalFileName: 'PL01_Gia.docx',
            storagePath: 'contracts/CTR-1/versions/v1_PL01.docx',
            sourceVersionNo: 1,
            order: 1,
          },
        ],
        uploadedBy: { uid: 'u1', email: 'user@test.vn', displayName: 'User 1' },
        uploadedAt: new Date(),
      },
    ];

    let result!: { current: ReturnType<typeof useDocumentViewer> };
    await act(async () => {
      const rendered = renderHook(() =>
        useDocumentViewer('CTR-1', versionsWithAnnexes, 1)
      );
      result = rendered.result;
    });

    await act(async () => {
      result.current.selectDocument('PL01');
    });

    expect(result.current.activeDocumentId).toBe('PL01');
    expect(storageService.fetchDocumentArrayBuffer).toHaveBeenCalledWith(
      'CTR-1',
      'contracts/CTR-1/versions/v1_PL01.docx'
    );
  });

  it('respects empty annexFiles snapshot in v2 when all annexes are removed', async () => {
    const versions: ContractVersionItem[] = [
      {
        versionNo: 1,
        versionId: 'v1',
        originalFileName: 'HD_v1.docx',
        storagePath: 'contracts/CTR-1/versions/v1.docx',
        annexFiles: [
          {
            annexId: 'PL01',
            label: 'PL01',
            originalFileName: 'PL01_v1.docx',
            storagePath: 'contracts/CTR-1/versions/v1_PL01.docx',
            sourceVersionNo: 1,
            order: 1,
          },
        ],
        uploadedBy: { uid: 'u1', email: 'user@test.vn', displayName: 'User 1' },
        uploadedAt: new Date(),
      },
      {
        versionNo: 2,
        versionId: 'v2',
        originalFileName: 'HD_v2.docx',
        storagePath: 'contracts/CTR-1/versions/v2.docx',
        annexFiles: [],
        uploadedBy: { uid: 'u1', email: 'user@test.vn', displayName: 'User 1' },
        uploadedAt: new Date(),
      },
    ];

    let result!: { current: ReturnType<typeof useDocumentViewer> };
    await act(async () => {
      const rendered = renderHook(() =>
        useDocumentViewer('CTR-1', versions, 2)
      );
      result = rendered.result;
    });

    expect(result.current.documentTabs).toHaveLength(1);
    expect(result.current.documentTabs[0].id).toBe('MAIN');
  });
});

