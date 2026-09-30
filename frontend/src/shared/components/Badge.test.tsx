import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';

describe('Badge Component', () => {
  it('renders children correctly', () => {
    render(<Badge>Bản nháp</Badge>);
    expect(screen.getByText('Bản nháp')).toBeInTheDocument();
  });

  it('applies variant classes accurately', () => {
    const { container } = render(<Badge variant="emerald">Đã duyệt</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-emerald-50');
  });

  it('supports custom className overrides', () => {
    const { container } = render(<Badge className="custom-class">Custom</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('custom-class');
  });
});
