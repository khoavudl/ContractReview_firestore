/**
 * Feature: Review Tasks & Workflow Action Engine
 * Component: TaskFormModal.tsx — Dialog for Legal team to add or edit contract review tasks
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal, Input, Button } from '@/shared';
import type { TaskItem, CreateTaskPayload, TaskCategory } from '../types';
import { TASK_CATEGORY_CONFIG } from '../types';

export interface TaskFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: CreateTaskPayload) => Promise<void>;
  readonly initialTask?: TaskItem | null;
}

export function TaskFormModal({
  isOpen,
  onClose,
  onSave,
  initialTask,
}: TaskFormModalProps): React.ReactElement {
  const [clauses, setClauses] = useState<string>('');
  const [category, setCategory] = useState<TaskCategory>('LEGAL');
  const [issueSummary, setIssueSummary] = useState<string>('');
  const [legalRecommendation, setLegalRecommendation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setClauses(initialTask.clauses);
      setCategory(initialTask.category);
      setIssueSummary(initialTask.issueSummary);
      setLegalRecommendation(initialTask.legalRecommendation);
    } else {
      setClauses('');
      setCategory('LEGAL');
      setIssueSummary('');
      setLegalRecommendation('');
    }
    setValidationError(null);
  }, [initialTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!clauses.trim() || !issueSummary.trim() || !legalRecommendation.trim()) {
      setValidationError('Vui lòng điền đầy đủ Điều khoản, Vấn đề phát hiện và Khuyến nghị.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);
    try {
      await onSave({
        clauses: clauses.trim(),
        category,
        issueSummary: issueSummary.trim(),
        legalRecommendation: legalRecommendation.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu nhiệm vụ rà soát.';
      setValidationError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTask ? 'Chỉnh Sửa Điều Khoản Rà Soát' : 'Thêm Điều Khoản Rà Soát Mới'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900/50">
            {validationError}
          </div>
        )}

        {initialTask && (initialTask.status === 'RESOLVED' || initialTask.status === 'WAIVED') && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold">Điều khoản đang ở trạng thái &quot;Đã phản hồi&quot;.</span>
              <p className="mt-0.5 text-amber-700/90 dark:text-amber-400/90">
                Khi bạn bấm &quot;Cập nhật&quot;, điều khoản này sẽ được mở lại (Cần giải trình) để người phụ trách xem xét và giải trình lại.
              </p>
            </div>
          </div>
        )}

        <Input
          label="Điều khoản tham chiếu"
          required
          placeholder="Ví dụ: Điều 4.2 - Thời hạn thanh toán"
          value={clauses}
          onChange={(e) => setClauses(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Phân loại rủi ro <span className="text-rose-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {(Object.keys(TASK_CATEGORY_CONFIG) as TaskCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {TASK_CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Vấn đề / Rủi ro phát hiện <span className="text-rose-500">*</span>
            </label>
            <span className={`text-[10px] ${issueSummary.length >= 900 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
              {issueSummary.length}/1000
            </span>
          </div>
          <textarea
            required
            rows={3}
            maxLength={1000}
            placeholder="Mô tả cụ thể nội dung điều khoản hiện tại tiềm ẩn rủi ro gì đối với công ty..."
            value={issueSummary}
            onChange={(e) => setIssueSummary(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Khuyến nghị sửa đổi của Pháp chế <span className="text-rose-500">*</span>
            </label>
            <span className={`text-[10px] ${legalRecommendation.length >= 900 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
              {legalRecommendation.length}/1000
            </span>
          </div>
          <textarea
            required
            rows={3}
            maxLength={1000}
            placeholder="Hướng dẫn người phụ trách cần đàm phán hoặc chỉnh sửa câu chữ như thế nào..."
            value={legalRecommendation}
            onChange={(e) => setLegalRecommendation(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting} type="button">
            Hủy
          </Button>
          <Button variant="primary" isLoading={isSubmitting} type="submit">
            {initialTask ? 'Cập nhật' : 'Thêm điều khoản'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
