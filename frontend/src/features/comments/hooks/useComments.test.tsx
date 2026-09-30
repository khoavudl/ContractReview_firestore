import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useComments } from './useComments';
import {
  DEV_SAMPLE_COMMENTS,
  subscribeToComments,
  addComment,
} from '../services/commentService';

vi.mock('../services/commentService', () => ({
  subscribeToComments: vi.fn(),
  addComment: vi.fn(),
  DEV_SAMPLE_COMMENTS: {
    'CTR-2609-0001': [
      {
        commentId: 'c-1',
        versionNo: 1,
        commentText: 'Bình luận 1',
        type: 'LEGAL_COMMENT',
        author: { uid: 'u1', displayName: 'Legal', role: 'LEGAL' },
        createdAt: new Date(),
      },
      {
        commentId: 'c-2',
        versionNo: 2,
        commentText: 'Bình luận v2',
        type: 'USER_RESPONSE',
        author: { uid: 'u2', displayName: 'User', role: 'USER' },
        createdAt: new Date(),
      },
    ],
  },
}));

describe('useComments hook', () => {
  const mockUser = {
    uid: 'user-01',
    displayName: 'Nguyễn Văn A',
    email: 'a@fev.com',
    role: 'USER' as const,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should subscribe to comments and populate state', async () => {
    vi.mocked(subscribeToComments).mockImplementation((_id, onUpdate) => {
      onUpdate(DEV_SAMPLE_COMMENTS['CTR-2609-0001'] as any);
      return () => {};
    });

    const { result } = renderHook(() =>
      useComments({
        contractId: 'CTR-2609-0001',
        currentVersion: 1,
        currentUser: mockUser,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.comments.length).toBe(2);
    expect(result.current.totalCount).toBe(2);
  });

  it('should filter comments by version', async () => {
    vi.mocked(subscribeToComments).mockImplementation((_id, onUpdate) => {
      onUpdate(DEV_SAMPLE_COMMENTS['CTR-2609-0001'] as any);
      return () => {};
    });

    const { result } = renderHook(() =>
      useComments({
        contractId: 'CTR-2609-0001',
        currentVersion: 1,
        currentUser: mockUser,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Default ALL
    expect(result.current.filteredComments.length).toBe(2);

    // Filter to version 1
    act(() => {
      result.current.setFilterVersion(1);
    });
    expect(result.current.filteredComments.length).toBe(1);
    expect(result.current.filteredComments[0].versionNo).toBe(1);

    // Filter to version 2
    act(() => {
      result.current.setFilterVersion(2);
    });
    expect(result.current.filteredComments.length).toBe(1);
    expect(result.current.filteredComments[0].versionNo).toBe(2);
  });

  it('should submit new comment with author info', async () => {
    vi.mocked(subscribeToComments).mockImplementation((_id, onUpdate) => {
      onUpdate([]);
      return () => {};
    });
    vi.mocked(addComment).mockResolvedValueOnce({
      commentId: 'c-new',
      versionNo: 1,
      clauseRef: 'Điều 2.1',
      commentText: 'Nội dung mới',
      type: 'USER_RESPONSE',
      author: { uid: mockUser.uid, displayName: mockUser.displayName, role: mockUser.role },
      createdAt: new Date(),
    });

    const { result } = renderHook(() =>
      useComments({
        contractId: 'CTR-2609-0001',
        currentVersion: 1,
        currentUser: mockUser,
      })
    );

    let success = false;
    await act(async () => {
      success = await result.current.submitComment({
        clauseRef: 'Điều 2.1',
        commentText: 'Nội dung mới',
      });
    });

    expect(success).toBe(true);
    expect(addComment).toHaveBeenCalledWith(
      'CTR-2609-0001',
      {
        versionNo: 1,
        clauseRef: 'Điều 2.1',
        commentText: 'Nội dung mới',
      },
      expect.objectContaining({
        uid: mockUser.uid,
        role: 'USER',
      })
    );
  });

  it('should prevent submitting empty comment', async () => {
    vi.mocked(subscribeToComments).mockImplementation((_id, onUpdate) => {
      onUpdate([]);
      return () => {};
    });

    const { result } = renderHook(() =>
      useComments({
        contractId: 'CTR-2609-0001',
        currentVersion: 1,
        currentUser: mockUser,
      })
    );

    let success = false;
    await act(async () => {
      success = await result.current.submitComment({
        commentText: '   ',
      });
    });

    expect(success).toBe(false);
    expect(addComment).not.toHaveBeenCalled();
  });
});
