/**
 * Unit Tests for ViewerSelector Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ViewerSelector } from './ViewerSelector';
import * as contractService from '../services/contractService';

describe('ViewerSelector Component', () => {
  const sampleUsers: contractService.ActiveUserOption[] = [
    { uid: 'u1', email: 'colleague1@foodempire.vn', displayName: 'Colleague One', department: 'Sales', role: 'USER' },
    { uid: 'u2', email: 'manager@foodempire.vn', displayName: 'Manager Boss', department: 'Sales', role: 'USER' },
    { uid: 'owner', email: 'owner@foodempire.vn', displayName: 'Owner Sales', department: 'Sales', role: 'USER' },
  ];

  beforeEach(() => {
    vi.spyOn(contractService, 'fetchActiveUsers').mockResolvedValue(sampleUsers);
  });

  it('renders input and selected emails as chips', async () => {
    const handleChange = vi.fn();
    render(
      <ViewerSelector
        selectedEmails={['manager@foodempire.vn']}
        onChange={handleChange}
        creatorEmail="owner@foodempire.vn"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Manager Boss/i)).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/Tìm tên, email hoặc phòng ban/i)).toBeInTheDocument();
  });

  it('filters out creatorEmail from autocomplete dropdown', async () => {
    render(
      <ViewerSelector
        selectedEmails={[]}
        onChange={vi.fn()}
        creatorEmail="owner@foodempire.vn"
      />
    );

    const input = screen.getByPlaceholderText(/Tìm tên, email hoặc phòng ban/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'owner' } });

    await waitFor(() => {
      expect(screen.queryByText(/Owner Sales/i)).not.toBeInTheDocument();
    });
  });

  it('calls onChange with new email when a user is selected from dropdown', async () => {
    const handleChange = vi.fn();
    render(
      <ViewerSelector
        selectedEmails={[]}
        onChange={handleChange}
        creatorEmail="owner@foodempire.vn"
      />
    );

    const input = screen.getByPlaceholderText(/Tìm tên, email hoặc phòng ban/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Colleague' } });

    await waitFor(() => {
      expect(screen.getByText(/Colleague One/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Colleague One/i));
    expect(handleChange).toHaveBeenCalledWith(['colleague1@foodempire.vn']);
  });

  it('allows removing an existing selected email chip', async () => {
    const handleChange = vi.fn();
    render(
      <ViewerSelector
        selectedEmails={['manager@foodempire.vn']}
        onChange={handleChange}
        creatorEmail="owner@foodempire.vn"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Manager Boss/i)).toBeInTheDocument();
    });

    const removeBtn = screen.getByTitle('Xóa người xem này');
    fireEvent.click(removeBtn);
    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('renders in disabled mode without search input or remove button', async () => {
    render(
      <ViewerSelector
        selectedEmails={['manager@foodempire.vn']}
        onChange={vi.fn()}
        disabled={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Manager Boss/i)).toBeInTheDocument();
    });

    expect(screen.queryByPlaceholderText(/Tìm tên/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle('Xóa người xem này')).not.toBeInTheDocument();
  });
});
