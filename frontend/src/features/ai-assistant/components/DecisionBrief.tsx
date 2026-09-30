/**
 * Feature: AI Assistant (Gemini 2.5)
 * Component: DecisionBrief.tsx — Leadership Executive Decision Brief & Concessions Comparison Table
 */

import React from 'react';
import {
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  Award,
  FileSignature,
} from 'lucide-react';
import type { DecisionBriefResult, ConcessionItem } from '../types';
import { DECISION_RECOMMENDATION_CONFIG } from '../types';

export interface DecisionBriefProps {
  data: DecisionBriefResult;
}

const CONCESSION_TYPE_CONFIG: Record<
  ConcessionItem['concessionType'],
  { label: string; badgeClass: string }
> = {
  OUR_CONCESSION: {
    label: 'Ta nhượng bộ',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  },
  THEIR_CONCESSION: {
    label: 'Đối tác nhượng bộ',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  },
  MUTUAL: {
    label: 'Đồng thuận hai bên',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  },
};

export const DecisionBrief: React.FC<DecisionBriefProps> = ({ data }) => {
  const recCfg =
    DECISION_RECOMMENDATION_CONFIG[data.recommendation] ||
    DECISION_RECOMMENDATION_CONFIG.APPROVE_WITH_CONDITIONS;

  return (
    <div className="space-y-4 text-left">
      {/* Leadership Recommendation Banner */}
      <div className={`p-4 rounded-lg border ${recCfg.badgeClass} space-y-1.5`}>
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 flex-shrink-0" />
          <h4 className="text-sm font-bold tracking-tight">
            Khuyến nghị của Trưởng phòng: {recCfg.label}
          </h4>
        </div>
        <p className="text-xs opacity-90 leading-relaxed">
          {recCfg.description}
        </p>
      </div>

      {/* Executive Summary */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1.5">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <FileCheck2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Tóm lược trình Lãnh đạo</span>
        </h5>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {data.executiveSummary}
        </p>
      </div>

      {/* Negotiation Concessions Comparison Table */}
      {data.negotiationConcessions.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Bảng nhượng bộ đàm phán ({data.negotiationConcessions.length})</span>
          </h5>

          <div className="space-y-2">
            {data.negotiationConcessions.map((item, idx) => {
              const typeCfg = CONCESSION_TYPE_CONFIG[item.concessionType] || CONCESSION_TYPE_CONFIG.MUTUAL;
              return (
                <div
                  key={idx}
                  className="p-3 bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Hạng mục #{idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeCfg.badgeClass}`}
                    >
                      {typeCfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-150 dark:border-slate-800">
                      <p className="text-[10px] font-semibold text-slate-500 mb-0.5">
                        Điều khoản ban đầu:
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 line-through opacity-80">
                        {item.originalClause}
                      </p>
                    </div>

                    <div className="p-2 bg-emerald-50/40 dark:bg-emerald-950/20 rounded border border-emerald-200/50 dark:border-emerald-900/40">
                      <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
                        Điều khoản thống nhất sửa đổi:
                      </p>
                      <p className="text-slate-900 dark:text-slate-100 font-medium">
                        {item.revisedClause}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Remaining Risks & Unresolved Issues Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Remaining Key Risks */}
        {data.keyRisksRemaining.length > 0 && (
          <div className="p-3 border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 rounded-lg space-y-1.5">
            <h6 className="text-[11px] font-bold uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Rủi ro còn tồn đọng</span>
            </h6>
            <ul className="space-y-1">
              {data.keyRisksRemaining.map((risk, idx) => (
                <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                  • {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Unresolved Issues */}
        {data.unresolvedIssues.length > 0 && (
          <div className="p-3 border border-rose-200/70 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 rounded-lg space-y-1.5">
            <h6 className="text-[11px] font-bold uppercase text-rose-800 dark:text-rose-300 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Vấn đề chưa giải quyết</span>
            </h6>
            <ul className="space-y-1">
              {data.unresolvedIssues.map((issue, idx) => (
                <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                  • {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Final Notes / Conclusion */}
      {data.finalNotes && (
        <div className="p-3.5 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/70 dark:border-brand-900/50 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-brand-700 dark:text-brand-300 font-semibold text-xs">
            <FileSignature className="w-3.5 h-3.5" />
            <span>Kết luận & Đề xuất hành động tiếp theo</span>
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {data.finalNotes}
          </p>
        </div>
      )}
    </div>
  );
};
