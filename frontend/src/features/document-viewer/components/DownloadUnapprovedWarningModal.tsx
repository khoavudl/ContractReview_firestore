/**
 * Feature: Document Viewer
 * Component: DownloadUnapprovedWarningModal — Warning dialog when downloading an unapproved older version
 */

import React from 'react';
import { AlertTriangle, Download, X } from 'lucide-react';
import { Modal, Button } from '@/shared';

export interface DownloadUnapprovedWarningModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirmDownload: () => void;
  readonly selectedVersionNo: number;
  readonly approvedVersionNo: number;
}

export function DownloadUnapprovedWarningModal({
  isOpen,
  onClose,
  onConfirmDownload,
  selectedVersionNo,
  approvedVersionNo,
}: DownloadUnapprovedWarningModalProps): React.ReactElement {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cảnh báo tải phiên bản chưa duyệt"
      size="sm"
    >
      <div className="space-y-4 py-1 text-left">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 leading-relaxed">
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Bạn đang tải phiên bản v{selectedVersionNo} chưa được phê duyệt chính thức.
            </p>
            <p className="text-amber-700 dark:text-amber-300">
              Phiên bản được Trưởng ban Pháp chế phê duyệt hợp lệ là{' '}
              <strong className="underline">bản v{approvedVersionNo}</strong>.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Tài liệu tải về có thể chứa các điều khoản cũ chưa hoàn thiện. Bạn có chắc chắn muốn tiếp tục tải phiên bản này?
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} icon={<X className="w-4 h-4" />}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onConfirmDownload();
              onClose();
            }}
            icon={<Download className="w-4 h-4" />}
          >
            Vẫn tải về
          </Button>
        </div>
      </div>
    </Modal>
  );
}
