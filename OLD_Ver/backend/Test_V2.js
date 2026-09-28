/**
 * Test_V2.gs - Backend Profiler & Micro-Benchmarking Suite
 * 
 * Mục tiêu:
 * - Bóc tách và đo đạc chính xác thời gian thực thi (ms) của từng phân lớp:
 *   1. Lớp I/O Google Sheets & Google Drive (Database / File Storage I/O)
 *   2. Lớp Xử lý Logic Javascript trên RAM (Array Filter, Map, Sort, JSON Parse, Format Date)
 *   3. Lớp Cache & Khóa đồng thời (CacheService RAM Hit/Miss & LockService Contention)
 * - Mô phỏng 100% các thao tác thực tế mà Frontend gọi về Backend qua ApiGateway.
 * - Chu trình Vòng đời Khép kín (Full Lifecycle):
 *   Tạo mẫu (Write) -> Đọc chi tiết (Read) -> Chuyển trạng thái (Workflow) -> Lưu trữ (Archive) -> Đọc lưu trữ (Archived Read) -> Dọn dẹp sạch (Auto-cleanup).
 * - Cam kết: TUYỆT ĐỐI KHÔNG làm bẩn dữ liệu thật, không làm biến đổi cấu trúc bảng (Schema).
 */

// ══════════════════════════════════════════════════════════════════════════════
// 1. BỘ CÔNG CỤ MICRO-PROFILER (STEP TIMER & FORMATTER)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Khởi tạo đối tượng đo lường bước (Micro-Profiler)
 * @param {string} flowTitle - Tên nghiệp vụ đang đo
 * @return {Object} Đối tượng profiler
 */
