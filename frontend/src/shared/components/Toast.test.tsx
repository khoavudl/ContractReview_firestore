import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast, ToastContainer } from './Toast';
import { ToastProvider, useToast } from '../hooks/useToast';
import { Button } from './Button';

describe('Toast and ToastContainer components', () => {
  it('should render Toast component with message, title, and variant accent', () => {
    const handleClose = vi.fn();
    render(
      <Toast
        toast={{
          id: 'test-1',
          title: 'Thành công',
          message: 'Hồ sơ đã được lưu',
          variant: 'success',
          duration: 3000,
        }}
        onClose={handleClose}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Thành công')).toBeInTheDocument();
    expect(screen.getByText('Hồ sơ đã được lưu')).toBeInTheDocument();
    expect(screen.getByTestId('toast-success')).toHaveClass(
      'border-l-emerald-500'
    );

    const closeBtn = screen.getByLabelText('Đóng thông báo');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledWith('test-1');
  });

  it('should render ToastContainer and display dynamic toasts', () => {
    function TestApp() {
      const { showToast } = useToast();
      return (
        <div>
          <Button
            onClick={() =>
              showToast({
                message: 'Thông báo thử nghiệm',
                variant: 'error',
              })
            }
          >
            Hiện Toast
          </Button>
          <ToastContainer />
        </div>
      );
    }

    render(
      <ToastProvider>
        <TestApp />
      </ToastProvider>
    );

    // Initially container should not be rendered
    expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument();

    // Trigger toast
    fireEvent.click(screen.getByText('Hiện Toast'));

    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    expect(screen.getByText('Thông báo thử nghiệm')).toBeInTheDocument();
    expect(screen.getByTestId('toast-error')).toBeInTheDocument();
  });
});
