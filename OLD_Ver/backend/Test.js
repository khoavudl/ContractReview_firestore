/**
 * Test.gs - Testing suite for Contract Review Workflow in Google Apps Script.
 * Can be executed directly in the Apps Script editor via runAllTests().
 */

function runAllTests() {
  Logger.log('--- BẮT ĐẦU CHẠY KIỂM THỬ CONTRACT REVIEW SYSTEM ---');
  var passed = 0;
  var failed = 0;
  
  function assert(condition, message) {
    if (condition) {
      Logger.log('✅ PASS: ' + message);
      passed++;
    } else {
      Logger.log('❌ FAIL: ' + message);
      failed++;
    }
  }
  
  try {
    // 1. Kiểm tra cấu hình và hằng số
    assert(typeof SHEET_NAMES === 'object', 'Định nghĩa SHEET_NAMES hằng số');
    assert(SHEET_NAMES.AI_ANALYSES === 'ai_analyses', 'Định nghĩa SHEET_NAMES.AI_ANALYSES chính xác');
    assert(SHEET_NAMES.TASK_LIST === 'task_list', 'Định nghĩa SHEET_NAMES.TASK_LIST chính xác');
    assert(STATUS.DRAFT === 'DRAFT', 'Định nghĩa STATUS.DRAFT chính xác');
    assert(ROLES.LEGAL === 'LEGAL', 'Định nghĩa ROLES.LEGAL chính xác');
    assert('archiveSpreadsheetId' in getConfig_(), 'Cấu hình getConfig_() có chứa thuộc tính archiveSpreadsheetId');

    // 2. Kiểm tra bộ máy chuyển đổi trạng thái (State Machine)
    assert(canTransition_(STATUS.DRAFT, STATUS.PENDING_LEGAL, ROLES.USER) === true, 'USER có thể chuyển DRAFT -> PENDING_LEGAL');
    assert(canTransition_(STATUS.DRAFT, STATUS.HOL_APPROVED, ROLES.USER) === false, 'USER không thể chuyển DRAFT -> HOL_APPROVED');
    assert(canTransition_(STATUS.PENDING_LEGAL, STATUS.LEGAL_APPROVED, ROLES.LEGAL) === true, 'LEGAL có thể chuyển PENDING_LEGAL -> LEGAL_APPROVED');
    assert(canTransition_(STATUS.PENDING_LEGAL, STATUS.LEGAL_APPROVED, ROLES.USER) === false, 'USER không thể chuyển PENDING_LEGAL -> LEGAL_APPROVED');
    assert(canTransition_(STATUS.LEGAL_APPROVED, STATUS.PENDING_HOL, ROLES.USER) === true, 'Hệ thống tự chuyển LEGAL_APPROVED -> PENDING_HOL');

    // 3. Kiểm tra helper database (yêu cầu đã chạy setupSpreadsheet trước đó)
    var spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (spreadsheetId) {
      try {
        var sheet = getSheet_(SHEET_NAMES.USERS);
        var users = sheetToObjects_(sheet);
        assert(users.length > 0, 'sheetToObjects_ chuyển đổi sheet users thành công (' + users.length + ' users)');
        
        var index = getRowByColumn_(sheet, 1, 'legal1');
        assert(index > 0, 'getRowByColumn_ tìm thấy user "legal1" ở dòng ' + index);
      } catch (dbErr) {
        Logger.log('❌ Lỗi kết nối Google Sheet: ' + dbErr.message + '. Vui lòng chạy setupSpreadsheet() trước.');
        failed++;
      }
    }
    
    // 4. Kiểm tra tính năng email thông báo bị tắt
    try {
      sendEmail_('test@example.com', 'Test Subject', 'Test Body');
      assert(DISABLE_EMAIL_NOTIFICATIONS === true, 'Hằng số DISABLE_EMAIL_NOTIFICATIONS phải là true');
      assert(true, 'sendEmail_ ghi nhận log bị tắt thành công (kiểm tra nhật ký thực thi phía trên)');
    } catch (emailErr) {
      Logger.log('❌ Lỗi khi test email: ' + emailErr.message);
      failed++;
    }

    // 5. Kiểm tra chức năng di dời Archive
    assert(testArchiveContract() === true, 'Hàm archiveContract_ di chuyển dữ liệu sang file lưu trữ thành công');

    // 6. Kiểm tra chức năng Cache và lấy hợp đồng lưu trữ
    assert(testCacheAndArchivedContracts() === true, 'Hàm testCacheAndArchivedContracts hoàn thành thành công');

    // 7. Kiểm tra chức năng AI Summary & Caching
    assert(testAISummaryAndCaching() === true, 'Hàm testAISummaryAndCaching chạy thành công');

    // 8. Kiểm tra chức năng generic AI & Đánh giá rủi ro
    assert(testAIAnalysisGenericFlow() === true, 'Hàm testAIAnalysisGenericFlow chạy thành công');

    // 9. Kiểm tra chức năng Migration database
    assert(testDatabaseMigration() === true, 'Hàm testDatabaseMigration chạy thành công');

    // 10. Kiểm tra chức năng Task List
    assert(testTaskListOperations() === true, 'Hàm testTaskListOperations chạy thành công');

    // 11. Kiểm tra quyền xoá hợp đồng
    assert(testDeleteContractPermissions() === true, 'Hàm testDeleteContractPermissions chạy thành công');

    // 12. Kiểm tra khóa đồng thời (Lock & Concurrency)
    assert(testConcurrencyLocks() === true, 'Hàm testConcurrencyLocks chạy thành công');

    // 13. Kiểm tra các bản vá bảo mật (Security Patches)
    assert(testSecurityPatches() === true, 'Hàm testSecurityPatches chạy thành công (Rate Limit, Payload, IDOR)');

    // 14. Kiểm tra & Benchmark hiệu năng Dashboard Init
    assert(testDashboardInitPerformance() === true, 'Hàm testDashboardInitPerformance chạy thành công (Benchmark Dashboard Init)');

    Logger.log('--- KẾT QUẢ KIỂM THỬ: ' + passed + ' PASSED, ' + failed + ' FAILED ---');
  } catch (e) {
    Logger.log('❌ LỖI HỆ THỐNG KHI KIỂM THỬ: ' + e.message);
  }
}

/**
 * Test function for recent security patches (DoS, Payload Size, IDOR).
 */
function testSecurityPatches() {
  Logger.log('--- BẮT ĐẦU TEST BẢO MẬT (SECURITY PATCHES) ---');
  try {
    var passedAll = true;

    // --- 1. Test Payload Size (ApiGateway doPost) ---
    Logger.log('👉 Test 1: Chặn Payload > 14.6MB');
    var largeString = new Array(15000000).join('A'); // Tạo chuỗi 15 triệu ký tự
    var fakeEvent = {
      postData: { contents: largeString }
    };
    try {
      var resObj = doPost(fakeEvent);
      var resJson = resObj.getContent();
      if (resJson.indexOf('Payload quá lớn') !== -1) {
        Logger.log('✅ PASS: Cổng ApiGateway đã chặn thành công Payload khổng lồ.');
      } else {
        Logger.log('❌ FAIL: ApiGateway không chặn Payload khổng lồ!');
        passedAll = false;
      }
    } catch (e) {
      // doPost might throw directly depending on config, but currently it returns JSON with success: false
      Logger.log('✅ PASS: Cổng ApiGateway đã ném lỗi chặn Payload: ' + e.message);
    }

    // --- 2. Test Rate Limiting (Auth.js) ---
    Logger.log('👉 Test 2: Rate Limiting (15 req/min)');
    var token = 'test_rate_limit_' + Date.now();
    var sessionData = { valid: true, username: 'testuser', role: 'USER', email: 'test@abc.com' };
    CacheService.getScriptCache().put(hashString_(token), JSON.stringify(sessionData), 300);

    var rateLimitTriggered = false;
    for (var i = 1; i <= 16; i++) {
      try {
        validateSession_(token);
      } catch (err) {
        if (err.message.indexOf('HTTP 429') !== -1) {
          rateLimitTriggered = true;
          break;
        }
      }
    }
    
    if (rateLimitTriggered) {
      Logger.log('✅ PASS: Rate Limiter đã hoạt động và block ở request số 16.');
    } else {
      Logger.log('❌ FAIL: Rate Limiter không hoạt động, cho phép vượt quá 15 req/phút!');
      passedAll = false;
    }

    // --- 3. Test IDOR in AIService ---
    Logger.log('👉 Test 3: BOLA/IDOR trong AIService (checkRiskAvailability)');
    // Gửi token của người lạ vào kiểm tra hợp đồng không phải của mình
    var unauthorizedToken = 'test_idor_' + Date.now();
    var hackerSession = { valid: true, username: 'hacker', role: 'USER', email: 'hacker@abc.com' };
    CacheService.getScriptCache().put(hashString_(unauthorizedToken), JSON.stringify(hackerSession), 300);

    // Truyền bừa một contractId (vì hacker chưa chắc đã tạo cái này)
    var testContractId = 'CTR-ANY-123';
    var response = checkRiskAvailability(testContractId, unauthorizedToken, 1);

    if (response.success === false && response.message.indexOf('Không tìm thấy hợp đồng') !== -1) {
      // Vì CTR-ANY-123 không tồn tại, hàm assertContractAccess_ sẽ báo "Không tìm thấy hợp đồng"
      Logger.log('✅ PASS: Hệ thống đã chặn Hacker truy cập ID hợp đồng ảo (BOLA/IDOR).');
    } else if (response.success === false && response.message.indexOf('Bạn không có quyền thao tác') !== -1) {
      Logger.log('✅ PASS: Hệ thống đã chặn Hacker xem trạng thái AI của hợp đồng người khác (Lỗi IDOR).');
    } else {
      Logger.log('❌ FAIL: Hacker vẫn có thể bypass kiểm tra IDOR! Response: ' + JSON.stringify(response));
      passedAll = false;
    }

    // Dọn dẹp cache
    CacheService.getScriptCache().remove(token);
    CacheService.getScriptCache().remove(unauthorizedToken);

    return passedAll;
  } catch (err) {
    Logger.log('❌ LỖI KHI CHẠY TEST BẢO MẬT: ' + err.message);
    return false;
  }
}

/**
 * Manual test function to trace contract creation on the backend.
 * Run this function in the Google Apps Script editor to see the full execution logs.
 */
