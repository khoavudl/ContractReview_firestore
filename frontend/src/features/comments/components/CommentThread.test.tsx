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
        commentId: 'c-3',
        versionNo: 2,
        commentText: 'Yêu cầu chỉnh sửa',
        type: 'SYSTEM_STATUS_CHANGE',
        statusLabel: 'Yêu cầu chỉnh sửa',
        statusIcon: '⚠️',
        rejectReason: 'Cần điều chỉnh thời hạn thanh toán thành 30 ngày',
        author: { uid: 'u3', displayName: 'vy.tran', role: 'LEGAL' },
        createdAt: new Date('2026-10-01T15:30:00Z'),
      },
      {
        commentId: 'c-2',
        versionNo: 2,
        commentText: 'Tải lên phiên bản v2',
        type: 'SYSTEM_VERSION_UPLOAD',
        changeSummary: 'Chỉnh sửa số 4.6 thành 4.5',
        author: { uid: 'u2', displayName: 'thao.pham', role: 'USER' },
        createdAt: new Date('2026-10-01T14:30:00Z'),
      },
      {
        commentId: 'c-1',
        versionNo: 1,
        commentText: 'Ý kiến pháp chế về thanh toán',
        type: 'LEGAL_COMMENT',
        author: { uid: 'u1', displayName: 'Luật sư Pháp', role: 'LEGAL' },
        createdAt: new Date('2026-09-28T10:00:00Z'),
      },
      {
        commentId: 'c-0',
        versionNo: 1,
        commentText: 'Phản hồi từ người tạo hợp đồng',
        type: 'USER_RESPONSE',
        author: { uid: 'u0', displayName: 'Nguyễn Văn Phụ Trách', role: 'USER' },
        createdAt: new Date('2026-09-27T08:00:00Z'),
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

  it('renders comments list with author and comment text across left, right and center', async () => {
    render(
      <CommentThread
        contractId="CTR-2609-0001"
        versionNo={1}
        currentUser={mockUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('thao.pham')).toBeInTheDocument();
      expect(screen.getByText('Luật sư Pháp')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn Phụ Trách')).toBeInTheDocument();
    });

    // Check system status notification (minimalist: no author, no version badge)
    expect(screen.getByText(/Đã chuyển sang trạng thái "Yêu cầu chỉnh sửa"/)).toBeInTheDocument();
    expect(screen.getByText(/Lý do:/)).toBeInTheDocument();
    expect(screen.getByText(/Cần điều chỉnh thời hạn thanh toán thành 30 ngày/)).toBeInTheDocument();

    // Check version upload card (in user chat bubble with simplified v2 badge)
    expect(screen.getByText(/Tải lên phiên bản v2/)).toBeInTheDocument();
    expect(screen.getByText(/Chỉnh sửa số 4.6 thành 4.5/)).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();

    // Check chat bubbles
    expect(screen.getByText('Ý kiến pháp chế về thanh toán')).toBeInTheDocument();
    expect(screen.getByText('Phản hồi từ người tạo hợp đồng')).toBeInTheDocument();
    expect(screen.getAllByText('v1').length).toBeGreaterThan(0);
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

  it('enforces maxLength 1000 and disables submit button when over limit or empty', () => {
    render(
      <CommentThread
        contractId="CTR-2609-0001"
        versionNo={1}
        currentUser={mockUser}
      />
    );

    const textarea = screen.getByPlaceholderText(/Viết ý kiến trao đổi/);
    expect(textarea).toHaveAttribute('maxLength', '1000');
    expect(screen.getByText('0/1000')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Gửi ý kiến/ });
    expect(submitBtn).toBeDisabled();
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
      expect(screen.getByText(/Hồ sơ đã được phê duyệt chính thức. Đóng luồng gửi trao đổi mới./)).toBeInTheDocument();
    });

    expect(screen.queryByPlaceholderText(/Viết ý kiến trao đổi/)).not.toBeInTheDocument();
  });
});
