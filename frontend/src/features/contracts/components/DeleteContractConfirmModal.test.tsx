/**
 * Unit Tests for DeleteContractConfirmModal
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteContractConfirmModal } from './DeleteContractConfirmModal';

describe('DeleteContractConfirmModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <DeleteContractConfirmModal
        isOpen={false}
        contractId="CTR-2609-0001"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText('Xác nhận xóa hồ sơ')).not.toBeInTheDocument();
  });

  it('renders correctly with contractId and contractTitle when open', () => {
    render(
      <DeleteContractConfirmModal
        isOpen={true}
        contractId="CTR-2609-0001"
        contractTitle="Hợp đồng mua bao bì"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Xác nhận xóa hồ sơ')).toBeInTheDocument();
    expect(screen.getByText('CTR-2609-0001')).toBeInTheDocument();
    expect(screen.getByText(/Hợp đồng mua bao bì/)).toBeInTheDocument();
    expect(screen.getByText('Hành động nguy hiểm không thể hoàn tác!')).toBeInTheDocument();
  });

  it('calls onClose when clicking Hủy', () => {
    const onClose = vi.fn();
    render(
      <DeleteContractConfirmModal
        isOpen={true}
        contractId="CTR-2609-0001"
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when clicking Xác nhận xóa', () => {
    const onConfirm = vi.fn();
    render(
      <DeleteContractConfirmModal
        isOpen={true}
        contractId="CTR-2609-0001"
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận xóa/i });
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables cancel button and shows loading state when isDeleting is true', () => {
    render(
      <DeleteContractConfirmModal
        isOpen={true}
        contractId="CTR-2609-0001"
        isDeleting={true}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
    expect(cancelBtn).toBeDisabled();
  });
});
