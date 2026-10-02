/**
 * Unit Tests for TaskRow Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskRow } from './TaskRow';
import type { TaskItem } from '../types';

describe('TaskRow Component', () => {
  const sampleTask: TaskItem = {
    taskId: 't-1',
    order: 1,
    clauses: 'Điều 4.2 - Thời hạn thanh toán',
    category: 'COMMERCIAL',
    issueSummary: 'Thời hạn 15 ngày quá ngắn',
    legalRecommendation: 'Sửa thành 30 ngày',
    status: 'OPEN',
    userNotes: '',
    createdBy: { uid: 'u-legal', displayName: 'Luật sư Trần' },
    updatedAt: new Date(),
  };

  const defaultProps = {
    task: sampleTask,
    canManage: true,
    canRespond: false,
    onSaveResponse: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders task clauses, order, category, and expanded details', () => {
    render(<TaskRow {...defaultProps} />);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Điều 4.2 - Thời hạn thanh toán')).toBeInTheDocument();
    expect(screen.getByText('Thời hạn 15 ngày quá ngắn')).toBeInTheDocument();
    expect(screen.getByText('Sửa thành 30 ngày')).toBeInTheDocument();
  });

  it('renders rose-red tone for "Bỏ qua" button and emerald tone for "Đã sửa" button when canRespond is true', () => {
    render(<TaskRow {...defaultProps} canRespond={true} />);

    const waiveBtn = screen.getByText('Bỏ qua (Waived)').closest('button');
    const resolveBtn = screen.getByText('Đã sửa (Resolved)').closest('button');

    expect(waiveBtn).toBeInTheDocument();
    expect(resolveBtn).toBeInTheDocument();

    // Check unselected classes
    expect(waiveBtn?.className).toContain('text-rose-700');
    expect(resolveBtn?.className).toContain('text-emerald-700');
  });

  it('applies active solid rose styling to "Bỏ qua" button when task status is WAIVED', () => {
    const waivedTask = { ...sampleTask, status: 'WAIVED' as const };
    render(<TaskRow {...defaultProps} task={waivedTask} canRespond={true} />);

    const waiveBtn = screen.getByText('Bỏ qua (Waived)').closest('button');
    expect(waiveBtn?.className).toContain('bg-rose-600');
    expect(waiveBtn?.className).toContain('text-white');
  });

  it('calls onUpdatePendingResponse when user types notes or clicks response buttons', () => {
    const onUpdatePendingResponse = vi.fn();
    render(
      <TaskRow
        {...defaultProps}
        canRespond={true}
        onUpdatePendingResponse={onUpdatePendingResponse}
      />
    );

    const textarea = screen.getByPlaceholderText(
      'Nhập nội dung giải trình hoặc thỏa thuận đàm phán với đối tác...'
    );
    fireEvent.change(textarea, { target: { value: 'Đã đàm phán thành công 30 ngày' } });
    expect(onUpdatePendingResponse).toHaveBeenCalledWith(
      't-1',
      'Đã đàm phán thành công 30 ngày',
      'OPEN'
    );

    const resolveBtn = screen.getByText('Đã sửa (Resolved)');
    fireEvent.click(resolveBtn);
    expect(onUpdatePendingResponse).toHaveBeenCalledWith(
      't-1',
      'Đã đàm phán thành công 30 ngày',
      'RESOLVED'
    );

    const waiveBtn = screen.getByText('Bỏ qua (Waived)');
    fireEvent.click(waiveBtn);
    expect(onUpdatePendingResponse).toHaveBeenCalledWith(
      't-1',
      'Đã đàm phán thành công 30 ngày',
      'WAIVED'
    );
  });

  it('collapses body content when isControlledExpanded is false', () => {
    render(<TaskRow {...defaultProps} isControlledExpanded={false} />);

    expect(screen.queryByText('Thời hạn 15 ngày quá ngắn')).not.toBeInTheDocument();
  });
});
