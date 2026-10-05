import { describe, it, expect } from 'vitest';
import {
  buildSummaryPrompt,
  buildRiskPrompt,
  buildDecisionBriefPrompt,
} from './promptBuilder.js';

describe('promptBuilder', () => {
  it('builds summary prompt correctly', () => {
    const prompt = buildSummaryPrompt('Hợp đồng mua bán thiết bị', 'Công ty ABC');
    expect(prompt.systemInstruction).toContain('trợ lý pháp lý');
    expect(prompt.userPrompt).toContain('Hợp đồng mua bán thiết bị');
    expect(prompt.userPrompt).toContain('Công ty ABC');
  });

  it('builds risk prompt tailored for BUYER role', () => {
    const prompt = buildRiskPrompt('Hợp đồng dịch vụ', 'Nhà cung cấp XYZ', 'BUYER');
    expect(prompt.systemInstruction).toContain('BÊN MUA');
    expect(prompt.systemInstruction).toContain('bảo vệ quyền lợi thanh toán');
    expect(prompt.userPrompt).toContain('Mitigation Wording');
  });

  it('builds risk prompt tailored for SELLER role', () => {
    const prompt = buildRiskPrompt('Hợp đồng bán hàng', 'Đại lý 123', 'SELLER');
    expect(prompt.systemInstruction).toContain('BÊN BÁN');
    expect(prompt.systemInstruction).toContain('thu hồi công nợ');
  });

  it('builds decision brief prompt for executive review without tasks', () => {
    const prompt = buildDecisionBriefPrompt('Hợp đồng thuê văn phòng', 'Ban Quản lý TN');
    expect(prompt.systemInstruction).toContain('cố vấn pháp chế trưởng');
    expect(prompt.userPrompt).toContain('Decision Brief');
    expect(prompt.userPrompt).not.toContain('TASK LIST');
  });

  it('builds decision brief prompt including task list text when provided', () => {
    const mockTasks = 'Nhiệm vụ #1 (PENALTY):\n- Điều khoản: Điều 8.2\n- Trạng thái: RESOLVED';
    const prompt = buildDecisionBriefPrompt('Hợp đồng mua bán', 'Đối tác ABC', 'Nội dung', mockTasks);
    expect(prompt.userPrompt).toContain('--- DANH SÁCH NHIỆM VỤ RÀ SOÁT & ĐÀM PHÁN (TASK LIST) ---');
    expect(prompt.userPrompt).toContain('Nhiệm vụ #1 (PENALTY)');
    expect(prompt.userPrompt).toContain('RESOLVED');
  });
});
