/**
 * Feature: Document Viewer
 * Component: VersionDropdown — Version history selector dropdown
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, History, Clock } from 'lucide-react';
import { formatDate } from '@/shared';
import type { ContractVersionItem } from '../types';

export interface VersionDropdownProps {
  readonly versions: readonly ContractVersionItem[];
  readonly selectedVersionNo: number;
  readonly onSelectVersion: (versionNo: number) => void;
  readonly isApproved?: boolean;
  readonly approvedVersionNo?: number;
}

export function VersionDropdown({
  versions,
  selectedVersionNo,
  onSelectVersion,
  isApproved = false,
  approvedVersionNo,
}: VersionDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeVersion = versions.find((v) => v.versionNo === selectedVersionNo) || versions[0];
  const sortedVersions = [...versions].sort((a, b) => b.versionNo - a.versionNo);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm"
        aria-expanded={isOpen}
      >
        <History className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
        <span>
          Phiên bản {activeVersion ? `v${activeVersion.versionNo}` : 'v1'}
          {isApproved && activeVersion?.versionNo === approvedVersionNo ? ' (Đã duyệt)' : ''}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 z-30 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs divide-y divide-slate-100 dark:divide-slate-700/60 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
            Lịch sử các phiên bản ({versions.length})
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {sortedVersions.map((v) => {
              const isSelected = v.versionNo === selectedVersionNo;
              return (
                <button
                  key={v.versionNo}
                  type="button"
                  onClick={() => {
                    onSelectVersion(v.versionNo);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left flex items-start gap-2.5 transition-colors ${
                    isSelected
                      ? 'bg-brand-50/70 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="mt-0.5">
                    {isSelected ? (
                      <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        Phiên bản v{v.versionNo}
                      </span>
                      {isApproved && v.versionNo === approvedVersionNo ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          Đã duyệt
                        </span>
                      ) : (
                        v.versionNo === versions[versions.length - 1]?.versionNo && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            Mới nhất
                          </span>
                        )
                      )}
                    </div>
                    {v.changeSummary && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {v.changeSummary}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(v.uploadedAt)}</span>
                      <span>•</span>
                      <span className="truncate">{v.uploadedBy.displayName || v.uploadedBy.email}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
