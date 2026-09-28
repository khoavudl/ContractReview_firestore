/**
 * DriveService.gs
 * Handles all Google Drive operations: folder management, file upload,
 * URL retrieval, and document text extraction.
 *
 * Dependencies: Config.gs (getConfig_)
 */

/**
 * Creates a contract folder inside the configured root folder.
 * Folder name format: '{contractId}_{supplier}'
 * @param {string} contractId - The contract identifier.
 * @param {string} supplier - The supplier name.
 * @return {string} The created folder ID.
 * @private
 */
function createContractFolder_(contractId, supplier) {
  var config = getConfig_();
  var rootFolderId = config.rootFolderId;
  var parentFolder = null;

  if (rootFolderId) {
    try {
      parentFolder = DriveApp.getFolderById(rootFolderId);
      if (parentFolder.isTrashed()) {
        parentFolder = null;
        Logger.log('Thư mục gốc cấu hình đã bị xoá hoặc nằm trong Thùng rác.');
      }
    } catch (err) {
      Logger.log('Không thể mở thư mục gốc cấu hình: ' + err.message);
    }
  }

  // Nếu không mở được thư mục cũ, tự tìm hoặc tạo mới thư mục ContractReview
  if (!parentFolder) {
    var folders = DriveApp.getRootFolder().getFoldersByName('ContractReview');
    if (folders.hasNext()) {
      parentFolder = folders.next();
      PropertiesService.getScriptProperties().setProperty('ROOT_FOLDER_ID', parentFolder.getId());
      Logger.log('Đã tự phục hồi bằng cách liên kết lại với thư mục ContractReview sẵn có.');
    } else {
      parentFolder = DriveApp.createFolder('ContractReview');
      PropertiesService.getScriptProperties().setProperty('ROOT_FOLDER_ID', parentFolder.getId());
      Logger.log('Đã tự phục hồi bằng cách tạo mới thư mục ContractReview.');
    }
  }

  var folderName = contractId + '_' + supplier;
  var newFolder = parentFolder.createFolder(folderName);
  return newFolder.getId();
}

/**
 * Uploads a file to the specified Drive folder from a base64 encoded string.
 * @param {string} folderId - The target folder ID.
 * @param {string} fileData - Base64 encoded file content.
 * @param {string} fileName - The original file name.
 * @return {object} Object with fileId, fileUrl, and fileName.
 * @private
 */
function uploadFileToDrive_(folderId, fileData, fileName) {
  var decoded = Utilities.base64Decode(fileData);
  var blob = Utilities.newBlob(decoded, null, fileName);

  // Detect MIME type from file extension
  var mimeType = getMimeTypeFromFileName_(fileName);
  if (mimeType) {
    blob.setContentType(mimeType);
  }

  var folder = DriveApp.getFolderById(folderId);
  var file = folder.createFile(blob);

  // Set file sharing: Anyone with the link can view
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (permErr) {
    Logger.log('Lỗi gán quyền cho file tham chiếu: ' + permErr.message);
  }

  return {
    fileId: file.getId(),
    fileUrl: file.getUrl(),
    fileName: file.getName()
  };
}

/**
 * Returns the web view URL for a file.
 * @param {string} fileId - The Google Drive file ID.
 * @return {string} The web view link for the file.
 * @private
 */
function getFileUrl_(fileId) {
  var file = DriveApp.getFileById(fileId);
  return file.getUrl();
}

/**
 * Saves a file blob (or base64 string) to the specified Drive folder,
 * converts it to Google Docs format, deletes the original file,
 * and returns the Google Doc's details.
 * 
 * @param {string} folderId - The target folder ID.
 * @param {string|Blob} fileDataOrBlob - Base64 encoded string OR a Blob/Attachment object.
 * @param {string} targetName - The desired name of the Google Doc.
 * @param {string} originalFileName - The original file name.
 * @return {object} { fileId, fileUrl, fileName }
 * @private
 */
