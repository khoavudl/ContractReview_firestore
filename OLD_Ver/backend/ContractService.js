/**
 * ContractService.gs
 * Core service for contract CRUD operations, status management, and statistics.
 *
 * Dependencies: Utils.gs, Auth.gs, Config.gs, DriveService.gs,
 *               ActivityLog.gs, NotificationService.gs
 */

/**
 * Creates a new contract with initial file upload.
 * @param {string} title - Contract title.
 * @param {string} supplier - Supplier/vendor name.
 * @param {string} description - Contract description.
 * @param {string} fileData - Base64 encoded file content.
 * @param {string} fileName - Original file name.
 * @param {string} token - Session token.
 * @param {Array<Object>} [referenceFilesData] - Array of {fileData, fileName} objects.
 * @return {object} JSON response with created contract data.
 */
function createContract(title, supplier, description, fileData, fileName, token, referenceFilesData) {
  try {
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    var user = session;
    if (!user) {
      return jsonResponse_(false, null, 'Không tìm thấy thông tin người dùng.');
    }

    // Chỉ người dùng có role USER mới được phép tạo hợp đồng
    if (user.role !== ROLES.USER) {
      return jsonResponse_(false, null, 'Chỉ người dùng có vai trò USER mới được phép tạo hợp đồng mới.');
    }

    // Validate required fields
    if (!title || !title.toString().trim() || 
        !supplier || !supplier.toString().trim() || 
        !description || !description.toString().trim() || 
        !fileData || !fileName) {
      return jsonResponse_(false, null, 'Vui lòng điền đầy đủ thông tin (Tên hợp đồng, Nhà cung cấp, Mô tả) và đính kèm tệp hợp đồng.');
    }

    // Truncate text to avoid Google Sheets cell limit (50000 chars)
    title = title.toString().trim().substring(0, 255);
    supplier = supplier.toString().trim().substring(0, 255);
    description = description.toString().trim().substring(0, 5000);

    if (fileData.length > 14680064) {
      return jsonResponse_(false, null, 'Dung lượng file quá lớn. Vui lòng đính kèm file nhỏ hơn 10MB.');
    }

    // Generate contract ID (Hàm này tự giữ lock riêng của nó)
    var contractId = generateContractId_();
    var now = formatDateTime_(new Date());

    var folderId = null;
    try {
      // Create Drive folder
      folderId = createContractFolder_(contractId, supplier);

      // Upload file and convert to Google Doc (version 1)
      var fileInfo = uploadAndConvertToGoogleDoc_(folderId, fileData, contractId + '_origin', fileName);

      // Acquire lock cho các thao tác ghi dữ liệu Sheet (Rất nhanh)
      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(15000);

        // Add contract row
        var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
        contractsSheet.appendRow([
          contractId,           // contract_id (A)
          title,                // title (B)
          supplier,             // supplier (C)
          description,          // description (D)
          STATUS.DRAFT,         // status (E)
          1,                    // current_version (F)
          folderId,             // folder_id (G)
          user.username,        // created_by (H)
          now,                  // created_at (I)
          now,                  // updated_at (J)
          0                     // reject_count (K)
        ]);

        // Add version row
        var versionsSheet = getSheet_(SHEET_NAMES.VERSIONS);
        versionsSheet.appendRow([
          contractId,           // contract_id (A)
          1,                    // version_no (B)
          fileInfo.fileId,      // file_id (C)
          fileInfo.fileName,    // file_name (D)
          fileInfo.fileUrl,     // file_url (E)
          user.username,        // uploaded_by (F)
          now,                  // uploaded_at (G)
          'INITIAL_UPLOAD',     // action (H)
          '',                   // change_summary (I)
          ''                    // nego_notes (J)
        ]);

        // Log activity
        logActivity_(contractId, 'CONTRACT_CREATED', user.username,
          'Tạo hợp đồng mới: ' + title + ' - NCC: ' + supplier);

        // Upload reference files if provided
        if (referenceFilesData && Array.isArray(referenceFilesData) && referenceFilesData.length > 0) {
          var maxRefFiles = Math.min(referenceFilesData.length, MAX_REF_FILES_ON_CREATE);
          var refFilesSheet = getSheet_(SHEET_NAMES.REFERENCE_FILES);
          for (var rf = 0; rf < maxRefFiles; rf++) {
            var refFile = referenceFilesData[rf];
            if (!refFile.fileData || !refFile.fileName) continue;
            try {
              var refFileInfo = uploadFileToDrive_(folderId, refFile.fileData, refFile.fileName);
              var refFileBytes = Utilities.base64Decode(refFile.fileData);
              var refFileSize = refFileBytes.length;
              var refMimeType = '';
              try {
                refMimeType = DriveApp.getFileById(refFileInfo.fileId).getMimeType();
              } catch(e) {}
              refFilesSheet.appendRow([
                contractId,
                refFileInfo.fileId,
                refFile.fileName,
                refFileInfo.fileUrl,
                refFileSize,
                refMimeType,
                user.username,
                now
              ]);
              logActivity_(contractId, 'REFERENCE_FILE_UPLOADED', user.username,
                'Upload tài liệu tham chiếu khi tạo hợp đồng: ' + refFile.fileName);
            } catch (refErr) {
              Logger.log('Error uploading reference file: ' + refFile.fileName + ' - ' + refErr.message);
            }
          }
        }

        var contractData = {
          contractId: contractId,
          title: title,
          supplier: supplier,
          description: description,
          status: STATUS.DRAFT,
          currentVersion: 1,
          folderId: folderId,
          createdBy: user.username,
          createdAt: now,
          updatedAt: now,
          rejectCount: 0,
          fileInfo: fileInfo
        };

        // Đảm bảo dữ liệu ghi thành công xuống Sheet trước khi dọn cache
        SpreadsheetApp.flush();

        // Xóa cache danh sách hợp đồng để tải mới ở lần sau
        clearChunkedCache_('all_active_contracts');

        return jsonResponse_(true, contractData, 'Tạo hợp đồng thành công.');
      } finally {
        lock.releaseLock();
      }
    } catch (innerErr) {
      // Dọn rác Drive nếu ghi DB lỗi
      if (folderId) {
        try { DriveApp.getFolderById(folderId).setTrashed(true); } catch (e) {}
      }
      throw innerErr;
    }
  } catch (e) {
    Logger.log('Error creating contract: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi tạo hợp đồng: ' + e.message);
  }
}

/**
 * Retrieves contracts list based on user role.
 * - USER: only their own contracts
 * - LEGAL/HOL: all contracts
 * @param {string} token - Session token.
 * @param {boolean} [forceRefresh] - Force refresh from Sheet, bypassing cache.
 * @return {object} JSON response with contracts array.
 */
