/**
 * ReferenceFileService.js
 * Handles operations related to reference files.
 */

function uploadReferenceFile(contractId, fileData, fileName, token) {
  try {
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }
    
    var user = session;
    var access = assertContractAccess_(contractId, user);
    if (!access.allowed) {
      return jsonResponse_(false, null, access.message);
    }
    
    var contract = access.contract;
    if (contract.status === STATUS.HOL_APPROVED || contract.status === STATUS.COMPLETED) {
      return jsonResponse_(false, null, 'Không thể upload tài liệu tham chiếu cho hợp đồng đã hoàn tất.');
    }
    
    var refFilesSheet = getSheet_(SHEET_NAMES.REFERENCE_FILES);
    var refFilesData = refFilesSheet.getDataRange().getValues();
    var currentCount = 0;
    if (refFilesData.length > 1) {
      for (var i = 1; i < refFilesData.length; i++) {
        if (String(refFilesData[i][0]) === String(contractId)) {
          currentCount++;
        }
      }
    }
    
    if (currentCount >= MAX_REFERENCE_FILES) {
      return jsonResponse_(false, null, 'Đã đạt giới hạn số lượng tài liệu tham chiếu (' + MAX_REFERENCE_FILES + ').');
    }
    
    if (fileData.length > 14680064) {
      return jsonResponse_(false, null, 'Dung lượng file quá lớn. Vui lòng đính kèm file nhỏ hơn 10MB.');
    }
    
    var contractsSheet = getSheet_(SHEET_NAMES.CONTRACTS);
    var contractRowIndex = getRowByColumn_(contractsSheet, 1, contractId);
    var contractValues = contractsSheet.getRange(contractRowIndex, 1, 1, contractsSheet.getLastColumn()).getValues()[0];
    var folderId = contractValues[6];
    
    var refFileInfo = uploadFileToDrive_(folderId, fileData, fileName);
    
    var refFileBytes = Utilities.base64Decode(fileData);
    var refFileSize = refFileBytes.length;
    var refMimeType = '';
    try {
      refMimeType = DriveApp.getFileById(refFileInfo.fileId).getMimeType();
    } catch(e) {}
    
    var now = formatDateTime_(new Date());
    
    var fileObj = {
      contractId: contractId,
      fileId: refFileInfo.fileId,
      fileName: fileName,
      fileUrl: refFileInfo.fileUrl,
      fileSize: refFileSize,
      mimeType: refMimeType,
      uploadedBy: user.username,
      uploadedAt: now
    };
    
    refFilesSheet.appendRow([
      contractId,
      refFileInfo.fileId,
      fileName,
      refFileInfo.fileUrl,
      refFileSize,
      refMimeType,
      user.username,
      now
    ]);
    
    logActivity_(contractId, 'REFERENCE_FILE_UPLOADED', user.username, 'Upload tài liệu tham chiếu: ' + fileName);
    invalidateBackendDetailCache_(contractId);

    return jsonResponse_(true, {
      referenceFile: fileObj,
      contractId: contractId
    }, 'Upload tài liệu tham chiếu thành công.');
  } catch (e) {
    Logger.log('Error in uploadReferenceFile: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi upload tài liệu tham chiếu: ' + e.message);
  }
}

function deleteReferenceFile(contractId, fileId, token) {
  try {
    var session = validateSession_(token);
    if (!session.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    var user = session;
    var access = assertContractAccess_(contractId, user);
    if (!access.allowed) {
      return jsonResponse_(false, null, access.message);
    }

    var contract = access.contract;
    if (contract.status === STATUS.HOL_APPROVED || contract.status === STATUS.COMPLETED) {
      return jsonResponse_(false, null, 'Không thể xóa tài liệu tham chiếu cho hợp đồng đã hoàn tất.');
    }

    var refFilesSheet = getSheet_(SHEET_NAMES.REFERENCE_FILES);
    var data = refFilesSheet.getDataRange().getValues();
    var rowIndex = -1;
    var uploadedBy = '';
    var fileName = '';

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(contractId) && String(data[i][1]) === String(fileId)) {
        rowIndex = i + 1;
        fileName = data[i][2];
        uploadedBy = data[i][6];
        break;
      }
    }

    if (rowIndex === -1) {
      return jsonResponse_(false, null, 'Không tìm thấy tài liệu tham chiếu.');
    }

    if (uploadedBy !== user.username) {
      return jsonResponse_(false, null, 'Bạn chỉ có thể xóa tài liệu do chính bạn tải lên.');
    }

    try {
      DriveApp.getFileById(fileId).setTrashed(true);
    } catch (e) {
      Logger.log('Error trashing reference file in Drive: ' + e.message);
    }

    refFilesSheet.deleteRow(rowIndex);

    logActivity_(contractId, 'REFERENCE_FILE_DELETED', user.username, 'Xóa tài liệu tham chiếu: ' + fileName);
    invalidateBackendDetailCache_(contractId);

    return jsonResponse_(true, { contractId: contractId, fileId: fileId }, 'Xóa tài liệu tham chiếu thành công.');
  } catch (e) {
    Logger.log('Error in deleteReferenceFile: ' + e.message);
    return jsonResponse_(false, null, 'Lỗi khi xóa tài liệu tham chiếu: ' + e.message);
  }
}
