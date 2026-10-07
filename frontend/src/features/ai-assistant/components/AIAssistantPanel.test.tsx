import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { FEATURE_FLAGS } from '@/shared';
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

import { fetchCachedAnalysis } from '../services/aiService';

describe('AIAssistantPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FEATURE_FLAGS.ENABLE_AI = true;
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

  it('hides re-analyze button strictly when analysis result is present (1-time execution per version)', async () => {
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

    // Strict 1-time execution: "Phân tích lại" button is NEVER shown when result exists
    expect(screen.queryByText('Phân tích lại')).not.toBeInTheDocument();
    expect(screen.getByText('Đã đệm (5ms)')).toBeInTheDocument();
  });

  it('hides re-analyze button and shows frozen badge when contract is approved', async () => {
    render(
      <AIAssistantPanel
        contractId="CTR-2609-0001"
        versionNo={1}
        userRole="USER"
        contractStatus="HOL_APPROVED"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tóm tắt')).toBeInTheDocument();
    });

    expect(screen.queryByText('Phân tích lại')).not.toBeInTheDocument();
    expect(screen.getByText('Đã đóng băng (Chỉ xem)')).toBeInTheDocument();
    // Cached analysis content is still visible
    expect(screen.getByText(SAMPLE_SUMMARY_RESULT.contractType)).toBeInTheDocument();
  });

  it('hides re-analyze button when USER views contract at PENDING_LEGAL stage', async () => {
    render(
      <AIAssistantPanel
        contractId="CTR-2609-0001"
        versionNo={1}
        userRole="USER"
        contractStatus="PENDING_LEGAL"
        isOwner={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tóm tắt')).toBeInTheDocument();
    });

    expect(screen.queryByText('Phân tích lại')).not.toBeInTheDocument();
    expect(screen.getByText(/Chỉ xem \(Giai đoạn PENDING_LEGAL\)/)).toBeInTheDocument();
    // Cached content remains visible
    expect(screen.getByText(SAMPLE_SUMMARY_RESULT.contractType)).toBeInTheDocument();
  });

  it('allows switching between BUYER and SELLER roles on RISK tab', async () => {
    render(
      <AIAssistantPanel
        contractId="CTR-2609-0001"
        versionNo={1}
        userRole="LEGAL"
        contractStatus="PENDING_LEGAL"
        companyRole="BUYER"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Rủi ro & Đề xuất')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Rủi ro & Đề xuất'));

    await waitFor(() => {
      expect(screen.getByText('🛡️ Bên Mua')).toBeInTheDocument();
      expect(screen.getByText('💼 Bên Bán')).toBeInTheDocument();
    });

    // Switch to SELLER position
    fireEvent.click(screen.getByText('💼 Bên Bán'));

    await waitFor(() => {
      expect(fetchCachedAnalysis).toHaveBeenCalledWith('CTR-2609-0001', 'RISK', 1, 'SELLER');
    });

    // Ensure re-analyze button is NOT rendered
    expect(screen.queryByText('Phân tích lại')).not.toBeInTheDocument();
  });

  it('hides re-analyze button when HOL views contract at PENDING_LEGAL stage', async () => {
    render(
      <AIAssistantPanel
        contractId="CTR-2609-0001"
        versionNo={1}
        userRole="HOL"
        contractStatus="PENDING_LEGAL"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tóm tắt')).toBeInTheDocument();
    });

    expect(screen.queryByText('Phân tích lại')).not.toBeInTheDocument();
    expect(screen.getByText(/Chỉ xem \(Giai đoạn PENDING_LEGAL\)/)).toBeInTheDocument();
    // Cached content remains visible
    expect(screen.getByText(SAMPLE_SUMMARY_RESULT.contractType)).toBeInTheDocument();
  });

  it('renders disabled notification card when FEATURE_FLAGS.ENABLE_AI is false', () => {
    FEATURE_FLAGS.ENABLE_AI = false;
    render(
      <AIAssistantPanel
        contractId="CTR-2609-0001"
        versionNo={1}
        userRole="USER"
      />
    );

    expect(screen.getByText('Trợ lý AI Đang Tạm Tắt')).toBeInTheDocument();
    expect(screen.getByText(/FEATURE_FLAGS\.ENABLE_AI = false/)).toBeInTheDocument();
  });

  it('renders contextual "Bắt đầu tóm tắt AI" button when cache is empty and triggers on click', async () => {
    vi.mocked(fetchCachedAnalysis).mockResolvedValueOnce(null);
    const { triggerAIAnalysis } = await import('../services/aiService');
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
      expect(screen.getByText('Chưa có dữ liệu phân tích')).toBeInTheDocument();
      expect(screen.getByText('Bắt đầu tóm tắt AI')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Bắt đầu tóm tắt AI'));

    await waitFor(() => {
      expect(triggerAIAnalysis).toHaveBeenCalledWith({
        contractId: 'CTR-2609-0001',
        analysisType: 'SUMMARY',
        versionNo: 1,
        companyRole: 'BUYER',
        forceRefresh: false,
      });
      expect(screen.getByText(SAMPLE_SUMMARY_RESULT.contractType)).toBeInTheDocument();
    });

    // Once analyzed, the trigger button is removed
    expect(screen.queryByText('Bắt đầu tóm tắt AI')).not.toBeInTheDocument();
    expect(screen.queryByText('Phân tích lại')).not.toBeInTheDocument();
  });

  it('renders "Bắt đầu phân tích rủi ro" button on empty RISK tab for LEGAL', async () => {
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
      return null;
    });

    render(
      <AIAssistantPanel
        contractId="CTR-2609-0001"
        versionNo={1}
        userRole="LEGAL"
        contractStatus="PENDING_LEGAL"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Rủi ro & Đề xuất')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Rủi ro & Đề xuất'));

    await waitFor(() => {
      expect(screen.getByText('Bắt đầu phân tích rủi ro')).toBeInTheDocument();
    });
  });

  afterAll(() => {
    FEATURE_FLAGS.ENABLE_AI = false;
  });
});
