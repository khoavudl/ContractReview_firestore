/**
 * Feature: Contracts Management — Archive Lookup
 * Component: ArchivedSearchModal.tsx — Spotlight Quick Search Modal with Client-Side In-Memory Search
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Building2,
  Calendar,
  User as UserIcon,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';
import { Modal, Badge, Button, formatDate, type AuthUser, type ContractDocument, STATUS_CONFIG } from '@/shared';
import {
  fetchArchivedContracts,
  filterArchivedContracts,
} from '../services/archivedContractService';

export interface ArchivedSearchModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly currentUser: AuthUser | null;
  readonly onSelectContract: (contractId: string) => void;
}

export function ArchivedSearchModal({
  isOpen,
  onClose,
  currentUser,
  onSelectContract,
}: ArchivedSearchModalProps): React.ReactElement {
  const [keyword, setKeyword] = useState<string>('');
  const [allArchived, setAllArchived] = useState<ContractDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load contracts when modal opens
  useEffect(() => {
    if (!isOpen) {
      setKeyword('');
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    fetchArchivedContracts(currentUser)
      .then((data) => {
        if (!isCancelled) {
          setAllArchived(data);
          setIsLoading(false);
          // Autofocus search input
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 100);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('[ArchivedSearchModal] Failed to fetch archived contracts:', err);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, currentUser]);

  // Client-Side In-Memory multi-field search (0 Firestore reads)
  const filteredList = useMemo(() => {
    return filterArchivedContracts(allArchived, keyword);
  }, [allArchived, keyword]);

  const handleSelect = (contractId: string): void => {
    onSelectContract(contractId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tra Cứu Hồ Sơ Lưu Trữ"
      description="Các hợp đồng đã hoàn tất và lưu trữ trong hệ thống"
      size="lg"
    >
      <div className="space-y-4">
        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã hợp đồng (CTR...), tên đối tác, hoặc tiêu đề..."
            className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span>
            {isLoading
              ? 'Đang đồng bộ kho lưu trữ...'
              : `Hiển thị ${filteredList.length} / ${allArchived.length} hồ sơ hoàn tất`}
          </span>
          <span className="text-slate-400">
            Tìm kiếm tức thì trong bộ nhớ RAM (0ms)
          </span>
        </div>

        {/* Result List Container */}
        <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
          {isLoading && (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200/60 dark:border-slate-800"
                />
              ))}
            </div>
          )}

          {!isLoading && filteredList.length === 0 && (
            <div className="py-12 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
                <FolderOpen className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Không tìm thấy hồ sơ lưu trữ nào
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {keyword
                  ? `Không có hợp đồng nào phù hợp với từ khóa "${keyword}".`
                  : 'Kho lưu trữ hiện tại chưa có hợp đồng nào ở trạng thái hoàn tất.'}
              </p>
            </div>
          )}

          {!isLoading &&
            filteredList.map((contract) => {
              const statusCfg = STATUS_CONFIG[contract.status];
              return (
                <div
                  key={contract.contractId}
                  onClick={() => handleSelect(contract.contractId)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-xs transition-all cursor-pointer group space-y-1.5 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:underline">
                        {contract.contractId}
                      </span>
                      <Badge variant={statusCfg.variant} size="sm">
                        {statusCfg.label}
                      </Badge>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        v{contract.currentVersion}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                        Lần review thứ {(contract.rejectCount || 0) + 1}
                      </span>
                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition-colors shrink-0" />
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 transition-colors">
                    {contract.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {contract.supplier}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3 text-slate-400" />
                      <span>{contract.createdBy.displayName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatDate(contract.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