function getContracts(token, forceRefresh) {
  try {
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    var user = session;
    if (!user) {
      return jsonResponse_(false, null, 'Không tìm thấy thông tin người dùng.');
    }

    // Tải từ Cache trước để tối ưu hóa hiệu suất (bỏ qua nếu forceRefresh)
    var cachedContractsStr = forceRefresh ? null : getChunkedCache_('all_active_contracts');
    var contracts = null;
    if (cachedContractsStr) {
      try {
        contracts = JSON.parse(cachedContractsStr);
      } catch (err) {
        Logger.log('Lỗi khi phân tích cache hợp đồng: ' + err.message);
      }
    }

    if (!contracts) {
      var sheet = getSheet_(SHEET_NAMES.CONTRACTS);
      var allContracts = sheetToObjects_(sheet);

      // Map to consistent property names
      contracts = allContracts.map(function (row) {
        return {
          contractId: row.contract_id,
          title: row.title,
          supplier: row.supplier,
          description: row.description,
          status: row.status,
          currentVersion: row.current_version,
          folderId: row.folder_id,
          createdBy: row.created_by,
          createdAt: formatIfDate_(row.created_at),
          updatedAt: formatIfDate_(row.updated_at),
          rejectCount: row.reject_count
        };
      });

      // Lưu vào Cache trong 15 phút (900 giây)
      try {
        putChunkedCache_('all_active_contracts', JSON.stringify(contracts), 900);
      } catch (cacheErr) {
        Logger.log('Lỗi ghi cache hợp đồng: ' + cacheErr.message);
      }
    }

    // Role-based filtering
    if (user.role === ROLES.USER) {
      contracts = contracts.filter(function (c) {
        return c.createdBy === user.username;
      });
    }
    // LEGAL and HOL see all contracts

    // Sort by updated_at descending (newest first)
    contracts.sort(function (a, b) {
      return parseDateTimeString_(b.updatedAt) - parseDateTimeString_(a.updatedAt);
    });

    return jsonResponse_(true, contracts);
  } catch (e) {
    Logger.log('Error getting contracts: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi lấy danh sách hợp đồng: ' + e.message);
  }
}

/**
 * Calculates contract statistics from an in-memory array of contract objects.
 * @param {Array<object>} contracts - List of contract objects.
 * @param {object} user - Authenticated user object.
 * @return {object} Stats object containing total, byStatus, pendingMyAction, etc.
 */
function calculateContractStatsFromObjects_(contracts, user) {
  var total = contracts.length;
  var byStatus = {};
  var pendingMyAction = 0;
  var pending = 0;
  var legalReview = 0;
  var headReview = 0;
  var approved = 0;

  for (var key in STATUS) {
    if (STATUS.hasOwnProperty(key)) {
      byStatus[STATUS[key]] = 0;
    }
  }

  for (var i = 0; i < contracts.length; i++) {
    var c = contracts[i];
    var status = c.status;
    var createdBy = c.createdBy;

    if (byStatus.hasOwnProperty(status)) {
      byStatus[status]++;
    } else {
      byStatus[status] = 1;
    }

    if (user.role === ROLES.USER) {
      if (createdBy === user.username &&
        (status === STATUS.DRAFT || status === STATUS.USER_REVISING || status === STATUS.HOL_APPROVED)) {
        pendingMyAction++;
      }
    } else if (user.role === ROLES.LEGAL) {
      if (status === STATUS.PENDING_LEGAL) {
        pendingMyAction++;
      }
    } else if (user.role === ROLES.HOL) {
      if (status === STATUS.PENDING_HOL) {
        pendingMyAction++;
      }
    }

    if (status === STATUS.DRAFT || status === STATUS.USER_REVISING) {
      pending++;
    } else if (status === STATUS.PENDING_LEGAL || status === STATUS.LEGAL_COMMENTED || status === STATUS.LEGAL_APPROVED) {
      legalReview++;
    } else if (status === STATUS.PENDING_HOL || status === STATUS.HOL_COMMENTED) {
      headReview++;
    } else if (status === STATUS.HOL_APPROVED || status === STATUS.COMPLETED) {
      approved++;
    }
  }

  return {
    total: total,
    byStatus: byStatus,
    pendingMyAction: pendingMyAction,
    pending: pending,
    legalReview: legalReview,
    headReview: headReview,
    approved: approved
  };
}

/**
 * Consolidated endpoint for Dashboard initialization (Contracts + Stats).
 * @param {string} token - Session token.
 * @param {boolean} [forceRefresh] - Force refresh from Sheet, bypassing cache.
 * @return {object} JSON response with contracts array, stats object, and dataVersion.
 */
function getDashboardInit(token, forceRefresh) {
  try {
    var contractsRes = getContracts(token, forceRefresh);
    if (!contractsRes.success) {
      return contractsRes;
    }
    var contracts = contractsRes.data || [];
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }
    var user = session;

    var stats = calculateContractStatsFromObjects_(contracts, user);

    // Tính dataVersion = max(updatedAt) của toàn bộ contracts (trước khi filter theo role)
    // Dùng để frontend phát hiện khi có user khác thay đổi dữ liệu
    var dataVersion = computeDataVersion_(contracts);

    return jsonResponse_(true, {
      contracts: contracts,
      stats: stats,
      dataVersion: dataVersion
    });
  } catch (e) {
    Logger.log('Error in getDashboardInit: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi khởi tạo Dashboard: ' + e.message);
  }
}

/**
 * Lightweight endpoint — chỉ trả dataVersion (max updatedAt) của danh sách hợp đồng.
 * Dùng để frontend kiểm tra xem localStorage cache có còn hợp lệ không mà không cần
 * tải toàn bộ data. Ưu tiên đọc từ CacheService nếu có sẵn.
 * @param {string} token - Session token.
 * @return {object} JSON response với { dataVersion: string }.
 */
function getDashboardVersion(token) {
  try {
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    // Đọc từ CacheService nếu có — nhanh, không cần đọc Spreadsheet
    var cachedStr = getChunkedCache_('all_active_contracts');
    var contracts = null;
    if (cachedStr) {
      try {
        contracts = JSON.parse(cachedStr);
      } catch (e) {
        // Ignore parse error, fallback to sheet
      }
    }

    if (!contracts) {
      // Cache miss: đọc từ Spreadsheet (hiếm khi xảy ra)
      var sheet = getSheet_(SHEET_NAMES.CONTRACTS);
      var allContracts = sheetToObjects_(sheet);
      contracts = allContracts.map(function(row) {
        return { updatedAt: formatIfDate_(row.updated_at) };
      });
    }

    var dataVersion = computeDataVersion_(contracts);
    return jsonResponse_(true, { dataVersion: dataVersion });
  } catch (e) {
    Logger.log('Error in getDashboardVersion: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi lấy dataVersion: ' + e.message);
  }
}

/**
 * Tính dataVersion = max(updatedAt) của mảng contracts.
 * Dùng làm "dấu vết" để phát hiện thay đổi data giữa các user mà không cần tải full data.
 * @param {Array<object>} contracts - Mảng contract objects có trường updatedAt.
 * @return {string} Timestamp mới nhất dưới dạng string, hoặc '0' nếu không có data.
 */
function computeDataVersion_(contracts) {
  if (!contracts || contracts.length === 0) return '0';
  var maxTime = 0;
  for (var i = 0; i < contracts.length; i++) {
    var t = parseDateTimeString_(contracts[i].updatedAt);
    if (t > maxTime) maxTime = t;
  }
  return String(maxTime);
}

/**

 * Retrieves archived contracts.
 * @param {string} token - Session token.
 * @param {boolean} [forceRefresh] - Force refresh from Sheet, bypassing cache.
/** Default limit of recent archived contracts to load initially */
var ARCHIVED_DEFAULT_LIMIT = 200;

/**
 * Retrieves a limited list of archived contracts (default top 200 newest).
 * @param {string} token - Session token.
 * @param {boolean} forceRefresh - If true, bypasses CacheService.
 * @param {number} [limit=200] - Max contracts to return (0 or null for default 200).
 * @return {object} JSON response with archived contracts.
 */
