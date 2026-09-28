/**
 * VersionService.gs
 * Handles contract version management including file uploads for revisions.
 *
 * Dependencies: Utils.gs, Auth.gs, Config.gs, DriveService.gs, ActivityLog.gs
 */

/**
 * Uploads a new version of a contract document.
 * Permission rules:
 * - USER can upload when status is DRAFT or USER_REVISING (own contracts only)
 * - LEGAL can upload when status is PENDING_LEGAL (for legal markup)
 *
 * @param {string} contractId - The contract identifier.
 * @param {string} fileData - Base64 encoded file content.
 * @param {string} fileName - Original file name.
 * @param {string} changeSummary - Summary of changes in this version.
 * @param {string} negoNotes - Negotiation notes (optional).
 * @param {string} token - Session token.
 * @return {object} JSON response with version data.
 */
function uploadNewVersion(contractId, fileData, fileName, changeSummary, negoNotes, token) {
  try {
    var session = validateSession_(token);
  if (!session.valid) {
    return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  }

  var user = session;
  if (!user) {
    return jsonResponse_(false, null, 'Không tìm thấy thông tin người dùng.');
  }

  if (!fileData || !fileName) {
    return jsonResponse_(false, null, 'Vui lòng đính kèm tệp hợp đồng.');
  }

  if (fileData.length > 14680064) {
    return jsonResponse_(false, null, 'Dung lượng file quá lớn. Vui lòng đính kèm file nhỏ hơn 10MB.');
  }

    // Find contract and its row number
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    var data = contractsSheet.getDataRange().getValues();
    var contractRowIndex = -1;
    var contractRow = null;

    for (var i = 1; i < data.length; i++) { // Skip header
      if (data[i][0] === contractId) {
        contractRowIndex = i + 1; // Sheet rows are 1-indexed
        contractRow = data[i];
        break;
      }
    }

    if (!contractRow) {
      return jsonResponse_(false, null, 'Không tìm thấy hợp đồng: ' + contractId);
    }

    var currentStatus = contractRow[4]; // Column E = status
    var currentVersion = contractRow[5]; // Column F = current_version
    var folderId = contractRow[6];       // Column G = folder_id
    var createdBy = contractRow[7];      // Column H = created_by

    // Permission and status validation
    var action = '';

    if (user.role === ROLES.USER) {
      if (createdBy !== user.username) {
        return jsonResponse_(false, null, 'Bạn không có quyền tải lên phiên bản mới cho hợp đồng này.');
      }
      if (currentStatus === STATUS.DRAFT || currentStatus === STATUS.USER_REVISING) {
        action = (currentStatus === STATUS.DRAFT) ? 'INITIAL_UPLOAD' : 'USER_REVISION';
      } else {
        return jsonResponse_(false, null, 'Không thể tải lên phiên bản mới khi hợp đồng đang ở trạng thái: ' + (STATUS_LABELS[currentStatus] || currentStatus));
      }
    } else if (user.role === ROLES.LEGAL) {
      if (currentStatus === STATUS.PENDING_LEGAL || currentStatus === STATUS.LEGAL_COMMENTED) {
        action = 'LEGAL_MARKUP';
      } else {
        return jsonResponse_(false, null, 'Bộ phận pháp lý chỉ có thể tải lên khi hợp đồng đang ở trạng thái Legal Review.');
      }
    } else if (user.role === ROLES.HOL) {
      if (currentStatus === STATUS.LEGAL_APPROVED || currentStatus === STATUS.PENDING_HOL || currentStatus === STATUS.HOL_COMMENTED) {
        action = 'HOL_MARKUP';
      } else {
        return jsonResponse_(false, null, 'Trưởng phòng Pháp chế chỉ có thể tải lên khi hợp đồng đang ở trạng thái Head Review.');
      }
    } else {
      return jsonResponse_(false, null, 'Vai trò của bạn không có quyền tải lên phiên bản mới.');
    }

    // Increment version number
    var newVersionNo = (parseInt(currentVersion, 10) || 0) + 1;
    var now = formatDateTime_(new Date());

    // Upload file and convert to Google Doc OUTSIDE the lock
    var fileInfo = uploadAndConvertToGoogleDoc_(folderId, fileData, contractId + '_v' + newVersionNo, fileName);

    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);
      
      // Re-fetch sheet inside lock to ensure we append safely
      var lockContractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
      var lockData = lockContractsSheet.getDataRange().getValues();
      var safeRowIndex = -1;
      for (var l = 1; l < lockData.length; l++) {
        if (lockData[l][0] === contractId) {
          safeRowIndex = l + 1;
          break;
        }
      }
      
      if (safeRowIndex === -1) {
        throw new Error('Hợp đồng không tồn tại trong DB.');
      }

    // Add version row
    var versionsSheet = getSheet_(SHEET_NAMES.VERSIONS);
    versionsSheet.appendRow([
      contractId,               // contract_id (A)
      newVersionNo,             // version_no (B)
      fileInfo.fileId,          // file_id (C)
      fileInfo.fileName,        // file_name (D)
      fileInfo.fileUrl,         // file_url (E)
      user.username,            // uploaded_by (F)
      now,                      // uploaded_at (G)
      action,                   // action (H)
      changeSummary || '',      // change_summary (I)
      negoNotes || ''           // nego_notes (J)
    ]);

    // Update contracts sheet: current_version and updated_at
    lockContractsSheet.getRange(safeRowIndex, 6).setValue(newVersionNo); // Column F
    lockContractsSheet.getRange(safeRowIndex, 10).setValue(now);          // Column J

    // Log activity
    logActivity_(contractId, 'VERSION_UPLOADED', user.username,
      'Tải lên phiên bản ' + newVersionNo + ' (' + action + '): ' + fileName);

    var autoComment = null;

    // Auto-create a comment on the Exchange tab with Change Summary & Negotiation Notes
    try {
      var commentId = generateUUID_();
      var commentType = (user.role === ROLES.USER) ? 'USER_RESPONSE' :
        (user.role === ROLES.LEGAL) ? 'LEGAL_COMMENT' :
          (user.role === ROLES.HOL) ? 'HOL_COMMENT' : 'USER_RESPONSE';

      var commentText = '**Tải lên phiên bản v' + newVersionNo + '**\n' +
        '- **Tóm tắt thay đổi:** ' + (changeSummary || 'Không có') + '\n' +
        '- **Ghi chú đàm phán:** ' + (negoNotes || 'Không có');

      var commentsSheet = getSheet_(SHEET_NAMES.COMMENTS);
      commentsSheet.appendRow([
        commentId,            // comment_id (A)
        contractId,           // contract_id (B)
        newVersionNo,         // version_no (C)
        '',                   // clause_ref (D)
        user.username,        // comment_by (E)
        now,                  // comment_at (F)
        commentText.trim(),   // comment_text (G)
        commentType           // type (H)
      ]);

      autoComment = {
        commentId: commentId,
        contractId: contractId,
        versionNo: newVersionNo,
        clauseRef: '',
        commentBy: user.username,
        commentAt: now,
        commentText: commentText.trim(),
        type: commentType
      };

      logActivity_(contractId, 'COMMENT_ADDED', user.username,
        'Tự động thêm bình luận cập nhật phiên bản ' + newVersionNo);
    } catch (commentErr) {
      Logger.log('Lỗi tự động thêm bình luận khi upload phiên bản: ' + commentErr.message);
    }

    var versionData = {
      contractId: contractId,
      versionNo: newVersionNo,
      fileId: fileInfo.fileId,
      fileName: fileInfo.fileName,
      fileUrl: fileInfo.fileUrl,
      uploadedBy: user.username,
      uploadedAt: now,
      action: action,
      changeSummary: changeSummary || '',
      negoNotes: negoNotes || ''
    };

    // Đảm bảo dữ liệu được commit thành công xuống Sheets vật lý trước khi giải phóng khóa và xóa cache
    SpreadsheetApp.flush();

    // Xóa cache danh sách hợp đồng do phiên bản và updated_at đã thay đổi
    invalidateBackendDetailCache_(contractId);
    clearChunkedCache_('all_active_contracts');

    return jsonResponse_(true, {
      version: versionData,
      newComment: autoComment,
      currentVersion: newVersionNo,
      contractId: contractId,
      updatedAt: now
    }, 'Tải lên phiên bản ' + newVersionNo + ' thành công.');
  } finally {
    lock.releaseLock();
  }
} catch (e) {
  Logger.log('Error uploading new version: ' + e.message);
  return jsonResponse_(false, null, 'Lỗi khi tải lên phiên bản mới: ' + e.message);
}
}
