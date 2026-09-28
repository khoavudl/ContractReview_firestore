/**
 * NotificationService.gs
 * Handles email notifications for contract workflow events.
 * All functions are private - called internally by other services.
 *
 * Dependencies: Utils.gs (getSheet_), Config.gs (SHEET_NAMES, ROLES)
 */

/**
 * Sends an HTML email via GmailApp.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject line.
 * @param {string} htmlBody - HTML formatted email body.
 * @private
 */
function sendEmail_(to, subject, htmlBody, cc) {
  if (DISABLE_EMAIL_NOTIFICATIONS) {
    Logger.log('Email notifications are disabled. Suppressed email to ' + to + ' with subject: ' + subject);
    return;
  }

  // Chuẩn hóa to và cc thành chuỗi nếu là mảng
  if (Array.isArray(to)) to = to.join(',');
  if (Array.isArray(cc)) cc = cc.join(',');

  // Whitelist filter: khi whitelist có giá trị, chỉ gửi tới email nằm trong whitelist
  if (EMAIL_WHITELIST && EMAIL_WHITELIST.length > 0) {
    var normalizedWhitelist = EMAIL_WHITELIST.map(function(item) {
      return String(item).toLowerCase().trim();
    });

    if (to) {
      var filteredTo = to.split(',').map(function(e) {
        return e.trim();
      }).filter(function(e) {
        return e && normalizedWhitelist.indexOf(e.toLowerCase()) !== -1;
      });
      to = filteredTo.length > 0 ? filteredTo.join(',') : undefined;
    }

    if (!to) {
      Logger.log('No TO recipients in whitelist, skipped email with subject: ' + subject);
      return;
    }

    // Lọc CC chỉ giữ email trong whitelist
    if (cc) {
      var filteredCC = cc.split(',').map(function(e) {
        return e.trim();
      }).filter(function(e) {
        return e && normalizedWhitelist.indexOf(e.toLowerCase()) !== -1;
      });
      cc = filteredCC.length > 0 ? filteredCC.join(',') : undefined;
    }
  }

  // Khử trùng lặp: Nếu ai đã nằm trong TO thì loại khỏi CC để tránh nhận 2 lần
  if (to && cc) {
    var toArr = to.split(',').map(function(e) {
      return e.trim().toLowerCase();
    });
    var ccArr = cc.split(',').map(function(e) {
      return e.trim();
    }).filter(function(e) {
      return e && toArr.indexOf(e.toLowerCase()) === -1;
    });
    cc = ccArr.length > 0 ? ccArr.join(',') : undefined;
  }

  try {
    var options = { htmlBody: htmlBody };
    if (cc) options.cc = cc;
    GmailApp.sendEmail(to, subject, '', options);
  } catch (e) {
    Logger.log('Error sending email to ' + to + ': ' + e.message);
  }
}

/**
 * Generates a professional HTML email template.
 * @param {string} title - Email heading/title.
 * @param {string} body - Main content HTML.
 * @param {string} actionUrl - URL for the action button.
 * @param {string} actionText - Text for the action button.
 * @return {string} Complete HTML email string.
 * @private
 */
function getEmailTemplate_(title, body, actionUrl, actionText) {
  return '<!DOCTYPE html>' +
    '<html>' +
    '<head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:\'Segoe UI\',Tahoma,Geneva,Verdana,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:30px 0;">' +
    '<tr><td align="center">' +
    '<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">' +

    // Header
    '<tr><td bgcolor="#1a237e" style="background-color:#1a237e;background:linear-gradient(135deg,#1a237e,#283593);padding:28px 32px;">' +
    '<h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Contract Review System</h1>' +
    '</td></tr>' +

    // Title
    '<tr><td style="padding:28px 32px 0;">' +
    '<h2 style="margin:0;color:#1a237e;font-size:18px;font-weight:600;border-bottom:2px solid #e8eaf6;padding-bottom:14px;">' + title + '</h2>' +
    '</td></tr>' +

    // Body
    '<tr><td style="padding:20px 32px;">' +
    '<div style="color:#424242;font-size:14px;line-height:1.7;">' + body + '</div>' +
    '</td></tr>' +

    // Action button
    (actionUrl ?
      '<tr><td style="padding:8px 32px 28px;">' +
      '<a href="' + actionUrl + '" style="display:inline-block;background-color:#1a237e;background:linear-gradient(135deg,#1a237e,#283593);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;">' + actionText + '</a>' +
      '</td></tr>' : '') +

    // Footer
    '<tr><td style="background-color:#f5f5f5;padding:18px 32px;border-top:1px solid #e0e0e0;">' +
    '<p style="margin:0;color:#9e9e9e;font-size:12px;text-align:center;">Email tự động từ hệ thống Contract Review. Vui lòng không trả lời email này.</p>' +
    '</td></tr>' +

    '</table>' +
    '</td></tr>' +
    '</table>' +
    '</body></html>';
}

