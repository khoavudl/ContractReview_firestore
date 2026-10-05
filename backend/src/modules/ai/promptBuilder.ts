import type { CompanyRole } from '../../types/index.js';
import type { AnalysisPromptInput } from './aiTypes.js';

/**
 * Builds prompt for contract executive summary (for USER / General).
 */
export function buildSummaryPrompt(
  contractTitle: string,
  supplier: string,
  contractText?: string
): AnalysisPromptInput {
  return {
    systemInstruction:
      'Bạn là trợ lý pháp lý doanh nghiệp chuyên nghiệp. Hãy đọc hợp đồng và tóm tắt khách quan, chính xác theo cấu trúc yêu cầu.',
    userPrompt: `Hồ sơ hợp đồng: "${contractTitle}" - Đối tác: "${supplier}". Vui lòng phân tích và tóm tắt các điều khoản quan trọng nhất.`,
    contractText,
  };
}

/**
 * Builds prompt for risk radar analysis based on BUYER/SELLER stance (for LEGAL).
 */
export function buildRiskPrompt(
  contractTitle: string,
  supplier: string,
  companyRole: CompanyRole,
  contractText?: string
): AnalysisPromptInput {
  const roleText =
    companyRole === 'BUYER'
      ? 'BÊN MUA (bảo vệ quyền lợi thanh toán, bảo hành, phạt chậm giao hàng, giới hạn trách nhiệm bồi thường)'
      : 'BÊN BÁN (bảo vệ quyền thu hồi công nợ, giới hạn nghĩa vụ bảo hành, miễn trừ trách nhiệm bất khả kháng)';

  return {
    systemInstruction: `Bạn là luật sư chuyên sâu về rà soát hợp đồng thương mại. Bạn đang bảo vệ quyền lợi của công ty chúng tôi với tư cách là ${roleText}.`,
    userPrompt: `Hồ sơ: "${contractTitle}" - Đối tác: "${supplier}". Hãy rà soát toàn bộ hợp đồng, chỉ rõ các điều khoản bất lợi, xếp hạng rủi ro và đề xuất câu chữ sửa đổi (Mitigation Wording) cụ thể.`,
    contractText,
  };
}

/**
 * Builds prompt for executive decision brief (for HOL).
 */
export function buildDecisionBriefPrompt(
  contractTitle: string,
  supplier: string,
  contractText?: string,
  taskListText?: string
): AnalysisPromptInput {
  let userPrompt = `Hồ sơ: "${contractTitle}" - Đối tác: "${supplier}". Vui lòng lập Báo cáo Tóm tắt Quyết định (Decision Brief) đánh giá các điểm nhượng bộ và khuyến nghị ký kết.`;
  if (taskListText && taskListText.trim().length > 0) {
    userPrompt += `\n\n--- DANH SÁCH NHIỆM VỤ RÀ SOÁT & ĐÀM PHÁN (TASK LIST) ---\n${taskListText.trim()}`;
  }

  return {
    systemInstruction:
      'Bạn là cố vấn pháp chế trưởng (Chief Legal Officer). Hãy tổng hợp bản báo cáo quyết định trình lãnh đạo, đối chiếu danh sách nhiệm vụ rà soát (Task List) với nội dung hợp đồng để đánh giá các điểm nhượng bộ (RESOLVED/WAIVED) và rủi ro còn tồn đọng (OPEN) nhằm đưa ra khuyến nghị phê duyệt dứt khoát.',
    userPrompt,
    contractText,
  };
}
