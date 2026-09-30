/**
 * Feature: AI Assistant (Gemini 2.5)
 * Component: RiskRadar.tsx — Risk Assessment Radar & Mitigation Wording Generator
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Copy,
  Check,
  ShieldCheck,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import type { RiskAssessmentResult } from '../types';
import { RISK_LEVEL_CONFIG } from '../types';

export interface RiskRadarProps {
  data: RiskAssessmentResult;
}

export const RiskRadar: React.FC<RiskRadarProps> = ({ data }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const overallCfg = RISK_LEVEL_CONFIG[data.overallRiskLevel] || RISK_LEVEL_CONFIG.MEDIUM;

  const handleCopyWording = (wording: string, index: number) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(wording);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Overall Risk Header Card */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Mức độ rủi ro tổng thể:
            </span>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${overallCfg.badgeClass}`}
          >
            {overallCfg.label}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
          "{data.summary}"
        </p>
      </div>

      {/* Identified Risks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Chi tiết rủi ro & Đề xuất chỉnh sửa ({data.risks.length})</span>
          </h4>
        </div>

        <div className="space-y-3">
          {data.risks.map((risk, idx) => {
            const riskCfg = RISK_LEVEL_CONFIG[risk.riskLevel] || RISK_LEVEL_CONFIG.MEDIUM;
            const isCopied = copiedIndex === idx;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 border-l-4 ${riskCfg.borderClass} space-y-2.5 shadow-xs`}
              >
                {/* Risk Title & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {risk.clause}
                  </h5>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${riskCfg.badgeClass}`}
                  >
                    {riskCfg.label}
                  </span>
                </div>

                {/* Description & Impact */}
                <div className="space-y-1 text-xs">
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Vấn đề:
                    </span>{' '}
                    {risk.description}
                  </p>
                  <p className="text-rose-700 dark:text-rose-300/90">
                    <span className="font-semibold">Tác động:</span> {risk.impact}
                  </p>
                </div>

                {/* Mitigation Wording Box */}
                {risk.mitigationWording && (
                  <div className="mt-2 p-2.5 bg-purple-50/70 dark:bg-purple-950/30 rounded border border-purple-200/80 dark:border-purple-900/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        Đề xuất câu chữ đàm phán (Mitigation Wording)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyWording(risk.mitigationWording, idx)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                        title="Sao chép câu chữ"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-mono leading-relaxed bg-white/70 dark:bg-slate-900/70 p-2 rounded border border-purple-100 dark:border-purple-950 select-all">
                      "{risk.mitigationWording}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Favorable Terms */}
      {data.favorableTerms && data.favorableTerms.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Điều khoản có lợi cho Doanh nghiệp ({data.favorableTerms.length})</span>
          </h4>
          <ul className="space-y-1.5">
            {data.favorableTerms.map((term, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-600 dark:text-slate-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded border border-emerald-200/50 dark:border-emerald-900/40 leading-relaxed"
              >
                ✓ {term}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
