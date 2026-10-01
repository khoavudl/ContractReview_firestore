/**
 * Feature: Review Tasks & Workflow Action Engine
 * Hook: useTaskList.ts — Realtime tasks list management, progress metrics, and RBAC actions
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { AuthUser, ContractStatus } from '@/shared';
import type {
  TaskItem,
  TaskStatus,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '../types';
import {
  subscribeTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../services/taskService';

export type TaskFilterType = 'ALL' | 'OPEN' | 'RESOLVED';

export interface UseTaskListReturn {
  readonly tasks: readonly TaskItem[];
  readonly filteredTasks: readonly TaskItem[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly filterStatus: TaskFilterType;
  readonly setFilterStatus: (filter: TaskFilterType) => void;
  readonly totalCount: number;
  readonly resolvedCount: number;
  readonly openCount: number;
  readonly percentComplete: number;
  readonly canManageTasks: boolean;
  readonly canRespondTasks: boolean;
  readonly addTask: (payload: CreateTaskPayload) => Promise<string>;
  readonly editTask: (taskId: string, updates: UpdateTaskPayload) => Promise<void>;
  readonly removeTask: (taskId: string) => Promise<void>;
  readonly saveUserResponse: (taskId: string, userNotes: string, status?: TaskStatus) => Promise<void>;
}

export function useTaskList(
  contractId: string | undefined,
  currentUser: AuthUser | null,
  contractStatus?: ContractStatus
): UseTaskListReturn {
  const [tasks, setTasks] = useState<readonly TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskFilterType>('ALL');

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
    if (!currentUser) return false;
    const isStaff = currentUser.role === 'LEGAL' || currentUser.role === 'HOL';
    const isValidStage =
      contractStatus === 'PENDING_LEGAL' ||
      contractStatus === 'LEGAL_COMMENTED' ||
      contractStatus === 'PENDING_HOL';
    return isStaff && isValidStage;
  }, [currentUser, contractStatus]);

  const canRespondTasks = useMemo(() => {
    if (!currentUser) return false;
    const isOwner = currentUser.role === 'USER';
    const isValidStage =
      contractStatus === 'USER_REVISING' ||
      contractStatus === 'LEGAL_COMMENTED' ||
      contractStatus === 'HOL_COMMENTED';
    return isOwner && isValidStage;
  }, [currentUser, contractStatus]);

  const totalCount = tasks.length;
  const resolvedCount = useMemo(
    () => tasks.filter((t) => t.status === 'RESOLVED' || t.status === 'WAIVED').length,
    [tasks]
  );
  const openCount = totalCount - resolvedCount;
  const percentComplete = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  const filteredTasks = useMemo(() => {
    if (filterStatus === 'ALL') return tasks;
    if (filterStatus === 'OPEN') return tasks.filter((t) => t.status === 'OPEN');
    return tasks.filter((t) => t.status === 'RESOLVED' || t.status === 'WAIVED');
  }, [tasks, filterStatus]);

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
    error,
    filterStatus,
    setFilterStatus,
    totalCount,
    resolvedCount,
    openCount,
    percentComplete,
    canManageTasks,
    canRespondTasks,
    addTask,
    editTask,
    removeTask,
    saveUserResponse,
  };
}
