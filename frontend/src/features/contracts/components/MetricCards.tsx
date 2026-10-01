/**
 * Feature: Contracts Management & Dashboard
 * Component: MetricCards — 4 Interactive Status Metric Cards with Click-to-Filter
 */

import React from 'react';
import { FileEdit, Scale, UserCheck, CheckCircle2 } from 'lucide-react';
import type { MetricGroupId } from '@/shared';
import type { MetricCounts, ContractFilterGroup } from '../types';

export interface MetricCardsProps {
  readonly counts: MetricCounts;
  readonly activeGroup: ContractFilterGroup;
  readonly onSelectGroup: (group: MetricGroupId) => void;
}

interface CardMeta {
  readonly id: MetricGroupId;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly colorClass: string;
  readonly activeBorder: string;
  readonly bgActive: string;
}

const CARDS_CONFIG: readonly CardMeta[] = [
  {
    id: 'draft',
    title: 'Bản nháp & Chờ sửa',
    subtitle: 'Nháp hoặc chờ User hoàn thiện',
    icon: FileEdit,
    colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
    activeBorder: 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20',
    bgActive: 'bg-amber-50/40 dark:bg-amber-950/20',
  },
  {
    id: 'legal',
    title: 'Pháp chế thẩm định',
    subtitle: 'Đang rà soát hoặc có góp ý',
    icon: Scale,
    colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40',
    activeBorder: 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20',
    bgActive: 'bg-blue-50/40 dark:bg-blue-950/20',
  },
  {
    id: 'head',
    title: 'Trưởng ban xét duyệt',
    subtitle: 'Đang trình duyệt hoặc yêu cầu làm rõ',
    icon: UserCheck,
    colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40',
    activeBorder: 'border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/20',
    bgActive: 'bg-purple-50/40 dark:bg-purple-950/20',
  },
  {
    id: 'approved',
    title: 'Đã duyệt',
    subtitle: 'Đã phê duyệt',
    icon: CheckCircle2,
    colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    activeBorder: 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20',
    bgActive: 'bg-emerald-50/40 dark:bg-emerald-950/20',
  },
];

export function MetricCards({
  counts,
  activeGroup,
  onSelectGroup,
}: MetricCardsProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS_CONFIG.map((card) => {
        const isActive = activeGroup === card.id;
        const count = counts[card.id];
        const IconComponent = card.icon;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectGroup(card.id)}
            className={`
              flex flex-col justify-between p-5 rounded-xl border text-left transition-all cursor-pointer
              bg-white dark:bg-slate-900 shadow-sm hover:shadow-md
              ${isActive ? `${card.activeBorder} ${card.bgActive}` : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}
            `}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.colorClass}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {count}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                hồ sơ
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 dark:text-slate-500 truncate mr-2">
                {card.subtitle}
              </span>
              <span
                className={`font-medium flex-shrink-0 ${isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                {isActive ? 'Đang lọc' : 'Lọc'}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
