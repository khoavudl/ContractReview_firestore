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

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText('Legal Review')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    expect(screen.getByText('Head Review')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Approved')).toBeInTheDocument();
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

    const legalCard = screen.getByText('Legal Review').closest('button');
    expect(legalCard).not.toBeNull();
    fireEvent.click(legalCard!);

    expect(onSelectGroup).toHaveBeenCalledWith('legal');
  });

  it('indicates active card state with aria-pressed attribute', () => {
    render(
      <MetricCards
        counts={sampleCounts}
        activeGroup="draft"
        onSelectGroup={vi.fn()}
      />
    );

    const draftCard = screen.getByText('Draft').closest('button');
    expect(draftCard).toHaveAttribute('aria-pressed', 'true');
  });
});