function uploadAndConvertToGoogleDoc_(folderId, fileDataOrBlob, targetName, originalFileName) {
  var blob;
  if (typeof fileDataOrBlob === 'string') {
    var decoded = Utilities.base64Decode(fileDataOrBlob);
    blob = Utilities.newBlob(decoded, null, originalFileName);
  } else {
    blob = fileDataOrBlob;
  }

  var mimeType = getMimeTypeFromFileName_(originalFileName);
  if (mimeType) {
    blob.setContentType(mimeType);
  }

  var folder = DriveApp.getFolderById(folderId);

  // 1. Create the original file in Drive
  var originalFile = folder.createFile(blob);
  var originalFileId = originalFile.getId();

  var googleDocId;
  try {
    // 2. Convert to Google Doc inside the same folder using Drive API v2
    var resource = {
      title: targetName,
      mimeType: 'application/vnd.google-apps.document',
      parents: [{ id: folderId }]
    };

    var convertedFile = Drive.Files.insert(resource, originalFile.getBlob(), { convert: true });
    googleDocId = convertedFile.id;

    // 3. Delete the original file
    originalFile.setTrashed(true);
  } catch (err) {
    Logger.log('Error converting file to Google Doc: ' + err.message);
    // Fallback: keep the original file if conversion failed
    googleDocId = originalFileId;

    // Rename original file to targetName if we are using it as fallback
    try {
      originalFile.setName(targetName + '_' + originalFileName);
    } catch (renameErr) {
      Logger.log('Error renaming fallback file: ' + renameErr.message);
    }
  }

  var docFile = DriveApp.getFileById(googleDocId);

  // Set file sharing: Anyone with the link can comment
  try {
    docFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.COMMENT);
  } catch (permErr) {
    Logger.log('Lỗi gán quyền cho file hợp đồng Google Docs: ' + permErr.message);
  }

  return {
    fileId: docFile.getId(),
    fileUrl: docFile.getUrl(),
    fileName: docFile.getName()
  };
}

/**
 * Extracts plain text content from a file in Google Drive.
 * Supports Google Docs natively. For docx/other formats, attempts conversion
 * via Drive Advanced Service (Drive API v2).
 * @param {string} fileId - The Google Drive file ID.
 * @return {string} The extracted plain text, or error message if extraction fails.
 * @private
 */
function extractTextFromFile_(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    var mimeType = file.getMimeType();

    // Google Docs: direct text extraction
    if (mimeType === 'application/vnd.google-apps.document') {
      return DocumentApp.openById(fileId).getBody().getText();
    }

    // For other file types (docx, doc, etc.): convert to Google Doc using Drive API v2 insert
    try {
      var blob = file.getBlob();
      var resource = {
        title: 'temp_extract_' + new Date().getTime(),
        mimeType: 'application/vnd.google-apps.document'
      };

      // Use Drive.Files.insert to upload blob and convert it to Google Docs format
      var tempFile = Drive.Files.insert(resource, blob, { convert: true });
      var text = DocumentApp.openById(tempFile.id).getBody().getText();

      // Cleanup: delete the temporary converted file
      try {
        DriveApp.getFileById(tempFile.id).setTrashed(true);
      } catch (cleanupErr) {
        Logger.log('Failed to delete temporary converted file: ' + cleanupErr.message);
      }

      return text;
    } catch (driveApiError) {
      Logger.log('Drive Advanced Service conversion error: ' + driveApiError.message);

      // Fallback: try exporting via REST API with OAuth token (only works if it's already a Google Doc)
      try {
        var exportUrl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '/export?mimeType=text/plain';
        var response = UrlFetchApp.fetch(exportUrl, {
          headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
          muteHttpExceptions: true
        });

        if (response.getResponseCode() === 200) {
          return response.getContentText();
        }
      } catch (fetchError) {
        Logger.log('REST API export fallback error: ' + fetchError.message);
      }

      return 'Không thể trích xuất văn bản tự động. Vui lòng dùng chức năng tóm tắt thủ công.';
    }
  } catch (e) {
    Logger.log('Text extraction error: ' + e.message);
    return 'Lỗi trích xuất: ' + e.message;
  }
}

/**
 * Determines MIME type from file extension.
 * @param {string} fileName - The file name with extension.
 * @return {string|null} The MIME type or null if unknown.
 * @private
 */
function getMimeTypeFromFileName_(fileName) {
  var ext = fileName.split('.').pop().toLowerCase();
  var mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    'odt': 'application/vnd.oasis.opendocument.text',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg'
  };
  return mimeTypes[ext] || null;
}