function createProfiler_(flowTitle) {
  var steps = [];
  var currentStep = null;
  var flowStartTime = Date.now();

  return {
    /**
     * Bắt đầu một bước đo mới
     * @param {string} name - Tên bước
     * @param {string} type - Phân loại: 'SHEETS_IO' | 'DRIVE_IO' | 'JS_LOGIC' | 'CACHE' | 'LOCK'
     */
    startStep: function(name, type) {
      if (currentStep) {
        this.endStep();
      }
      currentStep = {
        name: name,
        type: type || 'JS_LOGIC',
        startTime: Date.now(),
        duration: 0
      };
    },

    /**
     * Kết thúc bước đo hiện tại
     */
    endStep: function() {
      if (currentStep) {
        currentStep.duration = Date.now() - currentStep.startTime;
        steps.push(currentStep);
        currentStep = null;
      }
    },

    /**
     * In báo cáo chi tiết của nghiệp vụ ra Logger
     */
    logReport: function() {
      if (currentStep) {
        this.endStep();
      }
      var totalDuration = Date.now() - flowStartTime;

      Logger.log('┌─────────────────────────────────────────────────────────────────────────────');
      Logger.log('│ 🔍 [PROFILING] ' + flowTitle.toUpperCase());
      Logger.log('├─────────────────────────────────────────────────────────────────────────────');

      steps.forEach(function(s) {
        var pct = totalDuration > 0 ? ((s.duration / totalDuration) * 100).toFixed(1) : '0.0';
        var typeIcon = '⚙️';
        if (s.type === 'SHEETS_IO') typeIcon = '📂 [Sheets I/O]';
        else if (s.type === 'DRIVE_IO') typeIcon = '☁️ [Drive I/O] ';
        else if (s.type === 'CACHE') typeIcon = '💾 [Cache RAM] ';
        else if (s.type === 'LOCK') typeIcon = '🔒 [Lock/Sync] ';
        else typeIcon = '⚙️ [JS Logic] ';

        var perfTag = '⚡ Tốt';
        if (s.duration > 800) perfTag = '⚠️ Điểm nghẽn';
        else if (s.duration > 300) perfTag = '⏱️ Trung bình';

        var formattedDuration = (s.duration + ' ms').padStart(8, ' ');
        var formattedPct = (pct + '%').padStart(6, ' ');

        Logger.log('│ ' + typeIcon + ' ' + s.name.padEnd(38, ' ') + ': ' + formattedDuration + ' (' + formattedPct + ') ' + perfTag);
      });

      Logger.log('├─────────────────────────────────────────────────────────────────────────────');
      Logger.log('│ 👉 TỔNG THỜI GIAN THỰC THI : ' + totalDuration + ' ms');
      Logger.log('└─────────────────────────────────────────────────────────────────────────────\n');

      return {
        title: flowTitle,
        totalDuration: totalDuration,
        steps: steps
      };
    }
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. TẠO DỮ LIỆU MẪU CHUẨN HÓA & TỰ ĐỘNG DỌN DẸP (SANDBOX & AUTO-CLEANUP)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Tạo một bộ dữ liệu mẫu đầy đủ (1 contract, 2 versions, 3 comments, 4 tasks, 5 activities)
 * Đảm bảo mọi bài test Đọc/Ghi/Duyệt đều có dữ liệu chuẩn hóa để đo lường nhất quán.
 */
function seedProfilerStandardData_(contractId, testUser) {
  var ss = getSpreadsheet_();
  var now = new Date();
  var nowStr = formatDateTime_(now);

  // 1. Thêm vào bảng contracts (1 dòng)
  var contractsSheet = ss.getSheetByName(SHEET_NAMES.CONTRACTS);
  if (contractsSheet) {
    contractsSheet.appendRow([
      contractId,
      'Hợp đồng Mẫu Profiling Benchmark ' + now.getTime(),
      'Công ty TNHH Benchmark Solutions',
      'Hợp đồng thử nghiệm đo lường hiệu năng backend V2.',
      STATUS.PENDING_LEGAL,
      2,
      'folder_profiler_dummy',
      testUser.username,
      now,
      now,
      0
    ]);
  }

  // 2. Thêm vào bảng versions (2 dòng)
  var versionsSheet = ss.getSheetByName(SHEET_NAMES.VERSIONS);
  if (versionsSheet) {
    versionsSheet.appendRow([
      contractId, 1, 'file_id_v1', 'hop_dong_v1.docx', 'https://docs.google.com/dummy_v1',
      testUser.username, now, 'INITIAL_UPLOAD', 'Tạo hợp đồng ban đầu', ''
    ]);
    versionsSheet.appendRow([
      contractId, 2, 'file_id_v2', 'hop_dong_v2.docx', 'https://docs.google.com/dummy_v2',
      testUser.username, now, 'REVISED_UPLOAD', 'Cập nhật điều khoản thanh toán', 'Đã đàm phán giảm 5%'
    ]);
  }

  // 3. Thêm vào bảng comments (3 dòng)
  var commentsSheet = ss.getSheetByName(SHEET_NAMES.COMMENTS);
  if (commentsSheet) {
    commentsSheet.appendRow(['cmt_p1', contractId, 1, 'Điều 3.1', 'legal1', nowStr, 'Đề nghị bổ sung phạt vi phạm 8%.', 'LEGAL_COMMENT']);
    commentsSheet.appendRow(['cmt_p2', contractId, 1, 'Điều 3.1', testUser.username, nowStr, 'Đã trao đổi với đối tác và đồng ý 8%.', 'USER_COMMENT']);
    commentsSheet.appendRow(['cmt_p3', contractId, 2, 'Điều 5.2', 'legal1', nowStr, 'Thời hạn thanh toán 30 ngày là hợp lý.', 'LEGAL_COMMENT']);
  }

  // 4. Thêm vào bảng task_list (4 dòng)
  var taskListSheet = ss.getSheetByName(SHEET_NAMES.TASK_LIST);
  if (taskListSheet) {
    taskListSheet.appendRow([contractId, 'task_p1', 'Điều 3.1', 'Thiếu mức phạt vi phạm hợp đồng', 'Must Fix', 'Bổ sung phạt 8% giá trị vi phạm', 'Fixed', 'Đã sửa trong V2', 'Go']);
    taskListSheet.appendRow([contractId, 'task_p2', 'Điều 5.2', 'Thời hạn thanh toán quá ngắn (7 ngày)', 'Must Fix', 'Đổi sang tối thiểu 30 ngày', 'Fixed', 'Đối tác đã đồng ý 30 ngày', 'Go']);
    taskListSheet.appendRow([contractId, 'task_p3', 'Điều 7.1', 'Quy định bảo hành chưa rõ điều kiện loại trừ', 'Nego', 'Bổ sung chi tiết loại trừ hư hỏng do bên A', 'Partial Fixed', 'Đang chờ đối tác xác nhận', 'NoGo']);
    taskListSheet.appendRow([contractId, 'task_p4', 'Điều 10', 'Thẩm quyền giải quyết tranh chấp', 'Accept', 'Chấp nhận Tòa án theo mẫu của đối tác', 'Fixed', 'Đã chấp nhận', 'Go']);
  }

  // 5. Thêm vào bảng activity_log (5 dòng)
  var activitySheet = ss.getSheetByName(SHEET_NAMES.ACTIVITY_LOG);
  if (activitySheet) {
    activitySheet.appendRow([nowStr, contractId, 'CONTRACT_CREATED', testUser.username, 'Tạo mới hợp đồng']);
    activitySheet.appendRow([nowStr, contractId, 'STATUS_CHANGED', testUser.username, 'Chuyển trạng thái sang PENDING_LEGAL']);
    activitySheet.appendRow([nowStr, contractId, 'COMMENT_ADDED', 'legal1', 'Bình luận tại Điều 3.1']);
    activitySheet.appendRow([nowStr, contractId, 'VERSION_UPLOADED', testUser.username, 'Tải lên phiên bản V2']);
    activitySheet.appendRow([nowStr, contractId, 'TASK_LIST_UPDATED', 'legal1', 'Cập nhật danh sách 4 nhiệm vụ rà soát']);
  }
}

/**
 * Dọn dẹp sạch sẽ 100% dữ liệu mẫu sau khi test xong.
 * Quét cả Sheet chính, Sheet Archive, Google Drive, và Cache RAM.
 */
function cleanupProfilerData_(contractId, tempFolderId, sessionTokens) {
  Logger.log('🧹 [CLEANUP] Bắt đầu dọn dẹp dữ liệu mẫu profiler...');

  // 1. Dọn dẹp Google Drive
  if (tempFolderId) {
    try {
      var folder = DriveApp.getFolderById(tempFolderId);
      folder.setTrashed(true);
      Logger.log('   ✅ Đã xóa thư mục test trên Drive vào thùng rác: ' + tempFolderId);
    } catch (e) {
      Logger.log('   ⚠️ Không thể xóa folder Drive tạm: ' + e.message);
    }
  }

  // Helper xóa dòng theo contractId từ dưới lên (tránh lệch index)
  var cleanRowsByContractId = function(sheet, idColIndex) {
    if (!sheet) return;
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    var data = sheet.getRange(1, idColIndex, lastRow, 1).getValues();
    var deletedCount = 0;
    for (var r = data.length - 1; r >= 1; r--) {
      var cellVal = String(data[r][0]);
      if (cellVal === contractId || cellVal.indexOf('CTR-PROFILER-') === 0) {
        sheet.deleteRow(r + 1);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      Logger.log('   ✅ Sheet [' + sheet.getName() + ']: Đã xóa ' + deletedCount + ' dòng test.');
    }
  };

  // 2. Dọn dẹp trên Main Spreadsheet
  try {
    var mainSS = getSpreadsheet_();
    cleanRowsByContractId(mainSS.getSheetByName(SHEET_NAMES.CONTRACTS), 1);
    cleanRowsByContractId(mainSS.getSheetByName(SHEET_NAMES.VERSIONS), 1);
    cleanRowsByContractId(mainSS.getSheetByName(SHEET_NAMES.COMMENTS), 2);
    cleanRowsByContractId(mainSS.getSheetByName(SHEET_NAMES.TASK_LIST), 1);
    cleanRowsByContractId(mainSS.getSheetByName(SHEET_NAMES.ACTIVITY_LOG), 2);
    cleanRowsByContractId(mainSS.getSheetByName(SHEET_NAMES.AI_ANALYSES), 1);
    cleanRowsByContractId(mainSS.getSheetByName(SHEET_NAMES.REFERENCE_FILES), 1);
  } catch (e) {
    Logger.log('   ⚠️ Lỗi dọn dẹp Main Spreadsheet: ' + e.message);
  }

  // 3. Dọn dẹp trên Archive Spreadsheet
  try {
    var archiveSS = getArchiveSpreadsheet_();
    if (archiveSS) {
      cleanRowsByContractId(archiveSS.getSheetByName(SHEET_NAMES.CONTRACTS), 1);
      cleanRowsByContractId(archiveSS.getSheetByName(SHEET_NAMES.VERSIONS), 1);
      cleanRowsByContractId(archiveSS.getSheetByName(SHEET_NAMES.COMMENTS), 2);
      cleanRowsByContractId(archiveSS.getSheetByName(SHEET_NAMES.TASK_LIST), 1);
      cleanRowsByContractId(archiveSS.getSheetByName(SHEET_NAMES.ACTIVITY_LOG), 2);
    }
  } catch (e) {
    Logger.log('   ⚠️ Lỗi dọn dẹp Archive Spreadsheet: ' + e.message);
  }

  // 4. Dọn dẹp CacheService
  try {
    var scriptCache = CacheService.getScriptCache();
    if (sessionTokens && Array.isArray(sessionTokens)) {
      sessionTokens.forEach(function(t) {
        scriptCache.remove(t);
        scriptCache.remove(hashString_(t));
      });
    }
    scriptCache.remove('contract_detail_' + contractId);
    clearChunkedCache_('all_active_contracts');
    clearChunkedCache_('all_archived_contracts');
    Logger.log('   ✅ Đã xóa toàn bộ token & cache tạm trong RAM.');
  } catch (e) {
    Logger.log('   ⚠️ Lỗi dọn dẹp Cache: ' + e.message);
  }

  Logger.log('✨ [CLEANUP HOÀN TẤT] Hệ thống đã trở về trạng thái sạch 100%.\n');
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. CÁC KỊCH BẢN PROFILING CHI TIẾT (BÓC TÁCH TỪNG LỚP)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * KỊCH BẢN 1: Bóc tách luồng Tải Dashboard (getDashboardInit)
 */
function profileDashboardFlow_(token) {
  var profiler = createProfiler_('1. Tải Dashboard & Thống kê (getDashboardInit)');

  // 0. Xóa cache để đo Cold Read
  clearChunkedCache_('all_active_contracts');

  // Bước 1: Mở Spreadsheet và đọc bảng contracts
  profiler.startStep('1. [Sheets I/O] Mở SS & Đọc bảng contracts', 'SHEETS_IO');
  var ss = getSpreadsheet_();
  var contractsSheet = ss.getSheetByName(SHEET_NAMES.CONTRACTS);
  var rawData = contractsSheet.getDataRange().getValues();
  profiler.endStep();

  // Bước 2: Xử lý logic RAM (Map object, filter quyền, tính stats)
  profiler.startStep('2. [JS Logic] Map Object, Filter & Tính Stats', 'JS_LOGIC');
  var contracts = [];
  var stats = { total: 0, draft: 0, pendingLegal: 0, legalApproved: 0, pendingHol: 0, completed: 0 };
  for (var i = 1; i < rawData.length; i++) {
    var row = rawData[i];
    var status = row[4];
    stats.total++;
    if (status === STATUS.DRAFT || status === STATUS.USER_REVISING) stats.draft++;
    else if (status === STATUS.PENDING_LEGAL || status === STATUS.LEGAL_COMMENTED) stats.pendingLegal++;
    else if (status === STATUS.LEGAL_APPROVED) stats.legalApproved++;
    else if (status === STATUS.PENDING_HOL || status === STATUS.HOL_COMMENTED) stats.pendingHol++;
    else if (status === STATUS.HOL_APPROVED || status === STATUS.COMPLETED) stats.completed++;

    contracts.push({
      contractId: row[0],
      title: row[1],
      supplier: row[2],
      status: status,
      currentVersion: row[5]
    });
  }
  profiler.endStep();

  // Bước 3: Lưu CacheService RAM
  profiler.startStep('3. [Cache RAM] Ghi CacheService (Chunking)', 'CACHE');
  putChunkedCache_('all_active_contracts', JSON.stringify(contracts), 300);
  profiler.endStep();

  // Bước 4: Đọc lại từ CacheService (Warm Read)
  profiler.startStep('4. [Cache RAM] Đọc lại từ Cache (Warm Read)', 'CACHE');
  var cachedResult = getChunkedCache_('all_active_contracts');
  profiler.endStep();

  return profiler.logReport();
}

/**
 * KỊCH BẢN 2: Bóc tách luồng Xem Chi Tiết Hợp Đồng (getContractDetail - 6 Bảng)
 */
function profileContractDetailFlow_(contractId, token) {
  var profiler = createProfiler_('2. Xem Chi Tiết Hợp Đồng (getContractDetail - 6 Bảng)');

  // 0. Xóa cache detail để đo Cold Read
  var scriptCache = CacheService.getScriptCache();
  scriptCache.remove('contract_detail_' + contractId);

  // Bước 1: Mở Spreadsheet và tìm dòng hợp đồng chính
  profiler.startStep('1. [Sheets I/O] Tìm dòng hợp đồng trong contracts', 'SHEETS_IO');
  var ss = getSpreadsheet_();
  var contractsSheet = ss.getSheetByName(SHEET_NAMES.CONTRACTS);
  var contractRowIndex = getRowByColumn_(contractsSheet, 1, contractId);
  var contractValues = contractsSheet.getRange(contractRowIndex, 1, 1, contractsSheet.getLastColumn()).getValues()[0];
  profiler.endStep();

  // Bước 2: Đọc dữ liệu từ 6 sheets liên quan (Điểm tốn I/O nhất)
  profiler.startStep('2. [Sheets I/O] Đọc 6 Sheets liên quan (getDataRange)', 'SHEETS_IO');
  var vSheet = ss.getSheetByName(SHEET_NAMES.VERSIONS);
  var cSheet = ss.getSheetByName(SHEET_NAMES.COMMENTS);
  var aSheet = ss.getSheetByName(SHEET_NAMES.ACTIVITY_LOG);
  var aiSheet = ss.getSheetByName(SHEET_NAMES.AI_ANALYSES);
  var tSheet = ss.getSheetByName(SHEET_NAMES.TASK_LIST);
  var rSheet = ss.getSheetByName(SHEET_NAMES.REFERENCE_FILES);

  var vData = vSheet ? vSheet.getDataRange().getValues() : [];
  var cData = cSheet ? cSheet.getDataRange().getValues() : [];
  var aData = aSheet ? aSheet.getDataRange().getValues() : [];
  var aiData = aiSheet ? aiSheet.getDataRange().getValues() : [];
  var tData = tSheet ? tSheet.getDataRange().getValues() : [];
  var rData = rSheet ? rSheet.getDataRange().getValues() : [];
  profiler.endStep();

  // Bước 3: Thuật toán lọc theo contractId, format ngày tháng và sắp xếp
  profiler.startStep('3. [JS Logic] Lọc 6 mảng, Map Object, Format & Sort', 'JS_LOGIC');
  var versions = [];
  for (var v = 1; v < vData.length; v++) {
    if (String(vData[v][0]) === String(contractId)) {
      versions.push({ versionNo: vData[v][1], fileName: vData[v][3], uploadedAt: formatIfDate_(vData[v][6]) });
    }
  }
  versions.sort(function(a, b) { return b.versionNo - a.versionNo; });

  var comments = [];
  for (var c = 1; c < cData.length; c++) {
    if (String(cData[c][1]) === String(contractId)) {
      comments.push({ commentId: cData[c][0], clauseRef: cData[c][3], commentAt: formatIfDate_(cData[c][5]) });
    }
  }

  var tasks = [];
  for (var t = 1; t < tData.length; t++) {
    if (String(tData[t][0]) === String(contractId)) {
      tasks.push({ taskId: tData[t][1], category: tData[t][4], status: tData[t][6] });
    }
  }

  var activities = [];
  for (var a = 1; a < aData.length; a++) {
    if (String(aData[a][1]) === String(contractId)) {
      activities.push({ timestamp: aData[a][0], action: aData[a][2] });
    }
  }

  var detailPayload = {
    contract: { contractId: contractValues[0], title: contractValues[1], status: contractValues[4] },
    versions: versions,
    comments: comments,
    taskList: tasks,
    activities: activities
  };
  profiler.endStep();

  // Bước 4: Lưu vào CacheService RAM
  profiler.startStep('4. [Cache RAM] Ghi Detail vào CacheService RAM', 'CACHE');
  scriptCache.put('contract_detail_' + contractId, JSON.stringify(detailPayload), 300);
  profiler.endStep();

  // Bước 5: Đọc Warm Read từ CacheService RAM
  profiler.startStep('5. [Cache RAM] Đọc Warm Read (Hit RAM ~50ms)', 'CACHE');
  var warmData = JSON.parse(scriptCache.get('contract_detail_' + contractId));
  profiler.endStep();

  return profiler.logReport();
}

/**
 * KỊCH BẢN 3: Bóc tách luồng Tạo Mới Hợp Đồng & Upload Drive (createContract)
 */
function profileCreateContractFlow_(token) {
  var profiler = createProfiler_('3. Tạo Mới Hợp Đồng & Drive (createContract)');
  var config = getConfig_();
  var createdFolder = null;

  // Bước 1: Google Drive I/O (Tạo Folder + Chuyển Base64 thành Blob và ghi file)
  profiler.startStep('1. [Drive I/O] Tạo Folder con + Upload file Blob', 'DRIVE_IO');
  var rootFolder = DriveApp.getFolderById(config.rootFolderId);
  createdFolder = rootFolder.createFolder('CTR-PROFILER-TEMP-' + Date.now());
  var dummyContent = Utilities.base64Encode('Đây là nội dung hợp đồng mẫu đo lường hiệu năng.');
  var blob = Utilities.newBlob(Utilities.base64Decode(dummyContent), 'text/plain', 'hop_dong_demo.txt');
  var createdFile = createdFolder.createFile(blob);
  profiler.endStep();

  // Bước 2: Khóa ScriptLock và Sinh mã hợp đồng
  profiler.startStep('2. [Lock/Sync] LockService & Sinh mã CTR-ID', 'LOCK');
  var newContractId = 'CTR-PROFILER-NEW-' + Date.now();
  profiler.endStep();

  // Bước 3: Ghi vào 3 sheets (contracts, versions, activity_log)
  profiler.startStep('3. [Sheets I/O] Append 3 dòng vào 3 Sheets', 'SHEETS_IO');
  var ss = getSpreadsheet_();
  var now = new Date();
  var nowStr = formatDateTime_(now);

  var contractsSheet = ss.getSheetByName(SHEET_NAMES.CONTRACTS);
  contractsSheet.appendRow([newContractId, 'Hợp đồng đo lường Write', 'Nhà cung cấp Test', 'Mô tả', STATUS.DRAFT, 1, createdFolder.getId(), 'user1', now, now, 0]);

  var versionsSheet = ss.getSheetByName(SHEET_NAMES.VERSIONS);
  versionsSheet.appendRow([newContractId, 1, createdFile.getId(), 'hop_dong_demo.txt', createdFile.getUrl(), 'user1', now, 'UPLOAD', 'Tạo ban đầu', '']);

  var activitySheet = ss.getSheetByName(SHEET_NAMES.ACTIVITY_LOG);
  activitySheet.appendRow([nowStr, newContractId, 'CONTRACT_CREATED', 'user1', 'Tạo hợp đồng test']);
  profiler.endStep();

  // Bước 4: Invalidate Cache
  profiler.startStep('4. [Cache RAM] Xóa Invalidate Dashboard Cache', 'CACHE');
  clearChunkedCache_('all_active_contracts');
  profiler.endStep();

  var report = profiler.logReport();

  // Xóa ngay hợp đồng vừa tạo này
  try {
    createdFolder.setTrashed(true);
    var cRow = getRowByColumn_(contractsSheet, 1, newContractId);
    if (cRow !== -1) contractsSheet.deleteRow(cRow);
    var vRow = getRowByColumn_(versionsSheet, 1, newContractId);
    if (vRow !== -1) versionsSheet.deleteRow(vRow);
    var aRow = getRowByColumn_(activitySheet, 2, newContractId);
    if (aRow !== -1) activitySheet.deleteRow(aRow);
  } catch (e) {}

  return report;
}

/**
 * KỊCH BẢN 4: Bóc tách luồng Tương tác Task List (saveTaskList / submitTaskList)
 */
function profileTaskListFlow_(contractId, tokenLegal) {
  var profiler = createProfiler_('4. Cập Nhật & Lưu Danh Sách Task (saveTaskList)');
  var ss = getSpreadsheet_();
  var taskListSheet = ss.getSheetByName(SHEET_NAMES.TASK_LIST);

  // Bước 1: Đọc và xác định các dòng task cũ cần thay thế
  profiler.startStep('1. [Sheets I/O] Đọc sheet task_list & Tìm dòng cũ', 'SHEETS_IO');
  var rawData = taskListSheet.getDataRange().getValues();
  var rowsToDelete = [];
  for (var i = rawData.length - 1; i >= 1; i--) {
    if (String(rawData[i][0]) === String(contractId)) {
      rowsToDelete.push(i + 1);
    }
  }
  profiler.endStep();

  // Bước 2: Chuẩn bị dữ liệu và ghi Batch (Bulk write) vào sheet
  profiler.startStep('2. [Sheets I/O] Batch Update ghi 4 tasks mới vào Sheet', 'SHEETS_IO');
  var newTasksData = [
    [contractId, 'task_p1', 'Điều 3.1', 'Thiếu mức phạt vi phạm', 'Must Fix', 'Bổ sung phạt 8%', 'Fixed', 'Đã sửa', 'Go'],
    [contractId, 'task_p2', 'Điều 5.2', 'Thời hạn thanh toán ngắn', 'Must Fix', 'Đổi sang 30 ngày', 'Fixed', 'Đã sửa', 'Go'],
    [contractId, 'task_p3', 'Điều 7.1', 'Bảo hành chưa rõ', 'Nego', 'Bổ sung loại trừ', 'Partial Fixed', 'Đang sửa', 'NoGo'],
    [contractId, 'task_p4', 'Điều 10', 'Thẩm quyền Tòa án', 'Accept', 'Chấp nhận mẫu', 'Fixed', 'Đồng ý', 'Go']
  ];
  if (newTasksData.length > 0) {
    var startRow = taskListSheet.getLastRow() + 1;
    taskListSheet.getRange(startRow, 1, newTasksData.length, newTasksData[0].length).setValues(newTasksData);
  }
  profiler.endStep();

  // Bước 3: Cập nhật trạng thái hợp đồng & Ghi activity log
  profiler.startStep('3. [Sheets I/O] Cập nhật trạng thái hợp đồng & Ghi Log', 'SHEETS_IO');
  var contractsSheet = ss.getSheetByName(SHEET_NAMES.CONTRACTS);
  var cRow = getRowByColumn_(contractsSheet, 1, contractId);
  if (cRow !== -1) {
    contractsSheet.getRange(cRow, 5).setValue(STATUS.USER_REVISING);
  }
  var actSheet = ss.getSheetByName(SHEET_NAMES.ACTIVITY_LOG);
  actSheet.appendRow([formatDateTime_(new Date()), contractId, 'TASK_LIST_SUBMITTED', 'legal1', 'Gửi 4 task yêu cầu user chỉnh sửa']);
  profiler.endStep();

  // Bước 4: Invalidate Cache
  profiler.startStep('4. [Cache RAM] Xóa Cache Detail & Dashboard', 'CACHE');
  CacheService.getScriptCache().remove('contract_detail_' + contractId);
  clearChunkedCache_('all_active_contracts');
  profiler.endStep();

  return profiler.logReport();
}

/**
 * KỊCH BẢN 5: Bóc tách luồng Phê Duyệt Hoàn Tất & Tự Động Di Dời (HOL Approve & Auto-Archive)
 */
function profileWorkflowAndArchiveFlow_(contractId, tokenHOL) {
  var profiler = createProfiler_('5. Phê Duyệt & Di Dời Lưu Trữ (HOL Approve -> Archive)');

  var mainSS = getSpreadsheet_();
  var archiveSS = getArchiveSpreadsheet_();

  // Bước 1: Cập nhật trạng thái sang HOL_APPROVED trên Main SS
  profiler.startStep('1. [Main SS] Cập nhật STATUS.HOL_APPROVED + Ghi log', 'SHEETS_IO');
  var mainContracts = mainSS.getSheetByName(SHEET_NAMES.CONTRACTS);
  var cRow = getRowByColumn_(mainContracts, 1, contractId);
  if (cRow !== -1) {
    mainContracts.getRange(cRow, 5).setValue(STATUS.HOL_APPROVED);
  }
  var mainAct = mainSS.getSheetByName(SHEET_NAMES.ACTIVITY_LOG);
  mainAct.appendRow([formatDateTime_(new Date()), contractId, 'STATUS_CHANGED', 'hol1', 'Phê duyệt hoàn tất hợp đồng']);
  profiler.endStep();

  // Bước 2: Mở Spreadsheet Lưu trữ riêng (Archive SS)
  profiler.startStep('2. [Archive I/O] Mở Spreadsheet Archive phụ', 'SHEETS_IO');
  var archiveContracts = archiveSS.getSheetByName(SHEET_NAMES.CONTRACTS);
  profiler.endStep();

  // Bước 3: Đọc dữ liệu từ Main SS và sao chép sang Archive SS (Data Migration)
  profiler.startStep('3. [Migration I/O] Copy dữ liệu 5 bảng sang Archive SS', 'SHEETS_IO');
  // Copy Contract row
  if (cRow !== -1) {
    var cData = mainContracts.getRange(cRow, 1, 1, mainContracts.getLastColumn()).getValues();
    archiveContracts.getRange(archiveContracts.getLastRow() + 1, 1, 1, cData[0].length).setValues(cData);
  }
  profiler.endStep();

  // Bước 4: Xóa các dòng đã chuyển trên Main SS (Data Cleanup)
  profiler.startStep('4. [Cleanup I/O] Xóa dữ liệu hợp đồng trên Main SS', 'SHEETS_IO');
  if (cRow !== -1) {
    mainContracts.deleteRow(cRow);
  }
  profiler.endStep();

  // Bước 5: Invalidate cả 2 Cache (Active & Archive)
  profiler.startStep('5. [Cache RAM] Xóa Cache Active & Archive RAM', 'CACHE');
  CacheService.getScriptCache().remove('contract_detail_' + contractId);
  clearChunkedCache_('all_active_contracts');
  clearChunkedCache_('all_archived_contracts');
  profiler.endStep();

  return profiler.logReport();
}

/**
 * KỊCH BẢN 6: Bóc tách luồng Tra cứu Hợp đồng đã Lưu trữ (getArchivedContracts)
 */
function profileArchivedContractsFlow_(token) {
  var profiler = createProfiler_('6. Tra Cứu Hợp Đồng Lưu Trữ (getArchivedContracts)');

  // 0. Xóa cache archive để đo Cold Read
  clearChunkedCache_('all_archived_contracts');

  // Bước 1: Mở Archive SS và đọc toàn bộ bảng contracts
  profiler.startStep('1. [Archive I/O] Mở Archive SS & Đọc bảng contracts', 'SHEETS_IO');
  var archiveSS = getArchiveSpreadsheet_();
  var archiveContractsSheet = archiveSS.getSheetByName(SHEET_NAMES.CONTRACTS);
  var rawData = archiveContractsSheet ? archiveContractsSheet.getDataRange().getValues() : [];
  profiler.endStep();

  // Bước 2: Xử lý logic RAM (Map object & format)
  profiler.startStep('2. [JS Logic] Map Object & Format dữ liệu', 'JS_LOGIC');
  var archivedList = [];
  if (rawData.length > 1) {
    for (var i = 1; i < rawData.length; i++) {
      archivedList.push({
        contractId: rawData[i][0],
        title: rawData[i][1],
        supplier: rawData[i][2],
        status: rawData[i][4],
        currentVersion: rawData[i][5]
      });
    }
  }
  profiler.endStep();

  // Bước 3: Lưu CacheService RAM
  profiler.startStep('3. [Cache RAM] Ghi CacheService RAM (Chunking)', 'CACHE');
  putChunkedCache_('all_archived_contracts', JSON.stringify(archivedList), 600);
  profiler.endStep();

  // Bước 4: Đọc Warm Read từ CacheService RAM
  profiler.startStep('4. [Cache RAM] Đọc Warm Read từ Cache (Hit RAM)', 'CACHE');
  var cachedArchived = getChunkedCache_('all_archived_contracts');
  profiler.endStep();

  return profiler.logReport();
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. HÀM CHẠY TỔNG HỢP VÀ IN BẢNG TỔNG KẾT (SCORECARD)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * 🚀 HÀM CHÍNH: CHẠY TOÀN BỘ BENCHMARK & IN BẢNG TỔNG KẾT HIỆU NĂNG
 * Chọn hàm này trong Apps Script Editor và bấm Run.
 */
function runAllBackendProfilers() {
  Logger.log('╔═════════════════════════════════════════════════════════════════════════════╗');
  Logger.log('║        🚀 BẮT ĐẦU CHẠY BACKEND PROFILER & BENCHMARK SUITE (V2)             ║');
  Logger.log('╚═════════════════════════════════════════════════════════════════════════════╝\n');

  var benchmarkStartTime = Date.now();
  var contractId = 'CTR-PROFILER-' + Date.now();
  var tempFolderId = null;

  // 1. Tạo session giả lập cho 3 vai trò
  var tokenUser = 'token_profiler_user_' + Date.now();
  var tokenLegal = 'token_profiler_legal_' + Date.now();
  var tokenHOL = 'token_profiler_hol_' + Date.now();

  var sessionUser = { valid: true, username: 'profiler_user', role: ROLES.USER, email: 'user@foodempire.vn', displayName: 'Test User' };
  var sessionLegal = { valid: true, username: 'profiler_legal', role: ROLES.LEGAL, email: 'legal@foodempire.vn', displayName: 'Test Legal' };
  var sessionHOL = { valid: true, username: 'profiler_hol', role: ROLES.HOL, email: 'hol@foodempire.vn', displayName: 'Test HOL' };

  var scriptCache = CacheService.getScriptCache();
  scriptCache.put(hashString_(tokenUser), JSON.stringify(sessionUser), 600);
  scriptCache.put(hashString_(tokenLegal), JSON.stringify(sessionLegal), 600);
  scriptCache.put(hashString_(tokenHOL), JSON.stringify(sessionHOL), 600);

  var summaryReports = [];

  try {
    // 2. Tạo Data Sample chuẩn hóa ban đầu
    Logger.log('📦 [SETUP] Đang khởi tạo Bộ Dữ Liệu Mẫu Chuẩn Hóa (' + contractId + ')...');
    seedProfilerStandardData_(contractId, sessionUser);
    Logger.log('   ✅ Khởi tạo thành công: 1 contract, 2 versions, 3 comments, 4 tasks, 5 activity logs.\n');

    // 3. Chạy lần lượt 6 kịch bản profiling
    summaryReports.push(profileDashboardFlow_(tokenUser));
    summaryReports.push(profileContractDetailFlow_(contractId, tokenLegal));
    summaryReports.push(profileCreateContractFlow_(tokenUser));
    summaryReports.push(profileTaskListFlow_(contractId, tokenLegal));
    summaryReports.push(profileWorkflowAndArchiveFlow_(contractId, tokenHOL));
    summaryReports.push(profileArchivedContractsFlow_(tokenUser));

    // 4. In Bảng Tổng Kết Scorecard
    var totalTime = ((Date.now() - benchmarkStartTime) / 1000).toFixed(2);
    Logger.log('\n╔═════════════════════════════════════════════════════════════════════════════╗');
    Logger.log('║                   📊 BẢNG TỔNG KẾT HIỆU NĂNG BACKEND (SCORECARD)            ║');
    Logger.log('╠═════════════════════════════════════════════════════════════════════════════╣');

    summaryReports.forEach(function(rep, idx) {
      var timeStr = (rep.totalDuration + ' ms').padStart(10, ' ');
      var rating = '⚡ Xuất sắc';
      if (rep.totalDuration > 1500) rating = '⚠️ Cần tối ưu';
      else if (rep.totalDuration > 800) rating = '⏱️ Khá';

      Logger.log('║ ' + (idx + 1) + '. ' + rep.title.padEnd(46, ' ') + ': ' + timeStr + ' | ' + rating);
    });

    Logger.log('╠═════════════════════════════════════════════════════════════════════════════╣');
    Logger.log('║ 👉 TỔNG THỜI GIAN BENCHMARK: ' + totalTime.padStart(6, ' ') + ' giây                                      ║');
    Logger.log('╚═════════════════════════════════════════════════════════════════════════════╝\n');

  } catch (err) {
    Logger.log('❌ [LỖI TRONG QUÁ TRÌNH PROFILING]: ' + err.message);
    Logger.log(err.stack);
  } finally {
    // 5. Luôn luôn dọn dẹp sạch sẽ 100%
    cleanupProfilerData_(contractId, tempFolderId, [tokenUser, tokenLegal, tokenHOL]);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. CÁC HÀM TIỆN ÍCH CHẠY LẺ TỪNG NGHIỆP VỤ
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Chỉ đo đạc riêng luồng Tải Dashboard
 */
function profileDashboardOnly() {
  var token = 'test_token_' + Date.now();
  CacheService.getScriptCache().put(hashString_(token), JSON.stringify({ valid: true, username: 'user1', role: ROLES.USER }), 300);
  try {
    profileDashboardFlow_(token);
  } finally {
    CacheService.getScriptCache().remove(hashString_(token));
  }
}

/**
 * Chỉ đo đạc riêng luồng Xem Chi Tiết Hợp Đồng (với Data Sample chuẩn)
 */
function profileContractDetailOnly() {
  var contractId = 'CTR-PROFILER-DETAIL-' + Date.now();
  var user = { valid: true, username: 'profiler_user', role: ROLES.LEGAL };
  var token = 'test_token_' + Date.now();
  CacheService.getScriptCache().put(hashString_(token), JSON.stringify(user), 300);

  try {
    seedProfilerStandardData_(contractId, user);
    profileContractDetailFlow_(contractId, token);
  } finally {
    cleanupProfilerData_(contractId, null, [token]);
  }
}

/**
 * Chỉ đo đạc riêng luồng Tạo Hợp Đồng & Upload Drive
 */
function profileCreateContractOnly() {
  var token = 'test_token_' + Date.now();
  CacheService.getScriptCache().put(hashString_(token), JSON.stringify({ valid: true, username: 'user1', role: ROLES.USER }), 300);
  try {
    profileCreateContractFlow_(token);
  } finally {
    CacheService.getScriptCache().remove(hashString_(token));
  }
}
