/**
 * Feature: AI Assistant (Gemini 2.5)
 * Hook: useAIEngine.ts — State Management, RBAC Tab Access & Firestore Caching Engine
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FEATURE_FLAGS, type CompanyRole, type UserRole } from '@/shared';
import {
  type AIAnalysisType,
  type AnalysisResultContent,
  type TabConfigItem,
  AI_TABS_CONFIG,
} from '../types';
import {
  fetchCachedAnalysis,
  triggerAIAnalysis,
} from '../services/aiService';

export interface UseAIEngineProps {
  contractId: string;
  versionNo: number;
  companyRole?: CompanyRole;
  userRole?: UserRole;
}

export interface UseAIEngineReturn {
  activeTab: AIAnalysisType;
  setActiveTab: (tab: AIAnalysisType) => void;
  allowedTabs: TabConfigItem[];
  currentResult: AnalysisResultContent | null;
  isCached: boolean;
  analyzedAt: Date | null;
  isLoading: boolean;
  error: string | null;
  canAccessTab: (tab: AIAnalysisType) => boolean;
  loadAnalysis: (tab: AIAnalysisType, forceRefresh?: boolean) => Promise<void>;
  reanalyzeCurrentTab: () => Promise<void>;
}

export function useAIEngine({
  contractId,
  versionNo,
  companyRole = 'BUYER',
  userRole = 'USER',
}: UseAIEngineProps): UseAIEngineReturn {
  const [activeTab, setActiveTabState] = useState<AIAnalysisType>('SUMMARY');
  const [cacheMap, setCacheMap] = useState<Record<string, AnalysisResultContent>>({});
  const [isCachedMap, setIsCachedMap] = useState<Record<string, boolean>>({});
  const [timestampMap, setTimestampMap] = useState<Record<string, Date>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // RBAC permission check for individual tab
  const canAccessTab = useCallback(
    (tab: AIAnalysisType): boolean => {
      const config = AI_TABS_CONFIG.find((t) => t.id === tab);
      if (!config) return false;
      return config.allowedRoles.includes(userRole);
    },
    [userRole]
  );

  // Tabs allowed for the current user's role
  const allowedTabs = useMemo(() => {
    return AI_TABS_CONFIG.filter((t) => t.allowedRoles.includes(userRole));
  }, [userRole]);

  // Set active tab safely with RBAC guard
  const setActiveTab = useCallback(
    (tab: AIAnalysisType) => {
      if (!canAccessTab(tab)) {
        console.warn(`[useAIEngine] Access denied to tab ${tab} for role ${userRole}`);
        return;
      }
      setActiveTabState(tab);
    },
    [canAccessTab, userRole]
  );

  // Helper key for in-memory cache
  const getCacheKey = useCallback(
    (tab: AIAnalysisType) => `${contractId}_v${versionNo}_${tab}_${companyRole}`,
    [contractId, versionNo, companyRole]
  );

  // Core loader function
  const loadAnalysis = useCallback(
    async (tab: AIAnalysisType, forceRefresh = false) => {
      if (!FEATURE_FLAGS.ENABLE_AI || !canAccessTab(tab)) return;

      const cacheKey = getCacheKey(tab);
      if (!forceRefresh && cacheMap[cacheKey]) return;

      setIsLoading(true);
      setError(null);

      try {
        if (!forceRefresh) {
          const cachedDoc = await fetchCachedAnalysis(contractId, tab, versionNo, companyRole);
          if (cachedDoc?.result) {
            setCacheMap((prev) => ({ ...prev, [cacheKey]: cachedDoc.result }));
            setIsCachedMap((prev) => ({ ...prev, [cacheKey]: true }));
            const createdAtDate = cachedDoc.createdAt instanceof Date
              ? cachedDoc.createdAt
              : new Date();
            setTimestampMap((prev) => ({ ...prev, [cacheKey]: createdAtDate }));
            setIsLoading(false);
            return;
          }
        }

        const response = await triggerAIAnalysis({
          contractId,
          analysisType: tab,
          versionNo,
          companyRole,
          forceRefresh,
        });

        if (response?.result) {
          setCacheMap((prev) => ({ ...prev, [cacheKey]: response.result }));
          setIsCachedMap((prev) => ({ ...prev, [cacheKey]: response.cached ?? false }));
          setTimestampMap((prev) => ({ ...prev, [cacheKey]: new Date() }));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi không xác định khi gọi AI';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [canAccessTab, getCacheKey, cacheMap, contractId, versionNo, companyRole]
  );

  // Re-run analysis for current active tab
  const reanalyzeCurrentTab = useCallback(async () => {
    if (!FEATURE_FLAGS.ENABLE_AI) return;
    await loadAnalysis(activeTab, true);
  }, [loadAnalysis, activeTab]);

  // Sync activeTab when role changes or initial mount
  useEffect(() => {
    if (!canAccessTab(activeTab)) {
      setActiveTabState('SUMMARY');
    }
  }, [activeTab, canAccessTab]);

  // Auto-fetch active tab analysis when params or tab change
  useEffect(() => {
    if (FEATURE_FLAGS.ENABLE_AI && contractId && canAccessTab(activeTab)) {
      loadAnalysis(activeTab, false);
    }
  }, [contractId, versionNo, companyRole, activeTab, canAccessTab, loadAnalysis]);

  const currentKey = getCacheKey(activeTab);
  const currentResult = cacheMap[currentKey] || null;
  const isCached = isCachedMap[currentKey] ?? true;
  const analyzedAt = timestampMap[currentKey] || null;

  return {
    activeTab,
    setActiveTab,
    allowedTabs,
    currentResult,
    isCached,
    analyzedAt,
    isLoading,
    error,
    canAccessTab,
    loadAnalysis,
    reanalyzeCurrentTab,
  };
}
