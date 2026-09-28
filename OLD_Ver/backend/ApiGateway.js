/**
 * ApiGateway.gs
 * Xử lý các HTTP POST requests từ Frontend độc lập (như Vercel/Vite).
 * Cung cấp API thay thế cho google.script.run
 */

function doPost(e) {
  try {
    // Nếu không có postData, trả về lỗi
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Missing POST data");
    }

    // Kiểm tra dung lượng payload (14MB limit - tương đương file 10MB base64)
    if (e.postData.contents.length > 14680064) {
      throw new Error("Payload quá lớn. Giới hạn tối đa 10MB cho file đính kèm.");
    }

    // Parse JSON payload
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var args = requestData.args || [];

    // Danh sách các hàm được phép gọi (Whitelist) để đảm bảo an toàn
    var allowedActions = {
      "checkSession": checkSession,
      "getDashboardInit": getDashboardInit,
      "getDashboardVersion": getDashboardVersion,
      "getContracts": getContracts,
      "getContractStats": getContractStats,
      "getArchivedContracts": getArchivedContracts,
      "searchArchivedContracts": searchArchivedContracts,
      "getContractDetail": getContractDetail,
      "updateContractStatus": updateContractStatus,
      "deleteContract": deleteContract,
      "saveTaskList": saveTaskList,
      "analyzeContract": analyzeContract,
      "checkRiskAvailability": checkRiskAvailability,
      "generateDecisionBrief": generateDecisionBrief,
      "submitTaskListToUser": submitTaskListToUser,
      "submitTaskListToLegal": submitTaskListToLegal,
      "createContract": createContract,
      "uploadNewVersion": uploadNewVersion,
      "addComment": addComment,
      "uploadReferenceFile": uploadReferenceFile,
      "deleteReferenceFile": deleteReferenceFile,
      "sendWorkflowEmail": sendWorkflowEmail
    };

    if (!allowedActions[action]) {
      throw new Error("Action not found or not allowed: " + action);
    }

    // Thực thi hàm tương ứng với mảng arguments được truyền vào
    var result = allowedActions[action].apply(this, args);

    // Chuẩn bị response thành công
    var responseObj = {
      success: true,
      data: result,
      message: "Success"
    };

    // Nếu kết quả trả về đã có cấu trúc {success, data, message} từ Service (ví dụ checkSession)
    // thì lấy thẳng cấu trúc đó để đồng nhất.
    if (result && typeof result === 'object' && result.hasOwnProperty('success')) {
      responseObj = result;
    }

    return ContentService.createTextOutput(JSON.stringify(responseObj))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Xử lý lỗi và trả về
    var errorResponse = {
      success: false,
      message: err.message,
      data: null
    };

    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
