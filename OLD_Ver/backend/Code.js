/**
 * Code.gs - Main entry point for the Contract Review Workflow web app.
 * Handles doGet, setup, email trigger, and email processing.
 */

// ⚡ Chạy hàm này 1 lần trong GAS Editor để trigger quyền GmailApp
function testSendEmail() {
  GmailApp.sendEmail('khoavudl@gmail.com', '[Test] Contract Review Email', 'Email test thành công! Hệ thống đã được cấp quyền gửi email.');
}
// ─── Web App Entry Point ─────────────────────────────────────

/**
 * Serves the web app HTML page.
 * @param {Object} e - The event object from the web app request.
 * @return {GoogleAppsScript.HTML.HtmlOutput} The HTML output.
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Contract Review System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Includes an HTML file's content for templating (use with <?!= include('filename') ?>).
 * @param {string} filename - The name of the HTML file to include (without .html extension).
 * @return {string} The HTML content of the file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ─── Setup Functions ─────────────────────────────────────────

/**
 * Creates all required sheets with proper headers if they don't exist.
 * Creates default users and root Drive folder.
 * PRIVATE — Chỉ chạy trực tiếp từ Apps Script Editor (Menu Run → setupSpreadsheet_).
 * Hàm này KHÔNG thể gọi từ client-side (google.script.run) vì có dấu gạch dưới cuối tên.
 */
function setupSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('SPREADSHEET_ID');
  var ss = null;

  if (spreadsheetId) {
    try {
      ss = SpreadsheetApp.openById(spreadsheetId);
    } catch (err) {
      Logger.log('Không thể mở Spreadsheet bằng ID cấu hình: ' + err.message);
    }
  }

  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      props.setProperty('SPREADSHEET_ID', ss.getId());
    }
  }

  if (!ss) {
    throw new Error(
      'Không tìm thấy Spreadsheet. Do dự án chạy ở dạng Standalone (hoặc chưa liên kết), ' +
      'vui lòng tạo một Google Sheet mới, copy ID của nó và lưu vào Script Properties ' +
      'với key là "SPREADSHEET_ID" (trong Project Settings trên giao diện Apps Script) trước khi chạy setupSpreadsheet_().'
    );
  }

  // ── Run Migrations ──
  migrateSummariesToAIAnalyses_(ss, '#4a86c8');
  var archiveId = props.getProperty('ARCHIVE_SPREADSHEET_ID');
  if (archiveId) {
    try {
      var archiveSS = SpreadsheetApp.openById(archiveId);
      migrateSummariesToAIAnalyses_(archiveSS, '#666666');
    } catch (err) {
      Logger.log('Không thể mở hoặc migrate Archive Spreadsheet: ' + err.message);
    }
  }

  // ── Define sheet structures ──
  var sheetDefs = {
    [SHEET_NAMES.USERS]: [
      'username', 'email', 'display_name', 'role'
    ],
    [SHEET_NAMES.CONTRACTS]: [
      'contract_id', 'title', 'supplier', 'description', 'status',
      'current_version', 'folder_id', 'created_by', 'created_at',
      'updated_at', 'reject_count'
    ],
    [SHEET_NAMES.VERSIONS]: [
      'contract_id', 'version_no', 'file_id', 'file_name', 'file_url',
      'uploaded_by', 'uploaded_at', 'action', 'change_summary', 'nego_notes'
    ],
    [SHEET_NAMES.COMMENTS]: [
      'comment_id', 'contract_id', 'version_no', 'clause_ref',
      'comment_by', 'comment_at', 'comment_text', 'type'
    ],
    [SHEET_NAMES.ACTIVITY_LOG]: [
      'timestamp', 'contract_id', 'action', 'performed_by', 'details'
    ],
    [SHEET_NAMES.AI_ANALYSES]: [
      'contract_id', 'version_no', 'analysis_type', 'result_json', 'analyzed_by', 'analyzed_at'
    ],
    [SHEET_NAMES.TASK_LIST]: [
      'contract_id', 'task_id', 'clauses', 'issue_summary', 'category', 'legal_recommendation', 'status', 'user_notes', 'legal_decision'
    ],
    [SHEET_NAMES.REFERENCE_FILES]: [
      'contract_id', 'file_id', 'file_name', 'file_url', 'file_size', 'mime_type', 'uploaded_by', 'uploaded_at'
    ]
  };

  // ── Create sheets with headers ──
  for (var sheetName in sheetDefs) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      var headers = sheetDefs[sheetName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4a86c8')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      Logger.log('Created sheet: ' + sheetName);
    }
  }

  // ── Create default users ──
  var usersSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  var existingUsers = sheetToObjects_(usersSheet);

  var defaultUsers = [
    {
      username: 'user1',
      email: 'user1@company.com',
      displayName: 'Người dùng',
      role: ROLES.USER
    },
    {
      username: 'legal1',
      email: 'legal1@company.com',
      displayName: 'Legal',
      role: ROLES.LEGAL
    },
    {
      username: 'hol1',
      email: 'hol1@company.com',
      displayName: 'Head of Legal',
      role: ROLES.HOL
    }
  ];

  for (var i = 0; i < defaultUsers.length; i++) {
    var defUser = defaultUsers[i];
    var exists = false;
    for (var j = 0; j < existingUsers.length; j++) {
      if (existingUsers[j].username === defUser.username) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      usersSheet.appendRow([
        defUser.username,
        defUser.email,
        defUser.displayName,
        defUser.role
      ]);
      Logger.log('Created default user: ' + defUser.username);
    }
  }

  // ── Create root Drive folder ──
  var rootFolderId = props.getProperty('ROOT_FOLDER_ID');
  if (!rootFolderId) {
    try {
      var folder = DriveApp.createFolder('ContractReview');
      rootFolderId = folder.getId();
      props.setProperty('ROOT_FOLDER_ID', rootFolderId);
      Logger.log('Created root folder: ' + rootFolderId);
    } catch (err) {
      Logger.log('Error creating root folder: ' + err.message);
    }
  }

  Logger.log('Setup completed successfully.');
}

