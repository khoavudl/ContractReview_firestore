/**
 * Unit Tests for MetricCards
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricCards } from './MetricCards';
import type { MetricCounts } from '../types';

describe('MetricCards', () => {
  const sampleCounts: MetricCounts = {
    all: 10,
    draft: 3,
    legal: 4,
    head: 2,
    approved: 1,
  };

  it('renders 4 metric cards with their numbers', () => {
    render(
      <MetricCards
        counts={sampleCounts}
        activeGroup="ALL"
        onSelectGroup={vi.fn()}
      />
    );

    expect(screen.getByText('Bản nháp & Chờ sửa')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText('Pháp chế thẩm định')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    expect(screen.getByText('Trưởng ban xét duyệt')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Đã duyệt')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('triggers onSelectGroup when a card is clicked', () => {
    const onSelectGroup = vi.fn();
    render(
      <MetricCards
        counts={sampleCounts}
        activeGroup="ALL"
        onSelectGroup={onSelectGroup}
      />
    );

    const legalCard = screen.getByText('Pháp chế thẩm định').closest('button');
    expect(legalCard).not.toBeNull();
    fireEvent.click(legalCard!);

    expect(onSelectGroup).toHaveBeenCalledWith('legal');
  });

  it('indicates active card state', () => {
    render(
      <MetricCards
        counts={sampleCounts}
        activeGroup="draft"
        onSelectGroup={vi.fn()}
      />
    );

    expect(screen.getByText('Đang lọc')).toBeInTheDocument();
  });
});
