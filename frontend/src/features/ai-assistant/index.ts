/**
 * Feature: AI Assistant (Gemini 2.5)
 * Master Barrel Export — Public API for feature 'ai-assistant'
 */

// Types
export * from './types';

// Services
export {
  buildAnalysisDocId,
  fetchCachedAnalysis,
  triggerAIAnalysis,
  SAMPLE_SUMMARY_RESULT,
  SAMPLE_RISK_RESULT,
  SAMPLE_DECISION_BRIEF_RESULT,
  DEV_SAMPLE_AI_ANALYSES,
} from './services/aiService';

// Hooks
export { useAIEngine } from './hooks/useAIEngine';
export type { UseAIEngineProps, UseAIEngineReturn } from './hooks/useAIEngine';

// Components
export { AISummaryBox } from './components/AISummaryBox';
export { RiskRadar } from './components/RiskRadar';
export { DecisionBrief } from './components/DecisionBrief';
export { AIAssistantPanel } from './components/AIAssistantPanel';
export type { AIAssistantPanelProps } from './components/AIAssistantPanel';