// ─── Email Trigger Functions ─────────────────────────────────

/**
 * Sets up a time-driven trigger to process forwarded emails every 5 minutes.
 * Checks for existing triggers to avoid duplicates.
 * PRIVATE — Chỉ chạy trực tiếp từ Apps Script Editor (Menu Run → setupEmailTrigger_).
 * Hàm này KHÔNG thể gọi từ client-side (google.script.run) vì có dấu gạch dưới cuối tên.
 */
function setupEmailTrigger_() {
  // Check for existing triggers to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'processForwardedEmails') {
      Logger.log('Email trigger already exists. Skipping creation.');
      return;
    }
  }

  ScriptApp.newTrigger('processForwardedEmails')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('Email trigger created: processForwardedEmails every 5 minutes.');
}

/**
 * Processes unread Gmail messages with the [CR] tag in the subject.
 * Creates contracts from email attachments and sends confirmation replies.
 */
function processForwardedEmails() {
  try {
    var threads = GmailApp.search('subject:' + EMAIL_FORWARD_TAG + ' is:unread', 0, 20);

    if (threads.length === 0) {
      Logger.log('No new [CR] emails found.');
      return;
    }

    // Ensure 'CR-Processed' label exists
    var label = GmailApp.getUserLabelByName('CR-Processed');
    if (!label) {
      label = GmailApp.createLabel('CR-Processed');
    }

    for (var t = 0; t < threads.length; t++) {
      var thread = threads[t];
      var messages = thread.getMessages();

      for (var m = 0; m < messages.length; m++) {
        var message = messages[m];
        if (!message.isUnread()) {
          continue;
        }

        try {
          processEmailMessage_(message, label);
        } catch (msgErr) {
          Logger.log('Error processing message: ' + msgErr.message);
          // Mark as read to avoid re-processing
          message.markRead();
          // Send error reply
          if (!DISABLE_EMAIL_NOTIFICATIONS) {
            try {
              message.reply(
                'Xin chào,\n\n' +
                'Đã xảy ra lỗi khi xử lý email của bạn trong hệ thống Contract Review:\n' +
                msgErr.message + '\n\n' +
                'Vui lòng thử lại hoặc liên hệ quản trị viên.\n\n' +
                'Trân trọng,\nContract Review System'
              );
            } catch (replyErr) {
              Logger.log('Error sending error reply: ' + replyErr.message);
            }
          } else {
            Logger.log('Email notifications are disabled. Suppressed error reply for message from ' + message.getFrom());
          }
        }
      }

      // Apply processed label to thread
      thread.addLabel(label);
    }

  } catch (err) {
    Logger.log('processForwardedEmails error: ' + err.message);
  }
}

