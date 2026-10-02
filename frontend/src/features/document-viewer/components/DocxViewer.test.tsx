/**
 * Unit Tests for DocxViewer Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { DocxViewer } from './DocxViewer';
import type { ContractVersionItem } from '../types';
import * as useDocumentViewerModule from '../hooks/useDocumentViewer';
import { renderAsync } from 'docx-preview';

vi.mock('docx-preview', () => ({
  renderAsync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../hooks/useDocumentViewer', () => ({
  useDocumentViewer: vi.fn(),
}));

describe('DocxViewer', () => {
  const mockVersions: ContractVersionItem[] = [
    {
      versionNo: 1,
      versionId: 'v1',
      originalFileName: 'BaoBi_v1.docx',
      storagePath: 'contracts/CTR-1/v1.docx',
      uploadedBy: { uid: 'u1', email: 'test@vn.com', displayName: 'Test User' },
      uploadedAt: new Date(),
    },
  ];

  it('renders empty state when errorType is FILE_NOT_FOUND', () => {
    vi.mocked(useDocumentViewerModule.useDocumentViewer).mockReturnValue({
      docxUrl: null,
      docxBuffer: null,
      isLoading: false,
      error: 'Chưa có file',
      errorType: 'FILE_NOT_FOUND',
      zoomLevel: 100,
      isFullscreen: false,
      selectedVersion: null,
      selectVersion: vi.fn(),
      setZoomLevel: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      toggleFullscreen: vi.fn(),
      refreshUrls: vi.fn(),
      downloadFile: vi.fn(),
    });

    render(
      <DocxViewer
        contractId="CTR-1"
        title="Hợp đồng mua bao bì"
        versions={[]}
      />
    );

    expect(screen.getByText(/Chưa có tệp tin văn bản/i)).toBeInTheDocument();
  });

  it('renders error state with download fallback when error occurs', () => {
    vi.mocked(useDocumentViewerModule.useDocumentViewer).mockReturnValue({
      docxUrl: 'https://download.docx',
      docxBuffer: null,
      isLoading: false,
      error: 'Lỗi khi tải tài liệu',
      errorType: 'NETWORK_ERROR',
      zoomLevel: 100,
      isFullscreen: false,
      selectedVersion: mockVersions[0],
      selectVersion: vi.fn(),
      setZoomLevel: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      toggleFullscreen: vi.fn(),
      refreshUrls: vi.fn(),
      downloadFile: vi.fn(),
    });

    render(
      <DocxViewer
        contractId="CTR-1"
        title="Hợp đồng mua bao bì"
        versions={mockVersions}
      />
    );

    expect(screen.getByText(/Không thể hiển thị văn bản xem trước/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Tải file Word \(\.docx\)/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders docx container and calls renderAsync when docxBuffer is provided', async () => {
    const mockBuffer = new ArrayBuffer(8);
    vi.mocked(useDocumentViewerModule.useDocumentViewer).mockReturnValue({
      docxUrl: 'https://storage.googleapis.com/test.docx',
      docxBuffer: mockBuffer,
      isLoading: false,
      error: null,
      errorType: null,
      zoomLevel: 100,
      isFullscreen: false,
      selectedVersion: mockVersions[0],
      selectVersion: vi.fn(),
      setZoomLevel: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      toggleFullscreen: vi.fn(),
      refreshUrls: vi.fn(),
      downloadFile: vi.fn(),
    });

    await act(async () => {
      render(
        <DocxViewer
          contractId="CTR-1"
          title="Hợp đồng mua bao bì"
          versions={mockVersions}
        />
      );
    });

    const container = screen.getByTestId('docx-render-container');
    expect(container).toBeInTheDocument();
    expect(renderAsync).toHaveBeenCalledWith(
      mockBuffer,
      expect.anything(),
      undefined,
      expect.objectContaining({ inWrapper: true, breakPages: true })
    );
  });

  it('opens warning modal when downloading an older unapproved version of an approved contract', async () => {
    const mockDownload = vi.fn();
    const approvedContract = {
      contractId: 'CTR-1',
      title: 'Hợp đồng mua bao bì',
      supplier: 'Bao bì ABC',
      description: 'Mô tả',
      status: 'HOL_APPROVED' as const,
      currentVersion: 2,
      createdBy: { uid: 'u1', email: 'test@vn.com', displayName: 'User' },
      rejectCount: 0,
      isArchived: false,
      companyRole: 'BUYER' as const,
      currentVersionFile: { versionNo: 2, originalFileName: 'CTR-1_approved.docx', storagePath: '' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Viewing v1 (older than currentVersion 2)
    vi.mocked(useDocumentViewerModule.useDocumentViewer).mockReturnValue({
      docxUrl: 'https://storage.googleapis.com/test.docx',
      docxBuffer: new ArrayBuffer(8),
      isLoading: false,
      error: null,
      errorType: null,
      zoomLevel: 100,
      isFullscreen: false,
      selectedVersion: mockVersions[0], // versionNo: 1
      selectVersion: vi.fn(),
      setZoomLevel: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      toggleFullscreen: vi.fn(),
      refreshUrls: vi.fn(),
      downloadFile: mockDownload,
    });

    render(
      <DocxViewer
        contractId="CTR-1"
        title="Hợp đồng mua bao bì"
        versions={mockVersions}
        contract={approvedContract}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /Download/i });
    fireEvent.click(downloadBtn);

    expect(screen.getByText('Cảnh báo tải phiên bản chưa duyệt')).toBeInTheDocument();
    expect(mockDownload).not.toHaveBeenCalled();

    // Confirm download in modal
    const confirmBtn = screen.getByRole('button', { name: /Vẫn tải về/i });
    fireEvent.click(confirmBtn);

    expect(mockDownload).toHaveBeenCalled();
  });

  it('displays default zoom of 75% and disables zoom out button at minimum zoom level', async () => {
    vi.mocked(useDocumentViewerModule.useDocumentViewer).mockReturnValue({
      docxUrl: 'https://storage.googleapis.com/test.docx',
      docxBuffer: new ArrayBuffer(8),
      isLoading: false,
      error: null,
      errorType: null,
      zoomLevel: 75,
      isFullscreen: false,
      selectedVersion: mockVersions[0],
      selectVersion: vi.fn(),
      setZoomLevel: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      toggleFullscreen: vi.fn(),
      refreshUrls: vi.fn(),
      downloadFile: vi.fn(),
    });

    await act(async () => {
      render(
        <DocxViewer
          contractId="CTR-1"
          title="Hợp đồng mua bao bì"
          versions={mockVersions}
        />
      );
    });

    expect(useDocumentViewerModule.useDocumentViewer).toHaveBeenCalledWith(
      'CTR-1',
      mockVersions,
      undefined,
      undefined,
      75
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByTitle('Thu nhỏ')).toBeDisabled();
    expect(screen.getByTitle('Phóng to')).not.toBeDisabled();
  });
});
