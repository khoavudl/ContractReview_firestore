/**
 * Feature: AI Assistant (Gemini 2.5)
 * Component: AISummaryBox.tsx — Executive Contract Summary Presentation
 */

import React from 'react';
import {
  Building2,
  Users2,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type { SummaryResult } from '../types';

export interface AISummaryBoxProps {
  data: SummaryResult;
}

export const AISummaryBox: React.FC<AISummaryBoxProps> = ({ data }) => {
  return (
    <div className="space-y-4 text-left">
      {/* Contract Header Tag */}
      <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 rounded-lg">
        <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-semibold text-xs mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Loại hình giao dịch</span>
        </div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {data.contractType}
        </p>
      </div>

      {/* Parties Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Bên A (Khách hàng)</span>
          </div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {data.parties.partyA}
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Users2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Bên B (Nhà cung cấp/Đối tác)</span>
          </div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {data.parties.partyB}
          </p>
        </div>
      </div>

      {/* Key Metrics: Duration & Finance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Thời hạn thực hiện</span>
          </div>
          <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
            {data.duration}
          </p>
        </div>

        <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Giá trị & Thanh toán</span>
          </div>
          <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
            {data.financialTerms}
          </p>
        </div>
      </div>

      {/* Key Obligations */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Nghĩa vụ cốt lõi ({data.keyObligations.length})</span>
        </h4>
        <ul className="space-y-1.5">
          {data.keyObligations.map((item, idx) => (
            <li
              key={idx}
              className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded border border-slate-150 dark:border-slate-800 leading-relaxed"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200 mr-1.5">
                {idx + 1}.
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Termination Conditions */}
      {data.terminationConditions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Điều kiện chấm dứt hợp đồng</span>
          </h4>
          <ul className="space-y-1.5">
            {data.terminationConditions.map((item, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/40 dark:bg-amber-950/20 p-2.5 rounded border border-amber-200/50 dark:border-amber-900/40 leading-relaxed"
              >
                • {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Special Clauses */}
      {data.specialClauses.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Điều khoản đặc biệt & Lưu ý
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.specialClauses.map((clause, idx) => (
              <span
                key={idx}
                className="inline-block text-xs px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
              >
                {clause}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