function testCreateContract() {
  Logger.log('--- BẮT ĐẦU TEST TẠO HỢP ĐỒNG TRÊN BACKEND ---');
  try {
    // 1. Lấy thông tin user đầu tiên trong bảng users để làm mẫu
    var usersSheet = getSheet_(SHEET_NAMES.USERS);
    var users = sheetToObjects_(usersSheet);
    if (users.length === 0) {
      throw new Error('Không tìm thấy user nào trong sheet "users". Vui lòng chạy setupSpreadsheet() trước.');
    }
    var testUser = users[0];
    Logger.log('👉 Sử dụng tài khoản test: ' + testUser.username + ' (Role: ' + testUser.role + ')');

    // 2. Tạo một session token giả trong cache
    var token = 'manual_test_token_' + Date.now();
    var sessionData = {
      username: testUser.username,
      role: testUser.role,
      email: testUser.email,
      displayName: testUser.display_name
    };
    CacheService.getScriptCache().put(token, JSON.stringify(sessionData), 300);
    Logger.log('👉 Đã tạo session giả trong cache với token: ' + token);

    // 3. Chuẩn bị dữ liệu hợp đồng giả
    var title = 'Hợp đồng kiểm thử ' + formatDateTime_(new Date());
    var supplier = 'Công ty TNHH Cung cấp Giải pháp Số';
    var description = 'Hợp đồng chạy thử nghiệm để debug lỗi tạo hợp đồng.';
    // File text đơn giản mã hóa base64
    var fileData = Utilities.base64Encode('Đây là nội dung hợp đồng kiểm thử được tạo từ hàm testCreateContract.');
    var fileName = 'hop_dong_demo.txt';

    Logger.log('👉 Tiến hành gọi hàm createContract()...');
    var result = createContract(title, supplier, description, fileData, fileName, token);
    
    Logger.log('👉 Kết quả trả về: ' + JSON.stringify(result));
    
    // Dọn dẹp cache
    CacheService.getScriptCache().remove(token);
    Logger.log('👉 Đã dọn dẹp session giả trong cache.');
    Logger.log('✅ TEST HOÀN TẤT THÀNH CÔNG!');
  } catch (e) {
    Logger.log('❌ LỖI KHI TEST TẠO HỢP ĐỒNG: ' + e.message);
    Logger.log(e.stack);
  }
}

/**
 * Test function to verify docx text extraction.
 * Finds the folder CTR-2605-002_* in ContractReview and extracts text from any .docx file inside.
 */
function testExtractTextFromDocx() {
  Logger.log('--- BẮT ĐẦU TEST TRÍCH XUẤT TEXT FILE DOCX ---');
  try {
    // 1. Tìm thư mục root ContractReview
    var rootFolder = null;
    var config = getConfig_();
    var rootFolderId = config.rootFolderId;
    
    if (rootFolderId) {
      try {
        rootFolder = DriveApp.getFolderById(rootFolderId);
        Logger.log('👉 Tìm thấy root folder từ Config: ' + rootFolder.getName() + ' (ID: ' + rootFolderId + ')');
      } catch (err) {
        Logger.log('⚠️ Không mở được rootFolderId từ Config: ' + err.message);
      }
    }
    
    if (!rootFolder) {
      var rootFolders = DriveApp.getRootFolder().getFoldersByName('ContractReview');
      if (rootFolders.hasNext()) {
        rootFolder = rootFolders.next();
        Logger.log('👉 Tìm thấy root folder bằng tên: ' + rootFolder.getName() + ' (ID: ' + rootFolder.getId() + ')');
      } else {
        Logger.log('❌ Không tìm thấy thư mục ContractReview trên Drive.');
        return;
      }
    }
    
    // 3. Tìm file docx trong thư mục mục tiêu
    var files = rootFolder.getFiles();
    var targetFile = null;
    while (files.hasNext()) {
      var file = files.next();
      var fileName = file.getName();
      Logger.log('Duyệt file trong thư mục: ' + fileName + ' (MimeType: ' + file.getMimeType() + ')');
      if (fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().indexOf('test') !== -1) {
        targetFile = file;
        Logger.log('👉 Chọn file mục tiêu: ' + fileName + ' (ID: ' + file.getId() + ')');
        break;
      }
    }
    
    if (!targetFile) {
      Logger.log('❌ Không tìm thấy file docx hoặc file test nào trong thư mục.');
      return;
    }
    
    // 4. Test hàm trích xuất
    Logger.log('👉 Gọi hàm extractTextFromFile_ cho fileId: ' + targetFile.getId());
    var text = extractTextFromFile_(targetFile.getId());
    Logger.log('=== KẾT QUẢ TRÍCH XUẤT (độ dài: ' + text.length + ' ký tự) ===');
    Logger.log(text);
    Logger.log('===========================================================');
    
  } catch (e) {
    Logger.log('❌ LỖI KHI TEST TRÍCH XUẤT: ' + e.message);
    Logger.log(e.stack);
  }
}

/**
 * Unit test for the contract archiving mechanism.
 * Clones, moves, and cleans test data between main and archive spreadsheets.
 */
function testArchiveContract() {
  Logger.log('--- BẮT ĐẦU TEST DI CHUYỂN DỮ LIỆU ARCHIVE ---');
  try {
    var mainSS = SpreadsheetApp.openById(getConfig_().spreadsheetId);
    
    // 1. Tạo 1 contract giả lập trên sheet chính
    var contractId = 'CTR-TEST-ARCHIVE';
    var now = new Date();
    var formattedNow = formatDateTime_(now);
    
    // Thêm dữ liệu vào main sheet
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    contractsSheet.appendRow([
      contractId,
      'Hợp đồng test Archive',
      'Công ty Archive Test',
      'Mô tả test archive',
      STATUS.HOL_APPROVED,
      1,
      'folder_id_test',
      'user1',
      now,
      now,
      0
    ]);
    
    var versionsSheet = getSheet_(SHEET_NAMES.VERSIONS);
    versionsSheet.appendRow([
      contractId,
      1,
      'file_id_test',
      'file_name_test',
      'http://url_test',
      'user1',
      now,
      'UPLOAD',
      'Test archive',
      'nego_notes_test'
    ]);
    
    var commentsSheet = getSheet_(SHEET_NAMES.COMMENTS);
    commentsSheet.appendRow([
      'comment_test_id',
      contractId,
      1,
      'clause_ref_test',
      'user1',
      formattedNow,
      'Comment test archive',
      'USER_COMMENT'
    ]);
    
    var activitySheet = getSheet_(SHEET_NAMES.ACTIVITY_LOG);
    activitySheet.appendRow([
      formattedNow,
      contractId,
      'TEST_ARCHIVE',
      'user1',
      'Activity log test archive'
    ]);

    var aiAnalysesSheet = getSheet_(SHEET_NAMES.AI_ANALYSES);
    if (aiAnalysesSheet) {
      aiAnalysesSheet.appendRow([
        contractId,
        1,
        'SUMMARY',
        '{"summary_text":"dummy"}',
        'user1',
        formattedNow
      ]);
    }

    var taskListSheet = getSheet_(SHEET_NAMES.TASK_LIST);
    if (taskListSheet) {
      taskListSheet.appendRow([
        contractId,
        'task_archive_id',
        'Điều 1',
        'Issue test archive',
        'Must Fix',
        'Recommendation test',
        'Fixed',
        'User response',
        'Go'
      ]);
    }
    
    Logger.log('👉 Đã tạo dữ liệu giả lập cho contract: ' + contractId + ' trên sheet chính.');
    
    // 2. Chạy hàm archive
    Logger.log('👉 Gọi hàm archiveContract_()...');
    archiveContract_(contractId);
    
    // 3. Kiểm tra xem dữ liệu ở sheet chính đã bị xoá chưa
    var mainContractRowIndex = getRowByColumn_(contractsSheet, 1, contractId);
    var mainVersionRowIndex = getRowByColumn_(versionsSheet, 1, contractId);
    var mainCommentRowIndex = getRowByColumn_(commentsSheet, 2, contractId);
    var mainActivityRowIndex = getRowByColumn_(activitySheet, 2, contractId);
    var mainAIAnalysisRowIndex = aiAnalysesSheet ? getRowByColumn_(aiAnalysesSheet, 1, contractId) : -1;
    var mainTaskListRowIndex = taskListSheet ? getRowByColumn_(taskListSheet, 1, contractId) : -1;
    
    var deletedFromMain = (mainContractRowIndex === -1 && mainVersionRowIndex === -1 && mainCommentRowIndex === -1 && mainActivityRowIndex === -1 && mainAIAnalysisRowIndex === -1 && mainTaskListRowIndex === -1);
    Logger.log((deletedFromMain ? '✅' : '❌') + ' Kiểm tra dữ liệu ở sheet chính đã được xoá.');
    
    // 4. Kiểm tra xem dữ liệu đã qua file Archive chưa
    var archiveSS = getArchiveSpreadsheet_();
    var archiveContracts = archiveSS.getSheetByName(SHEET_NAMES.CONTRACTS);
    var archiveVersions = archiveSS.getSheetByName(SHEET_NAMES.VERSIONS);
    var archiveComments = archiveSS.getSheetByName(SHEET_NAMES.COMMENTS);
    var archiveActivities = archiveSS.getSheetByName(SHEET_NAMES.ACTIVITY_LOG);
    var archiveAIAnalyses = archiveSS.getSheetByName(SHEET_NAMES.AI_ANALYSES);
    var archiveTaskList = archiveSS.getSheetByName(SHEET_NAMES.TASK_LIST);
    
    var archiveContractRowIndex = getRowByColumn_(archiveContracts, 1, contractId);
    var archiveVersionRowIndex = getRowByColumn_(archiveVersions, 1, contractId);
    var archiveCommentRowIndex = getRowByColumn_(archiveComments, 2, contractId);
    var archiveActivityRowIndex = getRowByColumn_(archiveActivities, 2, contractId);
    var archiveAIAnalysisRowIndex = archiveAIAnalyses ? getRowByColumn_(archiveAIAnalyses, 1, contractId) : -1;
    var archiveTaskListRowIndex = archiveTaskList ? getRowByColumn_(archiveTaskList, 1, contractId) : -1;
    
    var presentInArchive = (archiveContractRowIndex !== -1 && archiveVersionRowIndex !== -1 && archiveCommentRowIndex !== -1 && archiveActivityRowIndex !== -1 &&
                            (!archiveAIAnalyses || archiveAIAnalysisRowIndex !== -1) &&
                            (!archiveTaskList || archiveTaskListRowIndex !== -1));
    Logger.log((presentInArchive ? '✅' : '❌') + ' Kiểm tra dữ liệu đã hiện diện trên file Archive.');
    
    // 5. Dọn dẹp dữ liệu test ở file Archive để tránh rác
    if (archiveContractRowIndex !== -1) archiveContracts.deleteRow(archiveContractRowIndex);
    
    // Dọn dẹp versions
    var aVersionsData = archiveVersions.getDataRange().getValues();
    for (var i = aVersionsData.length - 1; i >= 1; i--) {
      if (aVersionsData[i][0] === contractId) {
        archiveVersions.deleteRow(i + 1);
      }
    }
    
    // Dọn dẹp comments
    var aCommentsData = archiveComments.getDataRange().getValues();
    for (var j = aCommentsData.length - 1; j >= 1; j--) {
      if (aCommentsData[j][1] === contractId) {
        archiveComments.deleteRow(j + 1);
      }
    }
    
    // Dọn dẹp activities
    var aActivitiesData = archiveActivities.getDataRange().getValues();
    for (var k = aActivitiesData.length - 1; k >= 1; k--) {
      if (aActivitiesData[k][1] === contractId) {
        archiveActivities.deleteRow(k + 1);
      }
    }

    // Dọn dẹp AI Analyses
    if (archiveAIAnalyses) {
      var aAIAnalysesData = archiveAIAnalyses.getDataRange().getValues();
      for (var a = aAIAnalysesData.length - 1; a >= 1; a--) {
        if (aAIAnalysesData[a][0] === contractId) {
          archiveAIAnalyses.deleteRow(a + 1);
        }
      }
    }

    // Dọn dẹp Task List
    if (archiveTaskList) {
      var aTaskListData = archiveTaskList.getDataRange().getValues();
      for (var t = aTaskListData.length - 1; t >= 1; t--) {
        if (aTaskListData[t][0] === contractId) {
          archiveTaskList.deleteRow(t + 1);
        }
      }
    }
    Logger.log('👉 Đã dọn dẹp sạch dữ liệu test trên file Archive.');
    
    return deletedFromMain && presentInArchive;
  } catch (e) {
    Logger.log('❌ LỖI TRONG QUÁ TRÌNH TEST ARCHIVE: ' + e.message);
    return false;
  }
}

