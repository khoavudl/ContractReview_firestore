/**
 * Feature: Review Tasks & Workflow Action Engine
 * Service: taskService.ts — Firestore subcollection operations & Direct Atomic Status Transitions
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';
import {
  getFirebaseDb,
  getFirebaseStorage,
  isMockDevEnvironment,
  toValidDate,
  STATUS_CONFIG,
  FEATURE_FLAGS,
  type AuthUser,
  type ContractDocument,
  type ContractStatus,
} from '@/shared';
import { updateMockContractStatus } from '@/features/contracts';
import type {
  TaskItem,
  CreateTaskPayload,
  UpdateTaskPayload,
  BatchSaveTasksPayload,
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
 * Batch save new task drafts and task updates in a single atomic writeBatch
 */
export async function batchSaveTasks(
  contractId: string,
  user: AuthUser,
  payload: BatchSaveTasksPayload,
  dbInstance?: Firestore
): Promise<void> {
  const draftsToCreate = payload.draftsToCreate || [];
  const tasksToUpdate = payload.tasksToUpdate || [];

  if (draftsToCreate.length === 0 && tasksToUpdate.length === 0) {
    return;
  }

  const isMock = isMockDevEnvironment();
  if (isMock) {
    let currentList = [...getMockTasks(contractId)];

    // 1. Process updates
    for (const updateItem of tasksToUpdate) {
      currentList = currentList.map((t) =>
        t.taskId === updateItem.taskId
          ? { ...t, ...updateItem.updates, updatedAt: new Date() }
          : t
      );
    }

    // 2. Process creates
    for (const draft of draftsToCreate) {
      const newTaskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newTask: TaskItem = {
        taskId: newTaskId,
        order: draft.order,
        clauses: draft.clauses.trim(),
        category: draft.category,
        issueSummary: draft.issueSummary.trim(),
        legalRecommendation: draft.legalRecommendation.trim(),
        status: 'OPEN',
        userNotes: '',
        createdBy: {
          uid: user.uid,
          displayName: user.displayName || user.email || 'Pháp chế',
        },
        updatedAt: new Date(),
      };
      currentList.push(newTask);
    }

    mockTasksStore.set(contractId, currentList);
    return;
  }

  const db = dbInstance ?? getFirebaseDb();
  const batch = writeBatch(db);

  // 1. Queue updates
  for (const updateItem of tasksToUpdate) {
    const taskRef = doc(db, 'contracts', contractId, 'tasks', updateItem.taskId);
    batch.update(taskRef, {
      ...updateItem.updates,
      updatedAt: serverTimestamp(),
    });
  }

  // 2. Queue creates
  for (const draft of draftsToCreate) {
    const taskColRef = collection(db, 'contracts', contractId, 'tasks');
    const newDocRef = doc(taskColRef);
    const newTask = {
      taskId: newDocRef.id,
      order: draft.order,
      clauses: draft.clauses.trim(),
      category: draft.category,
      issueSummary: draft.issueSummary.trim(),
      legalRecommendation: draft.legalRecommendation.trim(),
      status: 'OPEN' as const,
      userNotes: '',
      createdBy: {
        uid: user.uid,
        displayName: user.displayName || user.email || 'Pháp chế',
      },
      updatedAt: serverTimestamp(),
    };
    batch.set(newDocRef, newTask);
  }

  await batch.commit();
}

/**
 * Helper: Resolve status event icon
 */
function getStatusEventIcon(status: ContractStatus): string {
  if (status === 'PENDING_LEGAL') return '📄';
  if (status === 'USER_REVISING' || status === 'LEGAL_COMMENTED' || status === 'HOL_COMMENTED') return '✏️';
  if (status === 'PENDING_HOL') return '🔍';
  if (status === 'HOL_APPROVED') return '✅';
  if (status === 'COMPLETED') return '🎉';
  return '⚡';
}

/**
 * Context input contract for state transition
 */
export type TransitionContractContext = Pick<ContractDocument, 'contractId' | 'status'> & Partial<ContractDocument>;

/**
 * Helper: Compute contract doc updates for state transition
 */
