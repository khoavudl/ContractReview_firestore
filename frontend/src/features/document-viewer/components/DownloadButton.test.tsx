/**
 * Feature: Document Viewer
 * Unit Tests: DownloadButton.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DownloadButton } from './DownloadButton';
import type { DocumentTabItem } from '../types';

describe('DownloadButton Component', () => {
  const mockOnDownloadDocx = vi.fn();
  const mockOnDownloadSpecificDoc = vi.fn();
  const mockOnDownloadAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleTabs: DocumentTabItem[] = [
    {
      id: 'MAIN',
      label: 'HĐ Chính',
      originalFileName: 'HD_Goc.docx',
      storagePath: 'contracts/CTR-1/versions/v1.docx',
      isMain: true,
      sourceVersionNo: 1,
    },
    {
      id: 'PL01',
      label: 'Phụ lục 1: Báo giá',
      originalFileName: 'PL01_BaoGia.docx',
      storagePath: 'contracts/CTR-1/versions/v1_PL01.docx',
      isMain: false,
      sourceVersionNo: 1,
    },
    {
      id: 'PL02',
      label: 'Phụ lục 2: SLA',
      originalFileName: 'PL02_SLA.docx',
      storagePath: 'contracts/CTR-1/versions/v1_PL02.docx',
      isMain: false,
      sourceVersionNo: 1,
    },
  ];

  it('renders a single download button when only 1 document exists', () => {
    render(
      <DownloadButton
        onDownloadDocx={mockOnDownloadDocx}
        hasDocx={true}
        documentTabs={[sampleTabs[0]]}
      />
    );

    const button = screen.getByRole('button', { name: /Download/i });
    expect(button).toBeInTheDocument();
    expect(screen.queryByLabelText(/Tùy chọn tải về/i)).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(mockOnDownloadDocx).toHaveBeenCalledTimes(1);
  });

  it('disables download button when hasDocx is false', () => {
    render(
      <DownloadButton
        onDownloadDocx={mockOnDownloadDocx}
        hasDocx={false}
      />
    );

    const button = screen.getByRole('button', { name: /Download/i });
    expect(button).toBeDisabled();
  });

  it('renders a split button when multiple documents exist in bundle', () => {
    render(
      <DownloadButton
        onDownloadDocx={mockOnDownloadDocx}
        onDownloadSpecificDoc={mockOnDownloadSpecificDoc}
        onDownloadAll={mockOnDownloadAll}
        hasDocx={true}
        documentTabs={sampleTabs}
        activeDocument={sampleTabs[0]}
      />
    );

    const primaryBtn = screen.getByRole('button', { name: /Download/i });
    const chevronBtn = screen.getByLabelText(/Tùy chọn tải về/i);

    expect(primaryBtn).toBeInTheDocument();
    expect(chevronBtn).toBeInTheDocument();

    fireEvent.click(primaryBtn);
    expect(mockOnDownloadDocx).toHaveBeenCalledTimes(1);
  });

  it('toggles dropdown menu and allows triggering Download all', () => {
    render(
      <DownloadButton
        onDownloadDocx={mockOnDownloadDocx}
        onDownloadSpecificDoc={mockOnDownloadSpecificDoc}
        onDownloadAll={mockOnDownloadAll}
        hasDocx={true}
        documentTabs={sampleTabs}
        activeDocument={sampleTabs[0]}
      />
    );

    const chevronBtn = screen.getByLabelText(/Tùy chọn tải về/i);
    fireEvent.click(chevronBtn);

    // Menu should be open
    const downloadAllOption = screen.getByText('📦 Download all');
    expect(downloadAllOption).toBeInTheDocument();

    fireEvent.click(downloadAllOption);
    expect(mockOnDownloadAll).toHaveBeenCalledTimes(1);

    // Menu should auto-close
    expect(screen.queryByText('📦 Download all')).not.toBeInTheDocument();
  });

  it('allows downloading a specific annex from the dropdown menu', () => {
    render(
      <DownloadButton
        onDownloadDocx={mockOnDownloadDocx}
        onDownloadSpecificDoc={mockOnDownloadSpecificDoc}
        onDownloadAll={mockOnDownloadAll}
        hasDocx={true}
        documentTabs={sampleTabs}
        activeDocument={sampleTabs[0]}
      />
    );

    const chevronBtn = screen.getByLabelText(/Tùy chọn tải về/i);
    fireEvent.click(chevronBtn);

    const pl02Option = screen.getByText('Phụ lục 2: SLA');
    expect(pl02Option).toBeInTheDocument();

    fireEvent.click(pl02Option);
    expect(mockOnDownloadSpecificDoc).toHaveBeenCalledWith('PL02');
  });

  it('disables buttons when isDownloadingAll is true', () => {
    render(
      <DownloadButton
        onDownloadDocx={mockOnDownloadDocx}
        onDownloadSpecificDoc={mockOnDownloadSpecificDoc}
        onDownloadAll={mockOnDownloadAll}
        hasDocx={true}
        documentTabs={sampleTabs}
        activeDocument={sampleTabs[0]}
        isDownloadingAll={true}
      />
    );

    const primaryBtn = screen.getByRole('button', { name: /Download/i });
    const chevronBtn = screen.getByLabelText(/Tùy chọn tải về/i);

    expect(primaryBtn).toBeDisabled();
    expect(chevronBtn).toBeDisabled();
  });
});