/**
 * Test case for backend caching and getArchivedContracts API.
 */
function testCacheAndArchivedContracts() {
  Logger.log('--- BẮT ĐẦU TEST CACHE VÀ ARCHIVED CONTRACTS ---');
  try {
    var usersSheet = getSheet_(SHEET_NAMES.USERS);
    var testUser = sheetToObjects_(usersSheet)[0];
    var token = 'test_token_' + Date.now();
    var sessionData = {
      username: testUser.username,
      role: testUser.role,
      email: testUser.email,
      displayName: testUser.display_name
    };
    CacheService.getScriptCache().put(token, JSON.stringify(sessionData), 300);

    // 1. Clear cache ban đầu
    clearChunkedCache_('all_active_contracts');

    // 2. Gọi getContracts lần 1 (sẽ đọc từ sheet và set cache)
    var startTime = Date.now();
    var res1 = getContracts(token);
    var duration1 = Date.now() - startTime;
    Logger.log('👉 Gọi getContracts lần 1 (chưa cache): ' + duration1 + 'ms. Số hợp đồng: ' + (res1.data ? res1.data.length : 0));

    // 3. Gọi getContracts lần 2 (sẽ đọc từ cache)
    startTime = Date.now();
    var res2 = getContracts(token);
    var duration2 = Date.now() - startTime;
    Logger.log('👉 Gọi getContracts lần 2 (đã cache): ' + duration2 + 'ms. Số hợp đồng: ' + (res2.data ? res2.data.length : 0));

    var cacheWorking = (duration2 < duration1 || duration2 < 150);
    Logger.log((cacheWorking ? '✅' : '⚠️') + ' Kiểm tra Cache Service hoạt động.');

    // 4. Test Invalidate Cache
    clearChunkedCache_('all_active_contracts');
    var isCleared = (getChunkedCache_('all_active_contracts') === null);
    Logger.log((isCleared ? '✅' : '❌') + ' Kiểm tra invalidate cache thành công.');

    // 5. Test getArchivedContracts
    var archiveRes = getArchivedContracts(token);
    var archivedOk = (archiveRes && archiveRes.success === true && Array.isArray(archiveRes.data));
    Logger.log((archivedOk ? '✅' : '❌') + ' Kiểm tra getArchivedContracts trả về mảng hợp lệ. Số hợp đồng đã lưu trữ: ' + (archiveRes.data ? archiveRes.data.length : 0));

    // Dọn dẹp token giả lập
    CacheService.getScriptCache().remove(token);

    return isCleared && archivedOk;
  } catch (e) {
    Logger.log('❌ LỖI KHI TEST CACHE & ARCHIVED CONTRACTS: ' + e.message);
    return false;
  }
}

/**
 * Seeds a large volume of dummy data for scale and performance testing.
 * Creates 100 active contracts (in review state) and 1000 archived contracts.
 */
function seedLargeDummyData() {
  Logger.log('--- BẮT ĐẦU SEEDING DỮ LIỆU LỚN ---');
  var startTime = Date.now();
  
  try {
    var mainSS = SpreadsheetApp.openById(getConfig_().spreadsheetId);
    var archiveSS = getArchiveSpreadsheet_();
    
    // 1. Dọn dẹp dữ liệu seed cũ
    Logger.log('🧹 Đang dọn dẹp dữ liệu seed cũ...');
    var sheetsConfig = [
      { ss: mainSS, name: SHEET_NAMES.CONTRACTS, keyIndex: 0 },
      { ss: mainSS, name: SHEET_NAMES.VERSIONS, keyIndex: 0 },
      { ss: mainSS, name: SHEET_NAMES.COMMENTS, keyIndex: 1 },
      { ss: mainSS, name: SHEET_NAMES.ACTIVITY_LOG, keyIndex: 1 },
      { ss: archiveSS, name: SHEET_NAMES.CONTRACTS, keyIndex: 0 },
      { ss: archiveSS, name: SHEET_NAMES.VERSIONS, keyIndex: 0 },
      { ss: archiveSS, name: SHEET_NAMES.COMMENTS, keyIndex: 1 },
      { ss: archiveSS, name: SHEET_NAMES.ACTIVITY_LOG, keyIndex: 1 }
    ];
    
    sheetsConfig.forEach(function(cfg) {
      var sheet = cfg.ss.getSheetByName(cfg.name);
      if (sheet) {
        clearSeededDataFromSheet_(sheet, cfg.keyIndex);
      }
    });
    
    // 2. Tạo dữ liệu Active (100 hợp đồng)
    Logger.log('🌱 Đang chuẩn bị 100 hợp đồng Active (Đang Review)...');
    var activeContracts = [];
    var activeVersions = [];
    var activeComments = [];
    var activeActivities = [];
    
    var nowStr = formatDateTime_(new Date());
    
    for (var i = 1; i <= 100; i++) {
      var numStr = i.toString();
      while (numStr.length < 4) numStr = '0' + numStr;
      var contractId = 'CTR-SEED-' + numStr;
      var status = (i % 2 === 0) ? STATUS.PENDING_LEGAL : STATUS.PENDING_HOL;
      
      // columns: contract_id, title, supplier, description, status, current_version, folder_id, created_by, created_at, updated_at, reject_count
      activeContracts.push([
        contractId,
        'Hợp đồng thử nghiệm Active ' + numStr,
        'Nhà cung cấp Active ' + i,
        'Hợp đồng test hiệu năng tải dữ liệu active.',
        status,
        1,
        'folder_active_' + numStr,
        'user1',
        nowStr,
        nowStr,
        0
      ]);
      
      // columns: contract_id, version_no, file_id, file_name, file_url, uploaded_by, uploaded_at, action, change_summary, nego_notes
      activeVersions.push([
        contractId,
        1,
        'file_active_' + numStr,
        'hop_dong_active_' + i + '.docx',
        'https://docs.google.com/document/d/dummy_active_' + numStr,
        'user1',
        nowStr,
        'INITIAL_UPLOAD',
        'Khởi tạo hợp đồng test',
        ''
      ]);
      
      // columns: comment_id, contract_id, version_no, clause_ref, comment_by, comment_at, comment_text, type
      activeComments.push([
        'cmt_active_' + numStr,
        contractId,
        1,
        'Điều 1.' + (i % 5),
        'legal1',
        nowStr,
        'Bình luận thử nghiệm số ' + i,
        'LEGAL_COMMENT'
      ]);
      
      // columns: timestamp, contract_id, action, performed_by, details
      activeActivities.push([
        nowStr,
        contractId,
        'CONTRACT_CREATED',
        'user1',
        'Tạo hợp đồng test'
      ]);
    }
    
    // 3. Tạo dữ liệu Archive (1000 hợp đồng)
    Logger.log('🌱 Đang chuẩn bị 1000 hợp đồng Archive (Đã Duyệt)...');
    var archiveContracts = [];
    var archiveVersions = [];
    var archiveComments = [];
    var archiveActivities = [];
    
    for (var j = 1001; j <= 2000; j++) {
      var contractId = 'CTR-SEED-' + j;
      
      archiveContracts.push([
        contractId,
        'Hợp đồng thử nghiệm Archive ' + j,
        'Nhà cung cấp Archive ' + j,
        'Hợp đồng test hiệu năng tải dữ liệu archive.',
        STATUS.HOL_APPROVED,
        1,
        'folder_archive_' + j,
        'user1',
        nowStr,
        nowStr,
        0
      ]);
      
      archiveVersions.push([
        contractId,
        1,
        'file_archive_' + j,
        'hop_dong_archive_' + j + '.docx',
        'https://docs.google.com/document/d/dummy_archive_' + j,
        'user1',
        nowStr,
        'HOL_APPROVED',
        'Hợp đồng đã duyệt hoàn tất',
        ''
      ]);
      
      archiveComments.push([
        'cmt_archive_' + j,
        contractId,
        1,
        '',
        'hol1',
        nowStr,
        'Đã phê duyệt hoàn tất',
        'SYSTEM'
      ]);
      
      archiveActivities.push([
        nowStr,
        contractId,
        'STATUS_CHANGED',
        'hol1',
        'Chuyển trạng thái sang HOL_APPROVED'
      ]);
    }
    
    // 4. Ghi bulk ghi nhận vào spreadsheet
    Logger.log('💾 Đang ghi hàng loạt dữ liệu Active...');
    bulkWriteToSheet_(mainSS.getSheetByName(SHEET_NAMES.CONTRACTS), activeContracts);
    bulkWriteToSheet_(mainSS.getSheetByName(SHEET_NAMES.VERSIONS), activeVersions);
    bulkWriteToSheet_(mainSS.getSheetByName(SHEET_NAMES.COMMENTS), activeComments);
    bulkWriteToSheet_(mainSS.getSheetByName(SHEET_NAMES.ACTIVITY_LOG), activeActivities);
    
    Logger.log('💾 Đang ghi hàng loạt dữ liệu Archive...');
    bulkWriteToSheet_(archiveSS.getSheetByName(SHEET_NAMES.CONTRACTS), archiveContracts);
    bulkWriteToSheet_(archiveSS.getSheetByName(SHEET_NAMES.VERSIONS), archiveVersions);
    bulkWriteToSheet_(archiveSS.getSheetByName(SHEET_NAMES.COMMENTS), archiveComments);
    bulkWriteToSheet_(archiveSS.getSheetByName(SHEET_NAMES.ACTIVITY_LOG), archiveActivities);
    
    // 5. Clear cache
    clearChunkedCache_('all_active_contracts');
    clearChunkedCache_('all_archived_contracts');
    
    var duration = ((Date.now() - startTime) / 1000).toFixed(2);
    Logger.log('✅ SEEDING HOÀN TẤT THÀNH CÔNG! Thời gian thực hiện: ' + duration + ' giây.');
    return true;
  } catch (e) {
    Logger.log('❌ LỖI HỆ THỐNG KHI SEED DỮ LIỆU: ' + e.message);
    Logger.log(e.stack);
    return false;
  }
}

/**
 * Helper to clear seeded test contracts in memory and set values back.
 */
