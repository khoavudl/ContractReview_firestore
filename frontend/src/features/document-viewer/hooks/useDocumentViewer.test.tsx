/**
 * Unit Tests for useDocumentViewer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ContractVersionItem } from '../types';
import { useDocumentViewer } from './useDocumentViewer';
import * as storageService from '../services/storageService';

vi.mock('../services/storageService', () => ({
  fetchSignedDocumentUrl: vi.fn(),
}));

describe('useDocumentViewer', () => {
  const mockVersions: ContractVersionItem[] = [
    {
      versionNo: 1,
      versionId: 'v1',
      originalFileName: 'HopDong_v1.docx',
      storagePath: 'contracts/CTR-2609-0001/versions/v1.docx',
      previewPdfPath: 'contracts/CTR-2609-0001/previews/v1.pdf',
      uploadedBy: { uid: 'u1', email: 'user@test.vn', displayName: 'User 1' },
      changeSummary: 'Bản thảo ban đầu',
      uploadedAt: new Date(),
    },
    {
      versionNo: 2,
      versionId: 'v2',
      originalFileName: 'HopDong_v2.docx',
      storagePath: 'contracts/CTR-2609-0001/versions/v2.docx',
      previewPdfPath: 'contracts/CTR-2609-0001/previews/v2.pdf',
      uploadedBy: { uid: 'u1', email: 'user@test.vn', displayName: 'User 1' },
      changeSummary: 'Sửa điều khoản 4 & 5',
      uploadedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with the latest version when none specified', async () => {
    vi.mocked(storageService.fetchSignedDocumentUrl).mockResolvedValue('https://signed.url/v2.pdf');

    let result!: { current: ReturnType<typeof useDocumentViewer> };
    await act(async () => {
      const rendered = renderHook(() =>
        useDocumentViewer('CTR-2609-0001', mockVersions)
      );
      result = rendered.result;
    });

    expect(result.current.selectedVersion?.versionNo).toBe(2);
    expect(result.current.zoomLevel).toBe(100);
    expect(result.current.isFullscreen).toBe(false);
  });

  it('handles zoom in and zoom out within defined boundaries', async () => {
    let result!: { current: ReturnType<typeof useDocumentViewer> };
    await act(async () => {
      const rendered = renderHook(() =>
        useDocumentViewer('CTR-2609-0001', mockVersions, 1)
      );
      result = rendered.result;
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
    vi.mocked(storageService.fetchSignedDocumentUrl).mockResolvedValue('https://signed.url/test');

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

  it('sets error and CONVERTING type when preview pdf is missing', async () => {
    const versionsWithoutPdf: ContractVersionItem[] = [
      {
        versionNo: 1,
        versionId: 'v1',
        originalFileName: 'ChuaConvert.docx',
        storagePath: 'contracts/CTR-1/versions/v1.docx',
        previewPdfPath: '',
        uploadedBy: { uid: 'u1', email: 'user@test.vn', displayName: 'User 1' },
        uploadedAt: new Date(),
      },
    ];

    vi.mocked(storageService.fetchSignedDocumentUrl).mockResolvedValue('https://signed.url/doc.docx');

    const { result } = renderHook(() =>
      useDocumentViewer('CTR-1', versionsWithoutPdf, 1)
    );

    // Wait for effect
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.errorType).toBe('CONVERTING');
    expect(result.current.error).toContain('Bản PDF đang được xử lý');
    expect(result.current.docxUrl).toBe('https://signed.url/doc.docx');
    expect(result.current.pdfUrl).toBeNull();
  });
});
