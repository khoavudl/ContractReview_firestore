/**
 * CommentService.gs
 * Handles adding and retrieving comments on contracts.
 * Comment types are automatically determined by the user's role.
 *
 * Dependencies: Utils.gs, Auth.gs, Config.gs, ActivityLog.gs
 */

/**
 * Adds a comment to a contract version.
 * Comment type is automatically determined by the user's role:
 * - USER → 'USER_RESPONSE'
 * - LEGAL → 'LEGAL_COMMENT'
 * - HOL → 'HOL_COMMENT'
 *
 * @param {string} contractId - The contract identifier.
 * @param {number} versionNo - The version number being commented on.
 * @param {string} clauseRef - Reference to specific clause (optional).
 * @param {string} text - The comment text.
 * @param {string} token - Session token for authentication.
 * @return {object} JSON response with the created comment data.
 */
function addComment(contractId, versionNo, clauseRef, text, token) {
  var session = validateSession_(token);
  if (!session.valid) {
    return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  }

  var user = session;
  if (!user) {
    return jsonResponse_(false, null, 'Không tìm thấy thông tin người dùng.');
  }

  // Kiểm tra quyền truy cập hợp đồng (chặn BOLA/IDOR)
  var access = assertContractAccess_(contractId, user);
  if (!access.allowed) {
    return jsonResponse_(false, null, access.message);
  }

  if (!text || text.trim() === '') {
    return jsonResponse_(false, null, 'Nội dung bình luận không được để trống.');
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    // Determine comment type based on role
    var typeMap = {};
    typeMap[ROLES.USER] = 'USER_RESPONSE';
    typeMap[ROLES.LEGAL] = 'LEGAL_COMMENT';
    typeMap[ROLES.HOL] = 'HOL_COMMENT';
    var commentType = typeMap[user.role] || 'USER_RESPONSE';

    var commentId = generateUUID_();
    var commentAt = formatDateTime_(new Date());

    var sheet = getSheet_(SHEET_NAMES.COMMENTS);
    sheet.appendRow([
      commentId,            // comment_id (A)
      contractId,           // contract_id (B)
      versionNo || '',      // version_no (C)
      clauseRef || '',      // clause_ref (D)
      user.username,        // comment_by (E)
      commentAt,            // comment_at (F)
      text.trim(),          // comment_text (G)
      commentType           // type (H)
    ]);

    logActivity_(contractId, 'COMMENT_ADDED', user.username,
      'Thêm bình luận [' + commentType + '] cho phiên bản ' + (versionNo || 'N/A'));

    // Cập nhật ngày thay đổi cuối cùng (updated_at) của hợp đồng và xóa cache
    try {
      var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
      var contractRowIndex = getRowByColumn_(contractsSheet, 1, contractId);
      if (contractRowIndex !== -1) {
        contractsSheet.getRange(contractRowIndex, 10).setValue(commentAt); // Column J = updated_at
      }
      clearChunkedCache_('all_active_contracts');
      invalidateBackendDetailCache_(contractId);
    } catch (updateErr) {

      Logger.log('Lỗi cập nhật updated_at của hợp đồng sau khi bình luận: ' + updateErr.message);
    }

    // Đảm bảo dữ liệu ghi thành công xuống Sheet trước khi dọn cache và nhả lock
    SpreadsheetApp.flush();

    var comment = {
      commentId: commentId,
      contractId: contractId,
      versionNo: versionNo || '',
      clauseRef: clauseRef || '',
      commentBy: user.username,
      commentAt: commentAt,
      commentText: text.trim(),
      type: commentType
    };

    return jsonResponse_(true, {
      comment: comment,
      contractId: contractId,
      updatedAt: commentAt
    }, 'Đã thêm bình luận thành công.');
  } catch (e) {
    Logger.log('Error adding comment: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi thêm bình luận: ' + e.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Retrieves all comments for a contract, sorted by comment date descending.
 * @param {string} contractId - The contract identifier.
 * @param {string} token - Session token for authentication.
 * @return {object} JSON response with comments array.
 */
function getComments(contractId, token) {
  try {
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    var user = session;
    if (!user) {
      return jsonResponse_(false, null, 'Không tìm thấy thông tin người dùng.');
    }

    // Kiểm tra quyền truy cập hợp đồng (chặn BOLA/IDOR)
    var access = assertContractAccess_(contractId, user);
    if (!access.allowed) {
      return jsonResponse_(false, null, access.message);
    }

    var sheet = getSheet_(SHEET_NAMES.COMMENTS);
    var data = sheet.getDataRange().getValues();
    var headers = data.shift(); // Remove header row

    var comments = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i][1] === contractId) { // Column B = contract_id
        comments.push({
          commentId: data[i][0],
          contractId: data[i][1],
          versionNo: data[i][2],
          clauseRef: data[i][3],
          commentBy: data[i][4],
          commentAt: data[i][5],
          commentText: data[i][6],
          type: data[i][7]
        });
      }
    }

    // Sort by comment_at descending (newest first)
    comments.sort(function (a, b) {
      return new Date(b.commentAt) - new Date(a.commentAt);
    });

    return jsonResponse_(true, comments);
  } catch (e) {
    Logger.log('Error getting comments: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi lấy bình luận: ' + e.message);
  }
}