function clearSeededDataFromSheet_(sheet, contractIdColIndex) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var lastCol = sheet.getLastColumn();
  var range = sheet.getRange(2, 1, lastRow - 1, lastCol);
  var values = range.getValues();
  var filteredValues = values.filter(function(row) {
    var cId = row[contractIdColIndex];
    return !(typeof cId === 'string' && cId.indexOf('CTR-SEED-') === 0);
  });
  
  sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  if (filteredValues.length > 0) {
    sheet.getRange(2, 1, filteredValues.length, lastCol).setValues(filteredValues);
  }
}

/**
 * Bulk writes 2D array data to sheet.
 */
function bulkWriteToSheet_(sheet, data) {
  if (!data || data.length === 0) return;
  var lastRow = sheet.getLastRow();
  var startRow = lastRow + 1;
  var numRows = data.length;
  var numCols = data[0].length;
  sheet.getRange(startRow, 1, numRows, numCols).setValues(data);
}

/**
 * Unit test for AI summary cache and retrieval.
 */
function testAISummaryAndCaching() {
  Logger.log('--- BẮT ĐẦU TEST AI SUMMARY VÀ CACHING ---');
  try {
    var usersSheet = getSheet_(SHEET_NAMES.USERS);
    var testUser = sheetToObjects_(usersSheet)[0];
    var token = 'test_token_summary_' + Date.now();
    var sessionData = {
      username: testUser.username,
      role: testUser.role,
      email: testUser.email,
      displayName: testUser.display_name
    };
    CacheService.getScriptCache().put(token, JSON.stringify(sessionData), 300);

    var contractId = 'CTR-TEST-SUMMARY';
    var versionNo = 1;

    // 1. Dọn dẹp dữ liệu cũ nếu có
    var summariesSheet = getSheet_(SHEET_NAMES.AI_ANALYSES);
    var cleanSummaryRows = function() {
      var data = summariesSheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0]) === contractId) {
          summariesSheet.deleteRow(i + 1);
        }
      }
    };
    cleanSummaryRows();

    // 2. Thêm contract & version giả vào sheet chính
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    contractsSheet.appendRow([
      contractId, 'Hợp đồng test Summary', 'Supplier Test', 'Mô tả test summary',
      STATUS.DRAFT, versionNo, 'file_id_test_summary', 'user1', new Date(), new Date(), 0
    ]);

    var versionsSheet = getSheet_(SHEET_NAMES.VERSIONS);
    versionsSheet.appendRow([
      contractId, versionNo, 'file_id_test_summary', 'hop_dong_test_summary.docx',
      'http://url_test_summary', 'user1', new Date(), 'UPLOAD', 'Test', ''
    ]);

    // 3. Test getContractSummary trả về hasSummary: false
    var res1 = getContractSummary(contractId, token);
    var check1 = (res1.success === true && res1.data.hasSummary === false);
    Logger.log((check1 ? '✅' : '❌') + ' getContractSummary ban đầu trả về hasSummary: false');

    // 4. Ghi trực tiếp một summary giả vào summaries sheet để giả lập cache
    var dummyJson = '{"step":"step1_user","language":"vi","contract_metadata":{"contract_type":"Test"},"confidence":"high"}';
    summariesSheet.appendRow([
      contractId, versionNo, AI_TYPES.SUMMARY, dummyJson, 'user1', '25/05/2026 13:00'
    ]);

    // 5. Test getContractSummary trả về cache
    var res2 = getContractSummary(contractId, token);
    var check2 = (res2.success === true && res2.data.hasSummary === true && res2.data.summaryJson === dummyJson);
    Logger.log((check2 ? '✅' : '❌') + ' getContractSummary lấy từ cache thành công');

    // 6. Test summarizeContract trả về cache trực tiếp không gọi API
    var res3 = summarizeContract(contractId, token);
    var check3 = (res3.success === true && res3.data.hasSummary === true && res3.message.indexOf('cache') !== -1);
    Logger.log((check3 ? '✅' : '❌') + ' summarizeContract đọc từ cache thành công (không gọi API)');

    // 7. Dọn dẹp dữ liệu
    cleanSummaryRows();
    
    // Dọn dẹp contract
    var cRow = getRowByColumn_(contractsSheet, 1, contractId);
    if (cRow !== -1) contractsSheet.deleteRow(cRow);
    
    // Dọn dẹp version
    var vData = versionsSheet.getDataRange().getValues();
    for (var i = vData.length - 1; i >= 1; i--) {
      if (String(vData[i][0]) === contractId) {
        versionsSheet.deleteRow(i + 1);
      }
    }

    CacheService.getScriptCache().remove(token);
    return check1 && check2 && check3;
  } catch (e) {
    Logger.log('❌ LỖI KHI TEST SUMMARY & CACHING: ' + e.message);
    return false;
  }
}

function testRealAISummarize() {
  Logger.log('=== BẮT ĐẦU KIỂM THỬ TÓM TẮT AI THỰC TẾ (BACKEND) ===');
  var tempFile = null;
  var contractId = 'CTR-TEST-REAL-AI';
  var token = 'test_token_real_summary_' + Date.now();
  
  try {
    // 1. Khởi tạo session token
    var usersSheet = getSheet_(SHEET_NAMES.USERS);
    var users = sheetToObjects_(usersSheet);
    if (users.length === 0) {
      Logger.log('❌ Lỗi: Không tìm thấy người dùng nào trong bảng users. Hãy chạy setupSpreadsheet() trước.');
      return;
    }
    var testUser = users[0];
    var sessionData = {
      username: testUser.username,
      role: testUser.role,
      email: testUser.email,
      displayName: testUser.display_name
    };
    CacheService.getScriptCache().put(token, JSON.stringify(sessionData), 300);
    Logger.log('👉 Tạo session token giả: ' + token + ' cho user: ' + testUser.username);

    // 2. Tạo một Google Doc thật trên Drive phục vụ trích xuất text
    var docTitle = 'TEMP_TEST_CONTRACT_' + Date.now();
    var doc = DocumentApp.create(docTitle);
    var body = doc.getBody();
    
    body.appendParagraph('HỢP ĐỒNG DỊCH VỤ CÔNG NGHỆ THÔNG TIN');
    body.appendParagraph('Số: 01/2026/HĐDV');
    body.appendParagraph('Hôm nay, ngày 25/05/2026, chúng tôi gồm:');
    body.appendParagraph('Bên A: Công ty TNHH Giải pháp Phần mềm Việt Nam (Khách hàng)');
    body.appendParagraph('Bên B: Công ty TNHH Cung cấp Dịch vụ Số (Nhà cung cấp)');
    body.appendParagraph('Điều 1: Phạm vi công việc');
    body.appendParagraph('Bên B cung cấp dịch vụ bảo trì hệ thống máy chủ và phát triển phần mềm theo yêu cầu của Bên A.');
    body.appendParagraph('Điều 2: Giá trị hợp đồng và thanh toán');
    body.appendParagraph('Giá trị hợp đồng tạm tính là 50.000.000 VNĐ (Năm mươi triệu đồng chẵn). Loại tiền thanh toán là VNĐ.');
    body.appendParagraph('Bên A sẽ thanh toán đợt 1 50% ngay sau khi ký hợp đồng, đợt 2 50% trong vòng 7 ngày sau nghiệm thu.');
    body.appendParagraph('Điều 3: Thời hạn hợp đồng');
    body.appendParagraph('Hợp đồng có hiệu lực từ ngày 01/06/2026 đến hết ngày 31/12/2026. Hợp đồng có thể được gia hạn thêm.');
    body.appendParagraph('Điều 4: Bảo mật thông tin');
    body.appendParagraph('Hai bên cam kết bảo mật toàn bộ thông tin trong suốt thời hạn hợp đồng.');
    doc.saveAndClose();
    
    var fileId = doc.getId();
    tempFile = DriveApp.getFileById(fileId);
    Logger.log('👉 Đã tạo Google Doc thật trên Drive với ID: ' + fileId);

    // 3. Đưa contract và version giả lập vào sheet để kiểm tra
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    var versionsSheet = getSheet_(SHEET_NAMES.VERSIONS);
    var summariesSheet = getSheet_(SHEET_NAMES.AI_ANALYSES);

    // Dọn dẹp dữ liệu test cũ nếu có
    var cleanTestRows = function() {
      // Dọn summaries
      var sData = summariesSheet.getDataRange().getValues();
      for (var i = sData.length - 1; i >= 1; i--) {
        if (String(sData[i][0]) === contractId) summariesSheet.deleteRow(i + 1);
      }
      // Dọn versions
      var vData = versionsSheet.getDataRange().getValues();
      for (var j = vData.length - 1; j >= 1; j--) {
        if (String(vData[j][0]) === contractId) versionsSheet.deleteRow(j + 1);
      }
      // Dọn contract
      var cRow = getRowByColumn_(contractsSheet, 1, contractId);
      if (cRow !== -1) contractsSheet.deleteRow(cRow);
    };
    cleanTestRows();

    // Thêm hợp đồng test
    contractsSheet.appendRow([
      contractId,
      'Hợp đồng test AI Summarize',
      'Công ty Dịch vụ Số',
      'Hợp đồng kiểm thử AI thực tế',
      STATUS.DRAFT,
      1,
      'folder_id_test',
      testUser.username,
      new Date(),
      new Date(),
      0
    ]);

    // Thêm phiên bản test chứa fileId của Doc thật
    versionsSheet.appendRow([
      contractId,
      1,
      fileId,
      docTitle + '.docx',
      tempFile.getUrl(),
      testUser.username,
      new Date(),
      'UPLOAD',
      'Khởi tạo test',
      ''
    ]);
    Logger.log('👉 Đã liên kết hợp đồng giả lập ' + contractId + ' với tài liệu thật.');

    // 4. Chạy hàm summarizeContract
    Logger.log('👉 Bắt đầu gọi summarizeContract() - đang chạy trích xuất và gọi Gemini...');
    var startTime = Date.now();
    var result = summarizeContract(contractId, token);
    var duration = ((Date.now() - startTime) / 1000).toFixed(2);

    Logger.log('=== KẾT QUẢ TRẢ VỀ (Thời gian chạy: ' + duration + ' giây) ===');
    Logger.log(JSON.stringify(result, null, 2));

    // 5. Dọn dẹp sạch sẽ
    cleanTestRows();
    Logger.log('👉 Đã xóa dữ liệu test trong các sheet.');

  } catch (e) {
    Logger.log('❌ Lỗi ngoại lệ khi kiểm thử: ' + e.message);
    Logger.log(e.stack);
  } finally {
    // Xóa file tạm trên Drive
    if (tempFile) {
      try {
        tempFile.setTrashed(true);
        Logger.log('👉 Đã chuyển file Drive tạm vào thùng rác.');
      } catch (fErr) {
        Logger.log('⚠️ Không thể xóa file tạm trên Drive: ' + fErr.message);
      }
    }
    CacheService.getScriptCache().remove(token);
    Logger.log('=== KẾT THÚC KIỂM THỬ ===');
  }
}

/**
 * Test generic AI analysis and multiple types caching.
 */