/**
 * Processes a single email message: parses subject, finds user, extracts attachment, creates contract.
 * @param {GoogleAppsScript.Gmail.GmailMessage} message - The Gmail message.
 * @param {GoogleAppsScript.Gmail.GmailLabel} label - The CR-Processed label.
 */
function processEmailMessage_(message, label) {
  var subject = message.getSubject();
  var senderEmail = message.getFrom();

  // Extract email address from "Name <email@domain.com>" format
  var emailMatch = senderEmail.match(/<(.+?)>/);
  if (emailMatch) {
    senderEmail = emailMatch[1];
  }
  senderEmail = senderEmail.trim().toLowerCase();

  // Parse subject: expect format '[CR] Title - Supplier'
  var cleanSubject = subject.replace(EMAIL_FORWARD_TAG, '').trim();
  var parts = cleanSubject.split(' - ');
  if (parts.length < 2) {
    throw new Error('Tiêu đề email không đúng định dạng. Yêu cầu: [CR] Tiêu đề - Nhà cung cấp');
  }

  var title = parts[0].trim();
  var supplier = parts.slice(1).join(' - ').trim();

  // Look up sender in users sheet
  var usersSheet = getSheet_(SHEET_NAMES.USERS);
  var users = sheetToObjects_(usersSheet);
  var senderUsername = null;

  for (var i = 0; i < users.length; i++) {
    if (users[i].email && users[i].email.toLowerCase() === senderEmail) {
      senderUsername = users[i].username;
      break;
    }
  }

  if (!senderUsername) {
    throw new Error('Email "' + senderEmail + '" không được đăng ký trong hệ thống.');
  }

  // Extract first attachment (Word/PDF)
  var attachments = message.getAttachments();
  var validAttachment = null;

  for (var a = 0; a < attachments.length; a++) {
    var mimeType = attachments[a].getContentType();
    if (mimeType === 'application/pdf' ||
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      validAttachment = attachments[a];
      break;
    }
  }

  if (!validAttachment) {
    throw new Error('Không tìm thấy file đính kèm hợp lệ (PDF hoặc Word).');
  }

  // Create contract
  var result = createContractFromEmail_(title, supplier, senderUsername, validAttachment);

  // Mark message as read
  message.markRead();

  // Send confirmation reply
  if (!DISABLE_EMAIL_NOTIFICATIONS) {
    var config = getConfig_();
    var webAppUrl = config.webAppUrl || 'N/A';

    message.reply(
      'Xin chào,\n\n' +
      'Hợp đồng đã được tạo thành công trong hệ thống Contract Review:\n\n' +
      '• Mã hợp đồng: ' + result.contractId + '\n' +
      '• Tiêu đề: ' + title + '\n' +
      '• Nhà cung cấp: ' + supplier + '\n' +
      '• Trạng thái: ' + STATUS_LABELS.DRAFT + '\n\n' +
      'Truy cập hệ thống: ' + webAppUrl + '\n\n' +
      'Trân trọng,\nContract Review System'
    );
  } else {
    Logger.log('Email notifications are disabled. Suppressed confirmation reply to ' + senderEmail);
  }

  Logger.log('Created contract ' + result.contractId + ' from email by ' + senderUsername);
}

/**
 * Creates a contract and first version from an email attachment.
 * @param {string} title - The contract title.
 * @param {string} supplier - The supplier name.
 * @param {string} senderUsername - The username of the sender.
 * @param {GoogleAppsScript.Gmail.GmailAttachment} attachment - The email attachment.
 * @return {Object} { contractId, folderId }
 */
