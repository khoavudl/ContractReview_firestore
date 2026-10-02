/**
 * Unit Tests for TaskDraftCard Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskDraftCard } from './TaskDraftCard';

describe('TaskDraftCard Component', () => {
  const defaultProps = {
    order: 1,
    clauses: 'Điều 4.2 - Thời hạn thanh toán',
    category: 'COMMERCIAL' as const,
    issueSummary: 'Thời hạn 15 ngày quá ngắn',
    legalRecommendation: 'Đổi sang 30 ngày',
    authorName: 'Luật sư Trần',
    isExistingTask: false,
    onChangeClauses: vi.fn(),
    onChangeCategory: vi.fn(),
    onChangeIssueSummary: vi.fn(),
    onChangeLegalRecommendation: vi.fn(),
    onRemove: vi.fn(),
  };

  it('renders order number, category select, inputs, and textareas', () => {
    render(<TaskDraftCard {...defaultProps} />);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Cần giải trình')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Điều 4.2 - Thời hạn thanh toán')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Thời hạn 15 ngày quá ngắn')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Đổi sang 30 ngày')).toBeInTheDocument();
    expect(screen.getByText(/Khuyến nghị của Pháp chế \(Luật sư Trần\):/)).toBeInTheDocument();
  });

  it('triggers change handlers when user types into inputs', () => {
    render(<TaskDraftCard {...defaultProps} />);

    const clausesInput = screen.getByLabelText('Tên điều khoản tham chiếu');
    fireEvent.change(clausesInput, { target: { value: 'Điều 5 - Nghiệm thu' } });
    expect(defaultProps.onChangeClauses).toHaveBeenCalledWith('Điều 5 - Nghiệm thu');

    const issueInput = screen.getByLabelText('Vấn đề và rủi ro phát hiện');
    fireEvent.change(issueInput, { target: { value: 'Thiếu biên bản nghiệm thu' } });
    expect(defaultProps.onChangeIssueSummary).toHaveBeenCalledWith('Thiếu biên bản nghiệm thu');

    const recInput = screen.getByLabelText('Khuyến nghị của Pháp chế');
    fireEvent.change(recInput, { target: { value: 'Bổ sung phụ lục nghiệm thu' } });
    expect(defaultProps.onChangeLegalRecommendation).toHaveBeenCalledWith('Bổ sung phụ lục nghiệm thu');
  });

  it('triggers onChangeCategory when category selection changes', () => {
    render(<TaskDraftCard {...defaultProps} />);

    const select = screen.getByLabelText('Chọn phân loại rủi ro');
    fireEvent.change(select, { target: { value: 'PENALTY' } });
    expect(defaultProps.onChangeCategory).toHaveBeenCalledWith('PENALTY');
  });

  it('triggers onRemove when trash icon button is clicked', () => {
    render(<TaskDraftCard {...defaultProps} />);

    const removeBtn = screen.getByLabelText('Xóa khung');
    fireEvent.click(removeBtn);
    expect(defaultProps.onRemove).toHaveBeenCalledTimes(1);
  });
});