/**
 * Returns the webapp URL with contract anchor.
 * @param {string} contractId - The contract identifier.
 * @return {string} Full URL to the contract detail page.
 * @private
 */
function getContractUrl_(contractId) {
  return FRONTEND_URL + '/#contract/' + contractId;
}

/**
 * Finds user email by username from the users sheet.
 * Schema users: [Column A: username, Column B: email, Column C: display_name, Column D: role]
 * @param {string} username - The username to look up.
 * @return {string|null} The user's email or null.
 * @private
 */
function getUserEmail_(username) {
  if (!username) return null;
  var sheet = getSheet_(SHEET_NAMES.USERS);

  // 1. Tìm theo Column 1 (A = username)
  var rowIndex = getRowByColumn_(sheet, 1, username);
  if (rowIndex !== -1) {
    var email = sheet.getRange(rowIndex, 2).getValue(); // Column B (2) = email
    if (email) return String(email).trim();
  }

  // 2. Thử tìm theo Column 2 (B = email) nếu username thực chất là email
  var emailRowIndex = getRowByColumn_(sheet, 2, username);
  if (emailRowIndex !== -1) {
    var emailVal = sheet.getRange(emailRowIndex, 2).getValue();
    if (emailVal) return String(emailVal).trim();
  }

  // 3. Fallback nếu username đã có định dạng email
  if (String(username).indexOf('@') !== -1) {
    return String(username).trim();
  }
  return null;
}

/**
 * Finds all emails for users with a given role.
 * Schema users: [Column A: username, Column B: email, Column C: display_name, Column D: role]
 * @param {string} role - The role to search for (e.g., 'LEGAL', 'HOL').
 * @return {string[]} Array of email addresses.
 * @private
 */
function getEmailsByRole_(role) {
  var sheet = getSheet_(SHEET_NAMES.USERS);
  var data = sheet.getDataRange().getValues();
  var emails = [];

  for (var i = 1; i < data.length; i++) { // Skip header
    // data[i][3] = role (Column D), data[i][1] = email (Column B)
    if (data[i][3] === role && data[i][1]) {
      emails.push(String(data[i][1]).trim());
    }
  }
  return emails;
}

/**
 * Notifies legal team about a new contract requiring review.
 * @param {object} contract - Contract data object.
 * @param {string} creatorName - Display name of the contract creator.
 * @private
 */
function notifyLegalNewContract_(contract, creatorName) {
  if (DISABLE_EMAIL_NOTIFICATIONS) return;
  try {
    var legalEmails = getEmailsByRole_(ROLES.LEGAL);
    if (legalEmails.length === 0) {
      Logger.log('No LEGAL users found for notification.');
      return;
    }

    var creatorEmail = getUserEmail_(contract.createdBy);

    var subject = '[Contract Review] Hợp đồng mới cần review: ' + contract.contractId;
    var body =
      '<p>Xin chào,</p>' +
      '<p>Một hợp đồng mới đã được gửi để xem xét pháp lý:</p>' +
      '<table style="width:100%;border-collapse:collapse;margin:16px 0;">' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:140px;border:1px solid #e0e0e0;">Hợp đồng</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.title + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;border:1px solid #e0e0e0;">Nhà cung cấp</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.supplier + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;border:1px solid #e0e0e0;">Người tạo</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + creatorName + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;border:1px solid #e0e0e0;">Mã HĐ</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.contractId + '</td></tr>' +
      '</table>' +
      '<p>Vui lòng đăng nhập để xem xét và đưa ra góp ý.</p>';

    var actionUrl = getContractUrl_(contract.contractId);
    var html = getEmailTemplate_('Hợp đồng mới cần review', body, actionUrl, 'Xem xét hợp đồng');

    var toList = legalEmails.join(',');
    sendEmail_(toList, subject, html, creatorEmail);
  } catch (e) {
    Logger.log('Error notifying legal: ' + e.message);
  }
}

