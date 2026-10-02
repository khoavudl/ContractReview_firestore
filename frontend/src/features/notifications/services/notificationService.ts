/**
 * Feature: In-App Notifications
 * Service: notificationService.ts — Firestore Realtime Listener & Read Status Updates
 */

import {
  collection,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  getFirebaseDb,
  isMockDevEnvironment,
  toValidDate,
  FEATURE_FLAGS,
} from '@/shared';
import type { NotificationItem } from '../types';

/** Dev sample initial notifications for offline testing */
export const DEV_SAMPLE_NOTIFICATIONS: Record<string, NotificationItem[]> = {
  default: [
    {
      notifId: 'notif-001',
      contractId: 'CTR-2609-0001',
      title: 'Góp ý mới từ Pháp chế',
      message: 'Luật sư Trần Văn Pháp đã phản hồi về Điều 4.2 - Thời hạn thanh toán trong hồ sơ CTR-2609-0001.',
      type: 'NEW_COMMENT',
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
    },
    {
      notifId: 'notif-002',
      contractId: 'CTR-2609-0001',
      title: 'Trạng thái hợp đồng cập nhật',
      message: 'Hồ sơ CTR-2609-0001 đã chuyển sang trạng thái "Pháp chế Đang rà soát".',
      type: 'STATUS_CHANGE',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      notifId: 'notif-003',
      contractId: 'CTR-2609-0002',
      title: 'Nhiệm vụ rà soát mới',
      message: 'Có 3 điều khoản cần chỉnh sửa bổ sung trong hồ sơ hợp đồng tiếp thị số CTR-2609-0002.',
      type: 'TASK_ASSIGNED',
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
  ],
};

const mockInMemNotifs: Record<string, NotificationItem[]> = {};
const mockSubscribers: Record<string, Set<(items: NotificationItem[]) => void>> = {};

/**
 * Subscribes to realtime updates of user notifications
 * Collection: /notifications/{userId}/items
 */
export function subscribeToNotifications(
  userId: string,
  onUpdate: (items: NotificationItem[]) => void,
  onError?: (err: Error) => void,
  dbInstance?: Firestore
): Unsubscribe {
  if (!FEATURE_FLAGS.ENABLE_NOTIFICATIONS) {
    onUpdate([]);
    return () => {};
  }

  if (isMockDevEnvironment()) {
    if (!mockInMemNotifs[userId]) {
      mockInMemNotifs[userId] = [...DEV_SAMPLE_NOTIFICATIONS.default];
    }

    if (!mockSubscribers[userId]) {
      mockSubscribers[userId] = new Set();
    }
    mockSubscribers[userId].add(onUpdate);

    // Initial emit
    onUpdate([...mockInMemNotifs[userId]]);

    return () => {
      mockSubscribers[userId]?.delete(onUpdate);
    };
  }

  try {
    const db = dbInstance || getFirebaseDb();
    const notifsRef = collection(db, 'notifications', userId, 'items');
    const q = query(notifsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            notifId: d.id,
            createdAt: toValidDate(data.createdAt),
          } as NotificationItem;
        });
        onUpdate(list);
      },
      (err) => {
        console.warn(`[notificationService] Firestore onSnapshot error for ${userId}:`, err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn(`[notificationService] Failed to establish listener for ${userId}:`, err);
    if (onError) onError(err as Error);
    return () => {};
  }
}

/**
 * Marks a single notification as read
 */
export async function markNotificationAsRead(
  userId: string,
  notifId: string,
  dbInstance?: Firestore
): Promise<void> {
  if (!FEATURE_FLAGS.ENABLE_NOTIFICATIONS) {
    return;
  }

  if (isMockDevEnvironment()) {
    if (mockInMemNotifs[userId]) {
      mockInMemNotifs[userId] = mockInMemNotifs[userId].map((n) =>
        n.notifId === notifId ? { ...n, isRead: true } : n
      );
      mockSubscribers[userId]?.forEach((cb) => cb([...mockInMemNotifs[userId]]));
    }
    return;
  }

  const db = dbInstance || getFirebaseDb();
  const docRef = doc(db, 'notifications', userId, 'items', notifId);
  await updateDoc(docRef, { isRead: true });
}

/**
 * Marks all unread notifications for a user as read
 */
export async function markAllNotificationsAsRead(
  userId: string,
  dbInstance?: Firestore
): Promise<void> {
  if (!FEATURE_FLAGS.ENABLE_NOTIFICATIONS) {
    return;
  }

  if (isMockDevEnvironment()) {
    if (mockInMemNotifs[userId]) {
      mockInMemNotifs[userId] = mockInMemNotifs[userId].map((n) => ({ ...n, isRead: true }));
      mockSubscribers[userId]?.forEach((cb) => cb([...mockInMemNotifs[userId]]));
    }
    return;
  }

  const db = dbInstance || getFirebaseDb();
  const notifsRef = collection(db, 'notifications', userId, 'items');
  const q = query(notifsRef, where('isRead', '==', false));
  const snap = await getDocs(q);

  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { isRead: true });
  });
  await batch.commit();
}

/** Internal test reset helper */
export function resetMockNotificationsForTesting(): void {
  for (const key of Object.keys(mockInMemNotifs)) {
    delete mockInMemNotifs[key];
  }
  for (const key of Object.keys(mockSubscribers)) {
    delete mockSubscribers[key];
  }
}