function getArchivedContracts(token, forceRefresh, limit) {
  try {
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    var user = session;
    if (!user) {
      return jsonResponse_(false, null, 'Không tìm thấy thông tin người dùng.');
    }

    var maxLimit = (typeof limit === 'number' && limit > 0) ? limit : ARCHIVED_DEFAULT_LIMIT;

    // Tải từ Cache trước để tối ưu hóa hiệu suất (bỏ qua nếu forceRefresh)
    var cachedArchivedStr = forceRefresh ? null : getChunkedCache_('all_archived_contracts');
    var contracts = null;
    if (cachedArchivedStr) {
      try {
        contracts = JSON.parse(cachedArchivedStr);
      } catch (err) {
        Logger.log('Lỗi khi phân tích cache hợp đồng lưu trữ: ' + err.message);
      }
    }

    if (!contracts) {
      var archiveSS = getArchiveSpreadsheet_();
      var sheet = archiveSS.getSheetByName(SHEET_NAMES.CONTRACTS);
      if (!sheet) {
        return jsonResponse_(true, [], 'Không có dữ liệu lưu trữ.');
      }

      var allArchived = sheetToObjects_(sheet);

      contracts = allArchived.map(function (row) {
        return {
          contractId: row.contract_id,
          title: row.title,
          supplier: row.supplier,
          description: row.description,
          status: row.status,
          currentVersion: row.current_version,
          folderId: row.folder_id,
          createdBy: row.created_by,
          createdAt: formatIfDate_(row.created_at),
          updatedAt: formatIfDate_(row.updated_at),
          rejectCount: row.reject_count
        };
      });

      // Lưu vào Cache trong 15 phút (900 giây)
      try {
        putChunkedCache_('all_archived_contracts', JSON.stringify(contracts), 900);
      } catch (cacheErr) {
        Logger.log('Lỗi ghi cache hợp đồng lưu trữ: ' + cacheErr.message);
      }
    }

    // Role-based filtering: USER only sees their own archived contracts
    if (user.role === ROLES.USER) {
      contracts = contracts.filter(function (c) {
        return c.createdBy === user.username;
      });
    }

    // Sort by updated_at descending (newest first)
    contracts.sort(function (a, b) {
      return parseDateTimeString_(b.updatedAt) - parseDateTimeString_(a.updatedAt);
    });

    // Apply limit to prevent huge payloads
    if (contracts.length > maxLimit) {
      contracts = contracts.slice(0, maxLimit);
    }

    return jsonResponse_(true, contracts);
  } catch (e) {
    Logger.log('Error getting archived contracts: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi lấy danh sách hợp đồng đã lưu trữ: ' + e.message);
  }
}

/**
 * Searches the entire archived repository (and active contracts) on server-side.
 * @param {string} token - Session token.
 * @param {string} query - Keyword to search for.
 * @return {object} JSON response with matching contracts.
 */
function searchArchivedContracts(token, query) {
  try {
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    var user = session;
    if (!user) {
      return jsonResponse_(false, null, 'Không tìm thấy thông tin người dùng.');
    }

    var keyword = (query || '').toString().trim().toLowerCase();
    if (!keyword) {
      return getArchivedContracts(token, false, ARCHIVED_DEFAULT_LIMIT);
    }

    var archiveSS = getArchiveSpreadsheet_();
    var sheet = archiveSS.getSheetByName(SHEET_NAMES.CONTRACTS);
    var allArchivedRows = sheet ? sheetToObjects_(sheet) : [];

    var matching = [];

    for (var i = 0; i < allArchivedRows.length; i++) {
      var row = allArchivedRows[i];
      var createdBy = row.created_by || '';

      // Role check
      if (user.role === ROLES.USER && createdBy !== user.username) {
        continue;
      }

      var contractId = (row.contract_id || '').toString().toLowerCase();
      var title = (row.title || '').toString().toLowerCase();
      var supplier = (row.supplier || '').toString().toLowerCase();
      var description = (row.description || '').toString().toLowerCase();

      if (contractId.indexOf(keyword) !== -1 ||
          title.indexOf(keyword) !== -1 ||
          supplier.indexOf(keyword) !== -1 ||
          description.indexOf(keyword) !== -1 ||
          createdBy.toLowerCase().indexOf(keyword) !== -1) {
        matching.push({
          contractId: row.contract_id,
          title: row.title,
          supplier: row.supplier,
          description: row.description,
          status: row.status,
          currentVersion: row.current_version,
          folderId: row.folder_id,
          createdBy: row.created_by,
          createdAt: formatIfDate_(row.created_at),
          updatedAt: formatIfDate_(row.updated_at),
          rejectCount: row.reject_count
        });
      }
    }

    // Sort by updated_at descending (newest first)
    matching.sort(function (a, b) {
      return parseDateTimeString_(b.updatedAt) - parseDateTimeString_(a.updatedAt);
    });

    // Limit maximum search results to 100
    if (matching.length > 100) {
      matching = matching.slice(0, 100);
    }

    return jsonResponse_(true, {
      contracts: matching,
      query: query,
      count: matching.length
    });
  } catch (e) {
    Logger.log('Error searching archived contracts: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi tìm kiếm hợp đồng lưu trữ: ' + e.message);
  }
}

/**
 * Retrieves detailed contract information including versions, comments, and activity.
 * @param {string} contractId - The contract identifier.
 * @param {string} token - Session token.
 * @return {object} JSON response with { contract, versions, comments, activities }.
 */
function invalidateBackendDetailCache_(contractId) {
  if (!contractId) return;
  try {
    var cache = CacheService.getScriptCache();
    cache.remove('contract_detail_' + contractId);
    Logger.log('🗑️ [CACHE CLEAR] Cleared backend detail cache for contract: ' + contractId);
  } catch (e) {
    Logger.log('Error clearing backend detail cache: ' + e.message);
  }
}

