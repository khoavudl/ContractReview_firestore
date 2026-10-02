/**
 * Feature: Review Tasks & Workflow Action Engine
 * Component: TaskRow.tsx — Interactive task row with Legal recommendations and User response
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Scale,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/shared';
import type { TaskItem, TaskStatus } from '../types';
import { TASK_CATEGORY_CONFIG, TASK_STATUS_CONFIG } from '../types';

export interface TaskRowProps {
  readonly task: TaskItem;
  readonly canManage: boolean;
  readonly canRespond: boolean;
  readonly onSaveResponse: (taskId: string, userNotes: string, status?: TaskStatus) => Promise<void>;
  readonly onEdit?: (task: TaskItem) => void;
  readonly onDelete?: (taskId: string) => void;
  readonly isControlledExpanded?: boolean;
  readonly pendingResponse?: { userNotes: string; status: TaskStatus };
  readonly onUpdatePendingResponse?: (taskId: string, userNotes: string, status?: TaskStatus) => void;
}

export function TaskRow({
  task,
  canManage,
  canRespond,
  onSaveResponse,
  onEdit,
  onDelete,
  isControlledExpanded,
  pendingResponse,
  onUpdatePendingResponse,
}: TaskRowProps): React.ReactElement {
  const [localExpanded, setLocalExpanded] = useState<boolean | null>(null);
  const [userNotesInput, setUserNotesInput] = useState<string>(
    pendingResponse?.userNotes ?? task.userNotes
  );
  const [savingStatus, setSavingStatus] = useState<TaskStatus | null>(null);

  // Sync global collapse/expand changes
  useEffect(() => {
    setLocalExpanded(null);
  }, [isControlledExpanded]);

  // Sync pending response notes
  useEffect(() => {
    if (pendingResponse?.userNotes !== undefined) {
      setUserNotesInput(pendingResponse.userNotes);
    }
  }, [pendingResponse?.userNotes]);

  const isExpanded = localExpanded !== null ? localExpanded : (isControlledExpanded ?? true);

  const effectiveStatus = pendingResponse ? pendingResponse.status : task.status;
  const categoryMeta = TASK_CATEGORY_CONFIG[task.category] || TASK_CATEGORY_CONFIG.OTHER;
  const statusMeta = TASK_STATUS_CONFIG[effectiveStatus];

  const handleNotesChange = (val: string): void => {
    setUserNotesInput(val);
    if (onUpdatePendingResponse) {
      onUpdatePendingResponse(task.taskId, val, effectiveStatus);
    }
  };

  const handleStatusSelect = async (status: TaskStatus): Promise<void> => {
    if (onUpdatePendingResponse) {
      onUpdatePendingResponse(task.taskId, userNotesInput, status);
      return;
    }

    // Direct save fallback
    setSavingStatus(status);
    try {
      await onSaveResponse(task.taskId, userNotesInput, status);
    } finally {
      setSavingStatus(null);
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all ${
        effectiveStatus === 'OPEN'
          ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
      }`}
    >
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-xs text-slate-400">
              #{task.order}
            </span>
            <Badge variant={categoryMeta.colorScheme}>
              {categoryMeta.label}
            </Badge>
            <Badge variant={statusMeta.variant}>
              {statusMeta.label}
            </Badge>
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {task.clauses}
          </h4>
        </div>

        <div className="flex items-center gap-1">
          {canManage && (
            <>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Sửa điều khoản"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(task.taskId)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Xóa điều khoản"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => setLocalExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Body Content */}
      {isExpanded && (
        <div className="px-3.5 pb-4 sm:px-4 space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          {/* Issue Summary */}
          <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Vấn đề / Rủi ro phát hiện:</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
              {task.issueSummary}
            </p>
          </div>

          {/* Legal Recommendation */}
          <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
              <Scale className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Khuyến nghị của Pháp chế ({task.createdBy.displayName}):</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
              {task.legalRecommendation}
            </p>
          </div>

          {/* User Response Section */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                <span>Giải trình của Người phụ trách:</span>
              </div>
              {task.userNotes && !canRespond && (
                <span className="text-[11px] text-slate-400">
                  Trạng thái: {statusMeta.label}
                </span>
              )}
            </div>

            {canRespond ? (
              <div className="space-y-2.5">
                <textarea
                  value={userNotesInput}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  maxLength={1000}
                  placeholder="Nhập nội dung giải trình hoặc thỏa thuận đàm phán với đối tác..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span
                    className={`text-[10px] ${
                      userNotesInput.length >= 900
                        ? 'text-amber-600 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {userNotesInput.length}/1000
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Waived Button (Rose/Red Tone) */}
                    <button
                      type="button"
                      onClick={() => handleStatusSelect('WAIVED')}
                      disabled={savingStatus !== null}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        effectiveStatus === 'WAIVED'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs hover:bg-rose-700'
                          : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                      }`}
                    >
                      {savingStatus === 'WAIVED' ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <XCircle
                          className={`w-3.5 h-3.5 ${
                            effectiveStatus === 'WAIVED' ? 'text-white' : 'text-rose-500'
                          }`}
                        />
                      )}
                      <span>Bỏ qua (Waived)</span>
                    </button>

                    {/* Resolved Button (Emerald/Green Tone) */}
                    <button
                      type="button"
                      onClick={() => handleStatusSelect('RESOLVED')}
                      disabled={savingStatus !== null}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-all ${
                        effectiveStatus === 'RESOLVED'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs hover:bg-emerald-700'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                      }`}
                    >
                      {savingStatus === 'RESOLVED' ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            effectiveStatus === 'RESOLVED' ? 'text-white' : 'text-emerald-600'
                          }`}
                        />
                      )}
                      <span>Đã sửa (Resolved)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic pl-5">
                {task.userNotes ? task.userNotes : 'Chưa có ý kiến phản hồi.'}
              </p>
            )}
          </div>

          {/* Legal Decision Note (if present) */}
          {task.legalDecision && (
            <div className="p-2.5 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold">Ý kiến chốt của Pháp chế: </span>
                <span>{task.legalDecision}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