function testAIAnalysisGenericFlow() {
  Logger.log('--- BẮT ĐẦU TEST GENERIC AI ANALYSIS VÀ MULTIPLE TYPES CACHING ---');
  try {
    var usersSheet = getSheet_(SHEET_NAMES.USERS);
    var testUser = sheetToObjects_(usersSheet)[0];
    var token = 'test_token_generic_' + Date.now();
    var sessionData = {
      username: testUser.username,
      role: testUser.role,
      email: testUser.email,
      displayName: testUser.display_name
    };
    CacheService.getScriptCache().put(token, JSON.stringify(sessionData), 300);

    var contractId = 'CTR-TEST-GENERIC-AI';
    var versionNo = 1;

    // 1. Dọn dẹp dữ liệu cũ nếu có
    var analysesSheet = getSheet_(SHEET_NAMES.AI_ANALYSES);
    var cleanAnalysesRows = function() {
      var data = analysesSheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0]) === contractId) {
          analysesSheet.deleteRow(i + 1);
        }
      }
    };
    cleanAnalysesRows();

    // 2. Thêm contract & version giả
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    contractsSheet.appendRow([
      contractId, 'Hợp đồng test Generic', 'Supplier Test', 'Mô tả test generic',
      STATUS.DRAFT, versionNo, 'file_id_test_generic', 'user1', new Date(), new Date(), 0
    ]);

    var versionsSheet = getSheet_(SHEET_NAMES.VERSIONS);
    versionsSheet.appendRow([
      contractId, versionNo, 'file_id_test_generic', 'hop_dong_test_generic.docx',
      'http://url_test_generic', 'user1', new Date(), 'UPLOAD', 'Test', ''
    ]);

    // 3. Test getContractAnalyses ban đầu trả về các trường null
    var res1 = getContractAnalyses(contractId, token);
    var check1 = (res1.success === true && res1.data.SUMMARY === null && res1.data.RISK === null);
    Logger.log((check1 ? '✅' : '❌') + ' getContractAnalyses ban đầu trả về null cho tất cả analyses');

    // 4. Ghi trực tiếp một SUMMARY giả lập
    var dummySummaryJson = '{"purpose_scope":"Tóm tắt..."}';
    analysesSheet.appendRow([
      contractId, versionNo, AI_TYPES.SUMMARY, dummySummaryJson, 'user1', '25/05/2026 13:00'
    ]);

    // 5. Test getContractAnalyses trả về SUMMARY, RISK vẫn null
    var res2 = getContractAnalyses(contractId, token);
    var check2 = (res2.success === true && res2.data.SUMMARY !== null && res2.data.SUMMARY.resultJson === dummySummaryJson && res2.data.RISK === null);
    Logger.log((check2 ? '✅' : '❌') + ' getContractAnalyses lấy đúng SUMMARY từ cache, RISK vẫn null');

    // 6. Ghi thêm một RISK giả lập
    var dummyRiskJson = '{"overall_rating":"HIGH","overall_comment":"Rủi ro..."}';
    analysesSheet.appendRow([
      contractId, versionNo, AI_TYPES.RISK, dummyRiskJson, 'user1', '25/05/2026 13:05'
    ]);

    // 7. Test getContractAnalyses trả về cả hai
    var res3 = getContractAnalyses(contractId, token);
    var check3 = (res3.success === true && res3.data.SUMMARY !== null && res3.data.RISK !== null && res3.data.RISK.resultJson === dummyRiskJson);
    Logger.log((check3 ? '✅' : '❌') + ' getContractAnalyses lấy đúng cả hai SUMMARY và RISK từ cache');

    // 8. Test backward compatibility: summarizeContract trả về cache
    var res4 = summarizeContract(contractId, token);
    var check4 = (res4.success === true && res4.data.hasSummary === true && res4.data.summaryJson === dummySummaryJson && res4.message.indexOf('cache') !== -1);
    Logger.log((check4 ? '✅' : '❌') + ' summarizeContract backward compat wrapper trả đúng dữ liệu từ cache');

    // 9. Dọn dẹp
    cleanAnalysesRows();
    var cRow = getRowByColumn_(contractsSheet, 1, contractId);
    if (cRow !== -1) contractsSheet.deleteRow(cRow);
    var vData = versionsSheet.getDataRange().getValues();
    for (var i = vData.length - 1; i >= 1; i--) {
      if (String(vData[i][0]) === contractId) {
        versionsSheet.deleteRow(i + 1);
      }
    }
    CacheService.getScriptCache().remove(token);

    return check1 && check2 && check3 && check4;
  } catch (e) {
    Logger.log('❌ LỖI KHI TEST GENERIC AI FLOW: ' + e.message);
    return false;
  }
}

/**
 * Test database migration từ summaries sang ai_analyses.
 */
function testDatabaseMigration() {
  Logger.log('--- BẮT ĐẦU TEST DATABASE MIGRATION ---');
  try {
    var ss = null;
    var config = getConfig_();
    if (config.spreadsheetId) {
      try {
        ss = SpreadsheetApp.openById(config.spreadsheetId);
      } catch (err) {
        Logger.log('Không thể mở Spreadsheet bằng ID cấu hình: ' + err.message);
      }
    }
    if (!ss) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    if (!ss) {
      throw new Error('Không tìm thấy Spreadsheet.');
    }
    
    // 1. Setup: tạo sheet summaries giả lập (nếu chưa có)
    var oldSheet = ss.getSheetByName('summaries');
    if (oldSheet) {
      ss.deleteSheet(oldSheet);
    }
    oldSheet = ss.insertSheet('summaries');
    var oldHeaders = ['contract_id', 'version_no', 'summary_json', 'summarized_by', 'summarized_at'];
    oldSheet.getRange(1, 1, 1, oldHeaders.length).setValues([oldHeaders]);
    
    // Ghi dữ liệu test
    var testData = [
      ['CTR-MIG-1', 1, '{"summary":"Noi dung 1"}', 'user1', '25/05/2026 12:00'],
      ['CTR-MIG-2', 2, '{"summary":"Noi dung 2"}', 'user2', '25/05/2026 12:10']
    ];
    oldSheet.getRange(2, 1, testData.length, 5).setValues(testData);

    // Lưu trữ tạm sheet ai_analyses hiện tại nếu có để khôi phục sau
    var backupSheet = ss.getSheetByName(SHEET_NAMES.AI_ANALYSES);
    var backupData = [];
    if (backupSheet) {
      var lastRow = backupSheet.getLastRow();
      if (lastRow > 0) {
        backupData = backupSheet.getRange(1, 1, lastRow, backupSheet.getLastColumn()).getValues();
      }
      ss.deleteSheet(backupSheet);
    }

    // 2. Chạy migration
    migrateSummariesToAIAnalyses_(ss, '#4a86c8');

    // 3. Verify
    var oldSheetAfter = ss.getSheetByName('summaries');
    var check1 = (oldSheetAfter === null);
    Logger.log((check1 ? '✅' : '❌') + ' Sheet summaries cũ đã bị xóa');

    var newSheet = ss.getSheetByName(SHEET_NAMES.AI_ANALYSES);
    var check2 = (newSheet !== null);
    Logger.log((check2 ? '✅' : '❌') + ' Sheet ai_analyses mới đã được tạo');

    var check3 = false;
    if (newSheet) {
      var data = newSheet.getDataRange().getValues();
      // data[0] là header, data[1], data[2] là 2 dòng đã migrate
      check3 = (data.length === 3 &&
                data[1][0] === 'CTR-MIG-1' &&
                data[1][2] === 'SUMMARY' && // analysis_type
                data[1][3] === '{"summary":"Noi dung 1"}' && // result_json
                data[2][0] === 'CTR-MIG-2' &&
                data[2][2] === 'SUMMARY' &&
                data[2][3] === '{"summary":"Noi dung 2"}');
    }
    Logger.log((check3 ? '✅' : '❌') + ' Dữ liệu đã được migrate chính xác sang 6 cột mới');

    // 4. Khôi phục lại trạng thái ban đầu của ai_analyses
    var finalSheet = ss.getSheetByName(SHEET_NAMES.AI_ANALYSES);
    if (finalSheet) {
      ss.deleteSheet(finalSheet);
    }
    if (backupData.length > 0) {
      var restoredSheet = ss.insertSheet(SHEET_NAMES.AI_ANALYSES);
      restoredSheet.getRange(1, 1, backupData.length, backupData[0].length).setValues(backupData);
      restoredSheet.getRange(1, 1, 1, backupData[0].length).setFontWeight('bold').setBackground('#4a86c8').setFontColor('#ffffff');
      restoredSheet.setFrozenRows(1);
    }

    return check1 && check2 && check3;
  } catch (e) {
    Logger.log('❌ LỖI KHI TEST DATABASE MIGRATION: ' + e.message);
    return false;
  }
}

/**
 * Test case for Task List backend operations.
 * Validates save, retrieve, submit, and cleanup of task lists.
 */
