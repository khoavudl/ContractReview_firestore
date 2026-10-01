/**
 * Feature: Comments & Discussion Thread
 * Service: commentService.ts — Firestore Realtime Subcollection & Immutable Persistence
 */

import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  getFirebaseDb,
  isMockDevEnvironment,
  toValidDate,
} from '@/shared';
import {
  type CommentDocument,
  type CreateCommentPayload,
  type CreateSystemEventPayload,
  type CommentAuthor,
  resolveCommentType,
} from '../types';

export { resolveCommentType };

/** Dev sample initial comments for offline testing — ordered from newest to oldest */
export const DEV_SAMPLE_COMMENTS: Record<string, CommentDocument[]> = {
  'CTR-2609-0001': [
    {
      commentId: 'comment-004',
      versionNo: 2,
      commentText: 'Đã phê duyệt (Pháp lý)',
      type: 'SYSTEM_STATUS_CHANGE',
      statusLabel: 'Đã phê duyệt (Pháp lý)',
      statusIcon: '💚',
      author: {
        uid: 'legal_01',
        displayName: 'vy.tran',
        email: 'vy.tran@fev.com',
        role: 'LEGAL',
      },
      createdAt: new Date('2026-10-01T15:30:00Z'),
    },
    {
      commentId: 'comment-003',
      versionNo: 2,
      commentText:
        'Dear chị Vy,\nEm có chỉnh sửa số 4.6 thành 4.5 trong version tiếng Anh để tương ứng version tiếng Việt, các mục còn lại em giữ nguyên. Nhờ chị xem giúp em nhé.',
      type: 'USER_RESPONSE',
      author: {
        uid: 'user_01',
        displayName: 'thao.pham',
        email: 'thao.pham@fev.com',
        role: 'USER',
      },
      createdAt: new Date('2026-10-01T15:00:00Z'),
    },
    {
      commentId: 'comment-002',
      versionNo: 2,
      commentText: 'Tải lên phiên bản v2',
      type: 'SYSTEM_VERSION_UPLOAD',
      changeSummary: 'Chỉnh sửa số 4.6 thành 4.5 version tiếng Anh để khớp với version tiếng Việt.',
      author: {
        uid: 'user_01',
        displayName: 'thao.pham',
        email: 'thao.pham@fev.com',
        role: 'USER',
      },
      createdAt: new Date('2026-10-01T14:30:00Z'),
    },
    {
      commentId: 'comment-001',
      versionNo: 1,
      commentText:
        'Dear Thảo,\nNhư đã trao đổi, version 4 chưa điều chỉnh Điều 3.2 và Điều 4.5 như ý kiến của TUV. Chị đã chỉnh sửa như file clean đính kèm.\nEm xem lại và check với NCC nội dung version clean này nhé.',
      type: 'LEGAL_COMMENT',
      author: {
        uid: 'legal_01',
        displayName: 'vy.tran',
        email: 'vy.tran@fev.com',
        role: 'LEGAL',
      },
      createdAt: new Date('2026-09-30T10:00:00Z'),
    },
  ],
};

const mockInMemComments: Record<string, CommentDocument[]> = { ...DEV_SAMPLE_COMMENTS };
const mockSubscribers: Record<string, Set<(comments: CommentDocument[]) => void>> = {};

function sortCommentsDesc(list: CommentDocument[]): CommentDocument[] {
  return [...list].sort((a, b) => {
    const tA = toValidDate(a.createdAt)?.getTime() ?? 0;
    const tB = toValidDate(b.createdAt)?.getTime() ?? 0;
    return tB - tA;
  });
}

/**
 * Subscribes to realtime updates of contract discussion comments (ordered newest first)
 * Subcollection: /contracts/{contractId}/comments
 */
export function subscribeToComments(
  contractId: string,
  onUpdate: (comments: CommentDocument[]) => void,
  onError?: (err: Error) => void,
  dbInstance?: Firestore
): Unsubscribe {
  if (isMockDevEnvironment()) {
    if (!mockInMemComments[contractId]) {
      mockInMemComments[contractId] = DEV_SAMPLE_COMMENTS['CTR-2609-0001']
        ? [...DEV_SAMPLE_COMMENTS['CTR-2609-0001']]
        : [];
    }

    if (!mockSubscribers[contractId]) {
      mockSubscribers[contractId] = new Set();
    }
    mockSubscribers[contractId].add(onUpdate);

    // Initial emit (sorted newest first)
    onUpdate(sortCommentsDesc(mockInMemComments[contractId]));

    return () => {
      mockSubscribers[contractId]?.delete(onUpdate);
    };
  }

  try {
    const db = dbInstance || getFirebaseDb();
    const commentsRef = collection(db, 'contracts', contractId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            commentId: d.id,
            createdAt: toValidDate(data.createdAt),
          } as CommentDocument;
        });
        onUpdate(list);
      },
      (err) => {
        console.warn(`[commentService] Firestore onSnapshot error for ${contractId}:`, err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn(`[commentService] Failed to establish listener for ${contractId}:`, err);
    if (onError) onError(err as Error);
    return () => {};
  }
}

