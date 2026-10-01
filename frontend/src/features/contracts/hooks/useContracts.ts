/**
 * Feature: Contracts Management & Dashboard
 * Hook: useContracts — Realtime contracts subscription & filter state management
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  isMockDevEnvironment,
  type AuthUser,
  type ContractDocument,
  type MetricGroupId,
} from '@/shared';
import type {
  ContractFilterGroup,
  ContractFilterState,
  MetricCounts,
} from '../types';
import {
  subscribeContracts,
  calculateMetricCounts,
  filterContracts,
  getAllMockContracts,
} from '../services/contractService';

export interface UseContractsReturn {
  readonly contracts: readonly ContractDocument[];
  readonly filteredContracts: readonly ContractDocument[];
  readonly metricCounts: MetricCounts;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly filterState: ContractFilterState;
  readonly setSearchKeyword: (keyword: string) => void;
  readonly setActiveGroup: (group: ContractFilterGroup) => void;
  readonly toggleActiveGroup: (group: MetricGroupId) => void;
  readonly resetFilters: () => void;
}

export function useContracts(user: AuthUser | null): UseContractsReturn {
  const [contracts, setContracts] = useState<readonly ContractDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterState, setFilterState] = useState<ContractFilterState>({
    searchKeyword: '',
    activeGroup: 'ALL',
  });

  const setSearchKeyword = useCallback((searchKeyword: string) => {
    setFilterState((prev) => ({ ...prev, searchKeyword }));
  }, []);

  const setActiveGroup = useCallback((activeGroup: ContractFilterGroup) => {
    setFilterState((prev) => ({ ...prev, activeGroup }));
  }, []);

  const toggleActiveGroup = useCallback((group: MetricGroupId) => {
    setFilterState((prev) => ({
      ...prev,
      activeGroup: prev.activeGroup === group ? 'ALL' : group,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterState({ searchKeyword: '', activeGroup: 'ALL' });
  }, []);

  useEffect(() => {
    if (!user) {
      setContracts([]);
      setIsLoading(false);
      return undefined;
    }

    const isMock = isMockDevEnvironment();
    if (isMock) {
      setContracts(getAllMockContracts(user));
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
    setError(null);

    const unsubscribe = subscribeContracts(
      user,
      (items) => {
        if (items.length > 0) {
          setContracts(items);
        } else if (isMock) {
          setContracts(getAllMockContracts(user));
        } else {
          setContracts([]);
        }
        setIsLoading(false);
      },
      (err) => {
        if (!isMock) {
          setError(err.message || 'Không thể tải danh sách hợp đồng.');
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const metricCounts = useMemo(() => calculateMetricCounts(contracts), [contracts]);
  const filteredContracts = useMemo(() => filterContracts(contracts, filterState), [contracts, filterState]);

  return {
    contracts,
    filteredContracts,
    metricCounts,
    isLoading,
    error,
    filterState,
    setSearchKeyword,
    setActiveGroup,
    toggleActiveGroup,
    resetFilters,
  };
}
