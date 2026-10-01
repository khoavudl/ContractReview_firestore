import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentThread } from './CommentThread';
import {
  subscribeToComments,
  addComment,
  DEV_SAMPLE_COMMENTS,
} from '../services/commentService';

vi.mock('../services/commentService', () => ({
  subscribeToComments: vi.fn(),
  addComment: vi.fn(),
  DEV_SAMPLE_COMMENTS: {
    'CTR-2609-0001': [
      {
        commentId: 'c-1',
        versionNo: 1,
        commentText: 'Ý kiến pháp chế về thanh toán',
        type: 'LEGAL_COMMENT',
        author: { uid: 'u1', displayName: 'Luật sư Pháp', role: 'LEGAL' },
        createdAt: new Date('2026-09-28T10:00:00Z'),
      },
    ],
  },
}));

describe('CommentThread Component', () => {
  const mockUser = {
    uid: 'user-01',
    displayName: 'Nguyễn Văn Phụ Trách',
    email: 'user@fev.com',
    role: 'USER' as const,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(subscribeToComments).mockImplementation((_id, onUpdate) => {
      onUpdate(DEV_SAMPLE_COMMENTS['CTR-2609-0001'] as any);
      return () => {};
    });
  });

  it('renders comments list with author and clause reference', async () => {
    render(
      <CommentThread
        contractId="CTR-2609-0001"
        versionNo={1}
        currentUser={mockUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Trao đổi trực tiếp (1)')).toBeInTheDocument();
    });

    expect(screen.getByText('Luật sư Pháp')).toBeInTheDocument();
    expect(screen.getByText('Ý kiến pháp chế về thanh toán')).toBeInTheDocument();
  });

  it('allows user to type and submit a comment', async () => {
    vi.mocked(addComment).mockResolvedValueOnce({
      commentId: 'c-2',
      versionNo: 1,
      commentText: 'Phản hồi người phụ trách',
      type: 'USER_RESPONSE',
      author: { uid: mockUser.uid, displayName: mockUser.displayName, role: mockUser.role },
      createdAt: new Date(),
    });

    render(
      <CommentThread
        contractId="CTR-2609-0001"
        versionNo={1}
        currentUser={mockUser}
      />
    );

    const textarea = screen.getByPlaceholderText(/Viết ý kiến trao đổi/);
    fireEvent.change(textarea, { target: { value: 'Phản hồi người phụ trách' } });

    const submitBtn = screen.getByRole('button', { name: /Gửi ý kiến/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(addComment).toHaveBeenCalledWith(
        'CTR-2609-0001',
        {
          versionNo: 1,
          commentText: 'Phản hồi người phụ trách',
        },
        expect.objectContaining({
          uid: mockUser.uid,
          role: 'USER',
        })
      );
    });
  });

  it('hides comment input and displays lock banner when contract is approved', async () => {
    render(
      <CommentThread
        contractId="CTR-2609-0001"
        versionNo={1}
        currentUser={mockUser}
        contractStatus="HOL_APPROVED"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Trao đổi trực tiếp (1)')).toBeInTheDocument();
    });

    expect(screen.queryByPlaceholderText(/Viết ý kiến trao đổi/)).not.toBeInTheDocument();
    expect(screen.getByText(/Hồ sơ đã được phê duyệt chính thức. Đóng luồng gửi trao đổi mới./)).toBeInTheDocument();
  });
});
