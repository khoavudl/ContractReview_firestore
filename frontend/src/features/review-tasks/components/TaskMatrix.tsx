/**
 * Feature: Review Tasks & Workflow Action Engine
 * Component: TaskMatrix.tsx — Task List Matrix container with progress bar, filters, and modal
 */

import React, { useState } from 'react';
import { Plus, ListChecks, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/shared';
import type { TaskItem, CreateTaskPayload, TaskStatus } from '../types';
import type { UseTaskListReturn } from '../hooks/useTaskList';
import { TaskRow } from './TaskRow';
import { TaskFormModal } from './TaskFormModal';

export interface TaskMatrixProps {
  readonly taskList: UseTaskListReturn;
}

export function TaskMatrix({ taskList }: TaskMatrixProps): React.ReactElement {
  const {
    tasks,
    filteredTasks,
    isLoading,
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
  } = taskList;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const handleOpenAddModal = (): void => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: TaskItem): void => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (payload: CreateTaskPayload): Promise<void> => {
    if (editingTask) {
      await editTask(editingTask.taskId, payload);
    } else {
      await addTask(payload);
    }
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    if (window.confirm('Bạn có chắc chắn muốn xóa điều khoản rà soát này?')) {
      await removeTask(taskId);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      {/* Matrix Header & Progress */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-brand-600" />
              <span>Tiến độ rà soát điều khoản</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {totalCount > 0
                ? `${resolvedCount}/${totalCount} điều khoản đã phản hồi (${percentComplete}%)`
                : 'Chưa có điều khoản rà soát nào được tạo.'}
            </p>
          </div>

          {canManageTasks && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAddModal}
            >
              Thêm điều khoản
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                percentComplete === 100 ? 'bg-emerald-500' : 'bg-brand-500'
              }`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        <button
          type="button"
          onClick={() => setFilterStatus('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterStatus === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Tất cả ({totalCount})
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('OPEN')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterStatus === 'OPEN'
              ? 'bg-amber-600 text-white'
              : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>Cần giải trình ({openCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('RESOLVED')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterStatus === 'RESOLVED'
              ? 'bg-emerald-600 text-white'
              : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Đã phản hồi ({resolvedCount})</span>
        </button>
      </div>

      {/* Task List Items */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
        )}

        {!isLoading && filteredTasks.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 inline-flex items-center justify-center mb-2">
              <ListChecks className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {tasks.length === 0
                ? 'Chưa có điều khoản rà soát nào trong hồ sơ này.'
                : 'Không có điều khoản nào phù hợp với bộ lọc đã chọn.'}
            </p>
            {canManageTasks && tasks.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Bấm &quot;Thêm điều khoản&quot; ở trên để bắt đầu lập danh sách yêu cầu sửa đổi.
              </p>
            )}
          </div>
        )}

        {!isLoading &&
          filteredTasks.map((task) => (
            <TaskRow
              key={task.taskId}
              task={task}
              canManage={canManageTasks}
              canRespond={canRespondTasks}
              onSaveResponse={(id: string, notes: string, status?: TaskStatus) =>
                saveUserResponse(id, notes, status)
              }
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteTask}
            />
          ))}
      </div>

      {/* Legal Add/Edit Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        initialTask={editingTask}
      />
    </div>
  );
}