function getContractDetail(contractId, token) {
  try {
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    var user = session;
    if (!user) {
      return jsonResponse_(false, null, 'Không tìm thấy thông tin người dùng.');
    }

    // 0. Check CacheService RAM (~200ms response)
    var cacheKey = 'contract_detail_' + contractId;
    var scriptCache = CacheService.getScriptCache();
    var cachedDataStr = scriptCache.get(cacheKey);

    if (cachedDataStr) {
      try {
        var cachedObj = JSON.parse(cachedDataStr);
        if (cachedObj && cachedObj.contract) {
          // Permission check: USER can only see own contracts
          if (user.role === ROLES.USER && cachedObj.contract.createdBy !== user.username) {
            return jsonResponse_(false, null, 'Bạn không có quyền xem hợp đồng này.');
          }
          Logger.log('⚡ [PERF BACKEND CACHE] Hit CacheService RAM cho hợp đồng: ' + contractId);
          return jsonResponse_(true, cachedObj);
        }
      } catch (errCache) {
        // Ignore parse error, fallback to sheet read
      }
    }

    // Single pass Spreadsheet instance retrieval
    var ss = getSpreadsheet_();
    var contractsSheet = ss.getSheetByName(SHEET_NAMES.CONTRACTS);
    var isArchived = false;

    var contractRowIndex = getRowByColumn_(contractsSheet, 1, contractId); // Column A = contract_id

    if (contractRowIndex === -1) {
      try {
        var archiveSS = getArchiveSpreadsheet_();
        var archiveContractsSheet = archiveSS.getSheetByName(SHEET_NAMES.CONTRACTS);
        if (archiveContractsSheet) {
          contractRowIndex = getRowByColumn_(archiveContractsSheet, 1, contractId);
          if (contractRowIndex !== -1) {
            ss = archiveSS;
            contractsSheet = archiveContractsSheet;
            isArchived = true;
          }
        }
      } catch (err) {
        Logger.log('Error searching Archive DB: ' + err.message);
      }
    }

    if (contractRowIndex === -1) {
      return jsonResponse_(false, null, 'Không tìm thấy hợp đồng: ' + contractId);
    }

    var contractValues = contractsSheet.getRange(contractRowIndex, 1, 1, contractsSheet.getLastColumn()).getValues()[0];

    var contract = {
      contractId: contractValues[0],
      title: contractValues[1],
      supplier: contractValues[2],
      description: contractValues[3],
      status: contractValues[4],
      currentVersion: contractValues[5],
      folderId: contractValues[6],
      createdBy: contractValues[7],
      createdAt: formatIfDate_(contractValues[8]),
      updatedAt: formatIfDate_(contractValues[9]),
      rejectCount: contractValues[10]
    };

    // Permission check: USER can only see own contracts
    if (user.role === ROLES.USER && contract.createdBy !== user.username) {
      return jsonResponse_(false, null, 'Bạn không có quyền xem hợp đồng này.');
    }

    // Batch Sheet Handles from single `ss` instance
    var versionsSheet = ss.getSheetByName(SHEET_NAMES.VERSIONS);
    var commentsSheet = ss.getSheetByName(SHEET_NAMES.COMMENTS);
    var activitySheet = ss.getSheetByName(SHEET_NAMES.ACTIVITY_LOG);
    var analysesSheet = ss.getSheetByName(SHEET_NAMES.AI_ANALYSES);
    var taskListSheet = ss.getSheetByName(SHEET_NAMES.TASK_LIST);
    var refFilesSheet = ss.getSheetByName(SHEET_NAMES.REFERENCE_FILES);

    // Read raw 2D values in single pass fetches
    var versionsData = versionsSheet ? versionsSheet.getDataRange().getValues() : [];
    var commentsData = commentsSheet ? commentsSheet.getDataRange().getValues() : [];
    var activityData = activitySheet ? activitySheet.getDataRange().getValues() : [];
    var analysesData = analysesSheet ? analysesSheet.getDataRange().getValues() : [];
    var taskListData = taskListSheet ? taskListSheet.getDataRange().getValues() : [];
    var refFilesData = refFilesSheet ? refFilesSheet.getDataRange().getValues() : [];

    // 1. Get versions
    var versions = [];
    if (versionsData.length > 1) {
      for (var i = 1; i < versionsData.length; i++) {
        if (String(versionsData[i][0]) === String(contractId)) {
          versions.push({
            contractId: versionsData[i][0],
            versionNo: versionsData[i][1],
            fileId: versionsData[i][2],
            fileName: versionsData[i][3],
            fileUrl: versionsData[i][4],
            uploadedBy: versionsData[i][5],
            uploadedAt: formatIfDate_(versionsData[i][6]),
            action: versionsData[i][7],
            changeSummary: versionsData[i][8],
            negoNotes: versionsData[i][9]
          });
        }
      }
      versions.sort(function (a, b) { return b.versionNo - a.versionNo; });
    }

    // 2. Get comments
    var comments = [];
    if (commentsData.length > 1) {
      for (var j = 1; j < commentsData.length; j++) {
        if (String(commentsData[j][1]) === String(contractId)) {
          comments.push({
            commentId: commentsData[j][0],
            contractId: commentsData[j][1],
            versionNo: commentsData[j][2],
            clauseRef: commentsData[j][3],
            commentBy: commentsData[j][4],
            commentAt: formatIfDate_(commentsData[j][5]),
            commentText: commentsData[j][6],
            type: commentsData[j][7]
          });
        }
      }
      comments.sort(function (a, b) {
        return parseDateTimeString_(b.commentAt) - parseDateTimeString_(a.commentAt);
      });
    }

    // 3. Get activity log
    var activities = [];
    if (activityData.length > 1) {
      for (var ai = 1; ai < activityData.length; ai++) {
        if (String(activityData[ai][1]) === String(contractId)) {
          activities.push({
            timestamp: formatIfDate_(activityData[ai][0]),
            contractId: activityData[ai][1],
            action: activityData[ai][2],
            performedBy: activityData[ai][3],
            details: activityData[ai][4]
          });
        }
      }
      activities.sort(function (a, b) {
        return parseDateTimeString_(b.timestamp) - parseDateTimeString_(a.timestamp);
      });
    }

    // 4. Get AI analyses
    var latestVersionNo = 0;
    for (var vi2 = 0; vi2 < versions.length; vi2++) {
      if (versions[vi2].versionNo > latestVersionNo) {
        latestVersionNo = versions[vi2].versionNo;
      }
    }

    var aiAnalyses = {};
    var summary = null;
    if (analysesData.length > 1) {
      var allAnalysesData = sheetToObjectsFromData_(analysesData);
      var allAnalysesList = [];
      var bestByType = {};

      for (var m = 0; m < allAnalysesData.length; m++) {
        if (String(allAnalysesData[m].contract_id) === String(contractId)) {
          var entry = {
            hasAnalysis: true,
            analysisType: allAnalysesData[m].analysis_type,
            versionNo: parseInt(allAnalysesData[m].version_no, 10),
            resultJson: allAnalysesData[m].result_json,
            analyzedBy: allAnalysesData[m].analyzed_by,
            analyzedAt: formatIfDate_(allAnalysesData[m].analyzed_at)
          };
          allAnalysesList.push(entry);

          var aType = entry.analysisType;
          if (entry.versionNo <= latestVersionNo) {
            if (!bestByType[aType] || entry.versionNo > bestByType[aType].versionNo) {
              bestByType[aType] = entry;
            }
          }
        }
      }

      aiAnalyses = { allAnalyses: allAnalysesList };
      for (var typeKey in AI_TYPES) {
        var typeVal = AI_TYPES[typeKey];
        aiAnalyses[typeVal] = bestByType[typeVal] || null;
      }

      if (aiAnalyses['SUMMARY']) {
        summary = {
          hasSummary: aiAnalyses['SUMMARY'].hasAnalysis,
          versionNo: aiAnalyses['SUMMARY'].versionNo,
          summaryJson: aiAnalyses['SUMMARY'].resultJson,
          summarizedBy: aiAnalyses['SUMMARY'].analyzedBy,
          summarizedAt: aiAnalyses['SUMMARY'].analyzedAt
        };
      }
    }

    // 5. Get task list
    var taskList = [];
    if (taskListData.length > 1) {
      var tasks = sheetToObjectsFromData_(taskListData);
      taskList = tasks.filter(function (t) {
        return String(t.contract_id) === String(contractId);
      }).map(function (row) {
        return {
          contractId: row.contract_id,
          taskId: row.task_id,
          clauses: row.clauses,
          issueSummary: row.issue_summary,
          category: row.category,
          legalRecommendation: row.legal_recommendation,
          status: row.status,
          userNotes: row.user_notes,
          legalDecision: row.legal_decision
        };
      });
    }

    // 6. Get reference files
    var referenceFiles = [];
    if (refFilesData.length > 1) {
      for (var rf = 1; rf < refFilesData.length; rf++) {
        if (String(refFilesData[rf][0]) === String(contractId)) {
          referenceFiles.push({
            contractId: refFilesData[rf][0],
            fileId: refFilesData[rf][1],
            fileName: refFilesData[rf][2],
            fileUrl: refFilesData[rf][3],
            fileSize: refFilesData[rf][4],
            mimeType: refFilesData[rf][5],
            uploadedBy: refFilesData[rf][6],
            uploadedAt: formatIfDate_(refFilesData[rf][7])
          });
        }
      }
      referenceFiles.sort(function(a, b) {
        return parseDateTimeString_(b.uploadedAt) - parseDateTimeString_(a.uploadedAt);
      });
    }

    var resultObj = {
      contract: contract,
      versions: versions,
      comments: comments,
      activities: activities,
      aiAnalyses: aiAnalyses,
      summary: summary,
      taskList: taskList,
      referenceFiles: referenceFiles
    };

    // Save to CacheService RAM (30 minutes TTL = 1800s)
    try {
      scriptCache.put(cacheKey, JSON.stringify(resultObj), 1800);
    } catch (putErr) {
      Logger.log('Warning caching detail to CacheService: ' + putErr.message);
    }

    return jsonResponse_(true, resultObj);

  } catch (e) {
    Logger.log('Error in getContractDetail: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi lấy chi tiết hợp đồng: ' + e.message);
  }
}



