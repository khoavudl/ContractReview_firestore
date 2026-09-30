import type { CompanyRole } from '../../types/index.js';

export type AIAnalysisType = 'SUMMARY' | 'RISK' | 'DECISION_BRIEF';

/** Summary of contract content for USER / general review */
export interface SummaryResult {
  contractType: string;
  parties: {
    partyA: string;
    partyB: string;
  };
  keyObligations: string[];
  financialTerms: string;
  duration: string;
  terminationConditions: string[];
  specialClauses: string[];
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ContractRiskItem {
  clause: string;
  riskLevel: RiskLevel;
  description: string;
  impact: string;
  mitigationWording: string;
}

/** In-depth risk evaluation for LEGAL based on BUYER/SELLER position */
export interface RiskAssessmentResult {
  overallRiskLevel: RiskLevel;
  risks: ContractRiskItem[];
  favorableTerms: string[];
  summary: string;
}

export type DecisionRecommendation = 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REJECT';

export interface ConcessionItem {
  originalClause: string;
  revisedClause: string;
  concessionType: 'OUR_CONCESSION' | 'THEIR_CONCESSION' | 'MUTUAL';
}

/** Executive decision brief for Head of Legal prior to final sign-off */
export interface DecisionBriefResult {
  recommendation: DecisionRecommendation;
  executiveSummary: string;
  keyRisksRemaining: string[];
  negotiationConcessions: ConcessionItem[];
  unresolvedIssues: string[];
  finalNotes: string;
}

export interface AIAnalysisDocument {
  analysisId: string;
  analysisType: AIAnalysisType;
  versionNo: number;
  companyRole?: CompanyRole;
  result: SummaryResult | RiskAssessmentResult | DecisionBriefResult;
  analyzedBy: {
    uid: string;
    displayName: string;
  };
  createdAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
}

export interface AnalysisPromptInput {
  systemInstruction: string;
  userPrompt: string;
  pdfBuffer?: Buffer;
}

export interface GeminiClient {
  generateAnalysis<T>(
    input: AnalysisPromptInput,
    responseSchema: Record<string, unknown>
  ): Promise<T>;
}
