import { describe, it, expect } from 'vitest';
import {
  buildContractEmail,
  wrapOutlookHtml,
  type EmailContractInfo,
} from './emailTemplates.js';

describe('emailTemplates', () => {
  const sampleContract: EmailContractInfo = {
    contractId: 'CTR-2609-0001',
    title: 'Hợp đồng mua sắm thiết bị',
    supplier: 'Công ty ABC',
  };

  describe('wrapOutlookHtml', () => {
    it('creates an HTML table structure compatible with Microsoft Outlook', () => {
      const html = wrapOutlookHtml(
        'Tiêu đề thông báo',
        '<p>Nội dung</p>',
        'https://app.test/#contract/1',
        'Xem ngay'
      );

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<table width="600"');
      expect(html).toContain('background-color:#1a237e');
      expect(html).toContain('https://app.test/#contract/1');
      expect(html).toContain('Xem ngay');
    });
  });

  describe('buildContractEmail', () => {
    it('builds NEW_SUBMISSION email with correct subject and details table', () => {
      const { subject, html } = buildContractEmail(
        'NEW_SUBMISSION',
        sampleContract,
        'Nguyễn Văn A'
      );

      expect(subject).toBe(
        '[Contract Review] Hồ sơ mới cần thẩm định: CTR-2609-0001 - Hợp đồng mua sắm thiết bị'
      );
      expect(html).toContain('Hồ sơ hợp đồng mới cần thẩm định');
      expect(html).toContain('CTR-2609-0001');
      expect(html).toContain('Hợp đồng mua sắm thiết bị');
      expect(html).toContain('Công ty ABC');
      expect(html).toContain('Nguyễn Văn A');
      expect(html).toContain('Xem xét hợp đồng');
    });

    it('builds TASK_LIST_ASSIGNED email with extra note', () => {
      const { subject, html } = buildContractEmail(
        'TASK_LIST_ASSIGNED',
        sampleContract,
        'Trần Thị Legal',
        'Cần xem xét kỹ điều khoản phạt chậm'
      );

      expect(subject).toContain('Yêu cầu chỉnh sửa');
      expect(html).toContain('Xem Task List và sửa đổi');
      expect(html).toContain('Cần xem xét kỹ điều khoản phạt chậm');
    });

    it('builds RESUBMISSION email correctly', () => {
      const { subject, html } = buildContractEmail(
        'RESUBMISSION',
        sampleContract,
        'Nguyễn Văn A'
      );

      expect(subject).toContain('Bản sửa đổi mới');
      expect(html).toContain('Thẩm định bản sửa đổi');
    });

    it('builds LEGAL_APPROVED email for HOL', () => {
      const { subject, html } = buildContractEmail(
        'LEGAL_APPROVED',
        sampleContract,
        'Trần Thị Legal'
      );

      expect(subject).toContain('Trình Trưởng phòng duyệt');
      expect(html).toContain('Phê duyệt hợp đồng');
    });

    it('builds HOL_COMMENTED email with clarification request', () => {
      const { subject, html } = buildContractEmail(
        'HOL_COMMENTED',
        sampleContract,
        'Lê Văn HOL',
        'Làm rõ tỷ lệ cọc'
      );

      expect(subject).toContain('Ý kiến từ Trưởng phòng');
      expect(html).toContain('Làm rõ tỷ lệ cọc');
    });

    it('builds HOL_APPROVED email with WeSign submission prompt', () => {
      const { subject, html } = buildContractEmail(
        'HOL_APPROVED',
        sampleContract,
        'Lê Văn HOL'
      );

      expect(subject).toContain('ĐÃ PHÊ DUYỆT CHÍNH THỨC');
      expect(html).toContain('Xem hồ sơ & Tải bản duyệt');
    });
  });
});