/**
 * Updates contract status with transition validation and auto-transitions.
 * Handles notifications and comment logging.
 * @param {string} contractId - The contract identifier.
 * @param {string} newStatus - The target status.
 * @param {string} comment - Optional comment for the status change.
 * @param {string} token - Session token.
 * @return {object} JSON response.
 */
function updateContractStatus(contractId, newStatus, comment, token, skipEmail) {
  var session = validateSession_(token);
  if (!session.valid) {
    return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  }

  var user = session;
  if (!user) {
    return jsonResponse_(false, null, 'Không tìm thấy thông tin người dùng.');
  }

  var lock = LockService.getScriptLock();
  var isApproved = false;
  var currentStatus = '';
  var now = '';
  try {
    lock.waitLock(15000);

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

    // Kiểm tra quyền sở hữu: USER chỉ được thao tác trên hợp đồng do chính mình tạo (chặn BOLA/IDOR)
    var createdByOwner = contractRow[7]; // Column H = created_by
    if (user.role === ROLES.USER && createdByOwner !== user.username) {
      return jsonResponse_(false, null, 'Bạn không có quyền thao tác trên hợp đồng này.');
    }

    currentStatus = contractRow[4]; // Column E = status

    // Validate transition
    if (!canTransition_(currentStatus, newStatus, user.role)) {
      return jsonResponse_(false, null, 'Không thể chuyển trạng thái từ ' +
        (STATUS_LABELS[currentStatus] || currentStatus) + ' sang ' +
        (STATUS_LABELS[newStatus] || newStatus) + '.');
    }

    now = formatDateTime_(new Date());

    // Update status
    contractsSheet.getRange(contractRowIndex, 5).setValue(newStatus); // Column E
    contractsSheet.getRange(contractRowIndex, 10).setValue(now);       // Column J = updated_at

    // Increment reject_count for feedback statuses
    if (newStatus === STATUS.LEGAL_COMMENTED || newStatus === STATUS.HOL_COMMENTED) {
      var currentRejectCount = contractRow[10] || 0; // Column K
      contractsSheet.getRange(contractRowIndex, 11).setValue(currentRejectCount + 1);
    }

    var createdComment = null;
    var createdApprovedVersion = null;

    // Add comment if provided
    if (comment && comment.trim() !== '') {
      var commentType = 'STATUS_CHANGE';
      if (user.role === ROLES.LEGAL) commentType = 'LEGAL_COMMENT';
      else if (user.role === ROLES.HOL) commentType = 'HOL_COMMENT';
      else if (user.role === ROLES.USER) commentType = 'USER_RESPONSE';

      var commentId = generateUUID_();
      var commentsSheet = getSheet_(SHEET_NAMES.COMMENTS);
      commentsSheet.appendRow([
        commentId,              // comment_id (A)
        contractId,             // contract_id (B)
        contractRow[5] || '',   // version_no (C) = current_version
        '',                     // clause_ref (D)
        user.username,          // comment_by (E)
        now,                    // comment_at (F)
        comment.trim(),         // comment_text (G)
        commentType             // type (H)
      ]);

      createdComment = {
        commentId: commentId,
        contractId: contractId,
        versionNo: contractRow[5] || 1,
        clauseRef: '',
        commentBy: user.username,
        commentAt: now,
        commentText: comment.trim(),
        type: commentType
      };
    }

    // Add automatic comment for approval in exchange history
    if (newStatus === STATUS.LEGAL_APPROVED || newStatus === STATUS.HOL_APPROVED) {
      var approvedText = newStatus === STATUS.LEGAL_APPROVED ? '💚 Đã phê duyệt (Pháp lý)' : '💚 Đã phê duyệt (Trưởng phòng)';
      var autoCommentId = generateUUID_();
      var commentsSheet = getSheet_(SHEET_NAMES.COMMENTS);
      commentsSheet.appendRow([
        autoCommentId,          // comment_id (A)
        contractId,             // contract_id (B)
        contractRow[5] || '',   // version_no (C) = current_version
        '',                     // clause_ref (D)
        user.username,          // comment_by (E)
        now,                    // comment_at (F)
        approvedText,           // comment_text (G)
        'SYSTEM'                // type (H)
      ]);

      createdComment = {
        commentId: autoCommentId,
        contractId: contractId,
        versionNo: contractRow[5] || 1,
        clauseRef: '',
        commentBy: user.username,
        commentAt: now,
        commentText: approvedText,
        type: 'SYSTEM'
      };
    }

    // Build contract object for notifications
    var contract = {
      contractId: contractId,
      title: contractRow[1],
      supplier: contractRow[2],
      createdBy: contractRow[7]
    };

    var originalRequestedStatus = newStatus;
    var approvedDocUrl = null;

    // Handle notifications and auto-transitions based on new status
    if (newStatus === STATUS.PENDING_LEGAL) {
      if (!skipEmail) notifyLegalNewContract_(contract, user.displayName || user.username);
    } else if (newStatus === STATUS.LEGAL_COMMENTED) {
      if (!skipEmail) notifyUserFeedback_(contract, user.displayName || user.username);
      // Auto-transition: LEGAL_COMMENTED → USER_REVISING
      contractsSheet.getRange(contractRowIndex, 5).setValue(STATUS.USER_REVISING);
      newStatus = STATUS.USER_REVISING;
    } else if (newStatus === STATUS.LEGAL_APPROVED) {
      // Auto-transition: LEGAL_APPROVED → PENDING_HOL
      contractsSheet.getRange(contractRowIndex, 5).setValue(STATUS.PENDING_HOL);
      if (!skipEmail) notifyHOLReview_(contract);
      newStatus = STATUS.PENDING_HOL;
    } else if (newStatus === STATUS.HOL_COMMENTED) {
      if (!skipEmail) notifyUserRejectedByHOL_(contract, user.displayName || user.username);
      // Auto-transition: HOL_COMMENTED → USER_REVISING
      contractsSheet.getRange(contractRowIndex, 5).setValue(STATUS.USER_REVISING);
      newStatus = STATUS.USER_REVISING;
    } else if (newStatus === STATUS.HOL_APPROVED) {
      // Create an approved copy of the latest version's Google Doc
      try {
        var folderId = contractRow[6]; // Column G = folder_id
        if (folderId) {
          // Get all versions for this contract, find the latest
          var versionsSheet = getSheet_(SHEET_NAMES.VERSIONS);
          var versionsData = versionsSheet.getDataRange().getValues();
          versionsData.shift(); // remove header

          var latestVersion = null;
          var maxVersionNo = -1;
          for (var vi = 0; vi < versionsData.length; vi++) {
            if (String(versionsData[vi][0]) === String(contractId)) {
              var vNo = parseInt(versionsData[vi][1], 10);
              if (vNo > maxVersionNo) {
                maxVersionNo = vNo;
                latestVersion = {
                  fileId: versionsData[vi][2]
                };
              }
            }
          }

          if (latestVersion && latestVersion.fileId) {
            var sourceFile = DriveApp.getFileById(latestVersion.fileId);
            var approvedName = contractId + '_approved';
            var targetFolder = DriveApp.getFolderById(folderId);
            var approvedCopy = sourceFile.makeCopy(approvedName, targetFolder);
            approvedDocUrl = approvedCopy.getUrl();

            // Set file sharing: Anyone with the link can view
            try {
              approvedCopy.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            } catch (permErr) {
              Logger.log('Lỗi gán quyền cho file approved Google Doc: ' + permErr.message);
            }

            // Record approved version in versions sheet
            var approvedVersionNo = maxVersionNo + 1;
            var approvedNow = formatDateTime_(new Date());
            versionsSheet.appendRow([
              contractId,                  // contract_id (A)
              approvedVersionNo,           // version_no (B)
              approvedCopy.getId(),        // file_id (C)
              approvedName,                // file_name (D)
              approvedDocUrl,              // file_url (E)
              user.username,               // uploaded_by (F)
              approvedNow,                 // uploaded_at (G)
              'HOL_APPROVED',              // action (H)
              'Phiên bản được phê duyệt bởi ' + (user.displayName || user.username), // change_summary (I)
              ''                           // nego_notes (J)
            ]);

            createdApprovedVersion = {
              contractId: contractId,
              versionNo: approvedVersionNo,
              fileId: approvedCopy.getId(),
              fileName: approvedName,
              fileUrl: approvedDocUrl,
              uploadedBy: user.username,
              uploadedAt: approvedNow,
              action: 'HOL_APPROVED',
              changeSummary: 'Phiên bản được phê duyệt bởi ' + (user.displayName || user.username),
              negoNotes: ''
            };

            // Update current_version in contracts sheet
            contractsSheet.getRange(contractRowIndex, 6).setValue(approvedVersionNo);

            logActivity_(contractId, 'APPROVED_DOC_CREATED', user.username,
              'Tạo phiên bản phê duyệt: ' + approvedName);
          }
        }
      } catch (approvedErr) {
        Logger.log('Error creating approved doc copy: ' + approvedErr.message);
        // Non-fatal: continue with approval even if copy fails
      }

      if (!skipEmail) notifyUserApproved_(contract, approvedDocUrl);
    }

    // Log activity
    logActivity_(contractId, 'STATUS_CHANGED', user.username,
      'Chuyển trạng thái: ' + (STATUS_LABELS[currentStatus] || currentStatus) +
      ' → ' + (STATUS_LABELS[newStatus] || newStatus));

    if (newStatus === STATUS.HOL_APPROVED) {
      isApproved = true;
    }

    // Đảm bảo dữ liệu ghi thành công trước khi xóa cache và giải phóng lock
    SpreadsheetApp.flush();

    // Xóa cache danh sách hợp đồng do dữ liệu đã thay đổi
    invalidateBackendDetailCache_(contractId);
    clearChunkedCache_('all_active_contracts');
    clearChunkedCache_('all_archived_contracts');

  } finally {
    lock.releaseLock();
  }

  // Thực hiện di dời Archive ngoài khối giữ lock để tránh deadlock (archiveContract_ tự gọi lock riêng)
  if (isApproved) {
    try {
      archiveContract_(contractId);
    } catch (archiveErr) {
      Logger.log('Lỗi khi lưu trữ hợp đồng ' + contractId + ': ' + archiveErr.message);
      // Không chặn luồng chính nếu lưu trữ thất bại, nhưng ghi nhận log
    }
  }

  var finalRejectCount = (newStatus === STATUS.LEGAL_COMMENTED || newStatus === STATUS.HOL_COMMENTED)
    ? ((contractRow[10] || 0) + 1)
    : (contractRow[10] || 0);

  return jsonResponse_(true, {
    contractId: contractId,
    previousStatus: currentStatus,
    status: newStatus,
    currentStatus: newStatus,
    updatedAt: now,
    rejectCount: finalRejectCount,
    newComment: createdComment,
    newVersion: createdApprovedVersion,
    emailSent: !DISABLE_EMAIL_NOTIFICATIONS && !skipEmail,
    emailContext: {
      contractId: contractId,
      eventType: originalRequestedStatus,
      approvedDocUrl: approvedDocUrl || null
    }
  }, 'Cập nhật trạng thái thành công.');
}

