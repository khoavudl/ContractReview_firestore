/**
 * Feature: Review Tasks & Workflow Action Engine
 * Service: taskService.ts — Firestore subcollection operations & Cloud Function status transitions
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable, type Functions } from 'firebase/functions';
import { ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';
import {
  getFirebaseDb,
  getFirebaseFunctions,
  getFirebaseStorage,
  isMockDevEnvironment,
  toValidDate,
  type AuthUser,
  type ContractStatus,
} from '@/shared';
import { updateMockContractStatus } from '@/features/contracts';
import type {
  TaskItem,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '../types';

/**
 * Initial sample tasks for offline development & testing
 */
export const DEV_SAMPLE_TASKS: Record<string, TaskItem[]> = {
  'CTR-2609-0003': [
    {
      taskId: 'task-001',
      order: 1,
      clauses: 'Điều 4.2 - Thời hạn thanh toán và đối soát kho bãi',
      category: 'COMMERCIAL',
      issueSummary: 'Thời hạn thanh toán 15 ngày là quá ngắn so với quy chế công nợ nội bộ 30 ngày.',
      legalRecommendation: 'Đề nghị đàm phán sửa thành 30 ngày làm việc kể từ ngày nhận đủ hóa đơn hợp lệ.',
      status: 'OPEN',
      userNotes: '',
      createdBy: { uid: 'legal_01', displayName: 'Luật sư Trần Văn Pháp' },
      updatedAt: new Date('2026-09-27T08:30:00Z'),
    },
    {
      taskId: 'task-002',
      order: 2,
      clauses: 'Điều 8.1 - Mức phạt vi phạm hợp đồng logistics',
      category: 'PENALTY',
      issueSummary: 'Quy định phạt vi phạm 12% tổng giá trị hợp đồng vi phạm Điều 301 Luật Thương mại (tối đa 8%).',
      legalRecommendation: 'Chỉnh sửa mức phạt về tối đa 8% theo đúng Luật Thương mại 2005.',
      status: 'RESOLVED',
      userNotes: 'Đã đàm phán lại với đối tác Logistics Á Châu và thống nhất điều chỉnh về 8%.',
      legalDecision: 'Đồng ý với điều khoản đã chỉnh sửa.',
      createdBy: { uid: 'legal_01', displayName: 'Luật sư Trần Văn Pháp' },
      updatedAt: new Date('2026-09-27T10:15:00Z'),
    },
  ],
  'CTR-2609-0005': [
    {
      taskId: 'task-101',
      order: 1,
      clauses: 'Điều 6.3 - Trách nhiệm bồi thường mất mát hàng hóa',
      category: 'SLA',
      issueSummary: 'Chưa có quy định bồi thường theo giá trị thị trường đối với sản phẩm cà phê hòa tan.',
      legalRecommendation: 'Bổ sung cam kết bồi thường 100% giá bán buôn niêm yết trong trường hợp mất hoặc ướt bao bì.',
      status: 'OPEN',
      userNotes: '',
      createdBy: { uid: 'legal_02', displayName: 'Nguyễn Thị Pháp Chế' },
      updatedAt: new Date('2026-09-28T09:00:00Z'),
    },
  ],
};

// In-memory store for mock operations
const mockTasksStore: Map<string, TaskItem[]> = new Map();

function getMockTasks(contractId: string): TaskItem[] {
  if (!mockTasksStore.has(contractId)) {
    const initial = DEV_SAMPLE_TASKS[contractId] || [];
    mockTasksStore.set(contractId, [...initial]);
  }
  return mockTasksStore.get(contractId)!;
}

export function resetMockTasksForTesting(): void {
  mockTasksStore.clear();
}

function parseTaskDoc(docId: string, data: Record<string, unknown>): TaskItem {
  return {
    taskId: docId,
    order: Number(data.order) || 1,
    clauses: String(data.clauses || ''),
    category: (data.category as TaskItem['category']) || 'OTHER',
    issueSummary: String(data.issueSummary || ''),
    legalRecommendation: String(data.legalRecommendation || ''),
    status: (data.status as TaskItem['status']) || 'OPEN',
    userNotes: String(data.userNotes || ''),
    legalDecision: data.legalDecision ? String(data.legalDecision) : undefined,
    createdBy: (data.createdBy as TaskItem['createdBy']) || { uid: '', displayName: '' },
    updatedAt: toValidDate(data.updatedAt) ?? new Date(),
  };
}

/**
 * Subscribe to realtime tasks in /contracts/{contractId}/tasks subcollection
 */
export function subscribeTasks(
  contractId: string,
  onData: (tasks: TaskItem[]) => void,
  onError?: (err: Error) => void,
  dbInstance?: Firestore
): Unsubscribe {
  const isMock = isMockDevEnvironment();
  if (isMock) {
    const list = getMockTasks(contractId);
    onData([...list].sort((a, b) => a.order - b.order));
  }

  const db = dbInstance ?? getFirebaseDb();
  const tasksColRef = collection(db, 'contracts', contractId, 'tasks');
  const q = query(tasksColRef, orderBy('order', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d) => parseTaskDoc(d.id, d.data()));
        onData(items);
      } else if (isMock) {
        onData(getMockTasks(contractId));
      } else {
        onData([]);
      }
    },
    (err) => {
      if (isMock) {
        onData(getMockTasks(contractId));
      } else {
        onError?.(err);
      }
    }
  );
}

