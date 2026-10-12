/**
 * Feature: Document Viewer
 * Unit Tests: DocumentTabBar.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentTabBar } from './DocumentTabBar';
import type { DocumentTabItem } from '../types';

describe('DocumentTabBar Component', () => {
  const mockSelectDocument = vi.fn();

  it('renders nothing (null) when only 1 document exists (Progressive Disclosure)', () => {
    const singleDocTabs: DocumentTabItem[] = [
      {
        id: 'MAIN',
        label: 'HĐ Chính',
        originalFileName: 'HD_Chinh.docx',
        storagePath: 'contracts/v1.docx',
        isMain: true,
        sourceVersionNo: 1,
      },
    ];

    const { container } = render(
      <DocumentTabBar
        documentTabs={singleDocTabs}
        activeDocumentId="MAIN"
        onSelectDocument={mockSelectDocument}
        currentVersionNo={1}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders all document tabs when multiple documents exist', () => {
    const multiDocTabs: DocumentTabItem[] = [
      {
        id: 'MAIN',
        label: 'HĐ Chính',
        originalFileName: 'HD_Chinh.docx',
        storagePath: 'contracts/v1.docx',
        isMain: true,
        sourceVersionNo: 1,
      },
      {
        id: 'PL01',
        label: 'Phụ lục 1: Báo giá',
        originalFileName: 'PL01_Gia.docx',
        storagePath: 'contracts/v1_PL01.docx',
        isMain: false,
        sourceVersionNo: 1,
      },
      {
        id: 'PL02',
        label: 'Phụ lục 2: SLA',
        originalFileName: 'PL02_SLA.docx',
        storagePath: 'contracts/v1_PL02.docx',
        isMain: false,
        sourceVersionNo: 1,
      },
    ];

    render(
      <DocumentTabBar
        documentTabs={multiDocTabs}
        activeDocumentId="MAIN"
        onSelectDocument={mockSelectDocument}
        currentVersionNo={1}
      />
    );

    expect(screen.getByText('HĐ Chính')).toBeInTheDocument();
    expect(screen.getByText('Phụ lục 1: Báo giá')).toBeInTheDocument();
    expect(screen.getByText('Phụ lục 2: SLA')).toBeInTheDocument();
  });

  it('calls onSelectDocument when another tab is clicked', () => {
    const multiDocTabs: DocumentTabItem[] = [
      {
        id: 'MAIN',
        label: 'HĐ Chính',
        originalFileName: 'HD_Chinh.docx',
        storagePath: 'contracts/v1.docx',
        isMain: true,
        sourceVersionNo: 1,
      },
      {
        id: 'PL01',
        label: 'Phụ lục 1: Báo giá',
        originalFileName: 'PL01_Gia.docx',
        storagePath: 'contracts/v1_PL01.docx',
        isMain: false,
        sourceVersionNo: 1,
      },
    ];

    render(
      <DocumentTabBar
        documentTabs={multiDocTabs}
        activeDocumentId="MAIN"
        onSelectDocument={mockSelectDocument}
        currentVersionNo={1}
      />
    );

    const annexTab = screen.getByRole('tab', { name: /Phụ lục 1: Báo giá/i });
    fireEvent.click(annexTab);

    expect(mockSelectDocument).toHaveBeenCalledWith('PL01');
  });

  it('renders inherited badge when sourceVersionNo is less than currentVersionNo', () => {
    const multiDocTabs: DocumentTabItem[] = [
      {
        id: 'MAIN',
        label: 'HĐ Chính',
        originalFileName: 'HD_Chinh_v2.docx',
        storagePath: 'contracts/v2.docx',
        isMain: true,
        sourceVersionNo: 2,
      },
      {
        id: 'PL01',
        label: 'Phụ lục 1: Báo giá',
        originalFileName: 'PL01_Gia.docx',
        storagePath: 'contracts/v1_PL01.docx',
        isMain: false,
        sourceVersionNo: 1, // Inherited from v1 while we are at v2
      },
    ];

    render(
      <DocumentTabBar
        documentTabs={multiDocTabs}
        activeDocumentId="MAIN"
        onSelectDocument={mockSelectDocument}
        currentVersionNo={2}
      />
    );

    expect(screen.getByText('v1')).toBeInTheDocument();
  });
});