/**
 * Returns contract statistics for the dashboard.
 * Respects role-based filtering for counts.
 * @param {string} token - Session token.
 * @return {object} JSON response with { total, byStatus, pendingMyAction }.
 */
function getContractStats(token) {
  try {
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    var user = session;
    if (!user) {
      return jsonResponse_(false, null, 'Không tìm thấy thông tin người dùng.');
    }

    var sheet = getSheet_(SHEET_NAMES.CONTRACTS);
    var data = sheet.getDataRange().getValues();
    data.shift(); // Remove header

    // Filter by role
    var contracts = data;
    if (user.role === ROLES.USER) {
      contracts = data.filter(function (row) {
        return row[7] === user.username; // Column H = created_by
      });
    }

    var total = contracts.length;
    var byStatus = {};
    var pendingMyAction = 0;
    var pending = 0;
    var legalReview = 0;
    var headReview = 0;
    var approved = 0;

    // Initialize byStatus with all known statuses
    for (var key in STATUS) {
      if (STATUS.hasOwnProperty(key)) {
        byStatus[STATUS[key]] = 0;
      }
    }

    for (var i = 0; i < contracts.length; i++) {
      var status = contracts[i][4]; // Column E = status
      var createdBy = contracts[i][7]; // Column H = created_by

      if (byStatus.hasOwnProperty(status)) {
        byStatus[status]++;
      } else {
        byStatus[status] = 1;
      }

      // Calculate pendingMyAction (role-based)
      if (user.role === ROLES.USER) {
        if (createdBy === user.username &&
          (status === STATUS.DRAFT || status === STATUS.USER_REVISING || status === STATUS.HOL_APPROVED)) {
          pendingMyAction++;
        }
      } else if (user.role === ROLES.LEGAL) {
        if (status === STATUS.PENDING_LEGAL) {
          pendingMyAction++;
        }
      } else if (user.role === ROLES.HOL) {
        if (status === STATUS.PENDING_HOL) {
          pendingMyAction++;
        }
      }

      // Calculate pending, legalReview, headReview and approved
      if (status === STATUS.DRAFT || status === STATUS.USER_REVISING) {
        pending++;
      } else if (status === STATUS.PENDING_LEGAL || status === STATUS.LEGAL_COMMENTED || status === STATUS.LEGAL_APPROVED) {
        legalReview++;
      } else if (status === STATUS.PENDING_HOL || status === STATUS.HOL_COMMENTED) {
        headReview++;
      } else if (status === STATUS.HOL_APPROVED || status === STATUS.COMPLETED) {
        approved++;
      }
    }

    return jsonResponse_(true, {
      total: total,
      byStatus: byStatus,
      pendingMyAction: pendingMyAction,
      pending: pending,
      legalReview: legalReview,
      headReview: headReview,
      approved: approved
    });
  } catch (e) {
    Logger.log('Error getting contract stats: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi lấy thống kê: ' + e.message);
  }
}

