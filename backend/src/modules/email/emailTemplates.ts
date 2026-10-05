import type { EmailTemplateType } from './emailTypes.js';

export interface EmailContractInfo {
  contractId: string;
  title: string;
  supplier: string;
}

interface TemplateConfig {
  headerTitle: string;
  subjectPrefix: string;
  leadMessage: string;
  buttonText: string;
}

const TEMPLATE_CONFIGS: Record<EmailTemplateType, TemplateConfig> = {
  NEW_SUBMISSION: {
    headerTitle: 'Hồ sơ hợp đồng mới cần thẩm định',
    subjectPrefix: 'Hồ sơ mới cần thẩm định',
    leadMessage: 'Một hồ sơ hợp đồng mới vừa được gửi yêu cầu xem xét pháp lý:',
    buttonText: 'Xem xét hợp đồng',
  },
  TASK_LIST_ASSIGNED: {
    headerTitle: 'Yêu cầu chỉnh sửa hợp đồng',
    subjectPrefix: 'Yêu cầu chỉnh sửa',
    leadMessage: 'Pháp chế đã hoàn tất rà soát và yêu cầu chỉnh sửa theo Task List:',
    buttonText: 'Xem Task List và sửa đổi',
  },
  RESUBMISSION: {
    headerTitle: 'Hồ sơ đã nộp bản sửa đổi mới',
    subjectPrefix: 'Bản sửa đổi mới',
    leadMessage: 'Người phụ trách đã cập nhật phiên bản sửa đổi mới để thẩm định lại:',
    buttonText: 'Thẩm định bản sửa đổi',
  },
  LEGAL_APPROVED: {
    headerTitle: 'Trình Trưởng phòng phê duyệt hợp đồng',
    subjectPrefix: 'Trình Trưởng phòng duyệt',
    leadMessage: 'Chuyên viên Pháp chế đã thẩm định đạt yêu cầu và kính trình Trưởng phòng xem xét:',
    buttonText: 'Phê duyệt hợp đồng',
  },
  HOL_COMMENTED: {
    headerTitle: 'Ý kiến chỉ đạo từ Trưởng phòng',
    subjectPrefix: 'Ý kiến từ Trưởng phòng',
    leadMessage: 'Trưởng phòng Pháp chế có ý kiến yêu cầu làm rõ hoặc bổ sung hồ sơ:',
    buttonText: 'Xem ý kiến chỉ đạo',
  },
  HOL_APPROVED: {
    headerTitle: 'Hợp đồng đã được phê duyệt chính thức',
    subjectPrefix: 'ĐÃ PHÊ DUYỆT CHÍNH THỨC',
    leadMessage: 'Hồ sơ hợp đồng đã được Trưởng phòng phê duyệt. Bạn có thể tải bản duyệt nộp lên WeSign:',
    buttonText: 'Xem hồ sơ & Tải bản duyệt',
  },
};

/**
 * Builds HTML Table rows containing contract details for Outlook compatibility.
 */
function buildContractDetailsTable(
  contract: EmailContractInfo,
  extraNote?: string
): string {
  const noteRow = extraNote
    ? `<tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;border:1px solid #e2e8f0;">Ghi chú</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#c2410c;">${extraNote}</td></tr>`
    : '';

  return (
    '<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;color:#333333;">' +
    `<tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;width:130px;border:1px solid #e2e8f0;">Mã hợp đồng</td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:bold;">${contract.contractId}</td></tr>` +
    `<tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;border:1px solid #e2e8f0;">Tiêu đề</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${contract.title}</td></tr>` +
    `<tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;border:1px solid #e2e8f0;">Đối tác</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${contract.supplier}</td></tr>` +
    noteRow +
    '</table>'
  );
}

/**
 * Wraps content in an Outlook-ready master table layout with inline styling.
 * Follows SRP with <= 25 lines of logic.
 */
export function wrapOutlookHtml(
  headerTitle: string,
  bodyHtml: string,
  actionUrl?: string,
  actionText?: string
): string {
  const buttonHtml = actionUrl
    ? `<tr><td style="padding:8px 32px 28px;"><a href="${actionUrl}" style="display:inline-block;background-color:#1a237e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;font-weight:600;">${actionText || 'Xem chi tiết'}</a></td></tr>`
    : '';

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:\'Segoe UI\',Tahoma,Arial,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:24px 0;"><tr><td align="center">' +
    '<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">' +
    '<tr><td bgcolor="#1a237e" style="background-color:#1a237e;padding:24px 32px;"><h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">Contract Review System</h1></td></tr>' +
    `<tr><td style="padding:24px 32px 0;"><h2 style="margin:0;color:#1a237e;font-size:16px;font-weight:600;border-bottom:2px solid #e8eaf6;padding-bottom:12px;">${headerTitle}</h2></td></tr>` +
    `<tr><td style="padding:16px 32px;"><div style="color:#333333;font-size:14px;line-height:1.6;">${bodyHtml}</div></td></tr>` +
    buttonHtml +
    '<tr><td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;"><p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">Email tự động từ hệ thống Contract Review. Vui lòng không trả lời email này.</p></td></tr>' +
    '</table></td></tr></table></body></html>'
  );
}

/**
 * Builds email subject and HTML body for a given contract event.
 * Follows SRP with <= 25 lines of logic.
 */
export function buildContractEmail(
  templateType: EmailTemplateType,
  contract: EmailContractInfo,
  _actorName?: string,
  extraNote?: string,
  appBaseUrl = process.env.APP_BASE_URL || 'https://contractreview-v2.web.app'
): { subject: string; html: string } {
  const config = TEMPLATE_CONFIGS[templateType];
  const subject = `[Contract Review] ${config.subjectPrefix}: ${contract.contractId} - ${contract.title}`;
  const actionUrl = `${appBaseUrl}/contracts/${contract.contractId}`;

  const detailsTable = buildContractDetailsTable(contract, extraNote);
  const bodyHtml = `<p>Xin chào,</p><p>${config.leadMessage}</p>${detailsTable}<p>Vui lòng nhấp vào nút bên dưới để mở hồ sơ trên hệ thống:</p>`;
  const html = wrapOutlookHtml(config.headerTitle, bodyHtml, actionUrl, config.buttonText);

  return { subject, html };
}
