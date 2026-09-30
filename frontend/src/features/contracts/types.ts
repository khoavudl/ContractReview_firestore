/**
 * Feature: Contracts Management & Dashboard
 * Domain Types & Interfaces
 */

import type { ContractDocument, ContractStatus, CompanyRole, MetricGroupId } from '@/shared';

export type ContractFilterGroup = 'ALL' | MetricGroupId;

export interface MetricCounts {
  readonly all: number;
  readonly draft: number;
  readonly legal: number;
  readonly head: number;
  readonly approved: number;
}

export interface ContractFilterState {
  readonly searchKeyword: string;
  readonly activeGroup: ContractFilterGroup;
  readonly statusFilter?: ContractStatus | 'ALL';
}

export interface CreateContractPayload {
  readonly title: string;
  readonly supplier: string;
  readonly description: string;
  readonly department?: string;
  readonly companyRole?: CompanyRole;
}

export interface ContractListState {
  readonly contracts: readonly ContractDocument[];
  readonly filteredContracts: readonly ContractDocument[];
  readonly metricCounts: MetricCounts;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly filterState: ContractFilterState;
}