/**
 * Notifies the contract creator about new feedback/comments.
 * @param {object} contract - Contract data object.
 * @param {string} commenterName - Display name of the person who commented.
 * @private
 */
function notifyUserFeedback_(contract, commenterName) {
  if (DISABLE_EMAIL_NOTIFICATIONS) return;
  try {
    var creatorEmail = getUserEmail_(contract.createdBy);
    if (!creatorEmail) {
      Logger.log('Creator email not found for: ' + contract.createdBy);
      return;
    }

    var legalEmails = getEmailsByRole_(ROLES.LEGAL);
    var ccList = legalEmails.join(',') || undefined;

    var subject = '[Contract Review] Có góp ý mới cho: ' + contract.contractId;
    var body =
      '<p>Xin chào,</p>' +
      '<p>Hợp đồng của bạn vừa nhận được góp ý mới:</p>' +
      '<table style="width:100%;border-collapse:collapse;margin:16px 0;">' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:140px;border:1px solid #e0e0e0;">Hợp đồng</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.title + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;border:1px solid #e0e0e0;">Góp ý bởi</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + commenterName + '</td></tr>' +
      '</table>' +
      '<p>Vui lòng xem xét và cập nhật hợp đồng nếu cần.</p>';

    var actionUrl = getContractUrl_(contract.contractId);
    var html = getEmailTemplate_('Có góp ý mới', body, actionUrl, 'Xem góp ý');

    sendEmail_(creatorEmail, subject, html, ccList);
  } catch (e) {
    Logger.log('Error notifying user feedback: ' + e.message);
  }
}

/**
 * Notifies HOL (Head of Legal) that a contract needs approval.
 * @param {object} contract - Contract data object.
 * @private
 */
function notifyHOLReview_(contract) {
  if (DISABLE_EMAIL_NOTIFICATIONS) return;
  try {
    var holEmails = getEmailsByRole_(ROLES.HOL);
    if (holEmails.length === 0) {
      Logger.log('No HOL users found for notification.');
      return;
    }

    var creatorEmail = getUserEmail_(contract.createdBy);
    var legalEmails = getEmailsByRole_(ROLES.LEGAL);
    var ccList = [creatorEmail].concat(legalEmails).filter(Boolean).join(',') || undefined;

    var subject = '[Contract Review] Cần phê duyệt: ' + contract.contractId;
    var body =
      '<p>Xin chào,</p>' +
      '<p>Một hợp đồng đã được bộ phận pháp lý review và cần phê duyệt của bạn:</p>' +
      '<table style="width:100%;border-collapse:collapse;margin:16px 0;">' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:140px;border:1px solid #e0e0e0;">Hợp đồng</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.title + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;border:1px solid #e0e0e0;">Nhà cung cấp</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.supplier + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;border:1px solid #e0e0e0;">Mã HĐ</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.contractId + '</td></tr>' +
      '</table>' +
      '<p>Vui lòng đăng nhập để xem xét và phê duyệt.</p>';

    var actionUrl = getContractUrl_(contract.contractId);
    var html = getEmailTemplate_('Cần phê duyệt hợp đồng', body, actionUrl, 'Phê duyệt ngay');

    var toList = holEmails.join(',');
    sendEmail_(toList, subject, html, ccList);
  } catch (e) {
    Logger.log('Error notifying HOL: ' + e.message);
  }
}

/**
 * Notifies the contract creator that their contract has been approved.
 * @param {object} contract - Contract data object.
 * @private
 */
