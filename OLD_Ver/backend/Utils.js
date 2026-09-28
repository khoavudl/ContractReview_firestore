/**
 * Utils.gs - Shared helper functions for the Contract Review Workflow.
 * All functions are private (trailing underscore) unless otherwise noted.
 */

var _cachedSpreadsheet = null;
/**
 * Gets the main configured spreadsheet.
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet} The main spreadsheet object.
 */
function getSpreadsheet_() {
  if (!_cachedSpreadsheet) {
    var config = getConfig_();
    _cachedSpreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
  }
  return _cachedSpreadsheet;
}

/**
 * Gets a sheet by name from the configured spreadsheet.
 * @param {string} name - The sheet name (use SHEET_NAMES constants).
 * @return {GoogleAppsScript.Spreadsheet.Sheet} The sheet object.
 */
function getSheet_(name) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Sheet "' + name + '" không tồn tại.');
  }
  return sheet;
}


/**
 * Generates a contract ID in format CTR-YYMM-XXXX.
 * Auto-increments by checking existing IDs for the current month.
 * @return {string} The generated contract ID.
 */
function generateContractId_() {
  var now = new Date();
  var yy = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'yy');
  var mm = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'MM');
  var period = yy + mm; // e.g. '2605'
  var prefix = 'CTR-' + period + '-';
  var propKey = 'LAST_SEQ_' + period;

  var lock = LockService.getScriptLock();
  try {
    // Chờ tối đa 10 giây để lấy lock tránh trùng lặp khi chạy đồng thời
    lock.waitLock(10000);
  } catch (e) {
    throw new Error('Không thể tạo ID hợp đồng do hệ thống bận (Lock timeout).');
  }

  try {
    var props = PropertiesService.getScriptProperties();
    var lastSeqStr = props.getProperty(propKey);
    var maxSeq = 0;

    if (lastSeqStr !== null) {
      maxSeq = parseInt(lastSeqStr, 10);
    } else {
      // Fallback: chỉ quét sheet chính (active) để tìm seq lớn nhất của tháng hiện tại
      var sheet = getSheet_(SHEET_NAMES.CONTRACTS);
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < ids.length; i++) {
          var id = ids[i][0];
          if (typeof id === 'string' && id.indexOf(prefix) === 0) {
            var seq = parseInt(id.substring(prefix.length), 10);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }
        }
      }

      // Tự động dọn dẹp các key LAST_SEQ_ cũ của các tháng trước để tránh rác bộ nhớ
      try {
        var allProps = props.getProperties();
        var keysToDelete = [];
        for (var key in allProps) {
          if (key.indexOf('LAST_SEQ_') === 0 && key !== propKey) {
            keysToDelete.push(key);
          }
        }
        if (keysToDelete.length > 0) {
          props.deleteProperties(keysToDelete);
          Logger.log('Đã dọn dẹp các key ID cũ: ' + JSON.stringify(keysToDelete));
        }
      } catch (cleanErr) {
        Logger.log('generateContractId_ dọn dẹp key cũ lỗi: ' + cleanErr.message);
      }
    }

    var nextSeq = maxSeq + 1;
    props.setProperty(propKey, nextSeq.toString());

    var nextSeqStr = nextSeq.toString();
    while (nextSeqStr.length < 4) {
      nextSeqStr = '0' + nextSeqStr;
    }
    return prefix + nextSeqStr;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Generates a UUID using Apps Script built-in utility.
 * @return {string} A UUID string.
 */
function generateUUID_() {
  return Utilities.getUuid();
}

/**
 * Formats a Date object to dd/MM/yyyy HH:mm in Asia/Ho_Chi_Minh timezone.
 * @param {Date} date - The date to format.
 * @return {string} Formatted date string.
 */
function formatDateTime_(date) {
  if (!date || !(date instanceof Date)) {
    return '';
  }
  return Utilities.formatDate(date, 'Asia/Ho_Chi_Minh', 'yyyy/MM/dd HH:mm:ss');
}

