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
  type CommentAuthor,
  resolveCommentType,
} from '../types';

export { resolveCommentType };

/** Dev sample initial comments for offline testing */
export const DEV_SAMPLE_COMMENTS: Record<string, CommentDocument[]> = {
  'CTR-2609-0001': [
    {
      commentId: 'comment-001',
      versionNo: 1,
      clauseRef: 'Điều 4.2 - Thời hạn thanh toán',
      commentText:
        'Thời hạn thanh toán 15 ngày quá gấp so với quy chế công nợ nội bộ 30 ngày của công ty. Anh kiểm tra lại với bên nhà cung cấp xem có thể đàm phán dãn thành 30 ngày làm việc được không nhé.',
      type: 'LEGAL_COMMENT',
      author: {
        uid: 'legal_01',
        displayName: 'Luật sư Trần Văn Pháp',
        email: 'phap.tran@fev.com',
        role: 'LEGAL',
      },
      createdAt: new Date('2026-09-28T09:15:00Z'),
    },
    {
      commentId: 'comment-002',
      versionNo: 1,
      clauseRef: 'Điều 4.2 - Thời hạn thanh toán',
      commentText:
        'Em đã trao đổi trực tiếp với giám đốc kinh doanh bên Cloud Global Services. Họ đã đồng ý sửa thành 30 ngày làm việc sau khi nhận hóa đơn VAT ở bản sửa đổi v2 ạ.',
      type: 'USER_RESPONSE',
      author: {
        uid: 'user_01',
        displayName: 'Nguyễn Văn Phụ Trách',
        email: 'user@fev.com',
        role: 'USER',
      },
      createdAt: new Date('2026-09-28T14:30:00Z'),
    },
    {
      commentId: 'comment-003',
      versionNo: 1,
      clauseRef: 'Điều 8.2 - Mức trần bồi thường',
      commentText:
        'Mức trần bồi thường 6 tháng cước là điểm chấp nhận được trong đàm phán. Lưu ý yêu cầu đối tác ký kèm Phụ lục An toàn thông tin trước khi ký duyệt hợp đồng chính thức.',
      type: 'HOL_COMMENT',
      author: {
        uid: 'hol_01',
        displayName: 'Trưởng phòng Lê Trọng Luật',
        email: 'hol@fev.com',
        role: 'HOL',
      },
      createdAt: new Date('2026-09-29T10:00:00Z'),
    },
  ],
};

const mockInMemComments: Record<string, CommentDocument[]> = { ...DEV_SAMPLE_COMMENTS };
const mockSubscribers: Record<string, Set<(comments: CommentDocument[]) => void>> = {};

/**
 * Subscribes to realtime updates of contract discussion comments
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

    // Initial emit
    onUpdate([...mockInMemComments[contractId]]);

    return () => {
      mockSubscribers[contractId]?.delete(onUpdate);
    };
  }

  try {
    const db = dbInstance || getFirebaseDb();
    const commentsRef = collection(db, 'contracts', contractId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

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
  const commentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const commentType = resolveCommentType(author.role);

  const trimmedClauseRef = payload.clauseRef?.trim();

  const newComment: CommentDocument = {
    commentId,
    versionNo: payload.versionNo,
    ...(trimmedClauseRef ? { clauseRef: trimmedClauseRef } : {}),
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
    mockInMemComments[contractId].push(newComment);

    // Notify mock subscribers
    mockSubscribers[contractId]?.forEach((listener) => {
      listener([...mockInMemComments[contractId]]);
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
  if (trimmedClauseRef) {
    firestoreData.clauseRef = trimmedClauseRef;
  }

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