/**
 * Create a new review task in /contracts/{contractId}/tasks
 */
export async function createTask(
  contractId: string,
  user: AuthUser,
  payload: CreateTaskPayload,
  nextOrder: number,
  dbInstance?: Firestore
): Promise<string> {
  const isMock = isMockDevEnvironment();
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newTask: TaskItem = {
    taskId,
    order: nextOrder,
    clauses: payload.clauses.trim(),
    category: payload.category,
    issueSummary: payload.issueSummary.trim(),
    legalRecommendation: payload.legalRecommendation.trim(),
    status: 'OPEN',
    userNotes: '',
    createdBy: {
      uid: user.uid,
      displayName: user.displayName,
    },
    updatedAt: new Date(),
  };

  if (isMock) {
    const currentList = getMockTasks(contractId);
    mockTasksStore.set(contractId, [...currentList, newTask]);
    return taskId;
  }

  const db = dbInstance ?? getFirebaseDb();
  const taskDocRef = doc(db, 'contracts', contractId, 'tasks', taskId);
  await setDoc(taskDocRef, {
    ...newTask,
    updatedAt: serverTimestamp(),
  });

  return taskId;
}

/**
 * Update an existing review task (user notes or status)
 */
export async function updateTask(
  contractId: string,
  taskId: string,
  updates: UpdateTaskPayload,
  dbInstance?: Firestore
): Promise<void> {
  const isMock = isMockDevEnvironment();
  if (isMock) {
    const currentList = getMockTasks(contractId);
    const updated = currentList.map((t) => {
      if (t.taskId === taskId) {
        return {
          ...t,
          ...updates,
          updatedAt: new Date(),
        };
      }
      return t;
    });
    mockTasksStore.set(contractId, updated);
    return;
  }

  const db = dbInstance ?? getFirebaseDb();
  const taskDocRef = doc(db, 'contracts', contractId, 'tasks', taskId);
  await updateDoc(taskDocRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a review task
 */
export async function deleteTask(
  contractId: string,
  taskId: string,
  dbInstance?: Firestore
): Promise<void> {
  const isMock = isMockDevEnvironment();
  if (isMock) {
    const currentList = getMockTasks(contractId);
    mockTasksStore.set(contractId, currentList.filter((t) => t.taskId !== taskId));
    return;
  }

  const db = dbInstance ?? getFirebaseDb();
  const taskDocRef = doc(db, 'contracts', contractId, 'tasks', taskId);
  await deleteDoc(taskDocRef);
}

/**
 * Call Cloud Function transitionContractStatus to execute validated state transition
 */
export async function executeStatusTransition(
  contractId: string,
  targetStatus: ContractStatus,
  payload?: {
    changeSummary?: string;
    taskListComplete?: boolean;
    rejectReason?: string;
    versionNo?: number;
  },
  functionsInstance?: Functions
): Promise<{ success: boolean; newStatus: ContractStatus }> {
  const isMock = isMockDevEnvironment();
  if (isMock) {
    // Simulated instant success in mock mode
    updateMockContractStatus(contractId, targetStatus);
    return { success: true, newStatus: targetStatus };
  }

  const functions = functionsInstance ?? getFirebaseFunctions();
  const callable = httpsCallable<
    { contractId: string; targetStatus: ContractStatus; payload?: Record<string, unknown> },
    { success: boolean; newStatus: ContractStatus }
  >(functions, 'transitionContractStatus');

  const res = await callable({
    contractId,
    targetStatus,
    payload,
  });

  return res.data;
}

/**
 * Upload a revised Word document (.docx) to Firebase Storage and update versioning records
 */
export async function uploadRevisionDocx(
  contractId: string,
  user: AuthUser,
  file: File,
  nextVersionNo: number,
  changeSummary: string,
  negoNotes?: string,
  dbInstance?: Firestore,
  storageInstance?: FirebaseStorage
): Promise<{ versionId: string; storagePath: string }> {
  const isMock = isMockDevEnvironment();
  const versionId = `v${nextVersionNo}`;
  const storagePath = `contracts/${contractId}/versions/${versionId}.docx`;

  if (isMock) {
    return { versionId, storagePath };
  }

  const storage = storageInstance ?? getFirebaseStorage();
  const storageRef = ref(storage, storagePath);
  const downloadToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `token_${Date.now()}`;
  await uploadBytes(storageRef, file, {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    customMetadata: {
      firebaseStorageDownloadTokens: downloadToken,
    },
  });

  const db = dbInstance ?? getFirebaseDb();
  const versionDocRef = doc(db, 'contracts', contractId, 'versions', versionId);
  const now = serverTimestamp();

  await setDoc(versionDocRef, {
    versionId,
    versionNo: nextVersionNo,
    fileName: file.name,
    storagePath,
    action: 'USER_REVISION',
    changeSummary: changeSummary.trim(),
    negoNotes: negoNotes ? negoNotes.trim() : '',
    uploadedBy: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
    },
    uploadedAt: now,
  });

  // Update current version pointer on contract doc
  const contractDocRef = doc(db, 'contracts', contractId);
  await updateDoc(contractDocRef, {
    currentVersion: nextVersionNo,
    currentVersionFile: {
      versionNo: nextVersionNo,
      originalFileName: file.name,
      storagePath,
    },
    updatedAt: now,
  });

  return { versionId, storagePath };
}
