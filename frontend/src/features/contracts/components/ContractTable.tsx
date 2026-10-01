/**
 * Feature: Contracts Management & Dashboard
 * Component: ContractTable — Clean Enterprise Realtime Contract Table
 */

import React from 'react';
import { FolderOpen, Building2, User, Plus } from 'lucide-react';
import { Badge, Button, formatDateTime, getStatusMeta, type ContractDocument } from '@/shared';

export interface ContractTableProps {
  readonly contracts: readonly ContractDocument[];
  readonly isLoading?: boolean;
  readonly onSelectContract: (contractId: string) => void;
  readonly onCreateNew?: () => void;
  readonly canCreate?: boolean;
}

function TableSkeleton(): React.ReactElement {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  readonly canCreate?: boolean;
  readonly onCreateNew?: () => void;
}

function EmptyState({ canCreate, onCreateNew }: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
        <FolderOpen className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
        Không có hồ sơ hợp đồng nào
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5">
        Chưa tìm thấy hợp đồng nào phù hợp với bộ lọc hiện tại hoặc bạn chưa tạo hợp đồng nào.
      </p>
      {canCreate && onCreateNew && (
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={onCreateNew}>
          Tạo Hồ Sơ Mới
        </Button>
      )}
    </div>
  );
}

export function ContractTable({
  contracts,
  isLoading = false,
  onSelectContract,
  onCreateNew,
  canCreate = false,
}: ContractTableProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <TableSkeleton />
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <EmptyState canCreate={canCreate} onCreateNew={onCreateNew} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Mã Hợp Đồng</th>
              <th className="py-3 px-4">Tiêu Đề & Đối Tác</th>
              <th className="py-3 px-4">Phiên Bản</th>
              <th className="py-3 px-4">Người Phụ Trách</th>
              <th className="py-3 px-4">Ngày Cập Nhật</th>
              <th className="py-3 px-4">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {contracts.map((c) => {
              const meta = getStatusMeta(c.status);
              return (
                <tr
                  key={c.contractId}
                  onClick={() => onSelectContract(c.contractId)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-brand-600 dark:text-brand-400 whitespace-nowrap">
                    {c.contractId}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {c.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{c.supplier}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      v{c.currentVersion}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.createdBy.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                    {formatDateTime(c.updatedAt)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
