/**
 * ActivityLog.gs
 * Service for logging and retrieving contract activity history.
 * 
 * Dependencies: Utils.gs (getSheet_, jsonResponse_, formatDateTime_), Auth.gs (validateSession_)
 */

/**
 * Appends a new activity record to the activity_log sheet.
 * @param {string} contractId - The contract identifier.
 * @param {string} action - The action performed (e.g., 'CREATE', 'STATUS_CHANGE').
 * @param {string} username - The user who performed the action.
 * @param {string} details - Additional details about the action.
 * @private
 */
function logActivity_(contractId, action, username, details) {
  try {
    var sheet = getSheet_(SHEET_NAMES.ACTIVITY_LOG);
    sheet.appendRow([
      formatDateTime_(new Date()),  // timestamp (A)
      contractId,                    // contract_id (B)
      action,                        // action (C)
      username,                      // performed_by (D)
      details || ''                  // details (E)
    ]);
  } catch (e) {
    Logger.log('Error logging activity: ' + e.message);
    // Don't throw - logging should not break the main operation
  }
}

/**
 * Retrieves all activity logs for a given contract, sorted by timestamp descending.
 * @param {string} contractId - The contract identifier.
 * @param {string} token - Session token for authentication.
 * @return {object} JSON response with activity array.
 */
function getActivityLog(contractId, token, isArchived) {
  try {
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    if (isArchived === undefined) {
      isArchived = false;
      try {
        var mainContracts = getSheet_(SHEET_NAMES.CONTRACTS);
        if (getRowByColumn_(mainContracts, 1, contractId) === -1) {
          isArchived = true;
        }
      } catch (e) {
        Logger.log('Error auto-detecting archive status in getActivityLog: ' + e.message);
      }
    }

    var sheet = isArchived ? getArchiveSheet_(SHEET_NAMES.ACTIVITY_LOG) : getSheet_(SHEET_NAMES.ACTIVITY_LOG);
    var data = sheet.getDataRange().getValues();
    var headers = data.shift(); // Remove header row

    var activities = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i][1] === contractId) { // Column B = contract_id
        activities.push({
          timestamp: formatIfDate_(data[i][0]),
          contractId: data[i][1],
          action: data[i][2],
          performedBy: data[i][3],
          details: data[i][4]
        });
      }
    }

    // Sort by timestamp descending (newest first)
    activities.sort(function(a, b) {
      return parseDateTimeString_(b.timestamp) - parseDateTimeString_(a.timestamp);
    });

    return jsonResponse_(true, activities);
  } catch (e) {
    Logger.log('Error getting activity log: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi lấy lịch sử hoạt động: ' + e.message);
  }
}
