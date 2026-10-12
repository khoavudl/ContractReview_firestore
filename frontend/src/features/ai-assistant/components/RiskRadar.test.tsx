import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RiskRadar, getDocumentRefBadge } from './RiskRadar';
import type { RiskAssessmentResult } from '../types';

describe('RiskRadar Component & getDocumentRefBadge', () => {
  const mockRiskData: RiskAssessmentResult = {
    overallRiskLevel: 'HIGH',
    summary: 'Hợp đồng có rủi ro mâu thuẫn giữa phụ lục và hợp đồng chính.',
    risks: [
      {
        clause: 'Điều 8.2 - Giới hạn trách nhiệm',
        documentRef: 'HĐ Chính',
        riskLevel: 'CRITICAL',
        description: 'Bên B chỉ bồi thường tối đa 1 tháng phí.',
        impact: 'Thiệt hại lớn khi mất dữ liệu.',
        mitigationWording: 'Tăng mức bồi thường lên 100% giá trị hợp đồng.',
      },
      {
        clause: 'Điều 11.4 - Cam kết SLA',
        documentRef: 'PL02',
        riskLevel: 'HIGH',
        description: 'SLA không có hoàn tiền.',
        impact: 'Bị khóa hợp đồng.',
        mitigationWording: 'Cho phép hủy hợp đồng nếu SLA dưới 98%.',
      },
      {
        clause: 'Điều 5.3 - Lãi suất phạt',
        documentRef: 'PL01 vs HĐ Chính',
        riskLevel: 'LOW',
        description: 'Lãi suất PL01 (0.05%) mâu thuẫn HĐ chính (0.02%).',
        impact: 'Tranh chấp khi chậm thanh toán.',
        mitigationWording: 'Áp dụng thống nhất 0.02%/ngày.',
      },
      {
        clause: 'Điều 19 - Không có documentRef (Legacy)',
        riskLevel: 'MEDIUM',
        description: 'Dữ liệu cache cũ từ phiên bản trước.',
        impact: 'Tác động vừa phải.',
        mitigationWording: 'Giữ nguyên câu chữ.',
      },
    ],
    favorableTerms: [
      'Hỗ trợ 24/7 trong vòng 15 phút.',
      'Sao lưu dữ liệu tự động miễn phí.',
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDocumentRefBadge helper', () => {
    it('returns null for undefined, null or empty strings', () => {
      expect(getDocumentRefBadge(undefined)).toBeNull();
      expect(getDocumentRefBadge('')).toBeNull();
      expect(getDocumentRefBadge('   ')).toBeNull();
    });

    it('returns Main Contract badge for HĐ Chính or MAIN', () => {
      const badgeHd = getDocumentRefBadge('HĐ Chính');
      expect(badgeHd?.label).toBe('⭐ HĐ Chính');
      expect(badgeHd?.className).toContain('text-blue-700');

      const badgeMain = getDocumentRefBadge('MAIN');
      expect(badgeMain?.label).toBe('⭐ HĐ Chính');
    });

    it('returns Annex badge for PL01 or PL02', () => {
      const badgePl = getDocumentRefBadge('PL01');
      expect(badgePl?.label).toBe('📎 PL01');
      expect(badgePl?.className).toContain('text-purple-700');
    });

    it('returns Conflict badge when docRef contains "vs" or "xung đột"', () => {
      const badgeConflict = getDocumentRefBadge('PL01 vs HĐ Chính');
      expect(badgeConflict?.label).toBe('⚡ Xung đột: PL01 vs HĐ Chính');
      expect(badgeConflict?.className).toContain('text-amber-800');

      const badgeConflict2 = getDocumentRefBadge('Xung đột SLA');
      expect(badgeConflict2?.label).toContain('⚡ Xung đột:');
    });
  });

  describe('RiskRadar rendering', () => {
    it('renders overall risk header and summary', () => {
      render(<RiskRadar data={mockRiskData} />);

      expect(screen.getByText('Mức độ rủi ro tổng thể:')).toBeInTheDocument();
      expect(screen.getByText(/Hợp đồng có rủi ro mâu thuẫn giữa phụ lục/)).toBeInTheDocument();
      expect(screen.getByText('Chi tiết rủi ro & Đề xuất chỉnh sửa (4)')).toBeInTheDocument();
    });

    it('renders documentRef badges correctly for each risk item', () => {
      render(<RiskRadar data={mockRiskData} />);

      expect(screen.getByText('⭐ HĐ Chính')).toBeInTheDocument();
      expect(screen.getByText('📎 PL02')).toBeInTheDocument();
      expect(screen.getByText('⚡ Xung đột: PL01 vs HĐ Chính')).toBeInTheDocument();
    });

    it('maintains backward compatibility for legacy risks without documentRef', () => {
      render(<RiskRadar data={mockRiskData} />);

      expect(screen.getByText('Điều 19 - Không có documentRef (Legacy)')).toBeInTheDocument();
      // Should not throw or crash when documentRef is missing
    });

    it('renders favorable terms list', () => {
      render(<RiskRadar data={mockRiskData} />);

      expect(screen.getByText('Điều khoản có lợi cho Doanh nghiệp (2)')).toBeInTheDocument();
      expect(screen.getByText(/Hỗ trợ 24\/7 trong vòng 15 phút/)).toBeInTheDocument();
      expect(screen.getByText(/Sao lưu dữ liệu tự động miễn phí/)).toBeInTheDocument();
    });

    it('allows copying mitigation wording to clipboard', async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      render(<RiskRadar data={mockRiskData} />);

      const copyButtons = screen.getAllByTitle('Sao chép câu chữ');
      expect(copyButtons.length).toBeGreaterThan(0);

      fireEvent.click(copyButtons[0]);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        'Tăng mức bồi thường lên 100% giá trị hợp đồng.'
      );
    });
  });
});
