/**
 * Maintenance.gs
 * Chứa hàm dọn dẹp dữ liệu hệ thống (MVP version).
 */

/**
 * Dọn dẹp toàn bộ dữ liệu hệ thống.
 * PRIVATE — Chỉ chạy trực tiếp từ Apps Script Editor (Menu Run → clearAllSystemData_).
 * Hàm này KHÔNG thể gọi từ client-side (google.script.run) vì có dấu gạch dưới cuối tên.
 */
function clearAllSystemData_() {
  var config = getConfig_();
  var props = PropertiesService.getScriptProperties();

  // 1. Dọn dẹp các sheet dữ liệu chính (giữ lại tiêu đề hàng 1)
  var mainSS = SpreadsheetApp.openById(config.spreadsheetId);
  var tables = [
    SHEET_NAMES.CONTRACTS,
    SHEET_NAMES.VERSIONS,
    SHEET_NAMES.COMMENTS,
    SHEET_NAMES.ACTIVITY_LOG,
    SHEET_NAMES.AI_ANALYSES,
    SHEET_NAMES.TASK_LIST
  ];
  
  tables.forEach(function(name) {
    var sheet = mainSS.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
  });

  // 2. Dọn dẹp các sheet dữ liệu lưu trữ (Archive)
  if (config.archiveSpreadsheetId) {
    try {
      var archiveSS = SpreadsheetApp.openById(config.archiveSpreadsheetId);
      tables.forEach(function(name) {
        var sheet = archiveSS.getSheetByName(name);
        if (sheet && sheet.getLastRow() > 1) {
          sheet.deleteRows(2, sheet.getLastRow() - 1);
        }
      });
    } catch (e) {
      Logger.log('Không dọn dẹp được archive sheet: ' + e.message);
    }
  }

  // 3. Dọn dẹp thư mục Drive (đưa các thư mục con và file con vào thùng rác)
  if (config.rootFolderId) {
    try {
      var root = DriveApp.getFolderById(config.rootFolderId);
      
      // Xóa các thư mục con của từng hợp đồng
      var subFolders = root.getFolders();
      while (subFolders.hasNext()) {
        subFolders.next().setTrashed(true);
      }
      
      // Xóa các file lẻ khác trong root folder (ngoại trừ file chính và file archive)
      var files = root.getFiles();
      while (files.hasNext()) {
        var file = files.next();
        var fileId = file.getId();
        if (fileId !== config.spreadsheetId && fileId !== config.archiveSpreadsheetId) {
          file.setTrashed(true);
        }
      }
    } catch (e) {
      Logger.log('Không dọn dẹp được thư mục Drive: ' + e.message);
    }
  }

  // 4. Reset bộ đếm ID hợp đồng trong Script Properties
  var allProps = props.getProperties();
  for (var key in allProps) {
    if (key.indexOf('LAST_SEQ_') === 0) {
      props.deleteProperty(key);
    }
  }

  // 5. Xóa Cache danh sách hợp đồng
  try {
    clearChunkedCache_('all_active_contracts');
    clearChunkedCache_('all_archived_contracts');
  } catch (e) {
    Logger.log('Không xóa được cache: ' + e.message);
  }
  
  Logger.log('Đã dọn dẹp xong toàn bộ dữ liệu (MVP)!');
}
