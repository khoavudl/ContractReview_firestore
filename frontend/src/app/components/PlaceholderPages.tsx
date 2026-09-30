/**
 * Route View Components & Placeholders
 * Foundation screens for Login, Dashboard, Detail, 403, and 404
 */

import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShieldAlert, FileQuestion, ArrowLeft, Plus } from 'lucide-react';
import { Button, useToast } from '@/shared';
import { LoginCard, useAuth } from '@/features/auth';
import {
  MetricCards,
  ContractFilters,
  ContractTable,
  CreateContractModal,
  useContracts,
} from '@/features/contracts';
import { useAuthContext } from '../providers';

export function LoginView(): React.ReactElement {
  const { isAuthenticated } = useAuthContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ||
    '/dashboard';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSuccess = (): void => {
    showToast({
      title: 'Đăng nhập thành công',
      message: 'Chào mừng bạn đến với hệ thống Contract Review',
      variant: 'success',
    });
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bgLight dark:bg-surface-bgDark p-4">
      <LoginCard onSuccess={handleSuccess} />
    </div>
  );
}

export function DashboardView(): React.ReactElement {
  const { currentUser, permissions } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    filteredContracts,
    metricCounts,
    isLoading,
    filterState,
    setSearchKeyword,
    toggleActiveGroup,
    resetFilters,
  } = useContracts(currentUser);

  const handleSelectContract = (contractId: string) => {
    navigate(`/contracts/${contractId}`);
  };

  const handleCreateSuccess = (contractId: string) => {
    setIsCreateOpen(false);
    showToast({
      title: 'Tạo hồ sơ thành công',
      message: `Hồ sơ ${contractId} đã được khởi tạo ở trạng thái Bản nháp.`,
      variant: 'success',
    });
    navigate(`/contracts/${contractId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Bảng Điều Khiển Hợp Đồng
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Xin chào {currentUser?.displayName} ({currentUser?.role}) • Quản trị và theo dõi tiến độ thẩm định hợp đồng
          </p>
        </div>

        {permissions.isUser && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Tạo Hồ Sơ Mới
          </Button>
        )}
      </div>

      <MetricCards
        counts={metricCounts}
        activeGroup={filterState.activeGroup}
        onSelectGroup={toggleActiveGroup}
      />

      <ContractFilters
        keyword={filterState.searchKeyword}
        onKeywordChange={setSearchKeyword}
        activeGroup={filterState.activeGroup}
        onResetGroup={resetFilters}
        totalCount={metricCounts.all}
        filteredCount={filteredContracts.length}
      />

      <ContractTable
        contracts={filteredContracts}
        isLoading={isLoading}
        onSelectContract={handleSelectContract}
        onCreateNew={() => setIsCreateOpen(true)}
        canCreate={permissions.isUser}
      />

      {permissions.isUser && (
        <CreateContractModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
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
