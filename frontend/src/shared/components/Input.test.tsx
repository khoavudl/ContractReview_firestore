import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Search, Eye } from 'lucide-react';
import { Input } from './Input';

describe('Input component', () => {
  it('should render standard input with placeholder', () => {
    render(<Input placeholder="Nhập từ khoá tìm kiếm..." />);
    const input = screen.getByPlaceholderText('Nhập từ khoá tìm kiếm...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('h-9');
  });

  it('should render label and associate with input', () => {
    render(<Input label="Tên Hợp Đồng" placeholder="Hợp đồng dịch vụ" />);
    const label = screen.getByText('Tên Hợp Đồng');
    const input = screen.getByPlaceholderText('Hợp đồng dịch vụ');

    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', input.getAttribute('id'));
  });

  it('should display error message and mark aria-invalid', () => {
    render(
      <Input
        label="Số tiền"
        error="Số tiền không được để trống"
        placeholder="100.000.000"
      />
    );

    const input = screen.getByPlaceholderText('100.000.000');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('border-rose-500');
    expect(
      screen.getByText('Số tiền không được để trống')
    ).toBeInTheDocument();
  });

  it('should display helper text when there is no error', () => {
    render(
      <Input
        label="Mã hồ sơ"
        helperText="Định dạng: CTR-YYYY-XXXX"
        placeholder="CTR-2026-0001"
      />
    );

    expect(screen.getByText('Định dạng: CTR-YYYY-XXXX')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('CTR-2026-0001')
    ).toHaveAttribute('aria-invalid', 'false');
  });

  it('should render left and right icons', () => {
    render(
      <Input
        leftIcon={<Search data-testid="left-search-icon" />}
        rightIcon={<Eye data-testid="right-eye-icon" />}
        placeholder="Tìm kiếm..."
      />
    );

    expect(screen.getByTestId('left-search-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-eye-icon')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Tìm kiếm...');
    expect(input).toHaveClass('pl-9');
    expect(input).toHaveClass('pr-9');
  });

  it('should handle onChange events', () => {
    const handleChange = vi.fn();
    render(<Input placeholder="Gõ gì đó..." onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Gõ gì đó...');
    fireEvent.change(input, { target: { value: 'Hợp đồng mua bán' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('Hợp đồng mua bán');
  });

  it('should disable input when disabled prop is true', () => {
    render(<Input placeholder="Vô hiệu" disabled />);
    const input = screen.getByPlaceholderText('Vô hiệu');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50');
  });
});