function notifyUserApproved_(contract, approvedDocUrl) {
  if (DISABLE_EMAIL_NOTIFICATIONS) return;
  try {
    var creatorEmail = getUserEmail_(contract.createdBy);
    if (!creatorEmail) {
      Logger.log('Creator email not found for: ' + contract.createdBy);
      return;
    }

    var legalEmails = getEmailsByRole_(ROLES.LEGAL);
    var holEmails = getEmailsByRole_(ROLES.HOL);
    var ccList = legalEmails.concat(holEmails).join(',') || undefined;

    var subject = '[Contract Review] Hợp đồng đã được duyệt: ' + contract.contractId;
    var approvedDocRow = approvedDocUrl ?
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;border:1px solid #e0e0e0;">File phê duyệt</td>' +
      '<td style="padding:8px 12px;border:1px solid #e0e0e0;"><a href="' + approvedDocUrl + '" style="color:#1a237e;font-weight:600;text-decoration:underline;" target="_blank">' + contract.contractId + '_approved (Google Doc)</a></td></tr>' : '';

    var body =
      '<p>Xin chào,</p>' +
      '<p>Chúc mừng! Hợp đồng của bạn đã được phê duyệt thành công:</p>' +
      '<table style="width:100%;border-collapse:collapse;margin:16px 0;">' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:140px;border:1px solid #e0e0e0;">Hợp đồng</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.title + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;border:1px solid #e0e0e0;">Nhà cung cấp</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.supplier + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;border:1px solid #e0e0e0;">Mã HĐ</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.contractId + '</td></tr>' +
      approvedDocRow +
      '</table>' +
      '<p><strong>Bước tiếp theo:</strong> Vui lòng nộp hợp đồng lên hệ thống WeSign để hoàn tất quy trình ký kết.</p>';

    var actionUrl = approvedDocUrl || getContractUrl_(contract.contractId);
    var actionText = approvedDocUrl ? 'Mở file phê duyệt' : 'Xem hợp đồng';
    var html = getEmailTemplate_('Hợp đồng đã được duyệt!', body, actionUrl, actionText);

    sendEmail_(creatorEmail, subject, html, ccList);
  } catch (e) {
    Logger.log('Error notifying user approved: ' + e.message);
  }
}

/**
 * Notifies the contract creator that HOL has rejected/requested changes.
 * Separate from notifyUserFeedback_ to distinguish HOL rejection from Legal comments.
 * @param {object} contract - Contract data object.
 * @param {string} commenterName - Display name of the HOL who rejected.
 * @private
 */
function notifyUserRejectedByHOL_(contract, commenterName) {
  if (DISABLE_EMAIL_NOTIFICATIONS) return;
  try {
    var creatorEmail = getUserEmail_(contract.createdBy);
    if (!creatorEmail) {
      Logger.log('Creator email not found for: ' + contract.createdBy);
      return;
    }

    var legalEmails = getEmailsByRole_(ROLES.LEGAL);
    var holEmails = getEmailsByRole_(ROLES.HOL);
    var ccList = legalEmails.concat(holEmails).join(',') || undefined;

    var subject = '[Contract Review] Head of Legal yêu cầu chỉnh sửa: ' + contract.contractId;
    var body =
      '<p>Xin chào,</p>' +
      '<p>Head of Legal đã xem xét và yêu cầu chỉnh sửa hợp đồng của bạn:</p>' +
      '<table style="width:100%;border-collapse:collapse;margin:16px 0;">' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:140px;border:1px solid #e0e0e0;">Hợp đồng</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.title + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;border:1px solid #e0e0e0;">Nhà cung cấp</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.supplier + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;border:1px solid #e0e0e0;">Mã HĐ</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + contract.contractId + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;border:1px solid #e0e0e0;">Người yêu cầu</td><td style="padding:8px 12px;border:1px solid #e0e0e0;">' + commenterName + '</td></tr>' +
      '</table>' +
      '<p>Vui lòng xem xét Task List và cập nhật hợp đồng theo yêu cầu.</p>';

    var actionUrl = getContractUrl_(contract.contractId);
    var html = getEmailTemplate_('Yêu cầu chỉnh sửa từ Head of Legal', body, actionUrl, 'Xem yêu cầu');

    sendEmail_(creatorEmail, subject, html, ccList);
  } catch (e) {
    Logger.log('Error notifying HOL rejection: ' + e.message);
  }
}