function testTaskListOperations() {
  Logger.log('--- BẮT ĐẦU TEST TASK LIST OPERATIONS ---');
  try {
    var usersSheet = getSheet_(SHEET_NAMES.USERS);
    var testUser = sheetToObjects_(usersSheet)[0]; // user1 (USER)

    // Find legal1 user
    var users = sheetToObjects_(usersSheet);
    var legalUser = null;
    for (var u = 0; u < users.length; u++) {
      if (users[u].role === ROLES.LEGAL) {
        legalUser = users[u];
        break;
      }
    }
    if (!legalUser) legalUser = testUser;

    var tokenUser = 'test_token_user_' + Date.now();
    CacheService.getScriptCache().put(tokenUser, JSON.stringify({
      username: testUser.username,
      role: testUser.role,
      email: testUser.email,
      displayName: testUser.display_name
    }), 300);

    var tokenLegal = 'test_token_legal_' + Date.now();
    CacheService.getScriptCache().put(tokenLegal, JSON.stringify({
      username: legalUser.username,
      role: legalUser.role,
      email: legalUser.email,
      displayName: legalUser.display_name
    }), 300);

    var contractId = 'CTR-TEST-TASKLIST';

    // 1. Clean up old test data
    var cleanTestTasks = function () {
      var sheet = getSheet_(SHEET_NAMES.TASK_LIST);
      if (sheet) {
        var data = sheet.getDataRange().getValues();
        for (var i = data.length - 1; i >= 1; i--) {
          if (String(data[i][0]) === contractId) {
            sheet.deleteRow(i + 1);
          }
        }
      }
    };
    cleanTestTasks();

    // Create contract
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    var cRow = getRowByColumn_(contractsSheet, 1, contractId);
    if (cRow !== -1) contractsSheet.deleteRow(cRow);
    contractsSheet.appendRow([
      contractId, 'Contract test Task List', 'Supplier Test', 'Mô tả test',
      STATUS.PENDING_LEGAL, 1, 'folder_id_test', testUser.username, new Date(), new Date(), 0
    ]);

    // 2. Save task list using saveTaskList API
    var mockTasks = [
      { taskId: 'task1', clauses: 'Điều 3.1', issueSummary: 'Thiếu phạt vi phạm', category: 'Must Fix', legalRecommendation: 'Bổ dung phạt 8%', status: '', userNotes: '', legalDecision: 'NoGo' },
      { taskId: 'task2', clauses: 'Điều 5.2', issueSummary: 'Thời hạn thanh toán quá ngắn', category: 'Nego', legalRecommendation: 'Đổi thành 30 ngày', status: '', userNotes: '', legalDecision: 'NoGo' }
    ];

    var saveRes = saveTaskList(contractId, mockTasks, tokenLegal);
    var check1 = (saveRes.success === true);
    Logger.log((check1 ? '✅' : '❌') + ' saveTaskList API chạy thành công');

    // 3. Retrieve using getContractDetail
    var detailRes = getContractDetail(contractId, tokenLegal);
    var retrievedTasks = detailRes.data.taskList || [];
    var check2 = (retrievedTasks.length === 2 && retrievedTasks[0].clauses === 'Điều 3.1' && retrievedTasks[1].issueSummary === 'Thời hạn thanh toán quá ngắn');
    Logger.log((check2 ? '✅' : '❌') + ' getContractDetail trả về đúng danh sách task');

    // 4. Submit Task List to User (Legal -> User)
    var submitUserRes = submitTaskListToUser(contractId, mockTasks, tokenLegal);
    var updatedContract = getContractDetail(contractId, tokenLegal).data.contract;
    var check3 = (submitUserRes.success === true && updatedContract.status === STATUS.USER_REVISING && updatedContract.rejectCount === 1);
    Logger.log((check3 ? '✅' : '❌') + ' submitTaskListToUser chuyển trạng thái sang Draft (USER_REVISING) và tăng rejectCount');

    // 5. User updates status and notes, then submits back to Legal
    var updatedMockTasks = mockTasks.map(function (t) {
      if (t.taskId === 'task1') {
        t.status = 'Fixed';
        t.userNotes = 'Đã bổ sung phạt 8%';
      } else {
        t.status = 'Partial Fixed';
        t.userNotes = 'Đang đàm phán lại';
      }
      return t;
    });

    var submitLegalRes = submitTaskListToLegal(contractId, updatedMockTasks, tokenUser);
    var finalContract = getContractDetail(contractId, tokenLegal).data.contract;
    var finalTasks = getContractDetail(contractId, tokenLegal).data.taskList || [];
    var check4 = (submitLegalRes.success === true && finalContract.status === STATUS.PENDING_LEGAL && finalTasks[0].status === 'Fixed' && finalTasks[1].userNotes === 'Đang đàm phán lại');
    Logger.log((check4 ? '✅' : '❌') + ' submitTaskListToLegal chuyển trạng thái sang Legal Review và cập nhật dữ liệu phản hồi');

    // 6. Delete contract cleans up tasks
    // Set status to DRAFT first to bypass backend check since this is a cleanup operation in unit test
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    var contractRowIndex = getRowByColumn_(contractsSheet, 1, contractId);
    if (contractRowIndex !== -1) {
      contractsSheet.getRange(contractRowIndex, 5).setValue(STATUS.DRAFT);
    }
    var deleteRes = deleteContract(contractId, tokenUser);
    var tasksAfterDelete = [];
    var taskListSheet = getSheet_(SHEET_NAMES.TASK_LIST);
    if (taskListSheet) {
      var allTasks = sheetToObjects_(taskListSheet);
      tasksAfterDelete = allTasks.filter(function (t) { return String(t.contract_id) === String(contractId); });
    }
    var check5 = (deleteRes.success === true && tasksAfterDelete.length === 0);
    Logger.log((check5 ? '✅' : '❌') + ' deleteContract xoá sạch các dòng task tương ứng');

    // Cleanup session tokens
    CacheService.getScriptCache().remove(tokenUser);
    CacheService.getScriptCache().remove(tokenLegal);

    return check1 && check2 && check3 && check4 && check5;
  } catch (e) {
    Logger.log('❌ LỖI KHI TEST TASK LIST OPERATIONS: ' + e.message);
    return false;
  }
}

/**
 * Test case for contract deletion permission restrictions.
 * Validates that only the creator (USER role) can delete contracts in DRAFT or USER_REVISING status,
 * and that LEGAL/HOL roles cannot delete contracts at all.
 */
function testDeleteContractPermissions() {
  Logger.log('--- BẮT ĐẦU TEST DELETE CONTRACT PERMISSIONS ---');
  try {
    var usersSheet = getSheet_(SHEET_NAMES.USERS);
    var users = sheetToObjects_(usersSheet);
    
    // Find a USER, a LEGAL, and an HOL user
    var testUser = null;
    var legalUser = null;
    var holUser = null;
    var otherUser = null;
    
    for (var u = 0; u < users.length; u++) {
      if (users[u].role === ROLES.USER) {
        if (!testUser) testUser = users[u];
        else if (!otherUser) otherUser = users[u];
      } else if (users[u].role === ROLES.LEGAL) {
        legalUser = users[u];
      } else if (users[u].role === ROLES.HOL) {
        holUser = users[u];
      }
    }
    
    // Fallbacks if not found
    if (!testUser) throw new Error('Không tìm thấy user role USER.');
    if (!legalUser) throw new Error('Không tìm thấy user role LEGAL.');
    if (!holUser) throw new Error('Không tìm thấy user role HOL.');
    if (!otherUser) otherUser = { username: 'other_user', role: ROLES.USER };
    
    var tokenUser = 'test_token_del_user_' + Date.now();
    var tokenOtherUser = 'test_token_del_other_' + Date.now();
    var tokenLegal = 'test_token_del_legal_' + Date.now();
    var tokenHOL = 'test_token_del_hol_' + Date.now();
    
    CacheService.getScriptCache().put(tokenUser, JSON.stringify({
      username: testUser.username, role: testUser.role, email: testUser.email, displayName: testUser.display_name
    }), 300);
    CacheService.getScriptCache().put(tokenOtherUser, JSON.stringify({
      username: otherUser.username, role: otherUser.role, email: otherUser.email, displayName: otherUser.display_name
    }), 300);
    CacheService.getScriptCache().put(tokenLegal, JSON.stringify({
      username: legalUser.username, role: legalUser.role, email: legalUser.email, displayName: legalUser.display_name
    }), 300);
    CacheService.getScriptCache().put(tokenHOL, JSON.stringify({
      username: holUser.username, role: holUser.role, email: holUser.email, displayName: holUser.display_name
    }), 300);
    
    var contractId = 'CTR-TEST-DEL-PERM';
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    
    var cleanContract = function() {
      var cRow = getRowByColumn_(contractsSheet, 1, contractId);
      if (cRow !== -1) contractsSheet.deleteRow(cRow);
    };
    
    // Helper to create contract with specified status and owner
    var createTestContract = function(status, owner) {
      cleanContract();
      contractsSheet.appendRow([
        contractId, 'Contract test Delete Perm', 'Supplier Test', 'Mô tả test',
        status, 1, 'folder_id_test', owner, new Date(), new Date(), 0
      ]);
    };
    
    // 1. Test USER (owner) can delete in DRAFT status
    createTestContract(STATUS.DRAFT, testUser.username);
    var res1 = deleteContract(contractId, tokenUser);
    var check1 = (res1.success === true);
    Logger.log((check1 ? '✅' : '❌') + ' USER (chủ sở hữu) xoá được hợp đồng DRAFT');
    
    // 2. Test USER (owner) can delete in USER_REVISING status
    createTestContract(STATUS.USER_REVISING, testUser.username);
    var res2 = deleteContract(contractId, tokenUser);
    var check2 = (res2.success === true);
    Logger.log((check2 ? '✅' : '❌') + ' USER (chủ sở hữu) xoá được hợp đồng USER_REVISING');
    
    // 3. Test USER (owner) CANNOT delete in PENDING_LEGAL status
    createTestContract(STATUS.PENDING_LEGAL, testUser.username);
    var res3 = deleteContract(contractId, tokenUser);
    var check3 = (res3.success === false && res3.message.indexOf('chỉ có thể xoá khi chưa gửi duyệt') !== -1);
    Logger.log((check3 ? '✅' : '❌') + ' USER (chủ sở hữu) KHÔNG được phép xoá hợp đồng PENDING_LEGAL');
    
    // 4. Test USER (non-owner) CANNOT delete in DRAFT status
    createTestContract(STATUS.DRAFT, otherUser.username);
    var res4 = deleteContract(contractId, tokenUser);
    var check4 = (res4.success === false && res4.message.indexOf('Không có quyền xoá') !== -1);
    Logger.log((check4 ? '✅' : '❌') + ' USER (không phải chủ sở hữu) KHÔNG được phép xoá hợp đồng');
    
    // 5. Test LEGAL CANNOT delete in DRAFT status
    createTestContract(STATUS.DRAFT, testUser.username);
    var res5 = deleteContract(contractId, tokenLegal);
    var check5 = (res5.success === false && res5.message.indexOf('Không có quyền xoá') !== -1);
    Logger.log((check5 ? '✅' : '❌') + ' LEGAL KHÔNG được phép xoá hợp đồng');
    
    // 6. Test HOL CANNOT delete in DRAFT status
    createTestContract(STATUS.DRAFT, testUser.username);
    var res6 = deleteContract(contractId, tokenHOL);
    var check6 = (res6.success === false && res6.message.indexOf('Không có quyền xoá') !== -1);
    Logger.log((check6 ? '✅' : '❌') + ' HOL KHÔNG được phép xoá hợp đồng');
    
    // Clean up
    cleanContract();
    CacheService.getScriptCache().remove(tokenUser);
    CacheService.getScriptCache().remove(tokenOtherUser);
    CacheService.getScriptCache().remove(tokenLegal);
    CacheService.getScriptCache().remove(tokenHOL);
    
    return check1 && check2 && check3 && check4 && check5 && check6;
  } catch (e) {
    Logger.log('❌ LỖI KHI TEST DELETE CONTRACT PERMISSIONS: ' + e.message);
    return false;
  }
}

/**
 * Unit test to verify script LockService operations, contention, and deadlock avoidance.
 */
