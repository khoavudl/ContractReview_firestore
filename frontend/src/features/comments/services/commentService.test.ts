import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveCommentType,
  subscribeToComments,
  addComment,
  addSystemEventComment,
  resetMockCommentsForTesting,
  DEV_SAMPLE_COMMENTS,
} from './commentService';

vi.mock('@/shared', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/shared');
  return {
    ...actual,
    isMockDevEnvironment: vi.fn(() => false),
    getFirebaseDb: vi.fn(),
    toValidDate: vi.fn((val) => (val instanceof Date ? val : new Date(val))),
  };
});

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ type: 'SERVER_TIMESTAMP' })),
}));

import { isMockDevEnvironment } from '@/shared';
import { setDoc, onSnapshot } from 'firebase/firestore';

describe('commentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockCommentsForTesting();
  });

  describe('resolveCommentType', () => {
    it('should map roles correctly to CommentType', () => {
      expect(resolveCommentType('HOL')).toBe('HOL_COMMENT');
      expect(resolveCommentType('LEGAL')).toBe('LEGAL_COMMENT');
      expect(resolveCommentType('USER')).toBe('USER_RESPONSE');
    });
  });

  describe('subscribeToComments', () => {
    it('should emit initial comments in mock dev environment', () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(true);

      const onUpdate = vi.fn();
      const unsub = subscribeToComments('CTR-2609-0001', onUpdate);

      expect(onUpdate).toHaveBeenCalledWith(DEV_SAMPLE_COMMENTS['CTR-2609-0001']);
      unsub();
    });

    it('should setup Firestore onSnapshot in production environment', () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);

      const mockUnsub = vi.fn();
      vi.mocked(onSnapshot).mockReturnValueOnce(mockUnsub as any);

      const onUpdate = vi.fn();
      const unsub = subscribeToComments('CTR-2609-0001', onUpdate);

      expect(onSnapshot).toHaveBeenCalled();
      unsub();
      expect(mockUnsub).toHaveBeenCalled();
    });
  });

  describe('addComment', () => {
    it('should add comment and notify subscribers in mock mode', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(true);

      const onUpdate = vi.fn();
      const unsub = subscribeToComments('CTR-TEST-01', onUpdate);
      onUpdate.mockClear();

      const newComment = await addComment(
        'CTR-TEST-01',
        {
          versionNo: 1,
          commentText: 'Thử nghiệm bình luận',
        },
        {
          uid: 'user_01',
          displayName: 'Tester',
          email: 'test@fev.com',
          role: 'USER',
        }
      );

      expect(newComment.commentText).toBe('Thử nghiệm bình luận');
      expect(newComment.type).toBe('USER_RESPONSE');
      expect(onUpdate).toHaveBeenCalled();

      unsub();
    });

    it('should call setDoc in production mode', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      const res = await addComment(
        'CTR-2609-0001',
        {
          versionNo: 1,
          commentText: 'Ý kiến pháp chế',
        },
        {
          uid: 'legal_01',
          displayName: 'Luật sư',
          role: 'LEGAL',
        }
      );

      expect(res.type).toBe('LEGAL_COMMENT');
      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe('addSystemEventComment', () => {
    it('should add system version upload comment', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(true);

      const res = await addSystemEventComment(
        'CTR-TEST-02',
        {
          eventType: 'SYSTEM_VERSION_UPLOAD',
          versionNo: 3,
          changeSummary: 'Điều chỉnh hạn thanh toán thành 30 ngày',
        },
        {
          uid: 'user_01',
          displayName: 'thao.pham',
          role: 'USER',
        }
      );

      expect(res.type).toBe('SYSTEM_VERSION_UPLOAD');
      expect(res.versionNo).toBe(3);
      expect(res.changeSummary).toBe('Điều chỉnh hạn thanh toán thành 30 ngày');
      expect(res.author.displayName).toBe('thao.pham');
    });

    it('should add system status change comment', async () => {
      vi.mocked(isMockDevEnvironment).mockReturnValue(false);
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      const res = await addSystemEventComment(
        'CTR-2609-0001',
        {
          eventType: 'SYSTEM_STATUS_CHANGE',
          versionNo: 2,
          statusLabel: 'Head Review',
          statusIcon: '💚',
        },
        {
          uid: 'legal_01',
          displayName: 'vy.tran',
          role: 'LEGAL',
        }
      );

      expect(res.type).toBe('SYSTEM_STATUS_CHANGE');
      expect(res.statusLabel).toBe('Head Review');
      expect(res.statusIcon).toBe('💚');
      expect(setDoc).toHaveBeenCalled();
    });
  });
});
