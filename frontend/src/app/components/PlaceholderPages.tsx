/**
 * Route View Components & Placeholders
 * Foundation screens for Login, Dashboard, Detail, 403, and 404
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldAlert, FileQuestion, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '@/shared';
import { useAuthContext } from '../providers';

export function LoginView(): React.ReactElement {
  const { login } = useAuthContext();

  const handleDevLogin = (role: 'USER' | 'LEGAL' | 'HOL'): void => {
    login({
      uid: `dev-${role.toLowerCase()}-123`,
      email: `${role.toLowerCase()}@foodempire.com`,
      displayName: `Dev ${role} User`,
      role,
      isActive: true,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bgLight dark:bg-surface-bgDark p-4">
      <div className="max-w-md w-full bg-surface-cardLight dark:bg-surface-cardDark border border-surface-borderLight dark:border-surface-borderDark rounded-xl p-8 shadow-sm text-center">
        <div className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
          CR
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Contract Review v2.0
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
          Food Empire Vietnam • Cổng rà soát hợp đồng tập trung
        </p>

        <div className="space-y-3">
          <Button
            variant="primary"
            fullWidth
            onClick={() => handleDevLogin('USER')}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Đăng nhập tài khoản Nhân viên (USER)
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => handleDevLogin('LEGAL')}
          >
            Đăng nhập Chuyên viên Pháp chế (LEGAL)
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => handleDevLogin('HOL')}
          >
            Đăng nhập Trưởng ban Pháp chế (HOL)
          </Button>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Phase 4.1 sẽ tích hợp Microsoft 365 & Google SSO trực tiếp.
        </p>
      </div>
    </div>
  );
}

export function DashboardView(): React.ReactElement {
  const { currentUser } = useAuthContext();
  return (
    <div className="space-y-4">
      <div className="border-b border-surface-borderLight dark:border-surface-borderDark pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Bảng Điều Khiển Hợp Đồng
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Xin chào {currentUser?.displayName} ({currentUser?.role})
        </p>
      </div>
      <div className="bg-surface-cardLight dark:bg-surface-cardDark p-8 rounded-xl border border-surface-borderLight dark:border-surface-borderDark text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Khung điều hướng đã sẵn sàng. Bảng hợp đồng realtime và 4 nhóm metric
          cards sẽ được kết nối ở Giai đoạn 4.2.
        </p>
      </div>
    </div>
  );
}

export function ContractDetailView(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="space-y-4">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại Bảng điều khiển
      </Link>
      <div className="bg-surface-cardLight dark:bg-surface-cardDark p-6 rounded-xl border border-surface-borderLight dark:border-surface-borderDark">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Chi tiết Hợp đồng: {id}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Trình đọc PDF in-app, Ma trận nhiệm vụ và Gemini AI sẽ kết nối ở Giai đoạn 4.
        </p>
      </div>
    </div>
  );
}

export function UnauthorizedView(): React.ReactElement {
  const { logout } = useAuthContext();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bgLight dark:bg-surface-bgDark p-4">
      <div className="max-w-md w-full bg-surface-cardLight dark:bg-surface-cardDark border border-surface-borderLight dark:border-surface-borderDark rounded-xl p-8 text-center shadow-sm">
        <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 inline-flex mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          403 - Chưa Được Cấp Quyền
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
          Tài khoản của bạn chưa có trong danh sách Whitelist hoặc không đủ quyền
          hạn truy cập mục này. Vui lòng liên hệ Quản trị viên để được phê duyệt.
        </p>
        <div className="space-y-2">
          <Button variant="secondary" fullWidth onClick={logout}>
            Đăng xuất hoặc thử tài khoản khác
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NotFoundView(): React.ReactElement {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 inline-flex mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
        404 - Không Tìm Thấy Trang
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
        Đường dẫn bạn yêu cầu không tồn tại trong hệ thống.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Về Bảng Điều Khiển
        </Button>
      </Link>
    </div>
  );
}