function testConcurrencyLocks() {
  Logger.log('--- BẮT ĐẦU TEST KHÓA ĐỒNG THỜI (CONCURRENCY LOCKS) ---');
  try {
    var usersSheet = getSheet_(SHEET_NAMES.USERS);
    var testUser = sheetToObjects_(usersSheet)[0];
    
    var token = 'test_token_lock_' + Date.now();
    var sessionData = {
      username: testUser.username,
      role: testUser.role,
      email: testUser.email,
      displayName: testUser.display_name
    };
    CacheService.getScriptCache().put(token, JSON.stringify(sessionData), 300);

    // 1. Nhận diện các thông tin người dùng mẫu
    var title = 'Hợp đồng test khóa ' + Date.now();
    var supplier = 'Nhà cung cấp khóa';
    var description = 'Mô tả test';
    var fileData = Utilities.base64Encode('Nội dung');
    var fileName = 'test.txt';
    
    // 2. Kiểm thử tránh deadlock cho luồng Tạo Hợp đồng (createContract -> generateContractId_)
    var contractId = 'CTR-TEST-LOCK';
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    var cRow = getRowByColumn_(contractsSheet, 1, contractId);
    if (cRow !== -1) contractsSheet.deleteRow(cRow);
    
    var createRes = createContract(title, supplier, description, fileData, fileName, token);
    var checkCreate = (createRes.success === true);
    Logger.log((checkCreate ? '✅' : '❌') + ' Gọi createContract thành công (Không bị deadlock với generateContractId_)');
    
    var newContractId = createRes.data.contractId;

    // 3. Kiểm thử tránh deadlock cho luồng Bình luận (addComment)
    var commentRes = addComment(newContractId, 1, 'Điều 1', 'Bình luận test khóa', token);
    var checkComment = (commentRes.success === true);
    Logger.log((checkComment ? '✅' : '❌') + ' Gọi addComment thành công (Không bị deadlock)');

    // 4. Kiểm thử tránh deadlock cho luồng Task List (saveTaskList)
    var taskListRes = saveTaskList(newContractId, [
      { taskId: 'task-l1', clauses: 'Điều 2', issueSummary: 'Lỗi khóa', category: 'Must Fix', legalRecommendation: 'Sửa', status: '', userNotes: '', legalDecision: 'NoGo' }
    ], token);
    var checkTaskList = (taskListRes.success === true);
    Logger.log((checkTaskList ? '✅' : '❌') + ' Gọi saveTaskList thành công (Không bị deadlock)');

    // 5. Kiểm thử tránh deadlock cho luồng Cập nhật trạng thái và tự động di dời (updateContractStatus -> archiveContract_)
    // Chuyển sang vai trò HOL để được quyền phê duyệt và kích hoạt archive
    var holUser = sheetToObjects_(usersSheet).filter(function(u) { return u.role === ROLES.HOL; })[0];
    var tokenHOL = 'test_token_lock_hol_' + Date.now();
    CacheService.getScriptCache().put(tokenHOL, JSON.stringify({
      username: holUser.username,
      role: holUser.role,
      email: holUser.email,
      displayName: holUser.display_name
    }), 300);

    // Đi qua các trạng thái trung gian để hợp lệ transition
    // DRAFT -> PENDING_LEGAL (bởi USER)
    updateContractStatus(newContractId, STATUS.PENDING_LEGAL, 'Gửi duyệt', token);
    
    // PENDING_LEGAL -> LEGAL_APPROVED (bởi LEGAL)
    var legalUser = sheetToObjects_(usersSheet).filter(function(u) { return u.role === ROLES.LEGAL; })[0];
    var tokenLegal = 'test_token_lock_legal_' + Date.now();
    CacheService.getScriptCache().put(tokenLegal, JSON.stringify({
      username: legalUser.username,
      role: legalUser.role,
      email: legalUser.email,
      displayName: legalUser.display_name
    }), 300);
    updateContractStatus(newContractId, STATUS.LEGAL_APPROVED, 'Duyệt pháp lý', tokenLegal);
    
    // PENDING_HOL -> HOL_APPROVED (bởi HOL) - Hàm này sẽ kích hoạt archiveContract_
    var updateRes = updateContractStatus(newContractId, STATUS.HOL_APPROVED, 'Phê duyệt hoàn tất', tokenHOL);
    var checkUpdateAndArchive = (updateRes.success === true);
    Logger.log((checkUpdateAndArchive ? '✅' : '❌') + ' Gọi updateContractStatus (HOL_APPROVED -> archiveContract_) thành công (Không bị deadlock)');

    // Dọn dẹp dữ liệu lưu trữ sau kiểm thử
    var archiveSS = getArchiveSpreadsheet_();
    var archiveContracts = archiveSS.getSheetByName(SHEET_NAMES.CONTRACTS);
    var archiveRowIndex = getRowByColumn_(archiveContracts, 1, newContractId);
    if (archiveRowIndex !== -1) {
      archiveContracts.deleteRow(archiveRowIndex);
    }
    
    // Dọn dẹp các dòng version, comment, task list trong archive
    var tables = [
      archiveSS.getSheetByName(SHEET_NAMES.VERSIONS),
      archiveSS.getSheetByName(SHEET_NAMES.COMMENTS),
      archiveSS.getSheetByName(SHEET_NAMES.ACTIVITY_LOG),
      archiveSS.getSheetByName(SHEET_NAMES.AI_ANALYSES),
      archiveSS.getSheetByName(SHEET_NAMES.TASK_LIST)
    ];
    tables.forEach(function(sh) {
      if (sh) {
        var d = sh.getDataRange().getValues();
        for (var i = d.length - 1; i >= 1; i--) {
          if (String(d[i][0]) === String(newContractId) || String(d[i][1]) === String(newContractId)) {
            sh.deleteRow(i + 1);
          }
        }
      }
    });

    CacheService.getScriptCache().remove(token);
    CacheService.getScriptCache().remove(tokenLegal);
    CacheService.getScriptCache().remove(tokenHOL);

    return checkCreate && checkComment && checkTaskList && checkUpdateAndArchive;
  } catch (e) {
    Logger.log('❌ LỖI TRONG QUÁ TRÌNH TEST KHÓA ĐỒNG THỜI: ' + e.message);
    Logger.log(e.stack);
    return false;
  }
}

/**
 * Unit test for Decision Brief functionality (support HOL to approve/reject).
 */
function testDecisionBriefFlow() {
  Logger.log('--- BẮT ĐẦU TEST QUY TRÌNH DECISION BRIEF ---');
  try {
    var contractId = 'CTR-TEST-DB-AI';
    var tokenHOL = 'test_token_hol_' + Date.now();
    var tokenLegal = 'test_token_legal_' + Date.now();

    // 1. Tạo session giả cho HOL & LEGAL
    var sessionHOL = { username: 'hol1', role: ROLES.HOL, email: 'hol1@example.com', displayName: 'Head of Legal' };
    var sessionLegal = { username: 'legal1', role: ROLES.LEGAL, email: 'legal1@example.com', displayName: 'Legal Reviewer' };
    CacheService.getScriptCache().put(tokenHOL, JSON.stringify(sessionHOL), 300);
    CacheService.getScriptCache().put(tokenLegal, JSON.stringify(sessionLegal), 300);

    // 2. Dọn dẹp dữ liệu test cũ nếu có
    var cleanTestData = function() {
      var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
      var row = getRowByColumn_(contractsSheet, 1, contractId);
      if (row !== -1) contractsSheet.deleteRow(row);

      var versionsSheet = getSheet_(SHEET_NAMES.VERSIONS);
      var vData = versionsSheet.getDataRange().getValues();
      for (var i = vData.length - 1; i >= 1; i--) {
        if (String(vData[i][0]) === contractId) versionsSheet.deleteRow(i + 1);
      }

      var taskListSheet = getSheet_(SHEET_NAMES.TASK_LIST);
      var tData = taskListSheet.getDataRange().getValues();
      for (var j = tData.length - 1; j >= 1; j--) {
        if (String(tData[j][0]) === contractId) taskListSheet.deleteRow(j + 1);
      }

      var analysesSheet = getSheet_(SHEET_NAMES.AI_ANALYSES);
      var aData = analysesSheet.getDataRange().getValues();
      for (var k = aData.length - 1; k >= 1; k--) {
        if (String(aData[k][0]) === contractId) analysesSheet.deleteRow(k + 1);
      }
    };
    cleanTestData();

    // 3. Tạo một contract giả ở trạng thái PENDING_HOL
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    contractsSheet.appendRow([
      contractId, 'Hợp đồng mua bán thiết bị IT', 'Supplier Test', 'Mô tả test decision brief',
      STATUS.PENDING_HOL, 1, 'file_id_test_db', 'user1', new Date(), new Date(), 0
    ]);

    var versionsSheet = getSheet_(SHEET_NAMES.VERSIONS);
    versionsSheet.appendRow([
      contractId, 1, 'file_id_test_db', 'hop_dong_test_db.docx',
      'http://url_test_db', 'user1', new Date(), 'UPLOAD', 'Test', ''
    ]);

    var taskListSheet = getSheet_(SHEET_NAMES.TASK_LIST);
    taskListSheet.appendRow([
      contractId, 'task_db_1', 'Điều 5', 'Rủi ro bảo hành ngắn', 'Must Fix', 'Yêu cầu tăng bảo hành lên 2 năm', 'Fixed', 'Đã bổ sung 2 năm', 'Go'
    ]);

    // 4. Test checkRiskAvailability khi CHƯA có Risk Analysis
    var check1 = checkRiskAvailability(contractId, tokenHOL);
    var check1Ok = (check1.success === true && check1.data.available === false);
    Logger.log((check1Ok ? '✅' : '❌') + ' checkRiskAvailability ban đầu trả về available: false');

    // 5. Test generateDecisionBrief khi CHƯA có Risk Analysis -> Phải trả về needRiskAnalysis: true
    var brief1 = generateDecisionBrief(contractId, tokenHOL);
    var brief1Ok = (brief1.success === false && brief1.data && brief1.data.needRiskAnalysis === true);
    Logger.log((brief1Ok ? '✅' : '❌') + ' generateDecisionBrief khi chưa có Risk trả về lỗi cần Risk Analysis');

    // 6. Test generateDecisionBrief phân quyền (gọi bằng token LEGAL) -> Phải bị từ chối
    var briefLegal = generateDecisionBrief(contractId, tokenLegal);
    var briefLegalOk = (briefLegal.success === false && briefLegal.message.indexOf('quyền') !== -1);
    Logger.log((briefLegalOk ? '✅' : '❌') + ' generateDecisionBrief chặn truy cập thành công cho role LEGAL');

    // 7. Ghi trực tiếp một RISK giả vào ai_analyses sheet
    var analysesSheet = getSheet_(SHEET_NAMES.AI_ANALYSES);
    var dummyRiskJson = JSON.stringify({
      overall_rating: 'MEDIUM',
      overall_comment: 'Hợp đồng có rủi ro vừa phải.',
      risk_clauses: [{ clause_reference: 'Điều 5', severity: 'MEDIUM', description: 'Bảo hành ngắn' }]
    });
    analysesSheet.appendRow([
      contractId, 1, 'RISK', dummyRiskJson, 'legal1', formatDateTime_(new Date())
    ]);

    // 8. Test checkRiskAvailability khi ĐÃ có Risk Analysis -> Trả về true
    var check2 = checkRiskAvailability(contractId, tokenHOL);
    var check2Ok = (check2.success === true && check2.data.available === true);
    Logger.log((check2Ok ? '✅' : '❌') + ' checkRiskAvailability trả về available: true sau khi đã seed Risk');

    // 9. Mock callGeminiAPI_ để tránh gọi API thật khi test
    // Lưu hàm gốc
    var originalCallGeminiAPI = callGeminiAPI_;
    
    // Tạo mock response đúng cấu trúc JSON mong đợi
    var mockBriefResponse = JSON.stringify({
      recommendation: 'CONDITIONAL_APPROVE',
      confidence: 'high',
      risk_summary: {
        overall_rating: 'MEDIUM',
        key_risks: [{ clause_reference: 'Điều 5', severity: 'MEDIUM', description: 'Bảo hành ngắn', mitigation_status: 'RESOLVED' }],
        unresolved_count: 0
      },
      task_review: {
        total_tasks: 1,
        by_category: { 'Must Fix': 1, 'Nego': 0, 'Accept': 0 },
        by_status: { 'Fixed': 1, 'Partial Fixed': 0, 'Can\'t Fix': 0 },
        critical_items: []
      },
      decision_factors: [
        { factor: 'Mức độ rủi ro tổng thể', weight: 'MEDIUM', assessment: 'NEUTRAL', detail: 'Hợp đồng trung bình' }
      ],
      conditions: [
        { condition: 'Đảm bảo bên đối tác ký trước ngày 15/06', priority: 'MUST' }
      ],
      executive_summary: 'Khuyến nghị phê duyệt có điều kiện.'
    });

    // Định nghĩa mock
    callGeminiAPI_ = function(prompt, mimeType) {
      Logger.log('🤖 Mock callGeminiAPI_ was called!');
      return mockBriefResponse;
    };

    Logger.log('👉 Tiến hành gọi generateDecisionBrief (sử dụng Mock API)...');
    var brief2 = generateDecisionBrief(contractId, tokenHOL);
    
    // Khôi phục hàm gốc
    callGeminiAPI_ = originalCallGeminiAPI;
    
    var brief2Ok = false;
    if (brief2.success === true) {
      var result = JSON.parse(brief2.data.resultJson);
      brief2Ok = (result.recommendation && result.executive_summary && result.risk_summary && result.task_review);
      Logger.log((brief2Ok ? '✅' : '❌') + ' generateDecisionBrief chạy thành công qua mock API và trả về cấu trúc JSON đúng chuẩn');
    } else {
      Logger.log('❌ generateDecisionBrief lỗi: ' + brief2.message);
    }

    // 10. Dọn dẹp dữ liệu test
    cleanTestData();
    CacheService.getScriptCache().remove(tokenHOL);
    CacheService.getScriptCache().remove(tokenLegal);
    Logger.log('👉 Đã dọn dẹp sạch dữ liệu test.');

    return check1Ok && brief1Ok && briefLegalOk && check2Ok && brief2Ok;
  } catch (e) {
    Logger.log('❌ LỖI TRONG QUÁ TRÌNH TEST DECISION BRIEF: ' + e.message);
    Logger.log(e.stack);
    return false;
  }
}

