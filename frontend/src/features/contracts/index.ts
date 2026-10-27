/**
 * Feature: Contracts Management & Dashboard
 * Public API Barrel Export
 */

// Types
export type {
  ContractFilterGroup,
  MetricCounts,
  ContractFilterState,
  CreateContractPayload,
  ContractListState,
} from './types';

// Services
export {
  generateContractId,
  calculateMetricCounts,
  filterContracts,
  createContract,
  subscribeContracts,
  fetchActiveUsers,
  updateContractViewers,
  type ActiveUserOption,
  DEV_SAMPLE_CONTRACTS,
  getMockContract,
  getAllMockContracts,
  updateMockContractStatus,
  updateMockContractVersion,
  deleteContractDoc,
  deleteMockContract,
} from './services/contractService';

// Hooks
export { useContracts, type UseContractsReturn } from './hooks/useContracts';
export { useCreateContract, type UseCreateContractReturn } from './hooks/useCreateContract';
export { useContractDetail, type UseContractDetailReturn } from './hooks/useContractDetail';

// Components
export { MetricCards, type MetricCardsProps } from './components/MetricCards';
export { ContractFilters, type ContractFiltersProps } from './components/ContractFilters';
export { ContractTable, type ContractTableProps } from './components/ContractTable';
export { CreateContractModal, type CreateContractModalProps } from './components/CreateContractModal';
export { ViewerSelector, type ViewerSelectorProps } from './components/ViewerSelector';
export { ManageViewersModal, type ManageViewersModalProps } from './components/ManageViewersModal';
export {
  DeleteContractConfirmModal,
  type DeleteContractConfirmModalProps,
} from './components/DeleteContractConfirmModal';
export {
  ArchivedSearchModal,
  type ArchivedSearchModalProps,
} from './components/ArchivedSearchModal';
export {
  fetchArchivedContracts,
  filterArchivedContracts,
  normalizeSearchText,
} from './services/archivedContractService';

// Utilities
export {
  generateAnnexId,
  formatAnnexLabel,
  buildAnnexStoragePath,
  computeApprovedFileName,
  resolveInheritedAnnexFiles,
  type UpdatedAnnexPayload,
  type NewAnnexPayload,
  type ResolveInheritedAnnexParams,
} from './utils/annexHelpers';