function buildContractUpdates(
  contract: TransitionContractContext,
  targetStatus: ContractStatus
): Record<string, unknown> {
  const updates: Record<string, unknown> = {
    status: targetStatus,
    updatedAt: serverTimestamp(),
  };

  if (targetStatus === 'USER_REVISING' && contract.status !== 'USER_REVISING') {
    updates.rejectCount = (contract.rejectCount || 0) + 1;
  }

  if (targetStatus === 'HOL_APPROVED' && contract.currentVersionFile) {
    updates.currentVersionFile = {
      ...contract.currentVersionFile,
      originalFileName: `${contract.contractId}_approved.docx`,
    };
  }

  if (targetStatus === 'COMPLETED') {
    updates.isArchived = true;
  }

  return updates;
}

/**
 * Helper: Queue system activity log and discussion comment into batch
 */
function queueActivityAndComment(
  batch: ReturnType<typeof writeBatch>,
  db: Firestore,
  contract: TransitionContractContext,
  targetStatus: ContractStatus,
  user: AuthUser,
  payload?: { changeSummary?: string; rejectReason?: string }
): void {
  const meta = STATUS_CONFIG[targetStatus];
  const reasonText = payload?.rejectReason?.trim() || payload?.changeSummary?.trim();
  const detailSuffix = reasonText ? ` - ${payload?.rejectReason ? 'Lý do' : 'Ghi chú'}: ${reasonText}` : '';

  const actRef = doc(collection(db, 'contracts', contract.contractId, 'activities'));
  batch.set(actRef, {
    activityId: actRef.id,
    action: 'STATUS_CHANGE',
    performedBy: { uid: user.uid, displayName: user.displayName || user.email || 'Hệ thống', role: user.role },
    details: `Chuyển trạng thái từ ${contract.status || 'UNKNOWN'} sang ${targetStatus}${detailSuffix}`,
    timestamp: serverTimestamp(),
  });

  const commentRef = doc(collection(db, 'contracts', contract.contractId, 'comments'));
  batch.set(commentRef, {
    commentId: commentRef.id,
    versionNo: contract.currentVersion || 1,
    commentText: meta?.label || targetStatus,
    type: 'SYSTEM_STATUS_CHANGE',
    author: { uid: user.uid, displayName: user.displayName || user.email || 'Hệ thống', email: user.email, role: user.role },
    createdAt: serverTimestamp(),
    statusLabel: meta?.label || targetStatus,
    statusIcon: getStatusEventIcon(targetStatus),
    ...(payload?.changeSummary ? { changeSummary: payload.changeSummary.trim() } : {}),
    ...(payload?.rejectReason ? { rejectReason: payload.rejectReason.trim() } : {}),
  });
}

/**
 * Helper: Queue in-app notification if target user is eligible
 */
