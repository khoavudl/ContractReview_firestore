import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DownloadUnapprovedWarningModal } from './DownloadUnapprovedWarningModal';

describe('DownloadUnapprovedWarningModal', () => {
  it('renders modal content with warning details', () => {
    render(
      <DownloadUnapprovedWarningModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirmDownload={vi.fn()}
        selectedVersionNo={1}
        approvedVersionNo={2}
      />
    );

    expect(screen.getByText('Cảnh báo tải phiên bản chưa duyệt')).toBeInTheDocument();
    expect(screen.getByText(/Bạn đang tải phiên bản v1 chưa được phê duyệt chính thức/)).toBeInTheDocument();
    expect(screen.getByText('bản v2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hủy bỏ/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vẫn tải về/ })).toBeInTheDocument();
  });

  it('triggers onClose when clicking Hủy bỏ', () => {
    const onClose = vi.fn();
    render(
      <DownloadUnapprovedWarningModal
        isOpen={true}
        onClose={onClose}
        onConfirmDownload={vi.fn()}
        selectedVersionNo={1}
        approvedVersionNo={2}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Hủy bỏ/ }));
    expect(onClose).toHaveBeenCalled();
  });

  it('triggers onConfirmDownload and onClose when clicking Vẫn tải về', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <DownloadUnapprovedWarningModal
        isOpen={true}
        onClose={onClose}
        onConfirmDownload={onConfirm}
        selectedVersionNo={1}
        approvedVersionNo={2}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Vẫn tải về/ }));
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
