import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';
import { Button } from './Button';

describe('Modal component', () => {
  it('should not render anything when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Tiêu đề mẫu">
        <p>Nội dung modal</p>
      </Modal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Nội dung modal')).not.toBeInTheDocument();
  });

  it('should render dialog, title, description, content and footer when isOpen is true', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Tạo Hợp Đồng Mới"
        description="Điền thông tin hợp đồng bên dưới"
        footer={<Button>Xác nhận</Button>}
      >
        <p>Biểu mẫu nhập liệu</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Tạo Hợp Đồng Mới')).toBeInTheDocument();
    expect(
      screen.getByText('Điền thông tin hợp đồng bên dưới')
    ).toBeInTheDocument();
    expect(screen.getByText('Biểu mẫu nhập liệu')).toBeInTheDocument();
    expect(screen.getByText('Xác nhận')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Tiêu đề">
        <p>Nội dung</p>
      </Modal>
    );

    const closeBtn = screen.getByLabelText('Đóng hộp thoại');
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Tiêu đề">
        <p>Nội dung</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking on the backdrop', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Tiêu đề">
        <p>Nội dung bên trong</p>
      </Modal>
    );

    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should NOT call onClose when clicking inside the modal content', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Tiêu đề">
        <p data-testid="inner-content">Nội dung bên trong</p>
      </Modal>
    );

    const content = screen.getByTestId('inner-content');
    fireEvent.click(content);

    expect(handleClose).not.toHaveBeenCalled();
  });
});