function queueTransitionNotification(
  batch: ReturnType<typeof writeBatch>,
  db: Firestore,
  contract: TransitionContractContext,
  targetStatus: ContractStatus,
  payload?: { rejectReason?: string; changeSummary?: string }
): void {
  if (!FEATURE_FLAGS.ENABLE_NOTIFICATIONS || !contract.createdBy?.uid) return;

  let title = '';
  let message = '';
  const targetUid = contract.createdBy.uid;

  if (targetStatus === 'USER_REVISING') {
    const isFromHol = contract.status === 'PENDING_HOL';
    const reasonSuffix = payload?.rejectReason ? ` (Lý do: ${payload.rejectReason})` : '';
    title = isFromHol ? 'Ý kiến từ Trưởng phòng Pháp chế' : 'Có yêu cầu chỉnh sửa từ Pháp chế';
    message = isFromHol
      ? `Hồ sơ "${contract.title || contract.contractId}" có ý kiến chỉ đạo cần chỉnh sửa.${reasonSuffix}`
      : `Hồ sơ "${contract.title || contract.contractId}" cần bạn kiểm tra danh mục rà soát và chỉnh sửa tài liệu.`;
  } else if (targetStatus === 'HOL_APPROVED') {
    title = 'Hợp đồng đã được phê duyệt';
    message = `Hồ sơ "${contract.title || contract.contractId}" đã được duyệt. Bạn có thể nộp ký WeSign.`;
  }

  if (title) {
    const notifRef = doc(collection(db, 'notifications', targetUid, 'items'));
    batch.set(notifRef, {
      notifId: notifRef.id,
      contractId: contract.contractId,
      title,
      message,
      type: 'STATUS_CHANGE',
      isRead: false,
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Input contract parameter type for status transitions
 */
export type TransitionContractInput = (Pick<ContractDocument, 'contractId'> & Partial<ContractDocument>) | string;

/**
 * Execute atomic state transition via direct Firestore writeBatch (Client-First Direct)
 */
export async function executeStatusTransition(
  contractInput: TransitionContractInput,
  targetStatus: ContractStatus,
  userOrPayload?: AuthUser | { changeSummary?: string; taskListComplete?: boolean; rejectReason?: string; versionNo?: number },
  payloadOrDb?: { changeSummary?: string; taskListComplete?: boolean; rejectReason?: string; versionNo?: number } | Firestore,
  dbInstance?: Firestore
): Promise<{ success: boolean; newStatus: ContractStatus }> {
  const startTime = performance.now();
  const contractId = typeof contractInput === 'string' ? contractInput : contractInput.contractId;
  const contract: TransitionContractContext =
    typeof contractInput === 'string'
      ? { contractId, status: 'DRAFT', title: contractId }
      : { ...contractInput, status: contractInput.status ?? 'DRAFT' };

  const user: AuthUser = (userOrPayload && 'uid' in userOrPayload && 'role' in userOrPayload)
    ? (userOrPayload as AuthUser)
    : { uid: 'system', displayName: 'Hệ thống', email: '', role: 'USER', isActive: true };

  const payload = (userOrPayload && !('uid' in userOrPayload))
    ? (userOrPayload as { changeSummary?: string; rejectReason?: string; versionNo?: number })
    : (payloadOrDb && !('type' in payloadOrDb || 'app' in payloadOrDb))
    ? (payloadOrDb as { changeSummary?: string; rejectReason?: string; versionNo?: number })
    : undefined;

  const db = (payloadOrDb && ('app' in payloadOrDb || 'type' in payloadOrDb))
    ? (payloadOrDb as Firestore)
    : (dbInstance ?? getFirebaseDb());

  const isMock = isMockDevEnvironment();
  if (isMock) {
    updateMockContractStatus(contractId, targetStatus);
    const duration = (performance.now() - startTime).toFixed(1);
    console.log(`⚡ [Workflow PERF] Mock status transition trong ${duration}ms | ${contractId}: ${contract.status || 'DRAFT'} -> ${targetStatus}`);
    return { success: true, newStatus: targetStatus };
  }

  const batch = writeBatch(db);
  const contractRef = doc(db, 'contracts', contractId);

  batch.update(contractRef, buildContractUpdates(contract, targetStatus));

  if (targetStatus === 'HOL_APPROVED') {
    const versionId = `v${contract.currentVersion || 1}`;
    const versionRef = doc(db, 'contracts', contractId, 'versions', versionId);
    batch.set(versionRef, { fileName: `${contractId}_approved.docx`, isApprovedVersion: true }, { merge: true });
  }

  queueActivityAndComment(batch, db, contract, targetStatus, user, payload);
  queueTransitionNotification(batch, db, contract, targetStatus, payload);

  await batch.commit();

  const duration = (performance.now() - startTime).toFixed(1);
  console.log(`⚡ [Workflow PERF] writeBatch() hoàn tất trong ${duration}ms | ${contractId}: ${contract.status || 'DRAFT'} -> ${targetStatus}`);

  return { success: true, newStatus: targetStatus };
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
  await uploadBytes(storageRef, file, {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    customMetadata: {
      createdByUid: user.uid,
    },
  });

  const db = dbInstance ?? getFirebaseDb();
  const versionDocRef = doc(db, 'contracts', contractId, 'versions', versionId);
  const now = serverTimestamp();

  const standardizedFileName = `${contractId}_v${nextVersionNo}.docx`;

  await setDoc(versionDocRef, {
    versionId,
    versionNo: nextVersionNo,
    fileName: standardizedFileName,
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
      originalFileName: standardizedFileName,
      storagePath,
    },
    updatedAt: now,
  });

  return { versionId, storagePath };
}
