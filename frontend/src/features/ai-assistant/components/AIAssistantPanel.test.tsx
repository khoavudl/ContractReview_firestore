import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIAssistantPanel } from './AIAssistantPanel';
import {
  SAMPLE_SUMMARY_RESULT,
  SAMPLE_RISK_RESULT,
  SAMPLE_DECISION_BRIEF_RESULT,
} from '../services/aiService';

vi.mock('../services/aiService', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../services/aiService');
  return {
    ...actual,
    fetchCachedAnalysis: vi.fn(),
    triggerAIAnalysis: vi.fn(),
  };
});

import { fetchCachedAnalysis, triggerAIAnalysis } from '../services/aiService';

describe('AIAssistantPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchCachedAnalysis).mockImplementation(async (_id, type) => {
      if (type === 'SUMMARY') {
        return {
          analysisId: 'SUMMARY_v1',
          analysisType: 'SUMMARY',
          versionNo: 1,
          result: SAMPLE_SUMMARY_RESULT,
          analyzedBy: { uid: 'ai', displayName: 'AI' },
          createdAt: new Date(),
        };
      }
      if (type === 'RISK') {
        return {
          analysisId: 'RISK_v1_BUYER',
          analysisType: 'RISK',
          versionNo: 1,
          result: SAMPLE_RISK_RESULT,
          analyzedBy: { uid: 'ai', displayName: 'AI' },
          createdAt: new Date(),
        };
      }
      if (type === 'DECISION_BRIEF') {
        return {
          analysisId: 'DECISION_BRIEF_v1',
          analysisType: 'DECISION_BRIEF',
          versionNo: 1,
          result: SAMPLE_DECISION_BRIEF_RESULT,
          analyzedBy: { uid: 'ai', displayName: 'AI' },
          createdAt: new Date(),
        };
      }
      return null;
    });
  });

  it('renders only SUMMARY tab pill for USER role', async () => {
    render(
      <AIAssistantPanel
        contractId="CTR-2609-0001"
        versionNo={1}
        userRole="USER"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tóm tắt')).toBeInTheDocument();
    });

    expect(screen.queryByText('Rủi ro & Đề xuất')).not.toBeInTheDocument();
    expect(screen.queryByText('Bản quyết định')).not.toBeInTheDocument();
    expect(screen.getByText('Đã đệm (5ms)')).toBeInTheDocument();
    expect(screen.getByText(SAMPLE_SUMMARY_RESULT.contractType)).toBeInTheDocument();
  });

  it('renders SUMMARY and RISK tab pills for LEGAL role', async () => {
    render(
      <AIAssistantPanel
        contractId="CTR-2609-0001"
        versionNo={1}
        userRole="LEGAL"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tóm tắt')).toBeInTheDocument();
      expect(screen.getByText('Rủi ro & Đề xuất')).toBeInTheDocument();
    });

    expect(screen.queryByText('Bản quyết định')).not.toBeInTheDocument();

    // Switch to RISK tab
    fireEvent.click(screen.getByText('Rủi ro & Đề xuất'));

    await waitFor(() => {
      expect(screen.getByText(/Chi tiết rủi ro & Đề xuất chỉnh sửa/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Điều 8.2 - Giới hạn trách nhiệm/)).toBeInTheDocument();
  });

  it('renders all 3 tab pills for HOL role and displays Decision Brief', async () => {
    render(
      <AIAssistantPanel
        contractId="CTR-2609-0001"
        versionNo={1}
        userRole="HOL"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tóm tắt')).toBeInTheDocument();
      expect(screen.getByText('Rủi ro & Đề xuất')).toBeInTheDocument();
      expect(screen.getByText('Bản quyết định')).toBeInTheDocument();
    });

    // Switch to DECISION_BRIEF tab
    fireEvent.click(screen.getByText('Bản quyết định'));

    await waitFor(() => {
      expect(screen.getByText(/Khuyến nghị của Trưởng phòng/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Bảng nhượng bộ đàm phán/)).toBeInTheDocument();
  });

  it('clicking re-analyze button calls triggerAIAnalysis with forceRefresh: true', async () => {
    vi.mocked(triggerAIAnalysis).mockResolvedValueOnce({
      cached: false,
      analysisId: 'SUMMARY_v1',
      result: SAMPLE_SUMMARY_RESULT,
    });

    render(
      <AIAssistantPanel
        contractId="CTR-2609-0001"
        versionNo={1}
        userRole="USER"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Phân tích lại')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Phân tích lại'));

    await waitFor(() => {
      expect(triggerAIAnalysis).toHaveBeenCalledWith({
        contractId: 'CTR-2609-0001',
        analysisType: 'SUMMARY',
        versionNo: 1,
        companyRole: 'BUYER',
        forceRefresh: true,
      });
    });
  });
});
