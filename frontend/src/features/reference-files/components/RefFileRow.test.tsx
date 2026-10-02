import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RefFileRow } from './RefFileRow';
import type { ReferenceFileDocument } from '../types';

describe('RefFileRow Component', () => {
  const sampleFile: ReferenceFileDocument = {
    fileId: 'ref-123',
    fileName: 'bang_bao_gia_2026.pdf',
    storagePath: 'contracts/CTR-001/reference_files/ref-123.pdf',
    fileSize: 1048576,
    mimeType: 'application/pdf',
    uploadedBy: {
      uid: 'user-01',
      displayName: 'Nguyễn Văn A',
    },
    uploadedAt: new Date('2026-09-28T10:00:00Z'),
  };

  it('renders file information correctly', () => {
    render(
      <RefFileRow
        file={sampleFile}
        canDelete={true}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('bang_bao_gia_2026.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    expect(screen.getByText(/Bởi Nguyễn Văn A/)).toBeInTheDocument();
    expect(screen.getByTitle('Mở xem trong tab mới')).toBeInTheDocument();
    expect(screen.getByTitle('Tải tệp xuống')).toBeInTheDocument();
    expect(screen.getByTitle('Xóa tệp đính kèm')).toBeInTheDocument();
  });

  it('triggers onOpen when clicking on file name/row', async () => {
    const onOpen = vi.fn().mockResolvedValue(true);

    render(
      <RefFileRow
        file={sampleFile}
        canDelete={false}
        onDelete={vi.fn()}
        onOpen={onOpen}
      />
    );

    const titleEl = screen.getByText('bang_bao_gia_2026.pdf');
    fireEvent.click(titleEl);

    await waitFor(() => {
      expect(onOpen).toHaveBeenCalledWith(sampleFile);
    });
  });

  it('triggers onOpen when clicking ExternalLink action button', async () => {
    const onOpen = vi.fn().mockResolvedValue(true);

    render(
      <RefFileRow
        file={sampleFile}
        canDelete={false}
        onDelete={vi.fn()}
        onOpen={onOpen}
      />
    );

    const openBtn = screen.getByTitle('Mở xem trong tab mới');
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(onOpen).toHaveBeenCalledWith(sampleFile);
    });
  });

  it('triggers onDelete when clicking delete button with confirmation', async () => {
    const onDelete = vi.fn().mockResolvedValue(true);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <RefFileRow
        file={sampleFile}
        canDelete={true}
        onDelete={onDelete}
      />
    );

    const deleteBtn = screen.getByTitle('Xóa tệp đính kèm');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(sampleFile);
    });
  });

  it('does not trigger onDelete if user cancels confirmation dialog', async () => {
    const onDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <RefFileRow
        file={sampleFile}
        canDelete={true}
        onDelete={onDelete}
      />
    );

    const deleteBtn = screen.getByTitle('Xóa tệp đính kèm');
    fireEvent.click(deleteBtn);

    expect(onDelete).not.toHaveBeenCalled();
  });
});
