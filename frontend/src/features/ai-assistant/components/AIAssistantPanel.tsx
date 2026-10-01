/**
 * Feature: AI Assistant (Gemini 2.5)
 * Container Component: AIAssistantPanel.tsx — Master AI Assistant Tab 2
 */

import React from 'react';
import {
  Sparkles,
  RefreshCw,
  Zap,
  Lock,
  FileText,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { Button } from '@/shared';
import type { CompanyRole, UserRole, ContractStatus } from '@/shared';
import { useAIEngine } from '../hooks/useAIEngine';
import { AISummaryBox } from './AISummaryBox';
import { RiskRadar } from './RiskRadar';
import { DecisionBrief } from './DecisionBrief';
import {
  isSummaryResult,
  isRiskAssessmentResult,
  isDecisionBriefResult,
  type AIAnalysisType,
} from '../types';

export interface AIAssistantPanelProps {
  contractId: string;
  versionNo: number;
  companyRole?: CompanyRole;
  userRole?: UserRole;
  contractStatus?: ContractStatus;
  isOwner?: boolean;
}

export function canTriggerAIAnalysis(
  contractStatus?: ContractStatus,
  userRole?: UserRole,
  isOwner = true
): boolean {
  if (!contractStatus) return true;
  if (contractStatus === 'HOL_APPROVED' || contractStatus === 'COMPLETED') {
    return false;
  }
  if (
    contractStatus === 'DRAFT' ||
    contractStatus === 'USER_REVISING' ||
    contractStatus === 'LEGAL_COMMENTED' ||
    contractStatus === 'HOL_COMMENTED'
  ) {
    return userRole === 'USER' && isOwner;
  }
  if (contractStatus === 'PENDING_LEGAL') {
    return userRole === 'LEGAL' || userRole === 'HOL';
  }
  if (contractStatus === 'PENDING_HOL') {
    return userRole === 'HOL';
  }
  return false;
}

const TAB_ICON_MAP: Record<AIAnalysisType, React.ReactNode> = {
  SUMMARY: <FileText className="w-3.5 h-3.5" />,
  RISK: <AlertTriangle className="w-3.5 h-3.5" />,
  DECISION_BRIEF: <Award className="w-3.5 h-3.5" />,
};

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  contractId,
  versionNo,
  companyRole = 'BUYER',
  userRole = 'USER',
  contractStatus,
  isOwner: isOwnerProp,
}) => {
  const {
    activeTab,
    setActiveTab,
    allowedTabs,
    currentResult,
    isCached,
    isLoading,
    error,
    reanalyzeCurrentTab,
  } = useAIEngine({ contractId, versionNo, companyRole, userRole });

  const isOwner = isOwnerProp ?? (userRole === 'USER');
  const isApproved = contractStatus === 'HOL_APPROVED' || contractStatus === 'COMPLETED';
  const canTrigger = canTriggerAIAnalysis(contractStatus, userRole, isOwner);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden text-left bg-white dark:bg-slate-900">
      {/* AI Header with Sub-tabs and Re-analyze Button */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
          {allowedTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title={tab.description}
              >
                {TAB_ICON_MAP[tab.id]}
                <span>{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Right meta controls: Cache status & Re-analyze button */}
        <div className="flex items-center gap-2">
          {currentResult && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border ${
                isCached
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
              }`}
              title={
                isCached
                  ? 'Kết quả đọc từ Firestore cache với độ trễ ~5ms và 0 chi phí API'
                  : 'Kết quả vừa được phân tích trực tiếp từ Gemini 2.5'
              }
            >
              {isCached ? (
                <>
                  <Zap className="w-3 h-3 text-emerald-600" />
                  <span>Đã đệm (5ms)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Mới phân tích</span>
                </>
              )}
            </span>
          )}

          {isApproved ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              title="Hồ sơ đã được phê duyệt — Phân tích AI đã đóng băng"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Đã đóng băng (Chỉ xem)</span>
            </span>
          ) : !canTrigger ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              title="Chỉ vai trò phụ trách giai đoạn này mới được kích hoạt phân tích AI"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Chỉ xem (Giai đoạn {contractStatus})</span>
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={reanalyzeCurrentTab}
              isLoading={isLoading}
              disabled={isLoading}
              className="text-xs h-7.5 px-2.5 gap-1.5 border-slate-300 dark:border-slate-700"
              title="Gọi Gemini AI phân tích lại nội dung mới nhất"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Phân tích lại</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-lg flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 animate-spin flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                  Gemini 2.5 Flash đang đọc hiểu tài liệu...
                </p>
                <p className="text-[11px] text-purple-700/80 dark:text-purple-300/70">
                  Đang trích xuất nghĩa vụ, phân tích rủi ro và tổng hợp báo cáo.
                </p>
              </div>
            </div>

            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
        )}

        {/* Error Alert */}
        {!isLoading && error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Không thể tải kết quả phân tích AI</span>
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={reanalyzeCurrentTab}
              className="text-xs h-7 mt-1 border-rose-300 text-rose-700 hover:bg-rose-100"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Loaded Data Render */}
        {!isLoading && !error && currentResult && (
          <>
            {activeTab === 'SUMMARY' && isSummaryResult(currentResult) && (
              <AISummaryBox data={currentResult} />
            )}

            {activeTab === 'RISK' && isRiskAssessmentResult(currentResult) && (
              <RiskRadar data={currentResult} />
            )}

            {activeTab === 'DECISION_BRIEF' && isDecisionBriefResult(currentResult) && (
              <DecisionBrief data={currentResult} />
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && !currentResult && (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Chưa có dữ liệu phân tích
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {isApproved
                  ? 'Hồ sơ đã được phê duyệt chính thức. Tính năng phân tích AI đã được đóng băng.'
                  : !canTrigger
                  ? 'Chỉ vai trò phụ trách giai đoạn này mới được kích hoạt phân tích AI.'
                  : 'Nhấn "Bắt đầu phân tích AI" để kích hoạt mô hình Gemini 2.5 Flash xử lý văn bản hợp đồng này.'}
              </p>
            </div>
            {canTrigger && (
              <Button
                variant="primary"
                size="sm"
                onClick={reanalyzeCurrentTab}
                className="text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Bắt đầu phân tích AI
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
