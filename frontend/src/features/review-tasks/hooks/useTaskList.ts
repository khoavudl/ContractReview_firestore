/**
 * Feature: Review Tasks & Workflow Action Engine
 * Hook: useTaskList.ts — Realtime tasks list management, progress metrics, inline drafts, and atomic batch saves
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { AuthUser, ContractStatus } from '@/shared';
import type {
  TaskItem,
  TaskStatus,
  CreateTaskPayload,
  UpdateTaskPayload,
  BatchTaskDraft,
} from '../types';
import {
  subscribeTasks,
  createTask,
  updateTask,
  deleteTask,
  batchSaveTasks,
} from '../services/taskService';

export type TaskFilterType = 'ALL' | 'OPEN' | 'RESOLVED';

export interface UseTaskListReturn {
  readonly tasks: readonly TaskItem[];
  readonly filteredTasks: readonly TaskItem[];
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly error: string | null;
  readonly filterStatus: TaskFilterType;
  readonly setFilterStatus: (filter: TaskFilterType) => void;
  readonly totalCount: number;
  readonly resolvedCount: number;
  readonly openCount: number;
  readonly percentComplete: number;
  readonly canManageTasks: boolean;
  readonly canRespondTasks: boolean;
  readonly currentUser: AuthUser | null;
  readonly addTask: (payload: CreateTaskPayload) => Promise<string>;
  readonly editTask: (taskId: string, updates: UpdateTaskPayload) => Promise<void>;
  readonly removeTask: (taskId: string) => Promise<void>;
  readonly saveUserResponse: (taskId: string, userNotes: string, status?: TaskStatus) => Promise<void>;

  // Inline Drafts & Dirty Tracking (Batch Saving for Legal/HOL)
  readonly draftTasks: readonly BatchTaskDraft[];
  readonly editingTasks: Record<string, UpdateTaskPayload>;
  readonly addNewDraft: () => void;
  readonly updateDraft: (draftId: string, updates: Partial<BatchTaskDraft>) => void;
  readonly removeDraft: (draftId: string) => void;
  readonly startEditTask: (task: TaskItem) => void;
  readonly updateEditingTask: (taskId: string, updates: Partial<UpdateTaskPayload>) => void;
  readonly cancelEditTask: (taskId: string) => void;

  // Pending User Responses (Batch Saving for USER in USER_REVISING)
  readonly pendingResponses: Record<string, { userNotes: string; status: TaskStatus }>;
  readonly updatePendingResponse: (taskId: string, userNotes: string, status?: TaskStatus) => void;

  // Global Dirty State
  readonly hasUnsavedChanges: boolean;
  readonly unsavedCount: number;
  readonly saveAllChanges: () => Promise<void>;
}

function validateDraftItem(draft: BatchTaskDraft): string | null {
  if (!draft.clauses.trim()) return `Khung #${draft.order}: Vui lòng nhập tên điều khoản tham chiếu.`;
  if (!draft.issueSummary.trim()) return `Khung #${draft.order}: Vui lòng nhập vấn đề / rủi ro phát hiện.`;
  if (!draft.legalRecommendation.trim()) return `Khung #${draft.order}: Vui lòng nhập khuyến nghị của Pháp chế.`;
  return null;
}

function validateEditedItem(order: number, updates: UpdateTaskPayload): string | null {
  if (updates.clauses !== undefined && !updates.clauses.trim()) {
    return `Điều khoản #${order}: Tên điều khoản không được để trống.`;
  }
  if (updates.issueSummary !== undefined && !updates.issueSummary.trim()) {
    return `Điều khoản #${order}: Vấn đề / rủi ro không được để trống.`;
  }
  if (updates.legalRecommendation !== undefined && !updates.legalRecommendation.trim()) {
    return `Điều khoản #${order}: Khuyến nghị không được để trống.`;
  }
  return null;
}

export function useTaskList(
  contractId: string | undefined,
  currentUser: AuthUser | null,
  contractStatus?: ContractStatus
): UseTaskListReturn {
  const [tasks, setTasks] = useState<readonly TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskFilterType>('ALL');

  // Inline drafts & editing states (Legal / HOL)
  const [draftTasks, setDraftTasks] = useState<readonly BatchTaskDraft[]>([]);
  const [editingTasks, setEditingTasks] = useState<Record<string, UpdateTaskPayload>>({});

  // Pending user responses states (USER in USER_REVISING)
  const [pendingResponses, setPendingResponses] = useState<
    Record<string, { userNotes: string; status: TaskStatus }>
  >({});

  useEffect(() => {
    if (!contractId || !currentUser) {
      setTasks([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeTasks(
      contractId,
      (items) => {
        setTasks(items);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message || 'Lỗi khi tải danh sách điều khoản rà soát.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [contractId, currentUser]);

  const canManageTasks = useMemo(() => {
    if (!currentUser || currentUser.role === 'USER') return false;
    if (contractStatus === 'PENDING_LEGAL') {
      return currentUser.role === 'LEGAL';
    }
    if (contractStatus === 'PENDING_HOL') {
      return currentUser.role === 'HOL';
    }
    return false;
  }, [currentUser, contractStatus]);

  const canRespondTasks = useMemo(() => {
    if (!currentUser || currentUser.role !== 'USER') return false;
    return (
      contractStatus === 'USER_REVISING' ||
      contractStatus === 'LEGAL_COMMENTED' ||
      contractStatus === 'HOL_COMMENTED'
    );
  }, [currentUser, contractStatus]);

  const totalCount = tasks.length + draftTasks.length;
  const resolvedCount = useMemo(() => {
    return tasks.filter((t) => {
      const pending = pendingResponses[t.taskId];
      const effectiveStatus = pending ? pending.status : t.status;
      return effectiveStatus === 'RESOLVED' || effectiveStatus === 'WAIVED';
    }).length;
  }, [tasks, pendingResponses]);

  const openCount = totalCount - resolvedCount;
  const percentComplete = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  const filteredTasks = useMemo(() => {
    if (filterStatus === 'ALL') return tasks;
    if (filterStatus === 'OPEN') {
      return tasks.filter((t) => {
        const pending = pendingResponses[t.taskId];
        const effectiveStatus = pending ? pending.status : t.status;
        return effectiveStatus === 'OPEN';
      });
    }
    return tasks.filter((t) => {
      const pending = pendingResponses[t.taskId];
      const effectiveStatus = pending ? pending.status : t.status;
      return effectiveStatus === 'RESOLVED' || effectiveStatus === 'WAIVED';
    });
  }, [tasks, filterStatus, pendingResponses]);

  // Draft operations (Legal / HOL)
  const addNewDraft = useCallback((): void => {
    setDraftTasks((prev) => {
      const nextOrder = tasks.length + prev.length + 1;
      const newDraft: BatchTaskDraft = {
        draftId: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        order: nextOrder,
        clauses: '',
        category: 'LEGAL',
        issueSummary: '',
        legalRecommendation: '',
      };
      return [...prev, newDraft];
    });
  }, [tasks.length]);

  const updateDraft = useCallback((draftId: string, updates: Partial<BatchTaskDraft>): void => {
    setDraftTasks((prev) =>
      prev.map((d) => (d.draftId === draftId ? { ...d, ...updates } : d))
    );
  }, []);

  const removeDraft = useCallback((draftId: string): void => {
    setDraftTasks((prev) => {
      const remaining = prev.filter((d) => d.draftId !== draftId);
      return remaining.map((d, idx) => ({
        ...d,
        order: tasks.length + idx + 1,
      }));
    });
  }, [tasks.length]);

  // Edit in-place operations (Legal / HOL)
  const startEditTask = useCallback((task: TaskItem): void => {
    setEditingTasks((prev) => ({
      ...prev,
      [task.taskId]: {
        clauses: task.clauses,
        category: task.category,
        issueSummary: task.issueSummary,
        legalRecommendation: task.legalRecommendation,
      },
    }));
  }, []);

  const updateEditingTask = useCallback((taskId: string, updates: Partial<UpdateTaskPayload>): void => {
    setEditingTasks((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...updates,
      },
    }));
  }, []);

  const cancelEditTask = useCallback((taskId: string): void => {
    setEditingTasks((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }, []);

  // Pending user response operations (USER in USER_REVISING)
  const updatePendingResponse = useCallback(
    (taskId: string, userNotes: string, status?: TaskStatus): void => {
      setPendingResponses((prev) => {
        const existing = prev[taskId];
        const taskObj = tasks.find((t) => t.taskId === taskId);
        const targetStatus = status || existing?.status || taskObj?.status || 'RESOLVED';
        return {
          ...prev,
          [taskId]: {
            userNotes,
            status: targetStatus,
          },
        };
      });
    },
    [tasks]
  );

  const unsavedCount =
    draftTasks.length + Object.keys(editingTasks).length + Object.keys(pendingResponses).length;
  const hasUnsavedChanges = unsavedCount > 0;

  const saveAllChanges = useCallback(async (): Promise<void> => {
    if (!contractId || !currentUser) return;
    if (
      draftTasks.length === 0 &&
      Object.keys(editingTasks).length === 0 &&
      Object.keys(pendingResponses).length === 0
    ) {
      return; // 0 writes, nothing to do!
    }

    // Validate drafts
    for (const draft of draftTasks) {
      const err = validateDraftItem(draft);
      if (err) throw new Error(err);
    }

    // Validate edits
    for (const [tId, updates] of Object.entries(editingTasks)) {
      const taskObj = tasks.find((t) => t.taskId === tId);
      const err = validateEditedItem(taskObj?.order || 0, updates);
      if (err) throw new Error(err);
    }

    setIsSaving(true);
    try {
      const editsToUpdate = Object.entries(editingTasks).map(([taskId, updates]) => ({
        taskId,
        updates: {
          ...updates,
          status: 'OPEN' as const,
        },
      }));

      const responsesToUpdate = Object.entries(pendingResponses).map(([taskId, resp]) => ({
        taskId,
        updates: {
          userNotes: resp.userNotes.trim(),
          status: resp.status,
        },
      }));

      await batchSaveTasks(contractId, currentUser, {
        draftsToCreate: draftTasks,
        tasksToUpdate: [...editsToUpdate, ...responsesToUpdate],
      });

      setDraftTasks([]);
      setEditingTasks({});
      setPendingResponses({});
    } finally {
      setIsSaving(false);
    }
  }, [contractId, currentUser, draftTasks, editingTasks, pendingResponses, tasks]);

  // Single operations (backwards compatibility)
  const addTask = useCallback(
    async (payload: CreateTaskPayload): Promise<string> => {
      if (!contractId || !currentUser) {
        throw new Error('Không thể thêm nhiệm vụ khi chưa đăng nhập.');
      }
      const nextOrder = tasks.length + 1;
      const id = await createTask(contractId, currentUser, payload, nextOrder);
      return id;
    },
    [contractId, currentUser, tasks.length]
  );

  const editTask = useCallback(
    async (taskId: string, updates: UpdateTaskPayload): Promise<void> => {
      if (!contractId) return;
      await updateTask(contractId, taskId, updates);
    },
    [contractId]
  );

  const removeTask = useCallback(
    async (taskId: string): Promise<void> => {
      if (!contractId) return;
      await deleteTask(contractId, taskId);
    },
    [contractId]
  );

  const saveUserResponse = useCallback(
    async (taskId: string, userNotes: string, status: TaskStatus = 'RESOLVED'): Promise<void> => {
      if (!contractId) return;
      await updateTask(contractId, taskId, {
        userNotes: userNotes.trim(),
        status,
      });
    },
    [contractId]
  );

  return {
    tasks,
    filteredTasks,
    isLoading,
    isSaving,
    error,
    filterStatus,
    setFilterStatus,
    totalCount,
    resolvedCount,
    openCount,
    percentComplete,
    canManageTasks,
    canRespondTasks,
    currentUser,
    addTask,
    editTask,
    removeTask,
    saveUserResponse,
    draftTasks,
    editingTasks,
    pendingResponses,
    hasUnsavedChanges,
    unsavedCount,
    addNewDraft,
    updateDraft,
    removeDraft,
    startEditTask,
    updateEditingTask,
    cancelEditTask,
    updatePendingResponse,
    saveAllChanges,
  };
}