/**
 * Adds an immutable comment to /contracts/{contractId}/comments/{commentId}
 */
export async function addComment(
  contractId: string,
  payload: CreateCommentPayload,
  author: CommentAuthor,
  dbInstance?: Firestore
): Promise<CommentDocument> {
  if (payload.commentText.trim().length > 1000) {
    throw new Error('Nội dung trao đổi không được vượt quá 1000 ký tự');
  }

  const commentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const commentType = resolveCommentType(author.role as 'USER' | 'LEGAL' | 'HOL');
  const newComment: CommentDocument = {
    commentId,
    versionNo: payload.versionNo,
    commentText: payload.commentText.trim(),
    type: commentType,
    author: {
      uid: author.uid,
      displayName: author.displayName,
      email: author.email,
      role: author.role,
    },
    createdAt: new Date(),
  };

  if (isMockDevEnvironment()) {
    if (!mockInMemComments[contractId]) {
      mockInMemComments[contractId] = [];
    }
    mockInMemComments[contractId].unshift(newComment);

    const sorted = sortCommentsDesc(mockInMemComments[contractId]);
    mockInMemComments[contractId] = sorted;

    // Notify mock subscribers
    mockSubscribers[contractId]?.forEach((listener) => {
      listener(sorted);
    });

    return newComment;
  }

  const db = dbInstance || getFirebaseDb();
  const docRef = doc(db, 'contracts', contractId, 'comments', commentId);

  const firestoreData: Record<string, unknown> = {
    commentId: newComment.commentId,
    versionNo: newComment.versionNo,
    commentText: newComment.commentText,
    type: newComment.type,
    author: newComment.author,
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, firestoreData);

  return newComment;
}

/**
 * Adds an automated system event card (Version upload or Status transition)
 * Subcollection: /contracts/{contractId}/comments/{commentId}
 */
export async function addSystemEventComment(
  contractId: string,
  payload: CreateSystemEventPayload,
  performedBy: CommentAuthor,
  dbInstance?: Firestore
): Promise<CommentDocument> {
  const commentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const defaultText =
    payload.commentText ||
    (payload.eventType === 'SYSTEM_VERSION_UPLOAD'
      ? `Tải lên phiên bản v${payload.versionNo}`
      : payload.statusLabel || 'Cập nhật trạng thái');

  const newComment: CommentDocument = {
    commentId,
    versionNo: payload.versionNo,
    commentText: defaultText,
    type: payload.eventType,
    author: {
      uid: performedBy.uid,
      displayName: performedBy.displayName,
      email: performedBy.email,
      role: performedBy.role,
    },
    createdAt: new Date(),
    ...(payload.changeSummary ? { changeSummary: payload.changeSummary } : {}),
    ...(payload.rejectReason ? { rejectReason: payload.rejectReason } : {}),
    ...(payload.statusLabel ? { statusLabel: payload.statusLabel } : {}),
    ...(payload.statusIcon ? { statusIcon: payload.statusIcon } : {}),
  };

  if (isMockDevEnvironment()) {
    if (!mockInMemComments[contractId]) {
      mockInMemComments[contractId] = [];
    }
    mockInMemComments[contractId].unshift(newComment);

    const sorted = sortCommentsDesc(mockInMemComments[contractId]);
    mockInMemComments[contractId] = sorted;

    mockSubscribers[contractId]?.forEach((listener) => {
      listener(sorted);
    });

    return newComment;
  }

  const db = dbInstance || getFirebaseDb();
  const docRef = doc(db, 'contracts', contractId, 'comments', commentId);

  const firestoreData: Record<string, unknown> = {
    commentId: newComment.commentId,
    versionNo: newComment.versionNo,
    commentText: newComment.commentText,
    type: newComment.type,
    author: newComment.author,
    createdAt: serverTimestamp(),
    ...(newComment.changeSummary ? { changeSummary: newComment.changeSummary } : {}),
    ...(newComment.rejectReason ? { rejectReason: newComment.rejectReason } : {}),
    ...(newComment.statusLabel ? { statusLabel: newComment.statusLabel } : {}),
    ...(newComment.statusIcon ? { statusIcon: newComment.statusIcon } : {}),
  };

  await setDoc(docRef, firestoreData);
  return newComment;
}

/** Internal helper for testing */
export function resetMockCommentsForTesting(): void {
  for (const key of Object.keys(mockInMemComments)) {
    delete mockInMemComments[key];
  }
  Object.assign(mockInMemComments, DEV_SAMPLE_COMMENTS);
  for (const key of Object.keys(mockSubscribers)) {
    delete mockSubscribers[key];
  }
}