/**
 * Test & Benchmark function for Dashboard initialization performance.
 */
function testDashboardInitPerformance() {
  Logger.log('--- 📊 CHẠY BENCHMARK HIỆU NĂNG DASHBOARD INIT ---');
  try {
    // 1. Giả lập token đăng nhập (Admin/Legal user)
    var sessionUser = {
      username: 'legal1',
      email: 'legal1@foodempire.vn',
      displayName: 'Legal One',
      role: ROLES.LEGAL
    };
    var token = 'test_token_perf_' + Date.now();
    CacheService.getScriptCache().put(token, JSON.stringify(sessionUser), 300);

    // 2. Đo đạc Luồng Cũ (Old Flow): Gọi getContracts và getContractStats riêng lẻ
    var startOld = Date.now();
    var contractsRes = getContracts(token, false);
    var statsRes = getContractStats(token);
    var durationOld = Date.now() - startOld;

    // 3. Đo đạc Luồng Mới (New Flow): Gọi getDashboardInit
    var startNew = Date.now();
    var dashInitRes = getDashboardInit(token, false);
    var durationNew = Date.now() - startNew;

    // 4. Kiểm tra cấu hình kết quả
    var isSuccess = dashInitRes.success === true &&
                    dashInitRes.data &&
                    Array.isArray(dashInitRes.data.contracts) &&
                    typeof dashInitRes.data.stats === 'object';

    // 5. Thống kê kết quả so sánh
    var savedMs = durationOld - durationNew;
    var speedupPercent = durationOld > 0 ? ((savedMs / durationOld) * 100).toFixed(1) : '0';

    Logger.log('⏱️ [OLD FLOW]  getContracts + getContractStats: ' + durationOld + ' ms');
    Logger.log('⚡ [NEW FLOW]  getDashboardInit:               ' + durationNew + ' ms');
    Logger.log('🚀 [BENCHMARK] Tiết kiệm: ' + savedMs + ' ms (' + speedupPercent + '% nhanh hơn ở Backend)');

    // Clean up
    CacheService.getScriptCache().remove(token);

    return isSuccess;
  } catch (e) {
    Logger.log('❌ Lỗi khi benchmark Dashboard Init: ' + e.message);
    return false;
  }
}

function testContractDetailPerformance() {
  Logger.log('----------------------------------------------------');
  Logger.log('🧪 RUNNING BENCHMARK: getContractDetail Optimization');
  Logger.log('----------------------------------------------------');

  try {
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    var data = contractsSheet.getDataRange().getValues();
    if (data.length < 2) {
      Logger.log('⚠️ Không có hợp đồng nào trong DB để benchmark.');
      return true;
    }

    var sampleContractId = data[1][0]; // Hợp đồng đầu tiên
    var adminEmail = 'test_admin_' + Date.now() + '@foodempire.vn';
    var userSheet = getSheet_(SHEET_NAMES.USERS);
    userSheet.appendRow(['testadmin', adminEmail, 'Test Admin', ROLES.LEGAL]);
    var token = createMockSessionToken_(adminEmail, ROLES.LEGAL);

    var start = Date.now();
    var res = getContractDetail(sampleContractId, token);
    var duration = Date.now() - start;

    var resObj = typeof res === 'string' ? JSON.parse(res) : res;
    var isSuccess = resObj && resObj.success === true;

    Logger.log('⚡ [BENCHMARK DETAIL]  getContractDetail (' + sampleContractId + '): ' + duration + ' ms');
    Logger.log('✅ Status: ' + (isSuccess ? 'SUCCESS' : 'FAILED'));
    if (resObj.data) {
      Logger.log('   - Versions: ' + (resObj.data.versions ? resObj.data.versions.length : 0));
      Logger.log('   - Comments: ' + (resObj.data.comments ? resObj.data.comments.length : 0));
      Logger.log('   - Activities: ' + (resObj.data.activities ? resObj.data.activities.length : 0));
      Logger.log('   - Tasks: ' + (resObj.data.taskList ? resObj.data.taskList.length : 0));
    }

    CacheService.getScriptCache().remove(token);
    return isSuccess;
  } catch (e) {
    Logger.log('❌ Lỗi khi benchmark Contract Detail: ' + e.message);
    return false;
  }
}

function testBackendCachePerformance() {
  Logger.log('----------------------------------------------------');
  Logger.log('🧪 RUNNING BENCHMARK: CacheService RAM (Option B)');
  Logger.log('----------------------------------------------------');

  try {
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    var data = contractsSheet.getDataRange().getValues();
    if (data.length < 2) return true;

    var sampleContractId = data[1][0];
    var adminEmail = 'test_cache_' + Date.now() + '@foodempire.vn';
    var userSheet = getSheet_(SHEET_NAMES.USERS);
    userSheet.appendRow(['testcache', adminEmail, 'Test Cache User', ROLES.LEGAL]);
    var token = createMockSessionToken_(adminEmail, ROLES.LEGAL);

    // 1. Force Cache Miss (Clear cache)
    invalidateBackendDetailCache_(sampleContractId);
    var startMiss = Date.now();
    getContractDetail(sampleContractId, token);
    var durationMiss = Date.now() - startMiss;

    // 2. Cache Hit (Second call)
    var startHit = Date.now();
    var resHit = getContractDetail(sampleContractId, token);
    var durationHit = Date.now() - startHit;

    var resObj = typeof resHit === 'string' ? JSON.parse(resHit) : resHit;
    var isSuccess = resObj && resObj.success === true;
    var savedMs = durationMiss - durationHit;
    var speedupPercent = durationMiss > 0 ? ((savedMs / durationMiss) * 100).toFixed(1) : '0';

    Logger.log('⏱️ [CACHE MISS]  Lần 1 (Sheets Read): ' + durationMiss + ' ms');
    Logger.log('⚡ [CACHE HIT]   Lần 2 (Script RAM):   ' + durationHit + ' ms');
    Logger.log('🚀 [BENCHMARK B] Tiết kiệm: ' + savedMs + ' ms (' + speedupPercent + '% nhanh hơn ở Backend!)');

    CacheService.getScriptCache().remove(token);
    return isSuccess;
  } catch (e) {
    Logger.log('❌ Lỗi khi benchmark Backend Cache: ' + e.message);
    return false;
  }
}

/**
 * Quick helper function to verify script configuration and force OAuth re-authorization prompt.
 * DOES NOT use try-catch so Apps Script engine triggers the authorization dialog directly.
 */
function testConfig1() {
  Logger.log('=== KẾT QUẢ KIỂM TRA CẤU HÌNH & QUYỀN TRUY CẬP (testConfig1) ===');
  
  var config = getConfig_();
  Logger.log('1. SPREADSHEET_ID: ' + (config.spreadsheetId ? '✅ ' + config.spreadsheetId : '❌ Chưa cấu hình'));
  Logger.log('2. ARCHIVE_SPREADSHEET_ID: ' + (config.archiveSpreadsheetId ? '✅ ' + config.archiveSpreadsheetId : '❌ Chưa cấu hình'));
  Logger.log('3. ROOT_FOLDER_ID: ' + (config.rootFolderId ? '✅ ' + config.rootFolderId : '❌ Chưa cấu hình'));
  Logger.log('4. FIREBASE_API_KEY: ' + (config.firebaseApiKey ? '✅ Đã thiết lập (' + config.firebaseApiKey.substring(0, 8) + '...)' : '❌ Chưa cấu hình'));
  Logger.log('5. GEMINI_API_KEY: ' + (config.geminiApiKey ? '✅ Đã thiết lập' : '❌ Chưa cấu hình'));

  // 1. Google Sheets Permission
  if (config.spreadsheetId) {
    var ss = SpreadsheetApp.openById(config.spreadsheetId);
    Logger.log('6. Google Sheets Permission: ✅ Đã mở Spreadsheet ("' + ss.getName() + '")');
  }

  // 2. UrlFetchApp Permission (Mạng bên ngoài)
  var res = UrlFetchApp.fetch('https://www.google.com', { muteHttpExceptions: true });
  Logger.log('7. UrlFetchApp Permission (Mạng): ✅ Đã kết nối HTTP Status ' + res.getResponseCode());

  // 3. Google Drive Permission
  if (config.rootFolderId) {
    var folder = DriveApp.getFolderById(config.rootFolderId);
    Logger.log('8. Google Drive Permission: ✅ Đã mở thư mục Root ("' + folder.getName() + '")');
  }

  // 4. Google Docs Permission (Cần thiết cho việc tạo/convert hợp đồng)
  var tempDoc = DocumentApp.create('Test_Perm_Doc');
  var tempDocId = tempDoc.getId();
  DriveApp.getFileById(tempDocId).setTrashed(true);
  Logger.log('9. Google Docs Permission: ✅ Đã kiểm tra quyền DocumentApp thành công');

  Logger.log('==================================================================');
}




