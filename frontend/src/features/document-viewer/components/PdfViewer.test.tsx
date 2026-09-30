/**
 * Unit Tests for PdfViewer Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PdfViewer } from './PdfViewer';
import type { ContractVersionItem } from '../types';
import * as useDocumentViewerModule from '../hooks/useDocumentViewer';

vi.mock('../hooks/useDocumentViewer', () => ({
  useDocumentViewer: vi.fn(),
}));

describe('PdfViewer', () => {
  const mockVersions: ContractVersionItem[] = [
    {
      versionNo: 1,
      versionId: 'v1',
      originalFileName: 'BaoBi_v1.docx',
      storagePath: 'contracts/CTR-1/v1.docx',
      previewPdfPath: 'contracts/CTR-1/v1.pdf',
      uploadedBy: { uid: 'u1', email: 'test@vn.com', displayName: 'Test User' },
      uploadedAt: new Date(),
    },
  ];

  it('renders converting fallback when errorType is CONVERTING', () => {
    vi.mocked(useDocumentViewerModule.useDocumentViewer).mockReturnValue({
      pdfUrl: null,
      docxUrl: 'https://download.docx',
      isLoading: false,
      error: 'Đang chuyển đổi',
      errorType: 'CONVERTING',
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
      <PdfViewer
        contractId="CTR-1"
        title="Hợp đồng mua bao bì"
        versions={mockVersions}
      />
    );

    expect(screen.getByText(/Bản xem trước PDF đang được xử lý/i)).toBeInTheDocument();
    expect(screen.getByText(/Tải file Word \(\.docx\)/i)).toBeInTheDocument();
  });

  it('renders empty state when errorType is FILE_NOT_FOUND', () => {
    vi.mocked(useDocumentViewerModule.useDocumentViewer).mockReturnValue({
      pdfUrl: null,
      docxUrl: null,
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
      <PdfViewer
        contractId="CTR-1"
        title="Hợp đồng mua bao bì"
        versions={[]}
      />
    );

    expect(screen.getByText(/Chưa có tệp tin văn bản/i)).toBeInTheDocument();
  });

  it('renders iframe when pdfUrl is provided', () => {
    vi.mocked(useDocumentViewerModule.useDocumentViewer).mockReturnValue({
      pdfUrl: 'https://storage.googleapis.com/test.pdf',
      docxUrl: 'https://storage.googleapis.com/test.docx',
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

    render(
      <PdfViewer
        contractId="CTR-1"
        title="Hợp đồng mua bao bì"
        versions={mockVersions}
      />
    );

    const iframe = screen.getByTestId('pdf-iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://storage.googleapis.com/test.pdf#toolbar=1&navpanes=0&view=FitH');
  });
});
