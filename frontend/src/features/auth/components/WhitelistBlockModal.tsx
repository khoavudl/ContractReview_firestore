/**
 * Feature: Auth & Whitelist Check
 * Component: WhitelistBlockModal — Dialog informing unauthorized users
 */

import React from 'react';
import { ShieldAlert, Mail } from 'lucide-react';
import { Modal, Button } from '@/shared';
import type { BlockedUserInfo } from '../types';

export interface WhitelistBlockModalProps {
  readonly isOpen: boolean;
  readonly blockedUser: BlockedUserInfo | null;
  readonly onClose: () => void;
  readonly onSwitchAccount: () => void;
}

export function WhitelistBlockModal({
  isOpen,
  blockedUser,
  onClose,
  onSwitchAccount,
}: WhitelistBlockModalProps): React.ReactElement | null {
  if (!blockedUser) {
    return null;
  }

  const isNotWhitelisted = blockedUser.reason === 'NOT_WHITELISTED';
  const title = isNotWhitelisted
    ? 'Tài khoản chưa được cấp quyền'
    : 'Tài khoản đã bị tạm khóa';

  const description = isNotWhitelisted
    ? 'Email của bạn chưa nằm trong danh sách nhân sự được cấp quyền sử dụng hệ thống Contract Review v2.0.'
    : 'Tài khoản của bạn hiện đang ở trạng thái ngừng kích hoạt trong hệ thống quản trị.';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <div className="flex flex-col sm:flex-row gap-2 w-full justify-end">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="primary" onClick={onSwitchAccount}>
            Đăng nhập tài khoản khác
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-2 gap-4">
        <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{blockedUser.email}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {description}
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 text-left w-full">
          💡 Vui lòng liên hệ Quản trị viên (IT Support) hoặc Bộ phận Pháp chế để kiểm tra lại quyền truy cập theo quy định doanh nghiệp.
        </div>
      </div>
    </Modal>
  );
}
