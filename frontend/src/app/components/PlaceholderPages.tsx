/**
 * Route View Components & Placeholders
 * Foundation screens for Login, Dashboard, Detail, 403, and 404
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  ShieldAlert,
  FileQuestion,
  ArrowLeft,
  Building2,
  Calendar,
  User as UserIcon,
  ListChecks,
  Bot,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import { Button, Badge, useToast, formatDate, STATUS_CONFIG, FEATURE_FLAGS } from '@/shared';
import { LoginCard, useAuth } from '@/features/auth';
import {
  MetricCards,
  ContractFilters,
  ContractTable,
  CreateContractModal,
  useContracts,
  useContractDetail,
} from '@/features/contracts';
import { DocxViewer } from '@/features/document-viewer';
import {
  TaskMatrix,
  ActionButtons,
  useTaskList,
  useWorkflowActions,
} from '@/features/review-tasks';
import { AIAssistantPanel } from '@/features/ai-assistant';
import { CommentThread } from '@/features/comments';
import { RefFileList } from '@/features/reference-files';
import { useAuthContext } from '../providers';

export function LoginView(): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuthContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ||
    '/dashboard';

  if (isLoading) {
    return (
      <div
        data-testid="auth-loading"
        className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">
            Đang xác thực phiên làm việc...
          </p>
        </div>
      </div>
    );
  }

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
      message: `Hồ sơ ${contractId} đã được khởi tạo ở trạng thái Draft.`,
      variant: 'success',
    });
    navigate(`/contracts/${contractId}`);
  };

  return (
    <div className="space-y-6">
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
        canCreate={permissions.isUser}
        onCreateNew={() => setIsCreateOpen(true)}
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
  const { currentUser } = useAuth();
  const { contract, versions, isLoading, error, refetchContract } = useContractDetail(id, currentUser);
  const [activeTab, setActiveTab] = useState<'comments' | 'tasks' | 'refs' | 'ai'>('comments');
  const taskList = useTaskList(contract?.contractId, currentUser, contract?.status);
  const workflowActions = useWorkflowActions(contract, currentUser, refetchContract, taskList.saveAllChanges);

  // Always ensure page is scrolled to top on contract load
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
        <div className="h-24 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 h-[600px] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700" />
          <div className="lg:col-span-5 h-[600px] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700" />
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
        <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 inline-flex mb-3">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Không tìm thấy hồ sơ hợp đồng
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-sm">
          {error || `Mã hợp đồng ${id} không tồn tại hoặc bạn không có quyền truy cập hồ sơ này.`}
        </p>
        <Link to="/dashboard">
          <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
            Về Bảng Điều Khiển
          </Button>
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[contract.status];

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* Contract Detail Header */}
      <div className="bg-white dark:bg-slate-850 p-3 sm:px-4 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        {/* Row 1: [Tên HĐ] [status] ---------------- [button] */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {contract.title}
            </h1>
            <Badge variant={statusConfig.variant}>
              {statusConfig.label}
            </Badge>
          </div>

          {currentUser && (
            <div className="flex-shrink-0">
              <ActionButtons
                workflowActions={workflowActions}
                contract={contract}
                currentUser={currentUser}
                openTasksCount={taskList.openCount}
                onActionCompleted={refetchContract}
              />
            </div>
          )}
        </div>

        {/* Row 2: [supplier] [creator] [createdDate] -------- [lần review thứ ..] */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-700 dark:text-slate-300">{contract.supplier}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{contract.createdBy.displayName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDate(contract.createdAt)}</span>
            </div>
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
              Lần review thứ {(contract.rejectCount || 0) + 1}
            </span>
          </div>
        </div>
      </div>

      {/* 6:4 Split Workspace Layout (Section 10.2 new_architecture.md) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
        {/* Left Column (60% on desktop) — In-App Document Viewer */}
        <div className="lg:col-span-7 xl:col-span-7 w-full h-[calc(100vh-165px)] flex flex-col">
          <DocxViewer
            contractId={contract.contractId}
            title={contract.title}
            versions={versions}
            initialVersionNo={contract.currentVersion}
            contract={contract}
            currentUser={currentUser}
            onVersionUploaded={refetchContract}
            className="h-full flex-1"
          />
        </div>

        {/* Right Column (40% on desktop) — Tab Panel */}
        <div className="lg:col-span-5 xl:col-span-5 w-full bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-165px)]">
          {/* Tabs Navigation Header */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 overflow-x-auto text-xs font-semibold">
            {/* 1. Trao đổi */}
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-1.5 px-3.5 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'comments'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-850'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Trao đổi</span>
            </button>

            {/* 2. Task list */}
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1.5 px-3.5 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'tasks'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-850'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Task list</span>
              {taskList.openCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 ml-0.5">
                  {taskList.openCount}
                </span>
              )}
            </button>

            {/* 3. Đính kèm */}
            <button
              type="button"
              onClick={() => setActiveTab('refs')}
              className={`flex items-center gap-1.5 px-3.5 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'refs'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-850'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Đính kèm</span>
            </button>

            {/* 4. Trợ lý AI */}
            <button
              type="button"
              disabled={!FEATURE_FLAGS.ENABLE_AI}
              onClick={() => {
                if (FEATURE_FLAGS.ENABLE_AI) {
                  setActiveTab('ai');
                }
              }}
              title={!FEATURE_FLAGS.ENABLE_AI ? 'Tính năng Trợ lý AI đang tạm tắt' : undefined}
              className={`flex items-center gap-1.5 px-3.5 py-3 border-b-2 transition-colors whitespace-nowrap ${
                !FEATURE_FLAGS.ENABLE_AI
                  ? 'border-transparent text-slate-400 dark:text-slate-500 opacity-40 cursor-not-allowed select-none hover:text-slate-400 dark:hover:text-slate-500'
                  : activeTab === 'ai'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-850'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Trợ lý AI{!FEATURE_FLAGS.ENABLE_AI ? ' (Tạm tắt)' : ''}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {activeTab === 'tasks' && (
              <TaskMatrix taskList={taskList} />
            )}

            {activeTab === 'ai' && FEATURE_FLAGS.ENABLE_AI && (
              <AIAssistantPanel
                contractId={contract.contractId}
                versionNo={contract.currentVersion}
                companyRole={contract.companyRole || 'BUYER'}
                userRole={currentUser?.role || 'USER'}
                contractStatus={contract.status}
                isOwner={currentUser?.uid === contract.createdBy.uid}
              />
            )}

            {activeTab === 'comments' && (
              <CommentThread
                contractId={contract.contractId}
                versionNo={contract.currentVersion}
                currentUser={currentUser}
                contractStatus={contract.status}
              />
            )}

            {activeTab === 'refs' && (
              <RefFileList
                contractId={contract.contractId}
                currentUser={currentUser}
                contractStatus={contract.status}
                createdByUid={contract.createdBy.uid}
              />
            )}
          </div>
        </div>
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