/**
 * Creates a standardized JSON response object.
 * @param {boolean} success - Whether the operation succeeded.
 * @param {*} data - The response data (can be null).
 * @param {string} message - A human-readable message.
 * @return {Object} { success, data, message }
 */
function jsonResponse_(success, data, message) {
  return {
    success: success,
    data: data,
    message: message || ''
  };
}

/**
 * Finds a row where a specific column matches a value.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to search.
 * @param {number} colIndex - The column index (1-indexed).
 * @param {*} value - The value to match.
 * @return {number} The row number (1-indexed) or -1 if not found.
 */
function getRowByColumn_(sheet, colIndex, value) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }
  var data = sheet.getRange(1, colIndex, lastRow, 1).getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === value || String(data[i][0]) === String(value)) {
      return i + 1;
    }
  }
  return -1;
}

/**
 * Converts sheet data to an array of objects using the header row as keys.
 * Handles empty sheets gracefully.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to convert.
 * @return {Array<Object>} Array of row objects.
 */
function sheetToObjects_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < 1 || lastCol < 1) {
    return [];
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  if (lastRow < 2) {
    return [];
  }

  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var results = [];

  for (var i = 0; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    results.push(obj);
  }

  return results;
}

/**
 * Converts a 2D array of raw values (row 0 = headers) into an array of objects.
 * Operates in-memory without making additional Sheets API calls.
 *
 * @param {Array<Array<any>>} data - 2D data array from getDataRange().getValues()
 * @return {Array<Object>} Array of row objects.
 */
function sheetToObjectsFromData_(data) {
  if (!data || data.length < 2) return [];
  var headers = data[0];
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    results.push(obj);
  }
  return results;
}


var _cachedArchiveSpreadsheet = null;
/**
 * Gets the archive spreadsheet. Creates it if it doesn't exist.
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet} The archive spreadsheet.
 */
function getArchiveSpreadsheet_() {
  if (!_cachedArchiveSpreadsheet) {
    var config = getConfig_();
    var archiveId = config.archiveSpreadsheetId;
    if (archiveId) {
      try {
        _cachedArchiveSpreadsheet = SpreadsheetApp.openById(archiveId);
      } catch (err) {
        Logger.log('Không thể mở Spreadsheet Archive bằng ID cấu hình: ' + err.message);
      }
    }
    
    if (!_cachedArchiveSpreadsheet) {
      // Tự động khởi tạo file Archive mới
      _cachedArchiveSpreadsheet = setupArchiveSpreadsheet();
    }
  }
  return _cachedArchiveSpreadsheet;
}

/**
 * Gets a sheet by name from the archive spreadsheet.
 * @param {string} name - The sheet name (use SHEET_NAMES constants).
 * @return {GoogleAppsScript.Spreadsheet.Sheet} The sheet object.
 */
function getArchiveSheet_(name) {
  var ss = getArchiveSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    var sheetDefs = {
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
    var headers = sheetDefs[name];
    if (headers) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#666666')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      Logger.log('Dynamically created missing archive sheet: ' + name);
    } else {
      throw new Error('Sheet "' + name + '" không tồn tại trong file Archive và không có định nghĩa cấu trúc.');
    }
  }
  return sheet;
}

/**
 * Creates the archive spreadsheet file with the proper structure.
 * Stores its ID in Script Properties.
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet} The created/configured spreadsheet.
 */
function setupArchiveSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var config = getConfig_();
  var ss = null;
  
  // 1. Tạo file Spreadsheet mới trên Drive
  try {
    var folder = null;
    if (config.rootFolderId) {
      try {
        folder = DriveApp.getFolderById(config.rootFolderId);
      } catch (e) {
        Logger.log('Không tìm thấy thư mục root folder ID: ' + e.message);
      }
    }
    
    if (!folder) {
      var folders = DriveApp.getRootFolder().getFoldersByName('ContractReview');
      if (folders.hasNext()) {
        folder = folders.next();
      }
    }
    
    // Tạo file Spreadsheet mới
    var ssNew = SpreadsheetApp.create('Contract_Archive_DB');
    var file = DriveApp.getFileById(ssNew.getId());
    
    if (folder) {
      // Dời file vào thư mục ContractReview
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }
    
    ss = ssNew;
    props.setProperty('ARCHIVE_SPREADSHEET_ID', ss.getId());
    Logger.log('Đã tạo file Archive Spreadsheet mới với ID: ' + ss.getId());
  } catch (err) {
    Logger.log('Lỗi khi tự động tạo file Archive: ' + err.message);
    throw new Error('Không thể khởi tạo cơ sở dữ liệu Archive: ' + err.message);
  }
  
  // 2. Định nghĩa cấu trúc bảng cho file Archive (giống file chính nhưng không có users)
  var sheetDefs = {
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
  
  // 3. Khởi tạo các sheet và header
  for (var sheetName in sheetDefs) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    // Set headers
    var headers = sheetDefs[sheetName];
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#666666') // Màu xám đậm để phân biệt với sheet chính (màu xanh #4a86c8)
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    Logger.log('Created archive sheet: ' + sheetName);
  }
  
  // Xóa Sheet1 mặc định nếu có
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {
      // Bỏ qua nếu là sheet duy nhất
    }
  }
  
  // Reset cached config và gán cache archive ss
  _cachedConfig = null;
  _cachedArchiveSpreadsheet = ss;
  
  Logger.log('Khởi tạo database Archive hoàn tất.');
  return ss;
}

/**
 * Puts a value in script cache, chunking it if it exceeds 100KB.
 * @param {string} key - The base cache key.
 * @param {string} valueStr - The string value to cache.
 * @param {number} expirationInSeconds - Expiration time (max 21600 seconds / 6 hours).
 */
function putChunkedCache_(key, valueStr, expirationInSeconds) {
  var cache = CacheService.getScriptCache();
  var chunkSize = 90 * 1024; // 90KB chunk size to be safe (limit is 100KB)
  
  // Clear any existing chunks first
  clearChunkedCache_(key);
  
  if (valueStr.length <= chunkSize) {
    cache.put(key, valueStr, expirationInSeconds);
  } else {
    var chunksCount = Math.ceil(valueStr.length / chunkSize);
    cache.put(key + '_chunks_count', String(chunksCount), expirationInSeconds);
    for (var i = 0; i < chunksCount; i++) {
      var chunk = valueStr.substring(i * chunkSize, (i + 1) * chunkSize);
      cache.put(key + '_chunk_' + i, chunk, expirationInSeconds);
    }
  }
}

/**
 * Gets a chunked value from script cache.
 * @param {string} key - The base cache key.
 * @return {string|null} The assembled cached string, or null if not found.
 */
function getChunkedCache_(key) {
  var cache = CacheService.getScriptCache();
  var valueStr = cache.get(key);
  if (valueStr) {
    return valueStr;
  }
  
  var chunksCountStr = cache.get(key + '_chunks_count');
  if (!chunksCountStr) {
    return null;
  }
  
  var chunksCount = parseInt(chunksCountStr, 10);
  var keysToGet = [];
  for (var i = 0; i < chunksCount; i++) {
    keysToGet.push(key + '_chunk_' + i);
  }
  
  var chunkDict = cache.getAll(keysToGet);
  var assembled = '';
  
  for (var j = 0; j < chunksCount; j++) {
    var chunk = chunkDict[key + '_chunk_' + j];
    if (!chunk) {
      return null; // If any chunk is missing, cache is invalid
    }
    assembled += chunk;
  }
  return assembled;
}

/**
 * Clears chunked cache.
 * @param {string} key - The base cache key.
 */
