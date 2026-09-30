import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders button label and handles click', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Lưu thay đổi</Button>);

    const btn = screen.getByRole('button', { name: /lưu thay đổi/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders loading spinner and disables button when isLoading is true', () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Đang xử lý
      </Button>
    );

    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies danger variant styling', () => {
    const { container } = render(<Button variant="danger">Xóa</Button>);
    const btn = container.querySelector('button');
    expect(btn).toHaveClass('bg-rose-600');
  });
});
