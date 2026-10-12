/**
 * Feature: Document Viewer
 * Component: UploadVersionModal.tsx — Dialog for uploading revision vN with per-document mapping
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  Star,
  Paperclip,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Plus,
  Undo2,
} from 'lucide-react';
import { Modal, Button, formatFileSize, STATUS_CONFIG } from '@/shared';
import type { AuthUser, ContractDocument } from '@/shared';
import { uploadRevisionDocx } from '@/features/review-tasks';
import { addSystemEventComment } from '@/features/comments';

export interface UploadVersionModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly contract: ContractDocument;
  readonly currentUser: AuthUser;
  readonly onUploaded: (newVersionNo: number) => void;
}

export function UploadVersionModal({
  isOpen,
  onClose,
  contract,
  currentUser,
  onUploaded,
}: UploadVersionModalProps): React.ReactElement {
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [annexUpdates, setAnnexUpdates] = useState<Record<string, File>>({});
  const [newAnnexes, setNewAnnexes] = useState<Array<{ file: File; label: string }>>([]);
  const [removedAnnexIds, setRemovedAnnexIds] = useState<string[]>([]);
  const [changeSummary, setChangeSummary] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const annexInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const newAnnexInputRef = useRef<HTMLInputElement>(null);

  const currentVersionNo = contract.currentVersion || 1;
  const nextVersionNo = currentVersionNo + 1;
  const statusConfig = STATUS_CONFIG[contract.status];
  const currentAnnexList = contract.annexFiles || [];

  const handleMainFilePick = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setErrorMessage('Chỉ chấp nhận tệp Microsoft Word định dạng .docx.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('Dung lượng tệp vượt quá 50MB.');
      return;
    }
    setMainFile(file);
    setErrorMessage(null);
  };

  const handleAnnexFilePick = (annexId: string, e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setErrorMessage('Chỉ chấp nhận tệp Microsoft Word định dạng .docx.');
      return;
    }
    setAnnexUpdates((prev) => ({ ...prev, [annexId]: file }));
    setErrorMessage(null);
  };

  const handleAddNewAnnex = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setErrorMessage('Chỉ chấp nhận tệp Microsoft Word định dạng .docx.');
      return;
    }
    setNewAnnexes((prev) => [
      ...prev,
      { file, label: file.name.replace(/\.docx$/i, '') },
    ]);
    setErrorMessage(null);
  };

  const toggleRemoveAnnex = (annexId: string): void => {
    setRemovedAnnexIds((prev) => {
      const willRemove = !prev.includes(annexId);
      if (willRemove) {
        setAnnexUpdates((u) => {
          const next = { ...u };
          delete next[annexId];
          return next;
        });
      }
      return willRemove ? [...prev, annexId] : prev.filter((id) => id !== annexId);
    });
  };

  const resetState = useCallback(() => {
    setMainFile(null);
    setAnnexUpdates({});
    setNewAnnexes([]);
    setRemovedAnnexIds([]);
    setChangeSummary('');
    setErrorMessage(null);
  }, []);

  const handleClose = (): void => {
    resetState();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const hasAnyChanges =
      Boolean(mainFile) ||
      Object.keys(annexUpdates).length > 0 ||
      newAnnexes.length > 0 ||
      removedAnnexIds.length > 0;

    if (!hasAnyChanges) {
      setErrorMessage('Vui lòng chọn ít nhất một tệp chỉnh sửa mới hoặc thay đổi phụ lục.');
      return;
    }

    if (!changeSummary.trim()) {
      setErrorMessage('Vui lòng nhập tóm tắt nội dung chỉnh sửa của phiên bản này.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const summary = changeSummary.trim();

      await uploadRevisionDocx(
        contract.contractId,
        currentUser,
        mainFile,
        nextVersionNo,
        summary,
        undefined,
        undefined,
        undefined,
        {
          currentContract: contract,
          annexUpdates,
          newAnnexes,
          removedAnnexIds,
        }
      );

      try {
        await addSystemEventComment(
          contract.contractId,
          {
            eventType: 'SYSTEM_VERSION_UPLOAD',
            versionNo: nextVersionNo,
            changeSummary: summary,
            commentText: `Tải lên phiên bản mới v${nextVersionNo}`,
          },
          {
            uid: currentUser.uid,
            displayName: currentUser.displayName || currentUser.email || 'Người dùng',
            email: currentUser.email,
            role: currentUser.role,
          }
        );
      } catch (commentErr) {
        console.warn('[UploadVersionModal] Failed to post system comment:', commentErr);
      }

      resetState();
      onUploaded(nextVersionNo);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải lên phiên bản mới.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Nộp Bản Chỉnh Sửa (Lên Phiên Bản v${nextVersionNo})`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900/50">
            {errorMessage}
          </div>
        )}

        {/* Current Stage Reminder */}
        <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs flex items-center justify-between">
          <div>
            Hồ sơ hiện tại: <span className="font-semibold">{statusConfig.label}</span>
          </div>
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
            Phiên bản hiện tại: v{currentVersionNo} → v{nextVersionNo}
          </span>
        </div>

        {/* Document Mapping Section */}
        <div className="space-y-2.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Danh sách tài liệu trong bộ hồ sơ (chỉ tải lên tệp có sửa đổi):
          </label>

          {/* Main Contract Row */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  Hợp đồng chính: {contract.currentVersionFile?.originalFileName || `${contract.contractId}_v1.docx`}
                </div>
                <div className="text-[11px] mt-0.5">
                  {mainFile ? (
                    <span className="text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Đã chọn bản sửa: {mainFile.name} ({formatFileSize(mainFile.size)})
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Giữ nguyên không đổi (từ v{contract.currentVersionFile?.versionNo || 1})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <input
                ref={mainFileInputRef}
                type="file"
                accept=".docx"
                onChange={handleMainFilePick}
                className="hidden"
                disabled={isUploading}
              />
              {mainFile ? (
                <button
                  type="button"
                  onClick={() => setMainFile(null)}
                  disabled={isUploading}
                  className="px-2 py-1 rounded text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Bỏ chọn
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => mainFileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-brand-500 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors"
                >
                  Chọn bản mới
                </button>
              )}
            </div>
          </div>

          {/* Annexes Rows */}
          {currentAnnexList.map((annex) => {
            const isRemoved = removedAnnexIds.includes(annex.annexId);
            const updatedFile = annexUpdates[annex.annexId];

            return (
              <div
                key={annex.annexId}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isRemoved
                    ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 opacity-60'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Paperclip className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {annex.label} ({annex.originalFileName})
                    </div>
                    <div className="text-[11px] mt-0.5">
                      {isRemoved ? (
                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                          Đã đánh dấu gỡ bỏ khỏi v{nextVersionNo}
                        </span>
                      ) : updatedFile ? (
                        <span className="text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Đã chọn bản sửa: {updatedFile.name} ({formatFileSize(updatedFile.size)})
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Giữ nguyên không đổi (từ v{annex.sourceVersionNo})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    ref={(el) => {
                      annexInputRefs.current[annex.annexId] = el;
                    }}
                    type="file"
                    accept=".docx"
                    onChange={(e) => handleAnnexFilePick(annex.annexId, e)}
                    className="hidden"
                    disabled={isUploading || isRemoved}
                  />

                  {isRemoved ? (
                    <button
                      type="button"
                      onClick={() => toggleRemoveAnnex(annex.annexId)}
                      disabled={isUploading}
                      className="px-2 py-1 rounded text-xs text-brand-600 hover:bg-brand-50 flex items-center gap-1"
                    >
                      <Undo2 className="w-3 h-3" /> Hoàn tác
                    </button>
                  ) : updatedFile ? (
                    <button
                      type="button"
                      onClick={() =>
                        setAnnexUpdates((prev) => {
                          const next = { ...prev };
                          delete next[annex.annexId];
                          return next;
                        })
                      }
                      disabled={isUploading}
                      className="px-2 py-1 rounded text-xs text-rose-500 hover:bg-rose-50"
                    >
                      Bỏ chọn
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => annexInputRefs.current[annex.annexId]?.click()}
                        disabled={isUploading}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-brand-500 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors"
                      >
                        Chọn bản mới
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRemoveAnnex(annex.annexId)}
                        disabled={isUploading}
                        title="Gỡ bỏ phụ lục này"
                        className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* New Annexes Added in this Revision */}
          {newAnnexes.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <Plus className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-semibold text-purple-900 dark:text-purple-200 truncate">
                  Phụ lục mới thêm: {item.file.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNewAnnexes((prev) => prev.filter((_, i) => i !== idx))}
                className="text-rose-500 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Add Additional Annex Button */}
          {currentAnnexList.length + newAnnexes.length < 5 && (
            <div>
              <input
                ref={newAnnexInputRef}
                type="file"
                accept=".docx"
                onChange={handleAddNewAnnex}
                className="hidden"
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={() => newAnnexInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1.5 py-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm phụ lục bổ sung (.docx)
              </button>
            </div>
          )}
        </div>

        {/* Change Summary Field */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tóm tắt nội dung chỉnh sửa *
          </label>
          <textarea
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="VD: Đã sửa lại thời hạn thanh toán Net 30 ở HĐ chính và cập nhật đơn giá ở Phụ lục 1..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Hủy Bỏ
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isUploading}
          >
            Nộp Bản v{nextVersionNo}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