function clearChunkedCache_(key) {
  var cache = CacheService.getScriptCache();
  cache.remove(key);
  var chunksCountStr = cache.get(key + '_chunks_count');
  if (chunksCountStr) {
    var chunksCount = parseInt(chunksCountStr, 10);
    cache.remove(key + '_chunks_count');
    for (var i = 0; i < chunksCount; i++) {
      cache.remove(key + '_chunk_' + i);
    }
  }
}

/**
 * Kiểm tra quyền truy cập hợp đồng dựa trên vai trò người dùng.
 * - USER: chỉ được truy cập hợp đồng do chính mình tạo (created_by === username).
 * - LEGAL / HOL: được truy cập tất cả hợp đồng.
 *
 * Lưu ý: Hàm này chỉ tra cứu database ACTIVE (không tra Archive).
 * Đối với dữ liệu Archive (hợp đồng đã duyệt), truy cập đã được kiểm soát
 * thông qua getContractDetail nên không cần kiểm tra thêm ở đây.
 *
 * @param {string} contractId - Mã hợp đồng cần kiểm tra.
 * @param {Object} user - Đối tượng user từ session {username, role, ...}.
 * @return {Object} { allowed: boolean, contract: Object|null, message: string }
 */
function assertContractAccess_(contractId, user) {
  var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
  var contractRowIndex = getRowByColumn_(contractsSheet, 1, contractId);

  if (contractRowIndex === -1) {
    return { allowed: false, contract: null, message: 'Không tìm thấy hợp đồng: ' + contractId };
  }

  var contractValues = contractsSheet.getRange(contractRowIndex, 1, 1, contractsSheet.getLastColumn()).getValues()[0];
  var createdBy = contractValues[7]; // Column H = created_by

  if (user.role === ROLES.USER && createdBy !== user.username) {
    return { allowed: false, contract: null, message: 'Bạn không có quyền thao tác trên hợp đồng này.' };
  }

  return {
    allowed: true,
    contract: {
      contractId: contractValues[0],
      title: contractValues[1],
      supplier: contractValues[2],
      status: contractValues[4],
      createdBy: createdBy
    },
    message: 'OK'
  };
}

/**
 * Kiểm tra xem giá trị có phải đối tượng Date không, nếu có thì format thành chuỗi ký tự.
 * Giúp tránh lỗi serialization khi truyền dữ liệu qua google.script.run.
 * @param {*} val - Giá trị cần kiểm tra.
 * @return {*} Chuỗi ký tự định dạng ngày tháng hoặc giá trị ban đầu.
 */
function formatIfDate_(val) {
  if (val && val instanceof Date) {
    return formatDateTime_(val);
  }
  return val;
}

/**
 * Removes all rows from a sheet where a specific column matches a value.
 * Uses batch read-filter-rewrite instead of individual deleteRow() calls.
 * This reduces O(N) Sheets API calls to O(1) — critical for performance.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to modify.
 * @param {number} keyColIndex - 0-based column index for matching.
 * @param {*} matchValue - The value to match for deletion.
 * @return {Array<Array>} The removed rows (useful for archiving).
 */
function batchRemoveRows_(sheet, keyColIndex, matchValue) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return []; // Only header or empty

  var lastCol = sheet.getLastColumn();
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var keepRows = [];
  var removedRows = [];

  for (var i = 0; i < data.length; i++) {
    if (String(data[i][keyColIndex]) === String(matchValue)) {
      removedRows.push(data[i]);
    } else {
      keepRows.push(data[i]);
    }
  }

  if (removedRows.length === 0) return []; // Nothing to remove

  // Clear all data rows (keep header row 1 intact)
  sheet.deleteRows(2, lastRow - 1);

  // Write back the kept rows
  if (keepRows.length > 0) {
    sheet.getRange(2, 1, keepRows.length, lastCol).setValues(keepRows);
  }

  return removedRows;
}
