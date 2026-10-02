/**
 * Feature: Review Tasks & Workflow Action Engine
 * Component: TaskMatrix.tsx — Task List Matrix container with inline drafts, progress bar, filters, collapse all, and batch saving
 */

import React, { useState } from 'react';
import { Plus, Save, ListChecks, CheckCircle2, Clock, Loader2, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/shared';
import type { TaskStatus } from '../types';
import type { UseTaskListReturn } from '../hooks/useTaskList';
import { TaskRow } from './TaskRow';
import { TaskDraftCard } from './TaskDraftCard';

export interface TaskMatrixProps {
  readonly taskList: UseTaskListReturn;
}

export function TaskMatrix({ taskList }: TaskMatrixProps): React.ReactElement {
  const {
    filteredTasks,
    isLoading,
    isSaving,
    filterStatus,
    setFilterStatus,
    totalCount,
    resolvedCount,
    openCount,
    percentComplete,
    canManageTasks,
    canRespondTasks,
    currentUser,
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
  } = taskList;

  const { showToast } = useToast();
  const [isAllCollapsed, setIsAllCollapsed] = useState<boolean>(false);

  const reviewerName =
    currentUser?.displayName ||
    (currentUser?.role === 'HOL' ? 'Trưởng ban Pháp chế' : 'Chuyên viên Pháp chế');

  const handleAddNew = (): void => {
    if (filterStatus === 'RESOLVED') {
      setFilterStatus('ALL');
    }
    addNewDraft();
  };

  const handleSaveAll = async (): Promise<void> => {
    try {
      await saveAllChanges();
      showToast({ message: 'Đã lưu các điều khoản rà soát thành công.', variant: 'success' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu điều khoản.';
      showToast({ message: msg, variant: 'error' });
    }
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    if (window.confirm('Bạn có chắc chắn muốn xóa điều khoản rà soát này?')) {
      await removeTask(taskId);
      showToast({ message: 'Đã xóa điều khoản rà soát.', variant: 'info' });
    }
  };

  const shouldShowDrafts = filterStatus === 'ALL' || filterStatus === 'OPEN';

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

          {/* Action buttons (Save for both Legal/HOL & User Revising; Add for Legal/HOL) */}
          {(canManageTasks || canRespondTasks) && (
            <div className="flex items-center gap-1.5">
              {/* Save Button (Icon-only) */}
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={!hasUnsavedChanges || isSaving}
                className={`relative p-2 rounded-lg transition-all ${
                  hasUnsavedChanges
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/20 active:scale-95'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                }`}
                title={
                  hasUnsavedChanges
                    ? `Lưu ${unsavedCount} thay đổi chưa lưu`
                    : 'Không có thay đổi nào chưa lưu'
                }
                aria-label="Lưu điều khoản"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {hasUnsavedChanges && !isSaving && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </span>
                )}
              </button>

              {/* Add Button (Icon-only) - Legal & HOL only */}
              {canManageTasks && (
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="p-2 rounded-lg bg-brand-600 hover:bg-brand-700 active:scale-95 text-white shadow-sm transition-all"
                  title="Thêm điều khoản rà soát"
                  aria-label="Thêm điều khoản"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
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

      {/* Filter Tabs & Collapse All Row */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
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

        {/* Global Collapse/Expand All Button (For all roles and all stages) */}
        {totalCount > 0 && (
          <button
            type="button"
            onClick={() => setIsAllCollapsed(!isAllCollapsed)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium whitespace-nowrap"
            title={isAllCollapsed ? 'Mở rộng tất cả điều khoản' : 'Thu gọn tất cả điều khoản'}
            aria-label={isAllCollapsed ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            <span>{isAllCollapsed ? 'Mở rộng' : 'Thu gọn'}</span>
          </button>
        )}
      </div>

      {/* Task List Items with Inline Drafts */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
        )}

        {/* 1. Render new draft cards (khung vàng) */}
        {shouldShowDrafts &&
          draftTasks.map((draft) => (
            <TaskDraftCard
              key={draft.draftId}
              order={draft.order}
              clauses={draft.clauses}
              category={draft.category}
              issueSummary={draft.issueSummary}
              legalRecommendation={draft.legalRecommendation}
              authorName={reviewerName}
              isExistingTask={false}
              onChangeClauses={(val) => updateDraft(draft.draftId, { clauses: val })}
              onChangeCategory={(cat) => updateDraft(draft.draftId, { category: cat })}
              onChangeIssueSummary={(val) => updateDraft(draft.draftId, { issueSummary: val })}
              onChangeLegalRecommendation={(val) =>
                updateDraft(draft.draftId, { legalRecommendation: val })
              }
              onRemove={() => removeDraft(draft.draftId)}
            />
          ))}

        {/* 2. Empty State */}
        {!isLoading && filteredTasks.length === 0 && (!shouldShowDrafts || draftTasks.length === 0) && (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 inline-flex items-center justify-center mb-2">
              <ListChecks className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {totalCount === 0
                ? 'Chưa có điều khoản rà soát nào trong hồ sơ này.'
                : 'Không có điều khoản nào phù hợp với bộ lọc đã chọn.'}
            </p>
            {canManageTasks && totalCount === 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Bấm icon &quot;+&quot; ở trên để bắt đầu thêm điều khoản cần giải trình.
              </p>
            )}
          </div>
        )}

        {/* 3. Render existing tasks (or in-place editing card if in editingTasks) */}
        {!isLoading &&
          filteredTasks.map((task) => {
            const editData = editingTasks[task.taskId];
            if (editData) {
              return (
                <TaskDraftCard
                  key={task.taskId}
                  order={task.order}
                  clauses={editData.clauses ?? task.clauses}
                  category={editData.category ?? task.category}
                  issueSummary={editData.issueSummary ?? task.issueSummary}
                  legalRecommendation={editData.legalRecommendation ?? task.legalRecommendation}
                  authorName={task.createdBy.displayName || 'Pháp chế'}
                  isExistingTask={true}
                  onChangeClauses={(val) => updateEditingTask(task.taskId, { clauses: val })}
                  onChangeCategory={(cat) => updateEditingTask(task.taskId, { category: cat })}
                  onChangeIssueSummary={(val) => updateEditingTask(task.taskId, { issueSummary: val })}
                  onChangeLegalRecommendation={(val) =>
                    updateEditingTask(task.taskId, { legalRecommendation: val })
                  }
                  onRemove={() => cancelEditTask(task.taskId)}
                />
              );
            }

            return (
              <TaskRow
                key={task.taskId}
                task={task}
                canManage={canManageTasks}
                canRespond={canRespondTasks}
                isControlledExpanded={!isAllCollapsed}
                pendingResponse={pendingResponses[task.taskId]}
                onUpdatePendingResponse={updatePendingResponse}
                onSaveResponse={(id: string, notes: string, status?: TaskStatus) =>
                  saveUserResponse(id, notes, status)
                }
                onEdit={startEditTask}
                onDelete={handleDeleteTask}
              />
            );
          })}
      </div>
    </div>
  );
}