function createContractFromEmail_(title, supplier, senderUsername, attachment) {
  var config = getConfig_();
  var now = new Date();
  var contractId = generateContractId_();

  // Create contract folder inside root folder
  var rootFolder = DriveApp.getFolderById(config.rootFolderId);
  var contractFolder = rootFolder.createFolder(contractId + ' - ' + title);
  var folderId = contractFolder.getId();

  // Save attachment and convert to Google Doc inside contract folder
  var fileInfo = uploadAndConvertToGoogleDoc_(folderId, attachment, contractId + '_origin', attachment.getName());
  var fileId = fileInfo.fileId;
  var fileName = fileInfo.fileName;
  var fileUrl = fileInfo.fileUrl;

  // Add contract row
  var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
  contractsSheet.appendRow([
    contractId,
    title,
    supplier,
    '',                         // description
    STATUS.DRAFT,
    1,                          // current_version
    folderId,
    senderUsername,
    now,                        // created_at
    now,                        // updated_at
    0                           // reject_count
  ]);

  // Add version row
  var versionsSheet = getSheet_(SHEET_NAMES.VERSIONS);
  versionsSheet.appendRow([
    contractId,
    1,                          // version_no
    fileId,
    fileName,
    fileUrl,
    senderUsername,
    now,                        // uploaded_at
    'UPLOAD',                   // action
    'Tạo từ email',            // change_summary
    ''                          // nego_notes
  ]);

  // Log activity
  var activitySheet = getSheet_(SHEET_NAMES.ACTIVITY_LOG);
  activitySheet.appendRow([
    now,
    contractId,
    'CREATE_FROM_EMAIL',
    senderUsername,
    'Tạo hợp đồng "' + title + '" với nhà cung cấp "' + supplier + '" từ email.'
  ]);

  // Clear cache do đã thêm hợp đồng mới từ email
  clearChunkedCache_('all_active_contracts');

  return {
    contractId: contractId,
    folderId: folderId
  };
}

/**
 * Di cư dữ liệu từ sheet 'summaries' cũ sang sheet 'ai_analyses' mới.
 * Thực hiện an toàn: kiểm tra tồn tại, đọc dữ liệu, map sang định dạng mới,
 * ghi dữ liệu mới rồi mới xóa sheet cũ.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - Spreadsheet đối tượng.
 * @param {string} headerBgColor - Màu nền của tiêu đề sheet mới.
 */
function migrateSummariesToAIAnalyses_(ss, headerBgColor) {
  var oldSheet = ss.getSheetByName('summaries');
  if (!oldSheet) {
    return; // Sheet cũ không tồn tại, bỏ qua
  }

  var lastRow = oldSheet.getLastRow();
  if (lastRow <= 1) {
    // Sheet cũ trống rỗng hoặc chỉ có tiêu đề, xóa luôn
    try {
      ss.deleteSheet(oldSheet);
      Logger.log('Xóa sheet summaries trống rỗng.');
    } catch (e) {
      Logger.log('Lỗi khi xóa sheet summaries trống: ' + e.message);
    }
    return;
  }

  // Đọc toàn bộ dữ liệu summaries cũ
  var oldData = oldSheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var newData = [];

  for (var i = 0; i < oldData.length; i++) {
    var row = oldData[i];
    var contractId = row[0];
    var versionNo = row[1];
    var summaryJson = row[2];
    var summarizedBy = row[3];
    var summarizedAt = row[4];

    if (contractId) {
      newData.push([
        contractId,
        versionNo,
        AI_TYPES.SUMMARY, // analysis_type = 'SUMMARY'
        summaryJson,
        summarizedBy,
        summarizedAt
      ]);
    }
  }

  // Tạo hoặc lấy sheet mới
  var newSheet = ss.getSheetByName(SHEET_NAMES.AI_ANALYSES);
  if (!newSheet) {
    newSheet = ss.insertSheet(SHEET_NAMES.AI_ANALYSES);
    var headers = [
      'contract_id', 'version_no', 'analysis_type', 'result_json', 'analyzed_by', 'analyzed_at'
    ];
    newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    newSheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground(headerBgColor || '#4a86c8')
      .setFontColor('#ffffff');
    newSheet.setFrozenRows(1);
  }

  // Ghi dữ liệu đã migrate vào sheet mới
  if (newData.length > 0) {
    newSheet.getRange(newSheet.getLastRow() + 1, 1, newData.length, 6).setValues(newData);
    Logger.log('Đã migrate ' + newData.length + ' dòng dữ liệu sang sheet ' + SHEET_NAMES.AI_ANALYSES);
  }

  // Xóa sheet cũ sau khi migrate thành công
  try {
    ss.deleteSheet(oldSheet);
    Logger.log('Đã xóa sheet summaries cũ thành công.');
  } catch (e) {
    Logger.log('Lỗi khi xóa sheet summaries cũ: ' + e.message);
  }
}