/**
 * Deletes a contract request if it is still in DRAFT status.
 * Also removes related sheets rows and Drive folder.
 * @param {string} contractId - The contract identifier.
 * @param {string} token - Session token.
 * @return {object} JSON response.
 */
function deleteContract(contractId, token) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    var user = session;
    if (!user) {
      return jsonResponse_(false, null, 'Không tìm thấy thông tin người dùng.');
    }

    // Find contract
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    var contractRowIndex = getRowByColumn_(contractsSheet, 1, contractId);
    if (contractRowIndex === -1) {
      return jsonResponse_(false, null, 'Không tìm thấy hợp đồng: ' + contractId);
    }

    var contractValues = contractsSheet.getRange(contractRowIndex, 1, 1, contractsSheet.getLastColumn()).getValues()[0];
    var status = contractValues[4];
    var createdBy = contractValues[7];
    var folderId = contractValues[6];

    // Permission check: only creator can delete if role is USER. LEGAL and HOL cannot delete at all.
    if (user.role === ROLES.USER) {
      if (createdBy !== user.username) {
        return jsonResponse_(false, null, 'Bạn không có quyền xoá hợp đồng này.');
      }
      // Status check: must be DRAFT or USER_REVISING
      if (status !== STATUS.DRAFT && status !== STATUS.USER_REVISING) {
        return jsonResponse_(false, null, 'Hợp đồng chỉ có thể xoá khi chưa gửi duyệt (Trạng thái Nháp hoặc Chờ chỉnh sửa).');
      }
    } else {
      // LEGAL and HOL roles are not allowed to delete
      return jsonResponse_(false, null, 'Bạn không có quyền xoá hợp đồng này.');
    }

    // Delete folder in Drive
    if (folderId) {
      try {
        DriveApp.getFolderById(folderId).setTrashed(true);
      } catch (driveErr) {
        Logger.log('Error trashing Drive folder for contract ' + contractId + ': ' + driveErr.message);
      }
    }

    // Delete row from contracts sheet
    contractsSheet.deleteRow(contractRowIndex);

    // Batch delete from related sheets (O(1) API calls per sheet instead of O(N))
    batchRemoveRows_(getSheet_(SHEET_NAMES.VERSIONS), 0, contractId);     // col A = contract_id
    batchRemoveRows_(getSheet_(SHEET_NAMES.COMMENTS), 1, contractId);     // col B = contract_id
    batchRemoveRows_(getSheet_(SHEET_NAMES.ACTIVITY_LOG), 1, contractId); // col B = contract_id

    try {
      batchRemoveRows_(getSheet_(SHEET_NAMES.AI_ANALYSES), 0, contractId);  // col A = contract_id
    } catch (aiErr) {
      Logger.log('batchRemoveRows_ ai_analyses: ' + aiErr.message);
    }

    try {
      batchRemoveRows_(getSheet_(SHEET_NAMES.TASK_LIST), 0, contractId);    // col A = contract_id
    } catch (taskErr) {
      Logger.log('batchRemoveRows_ task_list: ' + taskErr.message);
    }

    // Đảm bảo dữ liệu xóa thành công trước khi dọn cache
    SpreadsheetApp.flush();

    // Dọn dẹp cache backend
    invalidateBackendDetailCache_(contractId);


    // Xóa cache danh sách hợp đồng do dữ liệu đã bị xóa
    clearChunkedCache_('all_active_contracts');

    return jsonResponse_(true, null, 'Đã xoá hợp đồng thành công.');
  } catch (e) {
    Logger.log('Error deleting contract: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi xoá hợp đồng: ' + e.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Saves the task list for a contract, overwriting existing rows.
 * @param {string} contractId - The contract ID.
 * @param {Array<object>} taskList - Array of task rows.
 * @param {string} token - Session token.
 * @return {object} JSON response.
 */
function saveTaskList(contractId, taskList, token) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

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

    var taskListSheet = getSheet_(SHEET_NAMES.TASK_LIST);
    if (!taskListSheet) {
      return jsonResponse_(false, null, 'Không tìm thấy bảng task_list.');
    }

    // 1. Batch delete existing task rows for this contract_id
    batchRemoveRows_(taskListSheet, 0, contractId); // col A = contract_id

    // 2. Batch insert new rows (single setValues call instead of N appendRow calls)
    if (taskList && taskList.length > 0) {
      var newRows = [];
      for (var j = 0; j < taskList.length; j++) {
        var t = taskList[j];
        newRows.push([
          contractId,
          t.taskId || generateUUID_(),
          t.clauses || '',
          t.issueSummary || '',
          t.category || '',
          t.legalRecommendation || '',
          t.status || '',
          t.userNotes || '',
          t.legalDecision || ''
        ]);
      }
      var insertRow = taskListSheet.getLastRow() + 1;
      taskListSheet.getRange(insertRow, 1, newRows.length, newRows[0].length).setValues(newRows);
    }

    // Đảm bảo dữ liệu ghi thành công xuống Sheet trước khi dọn cache và nhả lock
    SpreadsheetApp.flush();
    invalidateBackendDetailCache_(contractId);
    clearChunkedCache_('all_active_contracts');

    return jsonResponse_(true, null, 'Đã lưu danh sách nhiệm vụ.');

  } catch (e) {
    Logger.log('Error in saveTaskList: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi lưu danh sách nhiệm vụ: ' + e.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Saves task list, changes contract status to Draft, and adds a comment on the exchange tab.
 * @param {string} contractId - The contract ID.
 * @param {Array<object>} taskList - Array of task rows.
 * @param {string} token - Session token.
 * @return {object} JSON response.
 */
function submitTaskListToUser(contractId, taskList, token, skipEmail) {
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

    if (user.role !== ROLES.LEGAL && user.role !== ROLES.HOL) {
      return jsonResponse_(false, null, 'Bạn không có quyền gửi danh sách nhiệm vụ.');
    }

    // First save the task list
    var saveResult = saveTaskList(contractId, taskList, token);
    if (!saveResult.success) {
      return saveResult;
    }

    // Find current status to determine next status
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    var contractRowIndex = getRowByColumn_(contractsSheet, 1, contractId);
    if (contractRowIndex === -1) {
      return jsonResponse_(false, null, 'Không tìm thấy hợp đồng.');
    }
    var currentStatus = contractsSheet.getRange(contractRowIndex, 5).getValue(); // Column E

    var nextStatus;
    if (currentStatus === STATUS.PENDING_LEGAL) {
      nextStatus = STATUS.LEGAL_COMMENTED;
    } else if (currentStatus === STATUS.PENDING_HOL) {
      nextStatus = STATUS.HOL_COMMENTED;
    } else {
      // Default fallback
      nextStatus = user.role === ROLES.HOL ? STATUS.HOL_COMMENTED : STATUS.LEGAL_COMMENTED;
    }

    // Update status and post comment
    var updateResult = updateContractStatus(contractId, nextStatus, 'vui lòng xem Task List và take action', token, skipEmail);
    return updateResult;
  } catch (e) {
    Logger.log('Error in submitTaskListToUser: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi gửi User: ' + e.message);
  }
}

/**
 * Saves task list, changes contract status to Legal Review, and adds a comment on the exchange tab.
 * @param {string} contractId - The contract ID.
 * @param {Array<object>} taskList - Array of task rows.
 * @param {string} token - Session token.
 * @param {boolean} [skipEmail=false] - If true, suppresses synchronous email sending.
 * @return {object} JSON response.
 */
function submitTaskListToLegal(contractId, taskList, token, skipEmail) {
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

    if (user.role !== ROLES.USER) {
      return jsonResponse_(false, null, 'Bạn không có quyền gửi yêu cầu review.');
    }

    // First save the task list
    var saveResult = saveTaskList(contractId, taskList, token);
    if (!saveResult.success) {
      return saveResult;
    }

    // Update status and post comment
    var updateResult = updateContractStatus(contractId, STATUS.PENDING_LEGAL, 'legal vui lòng review các thay đổi trên Task List', token, skipEmail);
    return updateResult;
  } catch (e) {
    Logger.log('Error in submitTaskListToLegal: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi gửi Legal review: ' + e.message);
  }
}

/**
 * Archives a contract by moving all its related data (contracts, versions, comments, activity log)
 * from the main spreadsheet to the separate Archive spreadsheet.
 * @param {string} contractId - The contract ID to archive.
 * @private
 */
function archiveContract_(contractId) {
  Logger.log('Starting archiving for contract ID: ' + contractId);
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var mainSS = SpreadsheetApp.openById(getConfig_().spreadsheetId);
    var archiveSS = getArchiveSpreadsheet_(); // Tự động mở hoặc tạo mới

    // Danh sách các bảng cần dời dữ liệu (keyCol is 0-based for batchRemoveRows_)
    var tables = [
      { name: SHEET_NAMES.CONTRACTS, keyCol: 0 },    // contract_id ở cột A (index 0)
      { name: SHEET_NAMES.VERSIONS, keyCol: 0 },     // contract_id ở cột A (index 0)
      { name: SHEET_NAMES.COMMENTS, keyCol: 1 },     // contract_id ở cột B (index 1)
      { name: SHEET_NAMES.ACTIVITY_LOG, keyCol: 1 }, // contract_id ở cột B (index 1)
      { name: SHEET_NAMES.AI_ANALYSES, keyCol: 0 },  // contract_id ở cột A (index 0)
      { name: SHEET_NAMES.TASK_LIST, keyCol: 0 },    // contract_id ở cột A (index 0)
      { name: SHEET_NAMES.REFERENCE_FILES, keyCol: 0 }  // contract_id ở cột A (index 0)
    ];

    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      var mainSheet = mainSS.getSheetByName(table.name);
      var archiveSheet = null;
      try {
        archiveSheet = getArchiveSheet_(table.name);
      } catch (e) {
        Logger.log('archiveContract_: Error getting sheet ' + table.name + ' from archive: ' + e.message);
      }

      if (!mainSheet || !archiveSheet) {
        Logger.log('Bỏ qua bảng ' + table.name + ' do không tồn tại ở main hoặc archive.');
        continue;
      }

      // Batch remove from main and get removed rows (O(1) API calls instead of O(N))
      var removedRows = batchRemoveRows_(mainSheet, table.keyCol, contractId);

      if (removedRows.length > 0) {
        // Write removed rows to archive in single batch
        archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, removedRows.length, removedRows[0].length).setValues(removedRows);
        Logger.log('Đã di chuyển ' + removedRows.length + ' dòng trong bảng ' + table.name + ' sang Archive.');
      }
    }

    // Đảm bảo dữ liệu được commit thành công xuống Sheets vật lý trước khi giải phóng khóa
    SpreadsheetApp.flush();

    Logger.log('Archiving completed for contract ID: ' + contractId);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Gửi email thông báo quy trình ngầm (Non-blocking UI).
 * Được gọi bất đồng bộ từ Frontend sau khi cập nhật trạng thái hợp đồng thành công.
 * @param {string} contractId - Mã hợp đồng.
 * @param {string} eventType - Loại sự kiện (PENDING_LEGAL, LEGAL_COMMENTED, LEGAL_APPROVED, PENDING_HOL, HOL_COMMENTED, HOL_APPROVED).
 * @param {object} [extraData] - Dữ liệu bổ sung (approvedDocUrl, ...).
 * @param {string} token - Session token.
 * @return {object} JSON response.
 */
function sendWorkflowEmail(contractId, eventType, extraData, token) {
  try {
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    var user = session;
    if (!user) {
      return jsonResponse_(false, null, 'Không tìm thấy thông tin người dùng.');
    }

    // Đọc thông tin hợp đồng (tìm active trước, archive sau nếu đã chuyển lưu trữ)
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    var contractRowIndex = getRowByColumn_(contractsSheet, 1, contractId);
    var contractRow = null;

    if (contractRowIndex !== -1) {
      contractRow = contractsSheet.getRange(contractRowIndex, 1, 1, 11).getValues()[0];
    } else {
      try {
        var archiveSs = getArchiveSpreadsheet_();
        if (archiveSs) {
          var archiveSheet = archiveSs.getSheetByName(SHEET_NAMES.CONTRACTS);
          if (archiveSheet) {
            var archiveRowIndex = getRowByColumn_(archiveSheet, 1, contractId);
            if (archiveRowIndex !== -1) {
              contractRow = archiveSheet.getRange(archiveRowIndex, 1, 1, 11).getValues()[0];
            }
          }
        }
      } catch (archLookupErr) {
        Logger.log('Lỗi tra cứu archive trong sendWorkflowEmail: ' + archLookupErr.message);
      }
    }

    if (!contractRow) {
      return jsonResponse_(false, null, 'Không tìm thấy hợp đồng: ' + contractId);
    }

    var contract = {
      contractId: contractId,
      title: contractRow[1],
      supplier: contractRow[2],
      createdBy: contractRow[7]
    };

    var commenterName = user.displayName || user.username;
    var approvedDocUrl = extraData ? (extraData.approvedDocUrl || null) : null;

    switch (eventType) {
      case 'PENDING_LEGAL':
        notifyLegalNewContract_(contract, commenterName);
        break;
      case 'LEGAL_COMMENTED':
        notifyUserFeedback_(contract, commenterName);
        break;
      case 'LEGAL_APPROVED':
      case 'PENDING_HOL':
        notifyHOLReview_(contract);
        break;
      case 'HOL_COMMENTED':
        notifyUserRejectedByHOL_(contract, commenterName);
        break;
      case 'HOL_APPROVED':
        notifyUserApproved_(contract, approvedDocUrl);
        break;
      default:
        Logger.log('sendWorkflowEmail: Bỏ qua eventType không xác định: ' + eventType);
        return jsonResponse_(false, null, 'Loại sự kiện không hỗ trợ: ' + eventType);
    }

    return jsonResponse_(true, { contractId: contractId, eventType: eventType }, 'Email thông báo đã được gửi.');
  } catch (e) {
    Logger.log('Lỗi trong sendWorkflowEmail: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi gửi email: ' + e.message);
  }
}
