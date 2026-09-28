import './style.css';

// ============================================================
// Components.html - Reusable UI Component Render Functions
// Contract Review Workflow - Google Apps Script
// ============================================================

// --- Constants ---
const STATUS_LABELS = {
  'DRAFT': 'Draft',
  'PENDING_LEGAL': 'Legal Review',
  'LEGAL_COMMENTED': 'Legal Review',
  'USER_REVISING': 'Draft',
  'LEGAL_APPROVED': 'Head Review',
  'PENDING_HOL': 'Head Review',
  'HOL_COMMENTED': 'Head Review',
  'HOL_APPROVED': 'Approved',
  'COMPLETED': 'Approved',
  'LEGAL_REVIEW': 'Legal Review',
  'HEAD_REVIEW': 'Head Review'
};

// --- Helper Functions ---

/**
 * Parses a custom datetime string (format: dd/MM/yyyy HH:mm) into a JavaScript Date object.
 * @param {string|Date|number} str - The date string, Date object, or timestamp.
 * @return {Date} Parsed date object.
 */
function parseDateTimeString(str) {
  if (!str) return new Date(0);
  if (str instanceof Date) return str;
  if (typeof str === 'number') return new Date(str);
  var s = String(str).trim();
  var parts = s.split(' ');
  if (parts.length < 2) {
    var d = new Date(s);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }
  var delimiter = parts[0].indexOf('/') !== -1 ? '/' : (parts[0].indexOf('-') !== -1 ? '-' : '/');
  var dateParts = parts[0].split(delimiter);
  var timeParts = parts[1].split(':');
  if (dateParts.length === 3 && timeParts.length >= 2) {
    var isYearFirst = dateParts[0].length === 4;
    var day = parseInt(isYearFirst ? dateParts[2] : dateParts[0], 10);
    var month = parseInt(dateParts[1], 10) - 1; // 0-based
    var year = parseInt(isYearFirst ? dateParts[0] : dateParts[2], 10);
    var hours = parseInt(timeParts[0], 10);
    var minutes = parseInt(timeParts[1], 10);
    var seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
    return new Date(year, month, day, hours, minutes, seconds);
  }
  var d = new Date(s);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/**
 * Format date string to dd/MM/yyyy HH:mm
 * @param {string|null} dateString
 * @returns {string}
 */
function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    var d = parseDateTimeString(dateString);
    if (isNaN(d.getTime())) return '—';
    var day = String(d.getDate()).padStart(2, '0');
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var year = d.getFullYear();
    var hours = String(d.getHours()).padStart(2, '0');
    var minutes = String(d.getMinutes()).padStart(2, '0');
    return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;
  } catch (e) {
    return '—';
  }
}

/**
 * Vietnamese relative time
 * @param {string|null} dateString
 * @returns {string}
 */
function timeAgo(dateString) {
  if (!dateString) return '';
  try {
    var now = new Date();
    var past = parseDateTimeString(dateString);
    if (isNaN(past.getTime())) return '';
    var diffMs = now - past;
    var diffSec = Math.floor(diffMs / 1000);
    var diffMin = Math.floor(diffSec / 60);
    var diffHour = Math.floor(diffMin / 60);
    var diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'vừa xong';
    if (diffMin < 60) return diffMin + ' phút trước';
    if (diffHour < 24) return diffHour + ' giờ trước';
    return diffDay + ' ngày trước';
  } catch (e) {
    return '';
  }
}

/**
 * Basic markdown to HTML conversion
 * @param {string} text
 * @returns {string}
 */
function formatMarkdown(text) {
  if (!text) return '';
  var html = text;
  // Bold: **text** → <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // List items: lines starting with - → <li>
  var lines = html.split('\n');
  var result = [];
  var inList = false;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.trim().indexOf('- ') === 0) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push('<li>' + line.trim().substring(2) + '</li>');
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    }
  }
  if (inList) {
    result.push('</ul>');
  }
  html = result.join('\n');
  // Newlines → <br>
  html = html.replace(/\n/g, '<br>');
  return html;
}

// --- Component Functions ---

/**
 * 1. Render status badge
 * @param {string} status
 * @returns {string} HTML
 */
function renderStatusBadge(status) {
  var label = STATUS_LABELS[status] || status;
  return '<span class="status-badge status-' + status + '">' + label + '</span>';
}

/**
 * 2. Render stat card
 * @param {string} label
 * @param {string|number} value
 * @param {string} icon
 * @param {string} color
 * @returns {string} HTML
 */
function renderStatCard(label, value, icon, color, filterType, isActive) {
  var activeClass = isActive ? ' active' : '';
  var clickHandler = filterType ? ' onclick="handleCardClick(\'' + filterType + '\')"' : '';
  return '<div class="stat-card' + activeClass + '"' + clickHandler + '>' +
    '<div class="stat-card-icon" style="background: linear-gradient(135deg, ' + color + ', ' + color + '40)">' + icon + '</div>' +
    '<div class="stat-card-info">' +
    '<div class="stat-card-number">' + value + '</div>' +
    '<div class="stat-card-label">' + label + '</div>' +
    '</div>' +
    '</div>';
}

/**
 * 3. Render contract card (glassmorphism)
 * @param {Object} contract
 * @param {string} userRole
 * @returns {string} HTML
 */
function renderContractCard(contract, userRole) {
  return '<div class="contract-card" onclick="navigateTo(\'contract-detail\', \'' + contract.contractId + '\')">' +
    '<div class="contract-card-header">' +
    '<span class="contract-card-id">' + contract.contractId + '</span>' +
    renderStatusBadge(contract.status) +
    '</div>' +
    '<div class="contract-card-title">' + (contract.title || '') + '</div>' +
    '<div class="contract-card-meta">' +
    '<div class="contract-card-meta-item">' +
    '<span class="meta-label">Nhà cung cấp</span>' +
    '<span class="meta-value">' + (contract.supplier || '—') + '</span>' +
    '</div>' +
    '<div class="contract-card-meta-item">' +
    '<span class="meta-label">Phiên bản</span>' +
    '<span class="meta-value">v' + (contract.currentVersion || 1) + '</span>' +
    '</div>' +
    '<div class="contract-card-meta-item">' +
    '<span class="meta-label">Ngày tạo</span>' +
    '<span class="meta-value">' + formatDate(contract.createdAt) + '</span>' +
    '</div>' +
    '<div class="contract-card-meta-item">' +
    '<span class="meta-label">Cập nhật</span>' +
    '<span class="meta-value">' + formatDate(contract.updatedAt) + '</span>' +
    '</div>' +
    '</div>' +
    '</div>';
}

/**
 * 4. Render contract table
 * @param {Array} contracts
 * @param {string} userRole
 * @returns {string} HTML
 */
function renderContractTable(contracts, userRole) {
  if (!contracts || contracts.length === 0) {
    return renderEmptyState('📄', 'Không có hợp đồng nào', 'Chưa có hợp đồng nào được tạo');
  }

  var html = '<div class="table-responsive">' +
    '<table class="contract-table">' +
    '<thead><tr>' +
    '<th>ID</th>' +
    '<th>Tiêu đề</th>' +
    '<th>Nhà cung cấp</th>' +
    '<th>Trạng thái</th>' +
    '<th>Phiên bản</th>' +
    '<th>Ngày tạo</th>' +
    '<th>Cập nhật</th>' +
    '</tr></thead>' +
    '<tbody>';

  for (var i = 0; i < contracts.length; i++) {
    var c = contracts[i];
    html += '<tr class="contract-table-row" onclick="navigateTo(\'contract-detail\', \'' + c.contractId + '\')">' +
      '<td class="contract-table-id">' + c.contractId + '</td>' +
      '<td class="contract-table-title">' + (c.title || '') + '</td>' +
      '<td>' + (c.supplier || '—') + '</td>' +
      '<td>' + renderStatusBadge(c.status) + '</td>' +
      '<td>v' + (c.currentVersion || 1) + '</td>' +
      '<td>' + formatDate(c.createdAt) + '</td>' +
      '<td>' + formatDate(c.updatedAt) + '</td>' +
      '</tr>';
  }

  html += '</tbody></table></div>';
  return html;
}

/**
 * 5. Render timeline
 * @param {Array} activities
 * @returns {string} HTML
 */
function renderTimeline(activities) {
  if (!activities || activities.length === 0) {
    return renderEmptyState('📋', 'Chưa có hoạt động', 'Lịch sử hoạt động sẽ hiển thị ở đây');
  }

  var actionLabels = {
    'CREATED': 'Tạo hợp đồng',
    'SUBMITTED': 'Gửi review',
    'COMMENTED': 'Thêm góp ý',
    'APPROVED': 'Phê duyệt',
    'REJECTED': 'Yêu cầu chỉnh sửa',
    'UPLOADED_VERSION': 'Upload phiên bản mới',
    'STATUS_CHANGED': 'Cập nhật trạng thái',
    'COMPLETED': 'Hoàn tất hợp đồng'
  };

  var dotColors = {
    'APPROVED': '#10b981',
    'COMPLETED': '#10b981',
    'CREATED': '#3b82f6',
    'UPLOADED_VERSION': '#3b82f6',
    'SUBMITTED': '#f59e0b',
    'REJECTED': '#ef4444',
    'COMMENTED': '#8b5cf6'
  };

  var sortedActivities = [...activities].sort(function (a, b) {
    var timeA = parseDateTimeString(a.timestamp).getTime() || 0;
    var timeB = parseDateTimeString(b.timestamp).getTime() || 0;
    return timeB - timeA;
  });

  var html = '<div class="timeline">';

  for (var i = 0; i < sortedActivities.length; i++) {
    var act = sortedActivities[i];
    var action = act.action || act.action_type || '';
    if (action === 'COMMENT_ADDED' || action === 'COMMENTED') {
      continue;
    }
    var dotColor = dotColors[action] || '#6b7280';
    var label = actionLabels[action] || action;
    var delay = i * 0.1;

    html += '<div class="timeline-item" style="animation-delay: ' + delay + 's">' +
      '<div class="timeline-dot" style="background-color: ' + dotColor + '"></div>' +
      '<div class="timeline-card">' +
      '<div class="timeline-card-header">' +
      '<span class="timeline-card-title">' + label + '</span>' +
      '<span class="timeline-timestamp">' + timeAgo(act.timestamp) + '</span>' +
      '</div>' +
      (act.details ? '<div class="timeline-card-body">' + act.details + '</div>' : '') +
      '<div class="timeline-card-actor">Thực hiện bởi: <strong>' + (act.performedBy || '—') + '</strong></div>' +
      '</div>' +
      '</div>';
  }

  html += '</div>';
  return html;
}

/**
 * 6. Render version item
 * @param {Object} version
 * @param {number} index
 * @returns {string} HTML
 */
function renderVersionItem(version, index) {
  var fileLinkHtml = '';
  if (version.fileUrl) {
    fileLinkHtml = '<a href="' + version.fileUrl + '" target="_blank" class="version-download-btn">👁️ Xem tài liệu</a>';
  }

  var summaryHtml = '';
  if (version.changeSummary) {
    summaryHtml = '<div class="version-change-summary">Tóm tắt: ' + version.changeSummary + '</div>';
  }

  var negoHtml = '';
  if (version.negoNotes) {
    negoHtml = '<div class="nego-notes">' +
      '<div class="nego-notes-title">Ghi chú đàm phán</div>' +
      '<div class="nego-notes-content">' + version.negoNotes + '</div>' +
      '</div>';
  }

  var html = '<div class="version-item">' +
    '<div class="version-number">v' + (version.versionNo || index + 1) + '</div>' +
    '<div class="version-info">' +
    '<div class="version-filename">' + (version.fileName || '—') + '</div>' +
    '<div class="version-meta">' +
    'Tải lên bởi: <strong>' + (version.uploadedBy || '—') + '</strong> &bull; ' + formatDate(version.uploadedAt) +
    '</div>' +
    summaryHtml +
    negoHtml +
    '</div>' +
    fileLinkHtml +
    '</div>';

  return html;
}

/**
 * 7. Render comment bubble
 * @param {Object} comment
 * @returns {string} HTML
 */
function renderCommentBubble(comment) {
  var typeMap = {
    'LEGAL_COMMENT': { cls: 'comment-legal', align: 'left' },
    'USER_RESPONSE': { cls: 'comment-user', align: 'right' },
    'HOL_COMMENT': { cls: 'comment-hol', align: 'left' }
  };

  var typeInfo = typeMap[comment.type] || { cls: 'comment-system', align: 'center' };

  var html = '<div class="comment-bubble ' + typeInfo.cls + '">' +
    '<div class="commenter">' + (comment.commentBy || '—') + '</div>' +
    '<div class="comment-timestamp">' + timeAgo(comment.commentAt) + '</div>';

  if (comment.clauseRef) {
    html += '<span class="clause-ref">📌 ' + comment.clauseRef + '</span>';
  }

  if (comment.versionNo) {
    html += '<span class="clause-ref" style="margin-left: 8px;">Phiên bản v' + comment.versionNo + '</span>';
  }

  html += '<div class="comment-text">' + formatMarkdown(comment.commentText || '') + '</div>' +
    '</div>';

  return html;
}

/**
 * 8. Render modal
 * @param {string} id
 * @param {string} title
 * @param {string} bodyHtml
 * @param {string} footerHtml
 * @returns {string} HTML
 */
function renderModal(id, title, bodyHtml, footerHtml) {
  var html = '<div class="modal-overlay" id="' + id + '" onclick="if(event.target===this) closeModal(\'' + id + '\')">' +
    '<div class="modal-card">' +
    '<div class="modal-header">' +
    '<h3 class="modal-title">' + title + '</h3>' +
    '<button class="modal-close" onclick="closeModal(\'' + id + '\')">&times;</button>' +
    '</div>' +
    '<div class="modal-body">' + bodyHtml + '</div>';

  if (footerHtml) {
    html += '<div class="modal-footer">' + footerHtml + '</div>';
  }

  html += '</div></div>';
  return html;
}

/**
 * 10. Render loading spinner
 * @param {string} message
 * @returns {string} HTML
 */
function renderLoadingSpinner(message) {
  var msg = message || 'Đang tải...';
  return '<div class="loading-container">' +
    '<div class="loading-spinner"></div>' +
    '<p class="loading-message">' + msg + '</p>' +
    '</div>';
}

/**
 * 11. Render empty state
 * @param {string} icon
 * @param {string} title
 * @param {string} subtitle
 * @returns {string} HTML
 */
function renderEmptyState(icon, title, subtitle) {
  return '<div class="empty-state">' +
    '<div class="empty-state-icon">' + (icon || '📭') + '</div>' +
    '<h3 class="empty-state-title">' + (title || 'Không có dữ liệu') + '</h3>' +
    '<p class="empty-state-subtitle">' + (subtitle || '') + '</p>' +
    '</div>';
}

/**
 * 12. Render toast notification
 * @param {string} message
 * @param {string} type - success|error|info|warning
 * @returns {string} HTML
 */
function renderToast(message, type) {
  var icons = {
    'success': '✅',
    'error': '❌',
    'info': 'ℹ️',
    'warning': '⚠️'
  };
  var icon = icons[type] || icons['info'];
  var toastType = type || 'info';

  return '<div class="toast toast-' + toastType + '">' +
    '<span class="toast-icon">' + icon + '</span>' +
    '<span class="toast-message">' + message + '</span>' +
    '<button class="toast-close" onclick="this.parentElement.remove()">&times;</button>' +
    '</div>';
}

/**
 * 13. Render action buttons (context-sensitive)
 * @param {Object} contract
 * @param {string} userRole
 * @returns {string} HTML
 */
function renderActionButtons(contract, userRole) {
  var buttons = [];
  var status = contract.status;

  // Note: Standalone "Xem tài liệu" button removed from detail header as per user request.
  // Documents are accessible directly via individual version cards in the "Phiên bản" tab.

  // Add "Xoá yêu cầu" button: Only USER can delete in DRAFT or USER_REVISING statuses. Legal and Head (HOL) cannot delete.
  if (userRole === 'USER' && (status === 'DRAFT' || status === 'USER_REVISING')) {
    buttons.push('<button class="btn btn-danger btn-sm" onclick="deleteContract(\'' + contract.contractId + '\')">🗑️ Xoá yêu cầu</button>');
  }

  // USER actions
  if (userRole === 'USER') {
    if (status === 'USER_REVISING') {
      buttons.push('<button class="btn btn-primary btn-sm" onclick="showUploadVersionModal(\'' + contract.contractId + '\')">📎 Upload bản chỉnh sửa</button>');
    }
  }

  var taskList = contract.taskList || [];
  var hasNoGo = taskList.length > 0 && taskList.some(function (t) {
    return t.legalDecision === 'NoGo';
  });

  // LEGAL actions
  if (userRole === 'LEGAL') {
    if (status === 'PENDING_LEGAL' && !hasNoGo) {
      buttons.push('<button class="btn btn-success btn-sm" onclick="approveContract(\'' + contract.contractId + '\')">✅ Phê duyệt</button>');
    }
  }

  // HOL actions
  if (userRole === 'HOL') {
    if (status === 'PENDING_HOL' && !hasNoGo) {
      buttons.push('<button class="btn btn-success btn-sm" onclick="approveContract(\'' + contract.contractId + '\')">✅ Phê duyệt</button>');
    }
  }

  // Show "Thêm Yêu cầu" button based on generic permissions
  var canAddComment =
    ((status === 'DRAFT' || status === 'USER_REVISING') && userRole === 'USER') ||
    (status === 'PENDING_LEGAL' && userRole === 'LEGAL') ||
    (status === 'PENDING_HOL' && userRole === 'HOL');

  if (canAddComment) {
    buttons.push('<button class="btn btn-secondary btn-sm" onclick="showCommentModal(\'' + contract.contractId + '\')">💬 Thêm Yêu cầu</button>');
  }

  if (buttons.length === 0) return '';

  return '<div class="action-buttons-container">' + buttons.join('') + '</div>';
}

/**
 * 14. Render loading skeleton for contracts list (glassmorphic placeholder cards)
 * @returns {string} HTML
 */
function renderLoadingSkeleton() {
  var cards = '';
  for (var i = 0; i < 4; i++) {
    cards += '<div class="contract-card skeleton-card">' +
      '<div class="contract-card-header">' +
      '<div class="skeleton-text skeleton-title-id"></div>' +
      '<div class="skeleton-badge"></div>' +
      '</div>' +
      '<div class="skeleton-text skeleton-title-main"></div>' +
      '<div class="contract-card-meta">' +
      '<div class="contract-card-meta-item"><div class="skeleton-text skeleton-meta-row"></div></div>' +
      '<div class="contract-card-meta-item"><div class="skeleton-text skeleton-meta-row"></div></div>' +
      '<div class="contract-card-meta-item"><div class="skeleton-text skeleton-meta-row"></div></div>' +
      '<div class="contract-card-meta-item"><div class="skeleton-text skeleton-meta-row"></div></div>' +
      '</div>' +
      '</div>';
  }
  return '<div class="contract-list">' + cards + '</div>';
}

/**
 * 15. Render pagination controls
 * @param {number} totalItems
 * @param {number} itemsPerPage
 * @param {number} currentPage
 * @returns {string} HTML
 */
function renderPagination(totalItems, itemsPerPage, currentPage, changeFnName = 'changePage') {
  var totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  if (totalPages <= 1) return '';

  var html = '<div class="pagination-container">';

  // Nút Previous
  var prevDisabled = currentPage === 1 ? ' disabled' : '';
  html += '<button class="btn btn-outline btn-sm"' + prevDisabled + ' onclick="' + changeFnName + '(' + (currentPage - 1) + ')">◀ Trước</button>';

  // Hiển thị số trang
  html += '<span class="pagination-info">Trang <strong>' + currentPage + '</strong> / ' + totalPages + '</span>';

  // Nút Next
  var nextDisabled = currentPage === totalPages ? ' disabled' : '';
  html += '<button class="btn btn-outline btn-sm"' + nextDisabled + ' onclick="' + changeFnName + '(' + (currentPage + 1) + ')">Sau ▶</button>';

  html += '</div>';
  return html;
}

/**
 * 16. Render AI summary panel from structured JSON data
 * @param {Object} summaryData - The summary data object containing summaryJson string.
 * @returns {string} HTML
 */
function renderSummaryPanel(summaryData) {
  if (!summaryData) {
    return '<div class="summary-card" style="border-left: 4px solid #eab308; background: rgba(234, 179, 8, 0.05); margin-top: 10px;">' +
      '  <h4 style="margin-top:0; color:#eab308; font-size: 15px; display:flex; align-items:center; gap:8px;">⚠️ Không có tóm tắt AI</h4>' +
      '  <p style="color:var(--text-secondary); font-size:13px; line-height: 1.5; margin:0;">' +
      '    Hợp đồng này không có dữ liệu tóm tắt AI trong lưu trữ (Archived DB) do chưa thực hiện tóm tắt trước khi phê duyệt.' +
      '  </p>' +
      '</div>';
  }

  var resultJson = summaryData.resultJson || summaryData.summaryJson;
  var analyzedBy = summaryData.analyzedBy || summaryData.summarizedBy || 'AI';
  var analyzedAt = summaryData.analyzedAt || summaryData.summarizedAt || '';

  var parsed = {};
  try {
    parsed = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
  } catch (e) {
    return '<div class="ai-summary-loading"><p>Lỗi giải mã JSON tóm tắt: ' + e.message + '</p></div>';
  }

  var meta = parsed.contract_metadata || {};
  var summary = parsed.summary || {};
  var keyTerms = parsed.key_terms_table || [];
  var missing = parsed.missing_or_unclear || [];
  var confidence = parsed.confidence || 'high';
  var confidenceClass = confidence.toLowerCase();

  var html = '<div class="ai-summary-container">';

  // Header Info Card
  html += '<div class="summary-card" style="border-left: 4px solid var(--accent-secondary);">';
  html += '  <p style="font-size:12px; color:var(--text-muted); margin:0;">Tóm tắt phiên bản <strong>v' + summaryData.versionNo + '</strong> bởi <strong>' + analyzedBy + '</strong> lúc ' + analyzedAt + '</p>';
  html += '</div>';

  // 1. Contract Metadata Card
  html += '<div class="summary-card">';
  html += '  <div class="summary-card-title">📝 Thông tin chung</div>';

  // Parties
  if (meta.parties && meta.parties.length > 0) {
    html += '  <div style="margin-bottom:12px;">';
    html += '    <div class="summary-meta-label" style="margin-bottom:6px;">Các bên tham gia:</div>';
    meta.parties.forEach(function (party) {
      if (party.name) {
        html += '    <div class="summary-party-tag">';
        html += '      <span class="summary-party-name">' + party.name + '</span>';
        if (party.role) {
          html += '    <span class="summary-party-role"> (' + party.role + ')</span>';
        }
        html += '    </div>';
      }
    });
    html += '  </div>';
  }

  html += '  <div class="summary-meta-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">';
  html += '    <div class="summary-meta-item"><span class="summary-meta-label">Loại hợp đồng:</span> <span class="summary-meta-value">' + (meta.contract_type || 'N/A') + '</span></div>';
  html += '    <div class="summary-meta-item"><span class="summary-meta-label">Hiệu lực:</span> <span class="summary-meta-value">' + (meta.effective_date || 'N/A') + '</span></div>';
  html += '    <div class="summary-meta-item"><span class="summary-meta-label">Thời hạn:</span> <span class="summary-meta-value">' + (meta.duration || 'N/A') + '</span></div>';
  html += '    <div class="summary-meta-item"><span class="summary-meta-label">Gia hạn:</span> <span class="summary-meta-value">' + (meta.renewal_terms || 'N/A') + '</span></div>';
  html += '    <div class="summary-meta-item" style="grid-column: span 2;"><span class="summary-meta-label">Giá trị:</span> <span class="summary-meta-value" style="color:var(--color-warning); font-size:16px;">' + (meta.estimated_value || 'N/A') + ' ' + (meta.currency || '') + '</span></div>';
  html += '  </div>';
  html += '</div>';

  // 2. Purpose & Scope
  html += '<div class="summary-card">';
  html += '  <div class="summary-card-title">🎯 Mục đích & Phạm vi</div>';
  html += '  <div class="summary-section-text">' + (summary.purpose_scope || 'N/A') + '</div>';
  html += '</div>';

  // 3. Key Obligations
  var ourObligations = (summary.key_obligations && summary.key_obligations.our_company) || [];
  var counterpartyObligations = (summary.key_obligations && summary.key_obligations.counterparty) || [];

  if (ourObligations.length > 0 || counterpartyObligations.length > 0) {
    html += '<div class="summary-card">';
    html += '  <div class="summary-card-title">⚖️ Nghĩa vụ chính</div>';
    html += '  <div class="obligations-split">';

    // Our Company
    html += '    <div class="obligation-col">';
    html += '      <div class="obligation-col-title">Bên mua</div>';
    if (ourObligations.length > 0) {
      html += '    <ul class="obligation-list">';
      ourObligations.forEach(function (item) {
        html += '    <li class="obligation-item">' + item + '</li>';
      });
      html += '    </ul>';
    } else {
      html += '    <p style="font-size:12px; color:var(--text-muted); font-style:italic;">Không ghi nhận</p>';
    }
    html += '    </div>';

    // Counterparty
    html += '    <div class="obligation-col">';
    html += '      <div class="obligation-col-title">Bên bán</div>';
    if (counterpartyObligations.length > 0) {
      html += '    <ul class="obligation-list">';
      counterpartyObligations.forEach(function (item) {
        html += '    <li class="obligation-item">' + item + '</li>';
      });
      html += '    </ul>';
    } else {
      html += '    <p style="font-size:12px; color:var(--text-muted); font-style:italic;">Không ghi nhận</p>';
    }
    html += '    </div>';

    html += '  </div>';
    html += '</div>';
  }

  // 4. Overviews (Payment, Delivery, Termination)
  if (summary.payment_overview || summary.delivery_acceptance_overview || summary.termination_overview) {
    html += '<div class="summary-card">';
    html += '  <div class="summary-card-title">⚙️ Điều khoản quan trọng</div>';

    if (summary.payment_overview) {
      html += '  <div style="margin-bottom:12px;">';
      html += '    <div class="summary-meta-label" style="margin-bottom:2px;">💰 Thanh toán</div>';
      html += '    <div class="summary-section-text">' + summary.payment_overview + '</div>';
      html += '  </div>';
    }

    if (summary.delivery_acceptance_overview) {
      html += '  <div style="margin-bottom:12px;">';
      html += '    <div class="summary-meta-label" style="margin-bottom:2px;">📦 Giao nhận & Nghiệm thu</div>';
      html += '    <div class="summary-section-text">' + summary.delivery_acceptance_overview + '</div>';
      html += '  </div>';
    }

    if (summary.termination_overview) {
      html += '  <div>';
      html += '    <div class="summary-meta-label" style="margin-bottom:2px;">🚫 Chấm dứt hợp đồng</div>';
      html += '    <div class="summary-section-text">' + summary.termination_overview + '</div>';
      html += '  </div>';
    }

    html += '</div>';
  }

  // 5. Key Terms Table
  if (keyTerms.length > 0) {
    html += '<div class="summary-card" style="padding: 16px 0 0 0; overflow:hidden;">';
    html += '  <div class="summary-card-title" style="padding: 0 20px;">📋 Chi tiết các điều khoản</div>';
    html += '  <div style="overflow-x:auto;">';
    html += '    <table class="summary-terms-table">';
    html += '      <thead>';
    html += '        <tr>';
    html += '          <th style="width:30%;">Danh mục</th>';
    html += '          <th style="width:50%;">Nội dung trích xuất</th>';
    html += '          <th style="width:20%; text-align:right;">Tham chiếu</th>';
    html += '        </tr>';
    html += '      </thead>';
    html += '      <tbody>';

    keyTerms.forEach(function (term) {
      html += '      <tr>';
      html += '        <td class="summary-term-cat">' + (term.category || 'Khác') + '</td>';
      html += '        <td>' + (term.extracted_text || 'N/A') + '</td>';
      html += '        <td style="text-align:right;">' + (term.clause_reference ? '<span class="summary-term-ref">' + term.clause_reference + '</span>' : '—') + '</td>';
      html += '      </tr>';
    });

    html += '      </tbody>';
    html += '    </table>';
    html += '  </div>';
    html += '</div>';
  }

  // 6. Missing or Unclear Warnings
  if (missing.length > 0) {
    html += '<div class="summary-card" style="background:transparent; border:none; padding:0;">';
    html += '  <div class="summary-card-title" style="color: var(--color-error);">⚠️ Điểm cần lưu ý/làm rõ</div>';
    missing.forEach(function (item) {
      if (item.issue) {
        html += '  <div class="missing-item-card">';
        html += '    <div class="missing-item-issue">🔍 ' + item.issue + '</div>';
        if (item.recommendation) {
          html += '  <div class="missing-item-recommendation">💡 ' + item.recommendation + '</div>';
        }
        html += '  </div>';
      }
    });
    html += '</div>';
  }

  // 7. Notes
  var notes = summary.notes || [];
  if (notes.length > 0) {
    html += '<div class="summary-card">';
    html += '  <div class="summary-card-title">💡 Ghi chú khác</div>';
    html += '  <ul class="obligation-list">';
    notes.forEach(function (note) {
      html += '    <li class="obligation-item">' + note + '</li>';
    });
    html += '  </ul>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

/**
 * Render khung bao quát Trợ lý AI dạng Tabs.
 * @param {Object} contract - Hợp đồng đối tượng.
 * @returns {string} HTML
 */
function renderAIAssistantPanel(contract) {
  var activeTab = AppState.activeAiTab || 'SUMMARY';
  var isAiLoading = !!AppState.aiLoadingType;
  var isHydrating = !!contract.isHydrating;
  var isControlDisabled = isAiLoading || isHydrating;
  var loadingType = AppState.aiLoadingType;
  var analyses = contract.aiAnalyses || {};
  var isApproved = (contract.status === 'HOL_APPROVED' || contract.status === 'COMPLETED');

  // Header with version dropdown select
  var versions = contract.versions || [];
  var dropdownHtml = '';
  if (versions.length > 0) {
    dropdownHtml += '<div style="display:flex; align-items:center; gap:8px;">';
    dropdownHtml += '  <span style="font-size:12px; color:var(--text-muted);">Phiên bản:</span>';
    dropdownHtml += '  <select id="ai-version-select" class="form-control" style="width: auto; padding: 4px 24px 4px 8px; font-size: 13px; height: 30px; border-radius: 4px;" onchange="handleAiVersionChange(this.value)" ' + (isControlDisabled ? 'disabled' : '') + '>';
    for (var v = 0; v < versions.length; v++) {
      var vNo = versions[v].versionNo;
      var selected = (vNo === AppState.selectedAiVersion) ? 'selected' : '';
      dropdownHtml += '<option value="' + vNo + '" ' + selected + '>v' + vNo + '</option>';
    }
    dropdownHtml += '  </select>';
    dropdownHtml += '</div>';
  }

  var html = '';
  // Header
  html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; padding: 0 4px; flex-shrink: 0; gap: 12px;">';
  html += '  <h3 style="margin:0; font-size:16px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:8px;">🤖 Trợ lý AI</h3>';
  html += '  ' + dropdownHtml;
  html += '</div>';

  // Tab Bar
  var showDecisionBrief = (AppState.user?.role === 'HOL') &&
    (contract.status === 'PENDING_HOL' ||
      contract.status === 'HOL_APPROVED' ||
      contract.status === 'COMPLETED' ||
      (analyses.allAnalyses && analyses.allAnalyses.some(function (a) { return a.analysisType === 'DECISION_BRIEF'; })));

  if (activeTab === 'DECISION_BRIEF' && !showDecisionBrief) {
    activeTab = 'SUMMARY';
    AppState.activeAiTab = 'SUMMARY';
  }

  html += '<div class="ai-tab-bar" style="' + (isHydrating ? 'opacity: 0.6;' : '') + '">';
  html += '  <button class="ai-tab-item ' + (activeTab === 'SUMMARY' ? 'active' : '') + '" onclick="switchAiTab(\'SUMMARY\')" ' + (isControlDisabled ? 'disabled' : '') + '>📝 Tóm tắt</button>';
  html += '  <button class="ai-tab-item ' + (activeTab === 'RISK' ? 'active' : '') + '" onclick="switchAiTab(\'RISK\')" ' + (isControlDisabled ? 'disabled' : '') + '>⚖️ Đánh giá rủi ro</button>';
  html += '  <button class="ai-tab-item ' + (activeTab === 'TASK_LIST' ? 'active' : '') + '" onclick="switchAiTab(\'TASK_LIST\')" ' + (isControlDisabled ? 'disabled' : '') + '>📋 Task List</button>';
  if (showDecisionBrief) {
    html += '  <button class="ai-tab-item ' + (activeTab === 'DECISION_BRIEF' ? 'active' : '') + '" onclick="switchAiTab(\'DECISION_BRIEF\')" ' + (isControlDisabled ? 'disabled' : '') + '>📊 Decision Brief</button>';
  }
  html += '</div>';

  // Content Area
  html += '<div class="ai-tab-content" style="margin-top: 12px;">';

  if (isHydrating) {
    // Trạng thái đang tải dữ liệu hợp đồng -> Vô hiệu hóa và hiển thị Skeleton
    html += '<div class="summary-card" style="opacity: 0.7; padding: 24px 16px; text-align: center;">';
    html += '  <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 16px; color: var(--text-muted); font-size: 13.5px; font-weight: 500;">';
    html += '    <span style="display: inline-block; animation: spin 0.8s linear infinite;">🔄</span> Đang nạp dữ liệu phân tích...';
    html += '  </div>';
    html += '  <div style="display: flex; flex-direction: column; gap: 10px; opacity: 0.5;">';
    html += '    <div class="skeleton" style="height: 20px; border-radius: 4px;"></div>';
    html += '    <div class="skeleton" style="height: 50px; border-radius: 6px;"></div>';
    html += '    <div class="skeleton" style="height: 50px; border-radius: 6px;"></div>';
    html += '  </div>';
    html += '</div>';
  } else if (activeTab === 'TASK_LIST') {
    html += renderTaskListPanel(contract, AppState.user?.role);
  } else if (isAiLoading && loadingType === activeTab) {
    // Đang loading đúng tab hiện tại
    var actionText = '';
    if (activeTab === 'SUMMARY') actionText = 'đọc hiểu và tóm tắt';
    else if (activeTab === 'RISK') actionText = 'phân tích và đánh giá rủi ro';
    else if (activeTab === 'DECISION_BRIEF') actionText = 'lập báo cáo khuyến nghị quyết định';

    html += '<div class="summary-card">';
    html += '  <div class="ai-summary-loading">';
    html += '    <div class="ai-pulse-ring"></div>';
    html += '    <p style="color:var(--text-secondary); font-size:14px; font-weight:500;">🤖 AI đang ' + actionText + ' hợp đồng...</p>';
    html += '  </div>';
    html += '</div>';
  } else {
    // Hiển thị dữ liệu phân tích hoặc nút CTA cho phiên bản đang chọn
    var allAnalyses = analyses.allAnalyses || [];
    var currentAnalysis = null;
    for (var k = 0; k < allAnalyses.length; k++) {
      if (allAnalyses[k].analysisType === activeTab &&
        allAnalyses[k].versionNo === AppState.selectedAiVersion) {
        currentAnalysis = allAnalyses[k];
        break;
      }
    }

    if (currentAnalysis) {
      // Có dữ liệu phân tích
      if (activeTab === 'SUMMARY') {
        html += renderSummaryPanel(currentAnalysis);
      } else if (activeTab === 'RISK') {
        html += renderRiskPanel(currentAnalysis);
      } else if (activeTab === 'DECISION_BRIEF') {
        html += renderDecisionBriefPanel(currentAnalysis);
      }
    } else {
      // Chưa có dữ liệu phân tích
      if (isApproved) {
        // Đã duyệt nhưng chưa chạy phân tích → Chỉ hiện thông báo
        var warnText = '';
        if (activeTab === 'SUMMARY') {
          warnText = 'Hợp đồng này không có dữ liệu tóm tắt AI trong lưu trữ (Archived DB) do chưa thực hiện tóm tắt trước khi phê duyệt.';
        } else if (activeTab === 'RISK') {
          warnText = 'Hợp đồng này không có dữ liệu đánh giá rủi ro AI trong lưu trữ (Archived DB) do chưa thực hiện đánh giá rủi ro trước khi phê duyệt.';
        } else if (activeTab === 'DECISION_BRIEF') {
          warnText = 'Hợp đồng này không có dữ liệu báo cáo khuyến nghị AI trong lưu trữ (Archived DB) do chưa thực hiện tạo Decision Brief trước khi phê duyệt.';
        }
        html += '<div class="summary-card" style="border-left: 4px solid #eab308; background: rgba(234, 179, 8, 0.05); margin-top: 10px;">';
        html += '  <h4 style="margin-top:0; color:#eab308; font-size: 15px; display:flex; align-items:center; gap:8px;">⚠️ Không có dữ liệu phân tích</h4>';
        html += '  <p style="color:var(--text-secondary); font-size:13px; line-height: 1.5; margin:0;">' + warnText + '</p>';
        html += '</div>';
      } else {
        // Chưa duyệt → Cho phép chạy phân tích
        if (activeTab === 'DECISION_BRIEF') {
          html += '<div class="summary-card ai-cta-section">';
          html += '  <h4 style="margin-top:0; color:var(--text-primary); font-size: 15px; font-weight:700;">Báo cáo Khuyến nghị Quyết định (Decision Brief)</h4>';
          html += '  <p style="color:var(--text-secondary); font-size:13px; line-height: 1.5; margin-bottom: 16px;">AI sẽ tổng hợp Task List, nội dung Hợp đồng, và Đánh giá rủi ro mới nhất để đưa ra báo cáo khuyến nghị phê duyệt hoặc từ chối hợp đồng cho Head of Legal.</p>';
          html += '  <button class="btn btn-ai" onclick="handleTriggerDecisionBrief(\'' + contract.contractId + '\')">📊 Tạo Decision Brief</button>';
          html += '</div>';
        } else {
          var titleText = activeTab === 'SUMMARY' ? 'Tóm tắt hợp đồng bằng AI' : 'Đánh giá rủi ro hợp đồng bằng AI';
          var descText = activeTab === 'SUMMARY'
            ? 'AI sẽ đọc toàn bộ nội dung văn bản hợp đồng và trích xuất thông tin quan trọng, nghĩa vụ các bên, điều khoản thanh toán, giao nhận.'
            : 'AI sẽ phân tích các điều khoản hợp đồng để phát hiện rủi ro bất lợi cho chúng tôi, đề xuất giải pháp giảm thiểu và chỉ ra các điều khoản bị thiếu.';
          var btnText = activeTab === 'SUMMARY' ? '⚡ Chạy Tóm tắt AI' : '⚡ Chạy Đánh giá Rủi ro';

          html += '<div class="summary-card ai-cta-section">';
          html += '  <h4 style="margin-top:0; color:var(--text-primary); font-size: 15px; font-weight:700;">' + titleText + '</h4>';
          html += '  <p style="color:var(--text-secondary); font-size:13px; line-height: 1.5; margin-bottom: 16px;">' + descText + '</p>';
          if (activeTab === 'RISK') {
            html += '  <div style="display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap; margin-top:10px;">';
            html += '    <div style="display:flex; align-items:center; gap:8px;">';
            html += '      <span style="font-size:13px; font-weight:600; color:var(--text-secondary);">Vai trò công ty:</span>';
            html += '      <select id="ai-role-select" class="form-control" style="width: auto; padding: 4px 24px 4px 8px; font-size: 13px; height: 32px; border-radius: 4px; background-color: var(--input-bg); border: 1px solid var(--input-border); color: var(--text-primary);" onchange="handleCompanyRoleChange(this.value)">';
            html += '        <option value="BUYER" ' + (AppState.selectedCompanyRole === 'BUYER' ? 'selected' : '') + '>🛒 Bên Mua</option>';
            html += '        <option value="SELLER" ' + (AppState.selectedCompanyRole === 'SELLER' ? 'selected' : '') + '>📦 Bên Bán</option>';
            html += '      </select>';
            html += '    </div>';
            html += '    <button class="btn btn-ai" onclick="handleTriggerAI(\'' + contract.contractId + '\', \'' + activeTab + '\')">' + btnText + '</button>';
            html += '  </div>';
          } else {
            html += '  <button class="btn btn-ai" onclick="handleTriggerAI(\'' + contract.contractId + '\', \'' + activeTab + '\')">' + btnText + '</button>';
          }
          html += '</div>';
        }
      }
    }
  }

  html += '</div>';
  return html;
}

/**
 * Render giao diện đánh giá rủi ro từ kết quả AI.
 * @param {Object} riskData - Dữ liệu đánh giá rủi ro chứa resultJson.
 * @returns {string} HTML
 */
function renderRiskPanel(riskData) {
  if (!riskData) return '';

  var parsed = {};
  try {
    var resultJson = riskData.resultJson || riskData.summaryJson;
    parsed = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
  } catch (e) {
    return '<div class="ai-summary-loading"><p>Lỗi giải mã JSON đánh giá rủi ro: ' + e.message + '</p></div>';
  }

  var overallRating = parsed.overall_rating || 'LOW';
  var overallComment = parsed.overall_comment || '';
  var riskClauses = parsed.risk_clauses || [];
  var missingProvisions = parsed.missing_provisions || [];
  var confidence = parsed.confidence || 'high';

  var ratingColor = '#10b981'; // Green
  var ratingBg = 'rgba(16, 185, 129, 0.05)';
  if (overallRating.toUpperCase() === 'HIGH') {
    ratingColor = '#ef4444'; // Red
    ratingBg = 'rgba(239, 68, 68, 0.05)';
  } else if (overallRating.toUpperCase() === 'MEDIUM') {
    ratingColor = '#eab308'; // Yellow
    ratingBg = 'rgba(234, 179, 8, 0.05)';
  }

  var confidenceClass = confidence.toLowerCase();
  var analyzedBy = riskData.analyzedBy || riskData.summarizedBy || 'AI';
  var analyzedAt = riskData.analyzedAt || riskData.summarizedAt || '';

  var html = '<div class="ai-summary-container">';

  // Header Info Card
  html += '<div class="summary-card" style="border-left: 4px solid var(--accent-secondary);">';
  html += '  <p style="font-size:12px; color:var(--text-muted); margin:0;">Đánh giá phiên bản <strong>v' + riskData.versionNo + '</strong> bởi <strong>' + analyzedBy + '</strong> lúc ' + analyzedAt + '</p>';
  html += '</div>';

  // 1. Overall Rating Card
  html += '<div class="summary-card risk-overview-card" style="border-left: 4px solid ' + ratingColor + '; background: ' + ratingBg + ';">';
  html += '  <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">';
  html += '    <span class="summary-meta-label">Rủi ro tổng thể:</span>';
  html += '    <span class="risk-badge risk-badge-' + overallRating.toLowerCase() + '">' + overallRating.toUpperCase() + '</span>';
  html += '  </div>';
  html += '  <div class="summary-section-text" style="font-weight: 500; line-height: 1.5; color: var(--text-primary);">' + overallComment + '</div>';
  html += '</div>';

  // 2. Risk Clauses
  html += '<div class="summary-card" style="background:transparent; border:none; padding:0; box-shadow:none; margin-top:16px;">';
  html += '  <div class="summary-card-title" style="padding-left:4px;">⚖️ Các điều khoản rủi ro</div>';
  if (riskClauses.length > 0) {
    riskClauses.forEach(function (item) {
      var sev = (item.severity || 'LOW').toUpperCase();
      var itemColor = '#10b981';
      if (sev === 'HIGH') itemColor = '#ef4444';
      else if (sev === 'MEDIUM') itemColor = '#eab308';

      html += '  <div class="missing-item-card risk-clause-card" style="border-left: 4px solid ' + itemColor + ';">';
      html += '    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">';
      html += '      <span style="font-weight:700; color:var(--text-primary); font-size:13px;">📍 ' + (item.clause_reference || 'Điều khoản') + '</span>';
      html += '      <span class="risk-badge risk-badge-' + sev.toLowerCase() + '">' + sev + '</span>';
      html += '    </div>';
      html += '    <div class="summary-section-text" style="margin-bottom:8px; font-size:13px;">' + item.description + '</div>';
      if (item.recommendation) {
        html += '  <div class="missing-item-recommendation" style="font-size:12px; margin-top:4px;">💡 <strong>Khuyến nghị:</strong> ' + item.recommendation + '</div>';
      }
      html += '  </div>';
    });
  } else {
    html += '  <div class="missing-item-card" style="border-left: 4px solid #10b981; background:rgba(16, 185, 129, 0.05);">';
    html += '    <div class="summary-section-text" style="color:var(--text-secondary); font-style:italic;">Không phát hiện điều khoản rủi ro nào đáng kể.</div>';
    html += '  </div>';
  }
  html += '</div>';

  // 3. Missing Provisions
  html += '<div class="summary-card" style="background:transparent; border:none; padding:0; box-shadow:none; margin-top:16px;">';
  html += '  <div class="summary-card-title" style="padding-left:4px; color: var(--color-error);">⚠️ Điều khoản bị thiếu</div>';
  if (missingProvisions.length > 0) {
    missingProvisions.forEach(function (item) {
      if (item.issue) {
        html += '  <div class="missing-item-card">';
        html += '    <div class="missing-item-issue">🔍 ' + item.issue + '</div>';
        if (item.recommendation) {
          html += '  <div class="missing-item-recommendation">💡 <strong>Khuyến nghị:</strong> ' + item.recommendation + '</div>';
        }
        html += '  </div>';
      }
    });
  } else {
    html += '  <div class="missing-item-card" style="border-left: 4px solid #10b981; background:rgba(16, 185, 129, 0.05);">';
    html += '    <div class="summary-section-text" style="color:var(--text-secondary); font-style:italic;">Không phát hiện điều khoản bị thiếu quan trọng nào.</div>';
    html += '  </div>';
  }
  html += '</div>';

  html += '</div>';
  return html;
}

/**
 * Render Decision Brief tab content.
 * @param {Object} briefData
 * @returns {string} HTML
 */
function renderDecisionBriefPanel(briefData) {
  if (!briefData) return '';

  var parsed = {};
  try {
    var resultJson = briefData.resultJson;
    parsed = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
  } catch (e) {
    return '<div class="ai-summary-loading"><p>Lỗi giải mã JSON Decision Brief: ' + e.message + '</p></div>';
  }

  var rec = parsed.recommendation || 'APPROVE';
  var recText = '';
  var recClass = '';
  if (rec === 'APPROVE') {
    recText = 'Phê duyệt (Approve)';
    recClass = 'recommendation-badge-approve';
  } else if (rec === 'REJECT') {
    recText = 'Từ chối (Reject)';
    recClass = 'recommendation-badge-reject';
  } else {
    recText = 'Phê duyệt có điều kiện (Conditional)';
    recClass = 'recommendation-badge-conditional';
  }

  var confidence = parsed.confidence || 'medium';
  var confidenceText = confidence === 'high' ? 'Cao' : (confidence === 'low' ? 'Thấp' : 'Trung bình');
  var confidenceClass = 'confidence-' + confidence;

  var overallRating = parsed.risk_summary?.overall_rating || 'LOW';
  var overallRatingClass = 'status-badge ' + overallRating;
  var overallRatingLabel = overallRating === 'HIGH' ? 'Rủi ro Cao' : (overallRating === 'MEDIUM' ? 'Rủi ro Trung bình' : 'Rủi ro Thấp');

  var html = '';
  html += '<div class="brief-container">';

  // 1. Recommendation Header Card
  html += '  <div class="brief-card">';
  html += '    <div class="recommendation-header">';
  html += '      <div class="recommendation-title-wrap">';
  html += '        <span class="recommendation-label">Khuyến nghị của AI</span>';
  html += '        <div class="recommendation-badge ' + recClass + '">📢 ' + recText + '</div>';
  html += '      </div>';
  html += '      <div class="confidence-indicator">';
  html += '        <span>Độ tin cậy:</span>';
  html += '        <span class="confidence-dot ' + confidenceClass + '"></span>';
  html += '        <strong class="' + confidenceClass + '">' + confidenceText + '</strong>';
  html += '      </div>';
  html += '    </div>';
  html += '    <div style="font-size: 11px; color: var(--text-muted); display:flex; justify-content:space-between; margin-top:8px;">';
  html += '      <span>Người lập: ' + (briefData.analyzedBy || 'System') + '</span>';
  html += '      <span>Thời gian: ' + (briefData.analyzedAt || '') + '</span>';
  html += '    </div>';
  html += '  </div>';

  // 2. Executive Summary
  html += '  <div class="brief-card">';
  html += '    <div class="brief-card-title">📝 Tóm tắt khuyến nghị</div>';
  html += '    <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin: 0;">' + (parsed.executive_summary || 'Không có tóm tắt.') + '</p>';
  html += '  </div>';

  // 3. Risk Summary
  var keyRisks = parsed.risk_summary?.key_risks || [];
  var unresolvedCount = parsed.risk_summary?.unresolved_count || 0;
  html += '  <div class="brief-card">';
  html += '    <div class="brief-card-title" style="justify-content: space-between; display: flex; align-items: center;">';
  html += '      <span>⚖️ Đánh giá rủi ro tổng hợp</span>';
  html += '      <span class="' + overallRatingClass + '">' + overallRatingLabel + '</span>';
  html += '    </div>';
  html += '    <p style="font-size:13px; color:var(--text-secondary); margin: 0 0 12px 0;">';
  html += '      Số rủi ro chưa giải quyết (UNRESOLVED): <strong style="color:var(--color-error);">' + unresolvedCount + '</strong>';
  html += '    </p>';

  if (keyRisks.length > 0) {
    html += '    <div class="brief-risk-list">';
    for (var i = 0; i < keyRisks.length; i++) {
      var r = keyRisks[i];
      var severityLabel = r.severity === 'HIGH' ? 'Cao' : (r.severity === 'MEDIUM' ? 'Trung bình' : 'Thấp');
      var severityClass = 'factor-weight-' + r.severity;
      var mitLabel = r.mitigation_status === 'RESOLVED' ? 'Đã giải quyết' : (r.mitigation_status === 'PARTIALLY_RESOLVED' ? 'Giải quyết một phần' : 'Chưa giải quyết');
      var mitClass = r.mitigation_status === 'RESOLVED' ? 'mitigation-resolved' : (r.mitigation_status === 'PARTIALLY_RESOLVED' ? 'mitigation-partial' : 'mitigation-unresolved');

      html += '      <div class="brief-risk-item">';
      html += '        <div class="brief-risk-meta">';
      html += '          <span class="brief-risk-ref">📍 ' + (r.clause_reference || 'Điều khoản không xác định') + '</span>';
      html += '          <div style="display:flex; gap:6px; align-items:center;">';
      html += '            <span class="factor-weight ' + severityClass + '">Mức độ: ' + severityLabel + '</span>';
      html += '            <span class="mitigation-tag ' + mitClass + '">' + mitLabel + '</span>';
      html += '          </div>';
      html += '        </div>';
      html += '        <div class="brief-risk-desc">' + (r.description || '') + '</div>';
      html += '      </div>';
    }
    html += '    </div>';
  } else {
    html += '    <p style="font-size:13px; color:var(--text-muted); font-style:italic; margin:0;">Không phát hiện rủi ro trọng yếu.</p>';
  }
  html += '  </div>';

  // 4. Task Review
  var taskReview = parsed.task_review || {};
  var totalTasks = taskReview.total_tasks || 0;
  var byCategory = taskReview.by_category || {};
  var byStatus = taskReview.by_status || {};
  var criticalItems = taskReview.critical_items || [];

  html += '  <div class="brief-card">';
  html += '    <div class="brief-card-title">📋 Tình hình xử lý Task List</div>';
  html += '    <div class="stats-grid">';
  html += '      <div class="stat-item">';
  html += '        <div class="stat-val">' + totalTasks + '</div>';
  html += '        <div class="stat-lbl">Tổng số task</div>';
  html += '      </div>';
  html += '      <div class="stat-item">';
  html += '        <div class="stat-val must-fix">' + (byCategory['Must Fix'] || 0) + '</div>';
  html += '        <div class="stat-lbl">Must Fix</div>';
  html += '      </div>';
  html += '      <div class="stat-item">';
  html += '        <div class="stat-val" style="color:var(--color-success);">' + (byStatus['Fixed'] || 0) + '</div>';
  html += '        <div class="stat-lbl">Đã sửa (Fixed)</div>';
  html += '      </div>';
  html += '    </div>';

  if (criticalItems.length > 0) {
    html += '    <div style="margin-top: 14px;">';
    html += '      <div style="font-size: 13px; font-weight:600; color:var(--color-error); margin-bottom:8px;">⚠️ Vấn đề tồn đọng nghiêm trọng (Must Fix nhưng chưa sửa xong):</div>';
    html += '      <div class="brief-risk-list">';
    for (var c = 0; c < criticalItems.length; c++) {
      var item = criticalItems[c];
      var statusLbl = item.status === 'Partial Fixed' ? 'Sửa một phần' : 'Không thể sửa';
      var statusCls = item.status === 'Partial Fixed' ? 'mitigation-partial' : 'mitigation-unresolved';

      html += '        <div class="brief-risk-item" style="border-left:3px solid var(--color-error);">';
      html += '          <div class="brief-risk-meta">';
      html += '            <span class="brief-risk-ref">📍 ' + (item.clauses || 'Điều khoản') + '</span>';
      html += '            <span class="mitigation-tag ' + statusCls + '">' + statusLbl + '</span>';
      html += '          </div>';
      html += '          <div class="brief-risk-desc" style="font-weight:600; margin-bottom:4px;">Vấn đề: ' + (item.issue_summary || '') + '</div>';
      html += '          <div class="brief-risk-desc" style="font-size:12.5px; opacity:0.85;">Tác động: ' + (item.impact_assessment || '') + '</div>';
      html += '        </div>';
    }
    html += '      </div>';
    html += '    </div>';
  }
  html += '  </div>';

  // 5. Decision Factors
  var factors = parsed.decision_factors || [];
  if (factors.length > 0) {
    html += '  <div class="brief-card" style="padding: 16px 12px;">';
    html += '    <div class="brief-card-title" style="padding-left:8px;">📊 Yếu tố ảnh hưởng quyết định</div>';
    html += '    <div class="table-responsive">';
    html += '      <table class="factors-table">';
    html += '        <thead>';
    html += '          <tr>';
    html += '            <th>Yếu tố</th>';
    html += '            <th>Trọng số</th>';
    html += '            <th>Đánh giá</th>';
    html += '            <th>Chi tiết</th>';
    html += '          </tr>';
    html += '        </thead>';
    html += '        <tbody>';
    for (var f = 0; f < factors.length; f++) {
      var fact = factors[f];
      var weightLbl = fact.weight === 'HIGH' ? 'Cao' : (fact.weight === 'MEDIUM' ? 'T.Bình' : 'Thấp');
      var weightCls = 'factor-weight-' + fact.weight;
      var assessLbl = fact.assessment === 'FAVORABLE' ? 'Thuận lợi' : (fact.assessment === 'NEUTRAL' ? 'Trung lập' : 'Bất lợi');
      var assessCls = 'factor-assessment-' + fact.assessment;

      html += '          <tr>';
      html += '            <td style="font-weight:600; color:var(--text-primary); min-width:100px;">' + (fact.factor || '') + '</td>';
      html += '            <td><span class="factor-weight ' + weightCls + '">' + weightLbl + '</span></td>';
      html += '            <td><span class="factor-assessment ' + assessCls + '">' + assessLbl + '</span></td>';
      html += '            <td style="color:var(--text-secondary); line-height:1.4;">' + (fact.detail || '') + '</td>';
      html += '          </tr>';
    }
    html += '        </tbody>';
    html += '      </table>';
    html += '    </div>';
    html += '  </div>';
  }

  // 6. Conditions (Only show if CONDITIONAL_APPROVE and conditions is not empty)
  var conditions = parsed.conditions || [];
  if (rec === 'CONDITIONAL_APPROVE' && conditions.length > 0) {
    html += '  <div class="brief-card">';
    html += '    <div class="brief-card-title">⚠️ Điều kiện phê duyệt</div>';
    html += '    <div class="brief-condition-list">';
    for (var cd = 0; cd < conditions.length; cd++) {
      var cond = conditions[cd];
      var priorityLbl = cond.priority === 'MUST' ? 'Bắt buộc' : (cond.priority === 'SHOULD' ? 'Khuyến nghị' : 'Tuỳ chọn');
      var priorityCls = 'condition-priority-' + cond.priority;

      html += '      <div class="brief-condition-item">';
      html += '        <span class="condition-priority ' + priorityCls + '">' + priorityLbl + '</span>';
      html += '        <div class="condition-text">' + (cond.condition || '') + '</div>';
      html += '      </div>';
    }
    html += '    </div>';
    html += '  </div>';
  }

  html += '</div>'; // End container
  return html;
}

/**
 * Render Task List tab content.
 * @param {Object} contract
 * @param {string} userRole
 * @returns {string} HTML
 */
function renderTaskListPanel(contract, userRole, isExpandedModal) {
  var taskList = contract.taskList || [];
  var status = contract.status;
  var isApproved = (status === 'HOL_APPROVED' || status === 'COMPLETED');

  var isDraftStage = (status === 'DRAFT' || status === 'USER_REVISING');
  var isLegalStage = (status === 'PENDING_LEGAL' || status === 'LEGAL_COMMENTED');
  var isHeadStage = (status === 'PENDING_HOL' || status === 'HOL_COMMENTED');

  var isLegalOrHead = (userRole === 'LEGAL' || userRole === 'HOL');
  var isUser = (userRole === 'USER');

  // Legal or HOL can edit their columns if it is their active review stage
  var canLegalEdit = !isApproved && (
    (userRole === 'LEGAL' && isLegalStage) ||
    (userRole === 'HOL' && isHeadStage)
  );

  // User can edit their columns if it is draft stage
  var canUserEdit = !isApproved && (userRole === 'USER' && isDraftStage);

  var showAddBtn = canLegalEdit;

  var html = '<div class="ai-summary-container">';

  html += '<div class="summary-card" style="padding: 16px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; gap: 12px; margin-bottom: 8px;">';
  html += '  <div>';
  html += '    <p style="margin: 4px 0 0 0; color:var(--text-secondary); font-size:12px;">Các yêu cầu chỉnh sửa và phản hồi của hợp đồng này</p>';
  html += '  </div>';

  var actionsHtml = '';
  if (!isExpandedModal) {
    actionsHtml += '  <button class="btn btn-outline btn-sm" onclick="showTaskListExpandedModal()" style="display: inline-flex; align-items: center; gap: 6px;">🖥️ Xem rộng</button>';
  }
  if (showAddBtn) {
    actionsHtml += '  <button class="task-row-btn btn-add" onclick="handleAddTaskRow()" title="Thêm dòng mới">➕</button>';
  }

  if (actionsHtml) {
    html += '  <div style="display: flex; align-items: center; gap: 8px;">' + actionsHtml + '</div>';
  }
  html += '</div>';

  if (taskList.length === 0) {
    html += '<div class="summary-card text-center" style="padding: 30px 20px;">';
    html += '  <span style="font-size: 32px; display: block; margin-bottom: 8px;">📋</span>';
    html += '  <h4 style="margin: 0; color: var(--text-primary); font-size: 14px;">Chưa có Task List</h4>';
    html += '  <p style="margin: 6px 0 0 0; color: var(--text-muted); font-size: 12px;">' +
      (isLegalOrHead ? 'Hãy nhấn nút "+" ở trên hoặc "Thêm Task" để bắt đầu tạo danh sách yêu cầu.' : 'Chưa có danh sách yêu cầu chỉnh sửa từ Legal cho hợp đồng này.') +
      '</p>';
    if (showAddBtn) {
      html += '  <button class="btn btn-outline btn-sm" style="margin-top:12px;" onclick="handleAddTaskRow()">➕ Thêm Task</button>';
    }
    html += '</div>';
    return html + '</div>';
  }

  html += '<div class="summary-card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-card);">';
  html += '  <div style="overflow-x: auto; width: 100%;">';
  html += '    <table class="task-list-table">';
  html += '      <thead>';
  html += '        <tr>';
  html += '          <th style="width: 15%;">Clauses</th>';
  html += '          <th style="width: 20%;">Issue Summary</th>';
  html += '          <th style="width: 12%;">Category</th>';
  html += '          <th style="width: 20%;">Legal Recommendation</th>';
  html += '          <th style="width: 12%;">Status</th>';
  html += '          <th style="width: 20%;">User notes</th>';
  html += '          <th style="width: 10%;">Legal Decision</th>';
  if (showAddBtn) {
    html += '          <th style="width: 5%; text-align: center;">Hành động</th>';
  }
  html += '        </tr>';
  html += '      </thead>';
  html += '      <tbody>';

  for (var i = 0; i < taskList.length; i++) {
    var t = taskList[i];
    var tid = t.taskId;

    // Check disable/enable states based on role and current active stage
    var isLegalFieldsDisabled = canLegalEdit ? '' : 'disabled';
    var isUserFieldsDisabled = canUserEdit ? '' : 'disabled';

    html += '        <tr data-task-id="' + tid + '">';

    // Clauses
    html += '          <td>';
    html += '            <input type="text" class="form-control" value="' + (t.clauses || '') + '" oninput="handleTaskFieldChange(\'' + tid + '\', \'clauses\', this.value)" ' + isLegalFieldsDisabled + ' placeholder="VD: Điều 4.2" />';
    html += '          </td>';

    // Issue Summary
    html += '          <td>';
    html += '            <textarea class="form-control" oninput="handleTaskFieldChange(\'' + tid + '\', \'issueSummary\', this.value); autoResizeTaskTextarea(this);" ' + isLegalFieldsDisabled + ' placeholder="Mô tả lỗi...">' + (t.issueSummary || '') + '</textarea>';
    html += '          </td>';

    // Category (Must Fix - Nego - Accept)
    html += '          <td>';
    html += '            <select class="form-control" onchange="handleTaskFieldChange(\'' + tid + '\', \'category\', this.value)" ' + isLegalFieldsDisabled + '>';
    var categories = ['Must Fix', 'Nego', 'Accept'];
    categories.forEach(function (cat) {
      var selected = t.category === cat ? 'selected' : '';
      html += '              <option value="' + cat + '" ' + selected + '>' + cat + '</option>';
    });
    html += '            </select>';
    html += '          </td>';

    // Legal Recommendation
    html += '          <td>';
    html += '            <textarea class="form-control" oninput="handleTaskFieldChange(\'' + tid + '\', \'legalRecommendation\', this.value); autoResizeTaskTextarea(this);" ' + isLegalFieldsDisabled + ' placeholder="Đề xuất chỉnh sửa...">' + (t.legalRecommendation || '') + '</textarea>';
    html += '          </td>';

    // Status (Fixed - Partial Fixed - Can\'t Fix)
    html += '          <td>';
    html += '            <select class="form-control" onchange="handleTaskFieldChange(\'' + tid + '\', \'status\', this.value)" ' + isUserFieldsDisabled + '>';
    html += '              <option value="" ' + (!t.status ? 'selected' : '') + '>—</option>';
    var statuses = ['Fixed', 'Partial Fixed', 'Can\'t Fix'];
    statuses.forEach(function (stat) {
      var selected = t.status === stat ? 'selected' : '';
      html += '              <option value="' + stat + '" ' + selected + '>' + stat + '</option>';
    });
    html += '            </select>';
    html += '          </td>';

    // User notes
    html += '          <td>';
    html += '            <textarea class="form-control" oninput="handleTaskFieldChange(\'' + tid + '\', \'userNotes\', this.value); autoResizeTaskTextarea(this);" ' + isUserFieldsDisabled + ' placeholder="Phản hồi của User...">' + (t.userNotes || '') + '</textarea>';
    html += '          </td>';

    // Legal Decision (Go - NoGo)
    html += '          <td>';
    html += '            <select class="form-control" onchange="handleTaskFieldChange(\'' + tid + '\', \'legalDecision\', this.value)" ' + isLegalFieldsDisabled + '>';
    var decisions = ['NoGo', 'Go'];
    decisions.forEach(function (dec) {
      var selected = t.legalDecision === dec ? 'selected' : '';
      html += '              <option value="' + dec + '" ' + selected + '>' + dec + '</option>';
    });
    html += '            </select>';
    html += '          </td>';

    // Remove row button (only for Legal/Head during their active review stage)
    if (showAddBtn) {
      html += '          <td style="text-align: center;">';
      html += '            <button class="task-row-btn btn-remove" onclick="handleDeleteTaskRow(\'' + tid + '\')" title="Xóa dòng">➖</button>';
      html += '          </td>';
    }

    html += '        </tr>';
  }

  html += '      </tbody>';
  html += '    </table>';
  html += '  </div>';
  html += '</div>';

  // Save/Submit buttons under the table (only displayed if this role is currently allowed to edit)
  if (!isApproved) {
    html += '<div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; padding: 0 4px;">';
    if (isLegalOrHead && canLegalEdit) {
      var hasNoGoInList = taskList.length > 0 && taskList.some(function (t) {
        return t.legalDecision === 'NoGo';
      });

      // Legal/Head controls: Save Draft and Send User
      html += '  <button class="btn btn-secondary btn-sm" onclick="handleSaveTaskListOnly(this)" data-original-text="💾 Lưu nháp">💾 Lưu nháp</button>';
      if (hasNoGoInList) {
        html += '  <button class="btn btn-primary btn-sm" onclick="handleSubmitTaskListToUser(this)">🚀 Gửi User</button>';
      }
    } else if (isUser && canUserEdit) {
      // User controls: Save Changes and Request Legal Review
      html += '  <button class="btn btn-secondary btn-sm" onclick="handleSaveTaskListOnly(this)" data-original-text="💾 Lưu thay đổi">💾 Lưu thay đổi</button>';
      html += '  <button class="btn btn-primary btn-sm" onclick="handleSubmitTaskListToLegal(this)">🚀 Request Legal Review</button>';
    }
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// ============================================================
// CONTRACT REVIEW SYSTEM - Main Application Logic
// ============================================================

// ------------------------------------------------------------
// 1. State Management
// ------------------------------------------------------------
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAj1gFntRYB2ShBsvtvru3to16DZYrKyds",
  authDomain: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? "contract-review-9f2be.firebaseapp.com" : window.location.hostname,
  projectId: "contract-review-9f2be",
  storageBucket: "contract-review-9f2be.firebasestorage.app",
  messagingSenderId: "371742783661",
  appId: "1:371742783661:web:b851350bf69b0d1fe3ae24"
};

const SESSION_STORAGE_KEY = 'cr_user_session';
const DASHBOARD_CACHE_KEY = 'cr_dashboard_cache';
const ARCHIVED_CACHE_KEY = 'cr_archived_cache';
const CONTRACT_DETAIL_CACHE_PREFIX = 'cr_detail_';
const MAX_CACHED_CONTRACT_DETAILS = 30;

// --- Local Storage Helpers ---
function getStoredUserSession() {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to parse cached user session:', e);
  }
  return null;
}

function getStoredDashboardCache() {
  try {
    const saved = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.contracts) && parsed.stats) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse dashboard cache:', e);
  }
  return null;
}

function saveDashboardCache(contracts, stats, dataVersion) {
  try {
    localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
      contracts: contracts,
      stats: stats,
      dataVersion: dataVersion,
      timestamp: Date.now()
    }));
    notifyCrossTabUpdate('DASHBOARD_UPDATED');
  } catch (e) {
    console.warn('Failed to save dashboard cache:', e);
  }
}

function getStoredArchivedCache() {
  try {
    const saved = localStorage.getItem(ARCHIVED_CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.archivedContracts)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse archived cache:', e);
  }
  return null;
}

function saveArchivedCache(archivedContracts) {
  try {
    localStorage.setItem(ARCHIVED_CACHE_KEY, JSON.stringify({
      archivedContracts: archivedContracts,
      timestamp: Date.now()
    }));
    notifyCrossTabUpdate('ARCHIVED_UPDATED');
  } catch (e) {
    console.warn('Failed to save archived cache:', e);
  }
}

function getStoredContractDetailCache(contractId) {
  if (!contractId) return null;
  try {
    const saved = localStorage.getItem(CONTRACT_DETAIL_CACHE_PREFIX + contractId);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.contractId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached contract detail for ' + contractId, e);
  }
  return null;
}

function saveContractDetailCache(contractId, fullContractData) {
  if (!contractId || !fullContractData) return;
  try {
    if (!fullContractData.cachedAt) {
      fullContractData.cachedAt = Date.now();
    }
    // Quản lý LRU quota: nếu có quá nhiều keys cr_detail_ trong localStorage, dọn dẹp các key cũ
    const detailKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CONTRACT_DETAIL_CACHE_PREFIX)) {
        detailKeys.push(key);
      }
    }
    if (detailKeys.length >= MAX_CACHED_CONTRACT_DETAILS) {
      for (let j = 0; j < 5; j++) {
        if (detailKeys[j] && detailKeys[j] !== CONTRACT_DETAIL_CACHE_PREFIX + contractId) {
          localStorage.removeItem(detailKeys[j]);
        }
      }
    }

    localStorage.setItem(CONTRACT_DETAIL_CACHE_PREFIX + contractId, JSON.stringify(fullContractData));
  } catch (e) {
    console.warn('Failed to save contract detail cache:', e);
  }
}

function removeContractDetailCache(contractId) {
  if (!contractId) return;
  try {
    localStorage.removeItem(CONTRACT_DETAIL_CACHE_PREFIX + contractId);
  } catch (e) { /* ignore */ }
}

function clearAllContractDetailCaches() {
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CONTRACT_DETAIL_CACHE_PREFIX)) {
        toRemove.push(key);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) { /* ignore */ }
}

function clearAllContractCaches() {
  try {
    localStorage.removeItem(DASHBOARD_CACHE_KEY);
    localStorage.removeItem(ARCHIVED_CACHE_KEY);
    lastDashboardFetchTime = 0;
    lastArchivedFetchTime = 0;
    clearAllContractDetailCaches();
    notifyCrossTabUpdate('CACHE_CLEARED');
  } catch (e) { /* ignore */ }
}

// --- Cross-Tab Realtime Synchronization ---
let syncChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    syncChannel = new BroadcastChannel('cr_sync_channel');
    syncChannel.onmessage = (event) => {
      handleCrossTabMessage(event.data);
    };
  }
} catch (e) {
  console.warn('BroadcastChannel not supported:', e);
}

function notifyCrossTabUpdate(type, payload = {}) {
  try {
    if (syncChannel) {
      syncChannel.postMessage({ type, payload, timestamp: Date.now() });
    }
  } catch (e) {}
}

function handleCrossTabMessage(data) {
  if (!data || !data.type) return;
  if (data.type === 'DASHBOARD_UPDATED') {
    const cached = getStoredDashboardCache();
    if (cached) {
      AppState.contracts = cached.contracts;
      AppState.stats = cached.stats;
      lastDashboardFetchTime = cached.timestamp || Date.now();
      if (AppState.currentView === 'dashboard') {
        renderDashboardContent();
      }
    }
  } else if (data.type === 'ARCHIVED_UPDATED') {
    const cached = getStoredArchivedCache();
    if (cached) {
      AppState.archivedContracts = cached.archivedContracts;
      lastArchivedFetchTime = cached.timestamp || Date.now();
      if (AppState.currentView === 'archived') {
        renderArchivedContent();
      }
    }
  } else if (data.type === 'CACHE_CLEARED') {
    AppState.contracts = null;
    AppState.stats = null;
    AppState.archivedContracts = null;
    lastDashboardFetchTime = 0;
    lastArchivedFetchTime = 0;
  }
}

window.addEventListener('storage', (e) => {
  if (e.key === DASHBOARD_CACHE_KEY) {
    handleCrossTabMessage({ type: 'DASHBOARD_UPDATED' });
  } else if (e.key === ARCHIVED_CACHE_KEY) {
    handleCrossTabMessage({ type: 'ARCHIVED_UPDATED' });
  } else if (e.key === SESSION_STORAGE_KEY && !e.newValue) {
    AppState.user = null;
    AppState.token = null;
    clearAllContractCaches();
    navigateTo('login');
  }
});

const cachedUser = getStoredUserSession();
const cachedDashboard = getStoredDashboardCache();
const cachedArchived = getStoredArchivedCache();

const AppState = {
  currentView: cachedUser ? 'dashboard' : 'login',
  previousView: 'dashboard', // Lưu lại view trước đó (dashboard hoặc archived) để back chính xác
  user: cachedUser,
  token: null,
  contracts: cachedDashboard ? cachedDashboard.contracts : null,
  stats: cachedDashboard ? cachedDashboard.stats : null,
  archivedContracts: cachedArchived ? cachedArchived.archivedContracts : null,
  contractDetailsMap: {}, // In-Memory Cache Map cho Chi tiết Hợp đồng ({ [contractId]: data })

  currentContract: null,
  currentContractId: null,
  filters: {
    status: cachedUser?.role === 'LEGAL' ? 'LEGAL_REVIEW' : (cachedUser?.role === 'HOL' ? 'HEAD_REVIEW' : 'PENDING_ACTION'),
    search: ''
  },
  currentPage: 1,         // Trang hiện tại cho phân trang Dashboard
  archivedSearch: '',     // Từ khóa tìm kiếm cho trang Đã duyệt
  archivedCurrentPage: 1, // Trang hiện tại cho phân trang Đã duyệt
  isDeepSearching: false, // Cờ bật khi đang hiển thị kết quả tìm kiếm sâu từ server
  deepSearchResults: null,// Danh sách kết quả tìm kiếm sâu từ server
  deepSearchLoading: false,// Trạng thái đang gọi API tìm kiếm sâu
  deepSearchQuery: '',    // Từ khóa của lượt tìm kiếm sâu gần nhất
  loading: false,
  isGlobalLoading: false,
  activeTab: 'overview',
  dashboardRefreshInterval: null,
  activeAiTab: 'SUMMARY',
  aiLoadingType: null,
  aiPanelCollapsed: true,
  selectedAiVersion: null,
  selectedCompanyRole: 'BUYER',
  isSidebarCollapsed: true,
  theme: document.documentElement.getAttribute('data-theme') || 'dark',
  loginError: null
};

function invalidateContractDetailCache(contractId) {
  if (!contractId) return;
  if (AppState.contractDetailsMap) {
    delete AppState.contractDetailsMap[contractId];
  }
  removeContractDetailCache(contractId);
  AppState.archivedContracts = null;
}


// ------------------------------------------------------------
// 1.5. Firebase Auth Init
// ------------------------------------------------------------
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}
// Set persistent auth state to keep user logged in on this browser profile
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((err) => {
    console.warn('Firebase setPersistence error:', err);
  });

const googleProvider = new firebase.auth.GoogleAuthProvider();

function getMicrosoftProvider() {
  const provider = new firebase.auth.OAuthProvider('microsoft.com');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

// Handle redirect result
firebase.auth().getRedirectResult()
  .then((result) => {
    if (result && result.user) {
      sessionStorage.removeItem('login_started');
    }
  })
  .catch((err) => {
    console.error('Lỗi sau khi redirect về:', err);
    showToast('Lỗi đăng nhập: ' + err.message, 'error');
    sessionStorage.removeItem('login_started');
  });

let isCheckingSession = false;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    if (isCheckingSession) {
      return; // Chống gọi trùng lặp checkSession đồng thời
    }
    isCheckingSession = true;

    // Nếu chưa từng có session (chưa có cachedUser), hiển thị màn hình 'Đang xác thực...'
    if (!AppState.user) {
      sessionStorage.setItem('login_started', '1');
      renderApp();
    }

    user.getIdToken().then((token) => {
      AppState.token = token;
      api('checkSession', token)
        .then(result => {
          isCheckingSession = false;
          sessionStorage.removeItem('login_started');
          const serverUser = result.data.user;
          AppState.user = serverUser;
          AppState.loginError = null;

          // Lưu cache vào localStorage để dùng ngay tức thì khi F5 / mở tab mới
          try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(serverUser));
          } catch (e) { /* ignore */ }

          // Cập nhật bộ lọc mặc định nếu chưa được set
          if (!AppState.filters.status) {
            if (serverUser.role === 'USER') {
              AppState.filters.status = 'PENDING_ACTION';
            } else if (serverUser.role === 'LEGAL') {
              AppState.filters.status = 'LEGAL_REVIEW';
            } else if (serverUser.role === 'HOL') {
              AppState.filters.status = 'HEAD_REVIEW';
            } else {
              AppState.filters.status = 'PENDING_ACTION';
            }
          }

          // Điều hướng view
          if (AppState.currentView === 'login' || window.location.hash === '#login' || window.location.hash === '' || window.location.hash === '#') {
            navigateTo('dashboard');
          } else {
            handleRoute();
          }
        })
        .catch(err => {
          isCheckingSession = false;
          sessionStorage.removeItem('login_started'); // Clear if error
          const errMsg = err.message || '';

          if (errMsg.includes('chưa được cấp quyền') || errMsg.includes('chưa được đăng ký') || errMsg.includes('Domain email không được phép')) {
            try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch (e) {}
            AppState.user = null;
            AppState.loginError = errMsg || 'Email của bạn chưa được đăng ký dùng app này, vui lòng liên hệ bộ phận IT của FESV.';
            firebase.auth().signOut();
            AppState.currentView = 'login';
            renderApp();
          } else if (errMsg.includes('hết hạn') || errMsg.includes('không hợp lệ')) {
            try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch (e) {}
            AppState.user = null;
            AppState.loginError = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại.';
            firebase.auth().signOut();
            AppState.currentView = 'login';
            renderApp();
          } else if (errMsg.includes('Failed to fetch') || errMsg.includes('Network response') || errMsg.includes('NetworkError')) {
            // Lỗi mạng hoặc GAS cold start tạm thời
            if (AppState.user) {
              // ĐÃ có session cache từ localStorage -> tiếp tục cho dùng, không đá ra login
              console.warn('[Silent Auth] Kết nối tới server bị gián đoạn, tiếp tục dùng session đã lưu:', errMsg);
            } else {
              // Lần đầu đăng nhập chưa có cache -> báo lỗi
              AppState.loginError = 'Kết nối gián đoạn hoặc máy chủ bận (' + errMsg + '). Vui lòng thử lại sau giây lát.';
              AppState.currentView = 'login';
              renderApp();
            }
          } else {
            if (!AppState.user) {
              AppState.loginError = 'Lỗi xác thực phiên: ' + errMsg;
              firebase.auth().signOut();
              AppState.currentView = 'login';
              renderApp();
            }
          }
        });
    }).catch(err => {
      isCheckingSession = false;
      sessionStorage.removeItem('login_started');
      if (!AppState.user) {
        AppState.loginError = 'Không thể lấy mã xác thực: ' + (err.message || '');
        AppState.currentView = 'login';
        renderApp();
      }
    });
  } else {
    isCheckingSession = false;
    sessionStorage.removeItem('login_started'); // Tránh kẹt spinner khi auth thất bại ngầm
    try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch (e) {}
    AppState.user = null;
    AppState.token = null;
    if (AppState.dashboardRefreshInterval) {
      clearInterval(AppState.dashboardRefreshInterval);
      AppState.dashboardRefreshInterval = null;
    }
    if (AppState.currentView !== 'login') {
      navigateTo('login');
    } else {
      renderApp();
    }
  }
});

// ------------------------------------------------------------
// 2. API Layer
// ------------------------------------------------------------
const GAS_API_URL = import.meta.env.VITE_GAS_API_URL || 'https://script.google.com/macros/s/AKfycbzhtBH0Bam3fda7gM8-swDw4eJI2VjNXBAodfiqiNm2J1zj6RixPipAcvWPwdTylWEV/exec';

// Whitelist of safe idempotent (Read/Query) actions that can be auto-retried on network glitches
const RETRYABLE_ACTIONS = new Set([
  'checkSession',
  'getDashboardInit',
  'getDashboardVersion',
  'getContracts',
  'getContractStats',
  'getArchivedContracts',
  'searchArchivedContracts',
  'getContractDetail',
  'checkRiskAvailability'
]);

/**
 * Lấy Firebase ID Token còn hạn (fresh token).
 * Firebase Client SDK tự động quản lý bộ nhớ đệm và tự động làm mới (refresh) trong nền
 * nếu token đã hết hạn hoặc sắp hết hạn trong vòng 5 phút.
 * @param {boolean} [forceRefresh=false] - Ép buộc Firebase server cấp token mới
 * @returns {Promise<string|null>}
 */
function getFreshToken(forceRefresh = false) {
  return new Promise((resolve) => {
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      currentUser.getIdToken(forceRefresh)
        .then((token) => {
          AppState.token = token;
          resolve(token);
        })
        .catch((err) => {
          console.warn('[Auth] Không thể lấy Fresh Token từ currentUser:', err);
          resolve(AppState.token || null);
        });
      return;
    }

    // Nếu currentUser chưa sẵn sàng (đang trong quá trình khởi động SDK lúc mở trang)
    let resolved = false;
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (resolved) return;
      resolved = true;
      try { unsubscribe(); } catch (e) {}
      if (user) {
        user.getIdToken(forceRefresh)
          .then((token) => {
            AppState.token = token;
            resolve(token);
          })
          .catch((err) => {
            console.warn('[Auth] Không thể lấy Fresh Token sau khi chờ onAuthStateChanged:', err);
            resolve(AppState.token || null);
          });
      } else {
        resolve(AppState.token || null);
      }
    });

    // Timeout an toàn 3 giây để không bao giờ treo request nếu Firebase gặp sự cố mạng
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { unsubscribe(); } catch (e) {}
        resolve(AppState.token || null);
      }
    }, 3000);
  });
}

async function api(functionName, ...args) {
  const isRetryable = RETRYABLE_ACTIONS.has(functionName);
  const maxRetries = isRetryable ? 2 : 0; // TUYỆT ĐỐI KHÔNG auto-retry các action ghi (createContract, uploadVersion,...) để chống trùng lặp bản ghi
  const baseDelay = 800;

  // Lấy Fresh Token hợp lệ trước khi gửi request (tránh 100% lỗi token hết hạn sau 60 phút)
  let freshToken = null;
  try {
    freshToken = await getFreshToken();
  } catch (e) {
    console.warn('[API] Lỗi khi lấy fresh token:', e);
  }

  // Tự động thay thế token cũ/null trong args bằng freshToken mới nhất
  const resolvedArgs = args.map((arg) => {
    if (freshToken && (arg === null || arg === undefined || arg === AppState.token || (typeof arg === 'string' && arg.length > 100 && arg.startsWith('eyJ')))) {
      return freshToken;
    }
    return arg;
  });

  function executeFetch(attempt = 0) {
    return fetch(GAS_API_URL, {
      method: 'POST',
      redirect: 'follow', // Important for GAS which redirects POST requests
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: functionName,
        args: resolvedArgs
      })
    })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(result => {
        if (result && result.success) return result;
        throw new Error(result?.message || 'Có lỗi xảy ra');
      })
      .catch(err => {
        const errMsg = err.message || '';
        const isNetworkError = errMsg.includes('Failed to fetch') || errMsg.includes('Network response') || errMsg.includes('NetworkError');

        if (isRetryable && isNetworkError && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(`[API Auto-Retry] ${functionName} attempt ${attempt + 1} thất bại (${errMsg}). Thử lại sau ${delay}ms...`);
          return new Promise(resolve => setTimeout(resolve, delay)).then(() => executeFetch(attempt + 1));
        }
        throw err;
      });
  }

  return executeFetch(0);
}


// ------------------------------------------------------------
// 3. File Handling
// ------------------------------------------------------------
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ------------------------------------------------------------
// 4. Toast System
// ------------------------------------------------------------
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toastHtml = renderToast(message, type);
  const wrapper = document.createElement('div');
  wrapper.innerHTML = toastHtml;
  const toastEl = wrapper.firstElementChild;
  container.appendChild(toastEl);
  setTimeout(() => {
    toastEl.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toastEl.remove(), 300);
  }, duration);
}

/**
 * Gửi email thông báo quy trình ngầm (Non-blocking UI).
 * Chạy bất đồng bộ, không bật màn hình loading, thông báo toast khi xong.
 * @param {object} emailContext - Object { contractId, eventType, approvedDocUrl }.
 */
function triggerBackgroundEmail(emailContext) {
  if (!emailContext || !emailContext.contractId || !emailContext.eventType) return;
  api('sendWorkflowEmail', emailContext.contractId, emailContext.eventType, emailContext, AppState.token)
    .then(res => {
      if (res?.success) {
        showToast('📧 Email thông báo đã được gửi', 'info', 3500);
      }
    })
    .catch(err => {
      console.warn('[Background Email] Gửi email ngầm không thành công:', err);
    });
}

// ------------------------------------------------------------
// 5. Modal & Confirmation & Global Loading System
// ------------------------------------------------------------
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
  if (id === 'task-list-expanded-modal') {
    renderContractDetailContent();
  }
}

/**
 * Custom Confirmation Dialog returning Promise<boolean>
 * @param {Object} options
 * @param {string} [options.title='Xác nhận']
 * @param {string} options.message
 * @param {string} [options.confirmText='Xác nhận']
 * @param {string} [options.cancelText='Huỷ bỏ']
 * @param {string} [options.type='primary'] - 'primary' | 'success' | 'danger' | 'warning'
 * @returns {Promise<boolean>}
 */
function showConfirmDialog(options) {
  return new Promise((resolve) => {
    const title = options?.title || 'Xác nhận';
    const message = options?.message || 'Bạn có chắc chắn muốn thực hiện hành động này?';
    const confirmText = options?.confirmText || 'Xác nhận';
    const cancelText = options?.cancelText || 'Huỷ bỏ';
    const type = options?.type || 'primary';

    const icons = {
      primary: '🚀',
      success: '✅',
      danger: '🗑️',
      warning: '⚠️',
      info: 'ℹ️'
    };
    const icon = icons[type] || '❓';
    const btnClass = type === 'danger' ? 'btn-danger' : (type === 'success' ? 'btn-success' : 'btn-primary');

    const dialogId = 'app-confirm-dialog-' + Date.now();
    const html = `
      <div class="modal-overlay" id="${dialogId}" style="z-index: 999990;">
        <div class="confirm-modal-card">
          <div class="confirm-icon-box type-${type}">
            <span>${icon}</span>
          </div>
          <h3 class="confirm-title">${title}</h3>
          <p class="confirm-message">${message}</p>
          <div class="confirm-actions">
            <button type="button" class="btn btn-ghost" id="${dialogId}-cancel">${cancelText}</button>
            <button type="button" class="btn ${btnClass}" id="${dialogId}-confirm">${confirmText}</button>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const modalEl = wrapper.firstElementChild;
    document.body.appendChild(modalEl);

    let isResolved = false;
    function cleanup(result) {
      if (isResolved) return;
      isResolved = true;
      modalEl.remove();
      resolve(result);
    }

    const cancelBtn = document.getElementById(`${dialogId}-cancel`);
    const confirmBtn = document.getElementById(`${dialogId}-confirm`);

    if (cancelBtn) cancelBtn.onclick = () => cleanup(false);
    if (confirmBtn) {
      confirmBtn.onclick = () => cleanup(true);
      confirmBtn.focus();
    }

    modalEl.onclick = (e) => {
      if (e.target === modalEl) cleanup(false);
    };
  });
}

/**
 * Show Global Blocking Loading Overlay with Spinning Wheel
 * @param {string} [title='Đang xử lý...']
 * @param {string} [subtitle='Vui lòng không đóng trình duyệt hoặc tải lại trang trong khi hệ thống đang xử lý.']
 */
function showGlobalLoading(title = 'Đang xử lý...', subtitle = 'Vui lòng không đóng trình duyệt hoặc tải lại trang trong khi hệ thống đang xử lý.') {
  AppState.isGlobalLoading = true;
  let overlay = document.getElementById('global-blocking-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'global-blocking-loading-overlay';
    overlay.className = 'global-loading-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="global-loading-card">
      <div class="global-loading-spinner-wrap">
        <div class="global-loading-pulse"></div>
        <div class="global-loading-spinner"></div>
      </div>
      <div class="global-loading-title">${title}</div>
      <p class="global-loading-subtitle">${subtitle}</p>
    </div>
  `;
  overlay.style.display = 'flex';
}

/**
 * Hide Global Blocking Loading Overlay
 */
function hideGlobalLoading() {
  AppState.isGlobalLoading = false;
  const overlay = document.getElementById('global-blocking-loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

document.addEventListener('keydown', (e) => {
  if (AppState.isGlobalLoading) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  if (e.key === 'Escape') {
    const isTaskListModalOpen = document.getElementById('task-list-expanded-modal') !== null;
    document.querySelectorAll('.modal-overlay:not([id^="app-confirm-dialog-"])').forEach(m => m.remove());
    if (isTaskListModalOpen) {
      renderContractDetailContent();
    }
  }
});

// ------------------------------------------------------------
// 6. Router
// ------------------------------------------------------------
function navigateTo(view, param) {
  if (view === 'login') window.location.hash = '#login';
  else if (view === 'dashboard') window.location.hash = '#dashboard';
  else if (view === 'archived') window.location.hash = '#archived';
  else if (view === 'contract-detail') window.location.hash = '#contract/' + param;
}

function handleRoute() {
  const hash = window.location.hash || '';

  // Nếu user đã đăng nhập mà truy cập trang gốc ('/' hoặc '#') hoặc '#login' -> chuyển thẳng vào dashboard ngay lập tức
  if (AppState.user && (hash === '' || hash === '#' || hash === '#login')) {
    navigateTo('dashboard');
    return;
  }

  if (hash === '#login' || hash === '#' || hash === '') {
    AppState.currentView = 'login';
    renderApp();
  } else if (hash === '#dashboard') {
    if (!AppState.user) { navigateTo('login'); return; }
    AppState.previousView = 'dashboard';
    const isNewView = AppState.currentView !== 'dashboard';
    AppState.currentView = 'dashboard';
    renderApp();
    if (isNewView || AppState.contracts === null || AppState.stats === null) {
      loadDashboardData();
    }
  } else if (hash === '#archived') {
    if (!AppState.user) { navigateTo('login'); return; }
    AppState.previousView = 'archived';
    const isNewView = AppState.currentView !== 'archived';
    AppState.currentView = 'archived';
    renderApp();
    if (isNewView || AppState.archivedContracts === null) {
      loadArchivedContractsData();
    }
  } else if (hash.startsWith('#contract/')) {
    if (!AppState.user) { navigateTo('login'); return; }
    const contractId = hash.replace('#contract/', '');
    if (AppState.currentView === 'dashboard' || AppState.currentView === 'archived') {
      AppState.previousView = AppState.currentView;
    }
    AppState.currentView = 'contract-detail';
    AppState.currentContractId = contractId;
    loadContractDetail(contractId);
  }
}


// ------------------------------------------------------------
// 7. Data Loading Functions & Stale-While-Revalidate (SWR)
// ------------------------------------------------------------
const SWR_STALE_TIME = 5 * 60 * 1000; // 5 phút (300.000 ms) - Dữ liệu Dashboard/Archived dưới 5 phút được coi là Fresh
const CONTRACT_DETAIL_STALE_TIME = 10 * 60 * 1000; // 10 phút (600.000 ms) - Bản chi tiết hợp đồng dưới 10 phút được coi là Fresh
let lastDashboardFetchTime = cachedDashboard?.timestamp || 0; // Timestamp của lần fetch dashboard thành công gần nhất
let lastArchivedFetchTime = cachedArchived?.timestamp || 0;   // Timestamp của lần fetch archived thành công gần nhất

/**
 * Tải dữ liệu dashboard.
 *
 * - Có data trong RAM/LocalStorage & chưa quá 5 phút (Fresh) → render ngay tức thì (0ms), KHÔNG gọi mạng.
 * - Có data trong RAM/LocalStorage & quá 5 phút (Stale) → render ngay (0ms) + SWR revalidate ngầm từ server.
 * - Chưa có data (lần đầu, sau F5) → spinner → fetch từ server.
 * - forceRefresh=true (user bấm nút 🔄 Làm mới) → spinner → force fetch từ DB (bypass cache).
 */
function loadDashboardData(forceRefresh = false) {
  const startTime = performance.now();
  AppState.currentPage = 1;

  if (AppState.dashboardRefreshInterval) {
    clearInterval(AppState.dashboardRefreshInterval);
    AppState.dashboardRefreshInterval = null;
  }

  const hasData = AppState.contracts !== null && AppState.stats !== null;
  const isStale = (Date.now() - lastDashboardFetchTime) >= SWR_STALE_TIME;

  // 1. Nếu ĐÃ CÓ DATA (từ RAM hoặc localStorage) và không phải forceRefresh
  if (!forceRefresh && hasData) {
    AppState.loading = false;
    if (AppState.currentView === 'dashboard') {
      renderDashboardContent();
    }

    // Nếu dữ liệu còn tươi (< 5 phút), kết thúc ngay, KHÔNG bắn network call về GAS
    if (!isStale) {
      const remainingSec = Math.max(0, Math.round((SWR_STALE_TIME - (Date.now() - lastDashboardFetchTime)) / 1000));
      console.log(`⚡ [PERF CACHE] Hiển thị Tổng quan từ Cache tức thì (0ms). Dữ liệu còn tươi trong ${remainingSec}s, bỏ qua gọi mạng.`);
      return;
    }

    console.log(`⚡ [PERF CACHE] Hiển thị Tổng quan từ Cache tức thì (0ms). Dữ liệu đã quá 5 phút ➔ Bắt đầu revalidate ngầm...`);

    // Silent background SWR (revalidate ngầm khi dữ liệu > 5 phút, KHÔNG bật loading spinner che giao diện)
    if (AppState.user) {
      api('getDashboardInit', AppState.token, false)
        .then(result => {
          const netTime = (performance.now() - startTime).toFixed(1);
          const data = result.data || {};
          AppState.contracts = data.contracts || [];
          AppState.stats = data.stats || null;
          lastDashboardFetchTime = Date.now();
          saveDashboardCache(AppState.contracts, AppState.stats, data.dataVersion);
          if (AppState.currentView === 'dashboard') {
            renderDashboardContent();
          }
          console.log(`🌐 [PERF SWR] getDashboardInit revalidate ngầm thành công: ${netTime} ms`);
        })
        .catch(err => {
          console.warn('[SWR] Lỗi revalidate ngầm dashboard:', err.message);
        });
    }
    return;
  }

  // 2. Chưa có data nào hoặc forceRefresh = true (bấm nút Làm mới) → bắt buộc fetch và show spinner
  AppState.loading = true;
  if (AppState.currentView === 'dashboard') {
    renderDashboardContent();
  }

  api('getDashboardInit', AppState.token, forceRefresh)
    .then(result => {
      const netTime = (performance.now() - startTime).toFixed(1);
      const data = result.data || {};
      AppState.contracts = data.contracts || [];
      AppState.stats = data.stats || null;
      AppState.loading = false;
      lastDashboardFetchTime = Date.now();
      saveDashboardCache(AppState.contracts, AppState.stats, data.dataVersion);
      if (AppState.currentView === 'dashboard') {
        renderDashboardContent();
      }
      console.log(`🌐 [PERF] getDashboardInit${forceRefresh ? ' (force bypass cache)' : ''}: ${netTime} ms`);
    })
    .catch(err => {
      AppState.loading = false;
      showToast('Lỗi tải dữ liệu: ' + err.message, 'error');
      if (AppState.currentView === 'dashboard') {
        renderDashboardContent();
      }
    });
}


function loadArchivedContractsData(forceRefresh = false) {
  const startTime = performance.now();
  const hasData = AppState.archivedContracts !== null;
  const isStale = (Date.now() - lastArchivedFetchTime) >= SWR_STALE_TIME;

  // 1. Nếu ĐÃ CÓ DATA (từ RAM hoặc localStorage) & không ép buộc forceRefresh
  if (!forceRefresh && hasData) {
    AppState.loading = false;
    if (AppState.currentView === 'archived') {
      renderArchivedContent();
    }

    // Nếu dữ liệu còn tươi (< 5 phút), kết thúc ngay, KHÔNG bắn network call về GAS
    if (!isStale) {
      const remainingSec = Math.max(0, Math.round((SWR_STALE_TIME - (Date.now() - lastArchivedFetchTime)) / 1000));
      console.log(`⚡ [PERF ARCHIVE] Hiển thị hợp đồng Đã duyệt từ Cache tức thì (0ms). Dữ liệu còn tươi trong ${remainingSec}s, bỏ qua gọi mạng.`);
      return;
    }

    console.log(`⚡ [PERF ARCHIVE] Hiển thị hợp đồng Đã duyệt từ Cache tức thì (0ms). Dữ liệu đã quá 5 phút ➔ Bắt đầu revalidate ngầm...`);

    // Silent background SWR revalidate khi dữ liệu > 5 phút
    if (AppState.user) {
      api('getArchivedContracts', AppState.token, false)
        .then(result => {
          const netTime = (performance.now() - startTime).toFixed(1);
          AppState.archivedContracts = result.data || [];
          lastArchivedFetchTime = Date.now();
          saveArchivedCache(AppState.archivedContracts);
          if (AppState.currentView === 'archived') {
            renderArchivedContent();
          }
          console.log(`🌐 [PERF SWR] getArchivedContracts revalidate ngầm thành công: ${netTime} ms`);
        })
        .catch(err => {
          console.warn('[SWR] Lỗi revalidate ngầm archived:', err.message);
        });
    }
    return;
  }

  // 2. Chưa có data hoặc forceRefresh
  AppState.loading = true;
  if (AppState.currentView === 'archived') {
    renderArchivedContent();
  }

  api('getArchivedContracts', AppState.token, forceRefresh)
    .then(result => {
      AppState.archivedContracts = result.data || [];
      AppState.loading = false;
      lastArchivedFetchTime = Date.now();
      saveArchivedCache(AppState.archivedContracts);
      if (AppState.currentView === 'archived') {
        renderArchivedContent();
      }
    })
    .catch(err => {
      AppState.loading = false;
      showToast('Lỗi tải dữ liệu lưu trữ: ' + err.message, 'error');
      if (AppState.currentView === 'archived') {
        renderArchivedContent();
      }
    });
}


function loadContractDetail(contractId, forceRefresh = false) {
  const startTime = performance.now();

  // Dọn interval cũ khi đổi trang (không dùng polling ngầm)
  if (AppState.dashboardRefreshInterval) {
    clearInterval(AppState.dashboardRefreshInterval);
    AppState.dashboardRefreshInterval = null;
  }

  AppState.loading = false; // Tắt flag loading dashboard để không làm giật thẻ khi back về
  AppState.currentContractId = contractId;
  AppState.activeAiTab = 'SUMMARY';

  // 1. Tìm thông tin trong danh sách Dashboard/Archived
  const allKnownContracts = (AppState.contracts || []).concat(AppState.archivedContracts || []);
  const currentContractInList = allKnownContracts.find(c => String(c.contractId) === String(contractId));

  // 2. Tìm trong RAM Cache hoặc LocalStorage Cache
  let cachedDetail = AppState.contractDetailsMap ? AppState.contractDetailsMap[contractId] : null;
  if (!cachedDetail) {
    cachedDetail = getStoredContractDetailCache(contractId);
    if (cachedDetail) {
      if (!AppState.contractDetailsMap) AppState.contractDetailsMap = {};
      AppState.contractDetailsMap[contractId] = cachedDetail;
    }
  }

  // 3. Kiểm tra tính tươi mới (Staleness):
  // Hợp đồng đã hoàn tất / HOD duyệt (HOL_APPROVED, COMPLETED) là dữ liệu BẤT BIẾN (Immutable) -> Cache vĩnh viễn, không hết hạn theo thời gian
  const isFinalized = (cachedDetail && (cachedDetail.status === 'HOL_APPROVED' || cachedDetail.status === 'COMPLETED'));
  const detailCachedAt = (cachedDetail && cachedDetail.cachedAt) || 0;
  const isTimeStale = isFinalized ? false : ((Date.now() - detailCachedAt) >= CONTRACT_DETAIL_STALE_TIME);

  let isDataStale = false;
  if (currentContractInList && cachedDetail) {
    if (cachedDetail.status !== currentContractInList.status || cachedDetail.updatedAt !== currentContractInList.updatedAt) {
      isDataStale = true;
      console.log(`🔄 [DETAIL STALE] Hợp đồng ${contractId} có thay đổi mới từ Dashboard (status/updatedAt) ➔ Tự động nạp bản mới nhất từ Server`);
    }
  }

  const isDetailStale = isTimeStale || isDataStale;

  // TRƯỜNG HỢP A: ĐÃ CÓ TRONG CACHE VÀ KHÔNG PHẢI FORCE REFRESH
  if (!forceRefresh && cachedDetail) {
    if (!isDetailStale) {
      // Dữ liệu còn hoàn toàn tươi mới (< 10 phút hoặc đã duyệt xong) -> Render 0ms và kết thúc, KHÔNG gọi mạng
      AppState.currentContract = cachedDetail;
      AppState.currentContract.isHydrating = false;
      if (AppState.currentContract.versions && AppState.currentContract.versions.length > 0) {
        AppState.selectedAiVersion = AppState.currentContract.versions[0].versionNo;
      } else {
        AppState.selectedAiVersion = AppState.currentContract.currentVersion || 1;
      }
      AppState.aiPanelCollapsed = true;
      renderApp();
      renderContractDetailContent();
      if (isFinalized) {
        console.log(`⚡ [PERF DETAIL] Mở hợp đồng đã hoàn tất ${contractId} từ Cache tức thì (0ms network call - Dữ liệu bất biến).`);
      } else {
        const remainingSec = Math.max(0, Math.round((CONTRACT_DETAIL_STALE_TIME - (Date.now() - detailCachedAt)) / 1000));
        console.log(`⚡ [PERF DETAIL] Mở hợp đồng ${contractId} từ Cache tức thì (0ms network call). Bản chi tiết còn tươi trong ${remainingSec}s.`);
      }
      return;
    } else {
      // DỮ LIỆU ĐÃ BỊ STALE (> 10 phút hoặc lệch dữ liệu):
      if (isTimeStale) {
        console.log(`⚡ [PERF DETAIL] Mở hợp đồng ${contractId} từ Cache tức thì (0ms). Bản chi tiết đã quá 10 phút ➔ Bắt đầu revalidate ngầm...`);
      }
      // Render Header + Trạng thái mới nhất từ danh sách Dashboard, nhưng bật isHydrating = true cho tab để user biết đang nạp bản mới
      const stalePreview = Object.assign({}, cachedDetail, {
        title: (currentContractInList && currentContractInList.title) || cachedDetail.title,
        supplier: (currentContractInList && currentContractInList.supplier) || cachedDetail.supplier,
        status: (currentContractInList && currentContractInList.status) || cachedDetail.status,
        updatedAt: (currentContractInList && currentContractInList.updatedAt) || cachedDetail.updatedAt,
        rejectCount: (currentContractInList && currentContractInList.rejectCount !== undefined) ? currentContractInList.rejectCount : cachedDetail.rejectCount,
        isHydrating: true,
        hydratingMessage: 'Đang đồng bộ bản cập nhật mới nhất từ máy chủ...'
      });
      AppState.currentContract = stalePreview;
      AppState.selectedAiVersion = stalePreview.currentVersion || 1;
      AppState.aiPanelCollapsed = true;
      renderApp();
      renderContractDetailContent();
    }
  }

  // TRƯỜNG HỢP B: CHƯA CÓ TRONG CACHE NHƯNG CÓ TRÊN DANH SÁCH DASHBOARD (INSTANT PREVIEW 0ms)
  if (!cachedDetail && currentContractInList && !forceRefresh) {
    const previewData = Object.assign({}, currentContractInList, {
      versions: [],
      comments: [],
      activities: [],
      summary: '',
      aiAnalyses: {},
      taskList: [],
      referenceFiles: [],
      isHydrating: true,
      hydratingMessage: 'Đang tải dữ liệu chi tiết hợp đồng...'
    });
    AppState.currentContract = previewData;
    AppState.selectedAiVersion = previewData.currentVersion || 1;
    AppState.aiPanelCollapsed = true;
    renderApp();
    renderContractDetailContent();
  } else if (!cachedDetail) {
    // Không có trên dashboard -> buộc phải hiện spinner toàn trang
    AppState.currentContract = null;
    renderApp();
    const detailArea = document.getElementById('contract-detail-area');
    if (detailArea) detailArea.innerHTML = renderLoadingSpinner('Đang tải chi tiết hợp đồng...');
  }

  // BẮT ĐẦU TẢI DỮ LIỆU TƯƠI MỚI TỪ SERVER
  api('getContractDetail', contractId, AppState.token)
    .then(result => {
      const netTime = (performance.now() - startTime).toFixed(1);
      const fullContractData = Object.assign({}, result.data.contract, {
        versions: result.data.versions || [],
        comments: result.data.comments || [],
        activities: result.data.activities || [],
        summary: result.data.summary || '',
        aiAnalyses: result.data.aiAnalyses || {},
        taskList: result.data.taskList || [],
        referenceFiles: result.data.referenceFiles || [],
        isHydrating: false,
        cachedAt: Date.now()
      });

      AppState.currentContract = fullContractData;
      if (!AppState.contractDetailsMap) AppState.contractDetailsMap = {};
      AppState.contractDetailsMap[contractId] = fullContractData; // Lưu RAM
      saveContractDetailCache(contractId, fullContractData); // Lưu LocalStorage

      if (AppState.currentContract.versions && AppState.currentContract.versions.length > 0) {
        AppState.selectedAiVersion = AppState.currentContract.versions[0].versionNo;
      } else {
        AppState.selectedAiVersion = AppState.currentContract.currentVersion || 1;
      }

      AppState.loading = false;
      AppState.aiPanelCollapsed = true;
      if (AppState.currentView === 'contract-detail' && String(AppState.currentContractId) === String(contractId)) {
        renderContractDetailContent();
      }
      console.log(`🌐 [PERF SWR] getContractDetail revalidate ngầm thành công (${contractId}): ${netTime} ms`);
    })
    .catch(err => {
      AppState.loading = false;
      showToast('Lỗi tải chi tiết hợp đồng: ' + err.message, 'error');
      if (!AppState.currentContract) {
        navigateTo('dashboard');
      }
    });
}


// ------------------------------------------------------------
// 8. Auth Functions
// ------------------------------------------------------------
function setLoginLoadingState(providerName) {
  const errorDiv = document.getElementById('login-error');
  if (errorDiv) errorDiv.style.display = 'none';

  const googleBtn = document.getElementById('login-btn-google');
  const msBtn = document.getElementById('login-btn-ms');

  if (googleBtn) googleBtn.disabled = true;
  if (msBtn) msBtn.disabled = true;

  const activeBtn = providerName === 'google' ? googleBtn : msBtn;
  if (activeBtn) activeBtn.innerHTML = 'Đang chuyển hướng...';
}

function resetLoginLoadingState() {
  const googleBtn = document.getElementById('login-btn-google');
  const msBtn = document.getElementById('login-btn-ms');

  if (googleBtn) {
    googleBtn.disabled = false;
    googleBtn.innerHTML = '<svg style="width:18px;height:18px;margin-right:8px;vertical-align:middle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Đăng nhập với Google';
  }
  if (msBtn) {
    msBtn.disabled = false;
    msBtn.innerHTML = '<svg style="width:18px;height:18px;margin-right:8px;vertical-align:middle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><path fill="#f25022" d="M0 0h10v10H0z"/><path fill="#7fba00" d="M11 0h10v10H11z"/><path fill="#00a4ef" d="M0 11h10v10H0z"/><path fill="#ffb900" d="M11 11h10v10H11z"/></svg>Đăng nhập với Microsoft';
  }
}

function handleGoogleLogin() {
  AppState.loginError = null;
  sessionStorage.setItem('login_started', '1');
  setLoginLoadingState('google');

  firebase.auth().signInWithRedirect(googleProvider)
    .catch((error) => {
      const errorDiv = document.getElementById('login-error');
      if (errorDiv) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
      }
      showToast('Lỗi chuyển hướng: ' + error.message, 'error');
      resetLoginLoadingState();
      sessionStorage.removeItem('login_started');
    });
}

function handleMicrosoftLogin() {
  AppState.loginError = null;
  sessionStorage.setItem('login_started', '1');
  setLoginLoadingState('ms');

  firebase.auth().signInWithRedirect(getMicrosoftProvider())
    .catch((error) => {
      const errorDiv = document.getElementById('login-error');
      if (errorDiv) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
      }
      showToast('Lỗi chuyển hướng: ' + error.message, 'error');
      resetLoginLoadingState();
      sessionStorage.removeItem('login_started');
    });
}

function handleLogout() {
  try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch (e) {}
  clearAllContractCaches();
  sessionStorage.removeItem('login_started');
  AppState.user = null;
  AppState.token = null;
  AppState.contracts = null;
  AppState.stats = null;
  AppState.archivedContracts = null;
  AppState.contractDetailsMap = {};
  firebase.auth().signOut().then(() => {
    showToast('Đã đăng xuất', 'info');
  });
}

// ------------------------------------------------------------
// 9. Contract Actions & Delta Synchronizers
// ------------------------------------------------------------

/**
 * 1. Cập nhật Delta khi thay đổi trạng thái hợp đồng (submitForReview, approveContract, markCompleted, submitTaskList)
 */
function applyStatusDelta(delta, contractIdFallback) {
  const contractId = String(delta?.contractId || contractIdFallback || AppState.currentContractId);
  if (!contractId) return;

  // Fallback nếu backend cũ trả về contractDetail
  if (delta?.contractDetail?.contract) {
    syncFullContractDetail(delta.contractDetail);
    return;
  }

  // Cập nhật AppState.currentContract
  if (AppState.currentContract && String(AppState.currentContract.contractId) === contractId) {
    if (delta?.status) AppState.currentContract.status = delta.status;
    if (delta?.updatedAt) AppState.currentContract.updatedAt = delta.updatedAt;
    if (delta?.rejectCount !== undefined) AppState.currentContract.rejectCount = delta.rejectCount;

    if (delta?.newComment) {
      if (!Array.isArray(AppState.currentContract.comments)) AppState.currentContract.comments = [];
      if (!AppState.currentContract.comments.some(c => c.commentId === delta.newComment.commentId)) {
        AppState.currentContract.comments.unshift(delta.newComment);
      }
    }

    if (delta?.newVersion) {
      if (!Array.isArray(AppState.currentContract.versions)) AppState.currentContract.versions = [];
      if (!AppState.currentContract.versions.some(v => v.versionNo === delta.newVersion.versionNo)) {
        AppState.currentContract.versions.unshift(delta.newVersion);
        AppState.currentContract.currentVersion = delta.newVersion.versionNo;
      }
    }

    if (AppState.contractDetailsMap) {
      AppState.contractDetailsMap[contractId] = AppState.currentContract;
    }
    saveContractDetailCache(contractId, AppState.currentContract);
  }

  // Cập nhật trong danh sách Dashboard
  if (Array.isArray(AppState.contracts)) {
    const idx = AppState.contracts.findIndex(c => String(c.contractId) === contractId);
    if (idx !== -1) {
      if (delta?.status) AppState.contracts[idx].status = delta.status;
      if (delta?.updatedAt) AppState.contracts[idx].updatedAt = delta.updatedAt;
      if (delta?.rejectCount !== undefined) AppState.contracts[idx].rejectCount = delta.rejectCount;
      if (delta?.newVersion) AppState.contracts[idx].currentVersion = delta.newVersion.versionNo;
    }
  }

  // Cập nhật trong danh sách Đã duyệt nếu chuyển sang duyệt/hoàn tất
  if (delta?.status === 'HOL_APPROVED' || delta?.status === 'COMPLETED') {
    if (Array.isArray(AppState.archivedContracts) && AppState.currentContract) {
      const aIdx = AppState.archivedContracts.findIndex(c => String(c.contractId) === contractId);
      if (aIdx !== -1) {
        AppState.archivedContracts[aIdx] = { ...AppState.archivedContracts[aIdx], ...AppState.currentContract };
      } else {
        AppState.archivedContracts.unshift({ ...AppState.currentContract });
      }
      saveArchivedCache(AppState.archivedContracts);
    }
  }

  saveDashboardCache(AppState.contracts, AppState.stats, Date.now());

  if (AppState.currentView === 'contract-detail' && String(AppState.currentContractId) === contractId) {
    renderContractDetailContent();
  }
}

/**
 * 2. Cập nhật Delta khi thêm bình luận (addComment)
 */
function applyCommentDelta(delta, contractIdFallback) {
  const contractId = String(delta?.contractId || contractIdFallback || AppState.currentContractId);
  if (!contractId) return;

  if (delta?.contractDetail?.contract) {
    syncFullContractDetail(delta.contractDetail);
    return;
  }

  if (AppState.currentContract && String(AppState.currentContract.contractId) === contractId) {
    if (delta?.updatedAt) AppState.currentContract.updatedAt = delta.updatedAt;
    if (delta?.comment) {
      if (!Array.isArray(AppState.currentContract.comments)) AppState.currentContract.comments = [];
      if (!AppState.currentContract.comments.some(c => c.commentId === delta.comment.commentId)) {
        AppState.currentContract.comments.unshift(delta.comment);
      }
    }
    if (AppState.contractDetailsMap) {
      AppState.contractDetailsMap[contractId] = AppState.currentContract;
    }
    saveContractDetailCache(contractId, AppState.currentContract);
  }

  if (Array.isArray(AppState.contracts)) {
    const idx = AppState.contracts.findIndex(c => String(c.contractId) === contractId);
    if (idx !== -1 && delta?.updatedAt) {
      AppState.contracts[idx].updatedAt = delta.updatedAt;
    }
  }
  saveDashboardCache(AppState.contracts, AppState.stats, Date.now());

  if (AppState.currentView === 'contract-detail' && String(AppState.currentContractId) === contractId) {
    renderContractDetailContent();
  }
}

/**
 * 3. Cập nhật Delta khi upload phiên bản mới (uploadNewVersion)
 */
function applyVersionDelta(delta, contractIdFallback) {
  const contractId = String(delta?.contractId || contractIdFallback || AppState.currentContractId);
  if (!contractId) return;

  if (delta?.contractDetail?.contract) {
    syncFullContractDetail(delta.contractDetail);
    return;
  }

  if (AppState.currentContract && String(AppState.currentContract.contractId) === contractId) {
    if (delta?.currentVersion) AppState.currentContract.currentVersion = delta.currentVersion;
    if (delta?.updatedAt) AppState.currentContract.updatedAt = delta.updatedAt;

    if (delta?.version) {
      if (!Array.isArray(AppState.currentContract.versions)) AppState.currentContract.versions = [];
      if (!AppState.currentContract.versions.some(v => v.versionNo === delta.version.versionNo)) {
        AppState.currentContract.versions.unshift(delta.version);
      }
    }

    if (delta?.newComment) {
      if (!Array.isArray(AppState.currentContract.comments)) AppState.currentContract.comments = [];
      if (!AppState.currentContract.comments.some(c => c.commentId === delta.newComment.commentId)) {
        AppState.currentContract.comments.unshift(delta.newComment);
      }
    }

    if (AppState.contractDetailsMap) {
      AppState.contractDetailsMap[contractId] = AppState.currentContract;
    }
    saveContractDetailCache(contractId, AppState.currentContract);
  }

  if (Array.isArray(AppState.contracts)) {
    const idx = AppState.contracts.findIndex(c => String(c.contractId) === contractId);
    if (idx !== -1) {
      if (delta?.currentVersion) AppState.contracts[idx].currentVersion = delta.currentVersion;
      if (delta?.updatedAt) AppState.contracts[idx].updatedAt = delta.updatedAt;
    }
  }
  saveDashboardCache(AppState.contracts, AppState.stats, Date.now());

  if (AppState.currentView === 'contract-detail' && String(AppState.currentContractId) === contractId) {
    renderContractDetailContent();
  }
}

/**
 * 4. Cập nhật Delta khi upload/xóa tài liệu tham chiếu (referenceFiles)
 */
function applyReferenceFileDelta(action, delta, contractIdFallback) {
  const contractId = String(delta?.contractId || contractIdFallback || AppState.currentContractId);
  if (!contractId) return;

  if (delta?.contractDetail?.contract) {
    syncFullContractDetail(delta.contractDetail);
    return;
  }

  if (AppState.currentContract && String(AppState.currentContract.contractId) === contractId) {
    if (!Array.isArray(AppState.currentContract.referenceFiles)) AppState.currentContract.referenceFiles = [];

    if (action === 'upload' && delta?.referenceFile) {
      if (!AppState.currentContract.referenceFiles.some(f => f.fileId === delta.referenceFile.fileId)) {
        AppState.currentContract.referenceFiles.unshift(delta.referenceFile);
      }
    } else if (action === 'delete' && delta?.fileId) {
      AppState.currentContract.referenceFiles = AppState.currentContract.referenceFiles.filter(f => f.fileId !== delta.fileId);
    }

    if (AppState.contractDetailsMap) {
      AppState.contractDetailsMap[contractId] = AppState.currentContract;
    }
    saveContractDetailCache(contractId, AppState.currentContract);
  }

  if (AppState.currentView === 'contract-detail' && String(AppState.currentContractId) === contractId) {
    renderContractDetailContent();
  }
}

function syncFullContractDetail(contractDetail) {
  if (!contractDetail || !contractDetail.contract) return;
  const contract = contractDetail.contract;
  const contractId = String(contract.contractId);
  const fullContractData = Object.assign({}, contract, {
    versions: contractDetail.versions || [],
    comments: contractDetail.comments || [],
    activities: contractDetail.activities || [],
    summary: contractDetail.summary || '',
    aiAnalyses: contractDetail.aiAnalyses || {},
    taskList: contractDetail.taskList || [],
    referenceFiles: contractDetail.referenceFiles || []
  });
  AppState.currentContract = fullContractData;
  if (!AppState.contractDetailsMap) AppState.contractDetailsMap = {};
  AppState.contractDetailsMap[contractId] = fullContractData;
  saveContractDetailCache(contractId, fullContractData);
  if (AppState.currentView === 'contract-detail' && String(AppState.currentContractId) === contractId) {
    renderContractDetailContent();
  }
}

async function submitForReview(contractId) {
  const confirmed = await showConfirmDialog({
    title: 'Xác nhận gửi review',
    message: 'Bạn có chắc chắn muốn gửi hợp đồng này cho Bộ phận Pháp lý (Legal) review không?',
    confirmText: 'Gửi review',
    type: 'primary'
  });
  if (!confirmed) return;

  showGlobalLoading('Đang gửi yêu cầu review...', 'Đang chuyển tiếp trạng thái sang Legal Review...');
  const taskList = AppState.currentContract?.taskList || [];
  invalidateContractDetailCache(contractId);

  try {
    await api('saveTaskList', contractId, taskList, AppState.token);
    const result = await api('updateContractStatus', contractId, 'PENDING_LEGAL', '', AppState.token);
    showToast('Đã gửi review thành công', 'success');
    applyStatusDelta(result?.data, contractId);
    hideGlobalLoading();
    loadDashboardData(false); // Đồng bộ ngầm
  } catch (err) {
    showToast('Lỗi gửi review: ' + err.message, 'error');
    hideGlobalLoading();
  }
}

async function deleteContract(contractId) {
  const confirmed = await showConfirmDialog({
    title: 'Xoá yêu cầu hợp đồng',
    message: 'Bạn có chắc chắn muốn xoá yêu cầu hợp đồng này?\nThao tác này sẽ xoá toàn bộ dữ liệu liên quan và không thể khôi phục.',
    confirmText: 'Xoá vĩnh viễn',
    cancelText: 'Huỷ bỏ',
    type: 'danger'
  });
  if (!confirmed) return;

  showGlobalLoading('Đang xoá hợp đồng...', 'Đang gỡ bỏ dữ liệu hợp đồng khỏi hệ thống...');
  invalidateContractDetailCache(contractId);

  try {
    await api('deleteContract', contractId, AppState.token);
    showToast('Đã xoá hợp đồng thành công', 'success');
    // Xóa ngay trong AppState.contracts & cache
    if (Array.isArray(AppState.contracts)) {
      AppState.contracts = AppState.contracts.filter(c => String(c.contractId) !== String(contractId));
      saveDashboardCache(AppState.contracts, AppState.stats, Date.now());
    }
    hideGlobalLoading();
    navigateTo('dashboard');
    loadDashboardData(false);
  } catch (err) {
    showToast('Lỗi xoá hợp đồng: ' + err.message, 'error');
    hideGlobalLoading();
  }
}

async function approveContract(contractId) {
  const isLegal = AppState.user?.role === 'LEGAL';
  const newStatus = isLegal ? 'LEGAL_APPROVED' : 'HOL_APPROVED';
  const roleName = isLegal ? 'Bộ phận Pháp lý (Legal)' : 'Trưởng phòng (Head of Legal)';

  const confirmed = await showConfirmDialog({
    title: 'Xác nhận phê duyệt',
    message: `Bạn xác nhận phê duyệt hợp đồng này với vai trò ${roleName}?`,
    confirmText: 'Phê duyệt',
    type: 'success'
  });
  if (!confirmed) return;

  showGlobalLoading('Đang xử lý phê duyệt...', `Đang lưu dữ liệu và chuyển trạng thái sang ${isLegal ? 'Head Review' : 'Đã duyệt'}...`);

  // Tự động lưu Task List hiện tại trước khi cập nhật trạng thái phê duyệt hợp đồng
  const taskList = AppState.currentContract?.taskList || [];
  invalidateContractDetailCache(contractId);

  try {
    await api('saveTaskList', contractId, taskList, AppState.token);
    const result = await api('updateContractStatus', contractId, newStatus, '', AppState.token, true);
    showToast('Đã phê duyệt hợp đồng thành công', 'success');
    applyStatusDelta(result?.data, contractId);
    hideGlobalLoading();
    loadDashboardData(false); // Đồng bộ ngầm
    triggerBackgroundEmail(result?.data?.emailContext);
  } catch (err) {
    showToast('Lỗi phê duyệt: ' + err.message, 'error');
    hideGlobalLoading();
  }
}

async function markCompleted(contractId) {
  const confirmed = await showConfirmDialog({
    title: 'Hoàn tất hợp đồng',
    message: 'Xác nhận đánh dấu hợp đồng này đã hoàn tất?',
    confirmText: 'Hoàn tất',
    type: 'success'
  });
  if (!confirmed) return;

  showGlobalLoading('Đang cập nhật trạng thái...', 'Đang lưu trữ và đánh dấu hoàn tất hợp đồng...');
  const taskList = AppState.currentContract?.taskList || [];
  invalidateContractDetailCache(contractId);

  try {
    await api('saveTaskList', contractId, taskList, AppState.token);
    const result = await api('updateContractStatus', contractId, 'COMPLETED', '', AppState.token);
    showToast('Hợp đồng đã được đánh dấu hoàn tất', 'success');
    applyStatusDelta(result?.data, contractId);
    hideGlobalLoading();
    loadDashboardData(false);
  } catch (err) {
    showToast('Lỗi cập nhật: ' + err.message, 'error');
    hideGlobalLoading();
  }
}

function updateAIPanelOnly() {
  const panel = document.getElementById('ai-assistant-panel');
  if (panel && AppState.currentContract) {
    panel.className = `split-right-panel ${AppState.aiPanelCollapsed ? 'collapsed' : ''}`;
    panel.innerHTML = renderAIAssistantPanel(AppState.currentContract);
  } else {
    renderContractDetailContent();
  }
  initTaskListTextareasAutoResize();
}

function updateActionButtonsOnly() {
  const actionsSection = document.getElementById('contract-actions-container') ||
    document.querySelector('.contract-actions-right') ||
    document.querySelector('.action-buttons-section');
  if (actionsSection && AppState.currentContract) {
    actionsSection.innerHTML = renderActionButtons(AppState.currentContract, AppState.user?.role);
  }
}

async function handleTriggerAI(contractId, analysisType) {
  var actionText = analysisType === 'SUMMARY' ? 'tóm tắt' : 'đánh giá rủi ro';
  const confirmed = await showConfirmDialog({
    title: 'Phân tích AI',
    message: 'Bạn có muốn thực hiện ' + actionText + ' hợp đồng này bằng AI?',
    confirmText: 'Phân tích ngay',
    type: 'primary'
  });
  if (!confirmed) return;

  AppState.aiLoadingType = analysisType;
  AppState.activeAiTab = analysisType;
  AppState.aiPanelCollapsed = false; // Auto expand
  updateAIPanelOnly();
  showToast('AI đang phân tích và ' + actionText + ' hợp đồng, vui lòng chờ giây lát...', 'info');

  api('analyzeContract', contractId, analysisType, AppState.token, AppState.selectedAiVersion, analysisType === 'RISK' ? AppState.selectedCompanyRole : null)
    .then(result => {
      AppState.aiLoadingType = null;
      if (result.success) {
        if (AppState.currentContract && AppState.currentContract.contractId === contractId) {
          if (!AppState.currentContract.aiAnalyses) {
            AppState.currentContract.aiAnalyses = {};
          }
          AppState.currentContract.aiAnalyses[analysisType] = result.data;
          if (!AppState.currentContract.aiAnalyses.allAnalyses) {
            AppState.currentContract.aiAnalyses.allAnalyses = [];
          }
          // Remove old analysis if it exists for the same version and type
          AppState.currentContract.aiAnalyses.allAnalyses = AppState.currentContract.aiAnalyses.allAnalyses.filter(
            a => !(a.versionNo === result.data.versionNo && a.analysisType === result.data.analysisType)
          );
          AppState.currentContract.aiAnalyses.allAnalyses.push(result.data);

          if (analysisType === 'SUMMARY') {
            AppState.currentContract.summary = {
              hasSummary: result.data.hasAnalysis,
              versionNo: result.data.versionNo,
              summaryJson: result.data.resultJson,
              summarizedBy: result.data.analyzedBy,
              summarizedAt: result.data.analyzedAt
            };
          }

          if (AppState.contractDetailsMap) {
            AppState.contractDetailsMap[contractId] = AppState.currentContract;
          }
          saveContractDetailCache(contractId, AppState.currentContract);
        }
        showToast('Phân tích hợp đồng bằng AI thành công!', 'success');
      } else {
        showToast(result.message || 'Lỗi khi phân tích hợp đồng', 'error');
      }
      updateAIPanelOnly();
    })
    .catch(err => {
      AppState.aiLoadingType = null;
      showToast('Lỗi kết nối: ' + err.message, 'error');
      updateAIPanelOnly();
    });
}

async function handleTriggerDecisionBrief(contractId) {
  const confirmed = await showConfirmDialog({
    title: 'Khuyến nghị quyết định (AI)',
    message: 'Bạn có muốn thực hiện lập báo cáo khuyến nghị quyết định (Decision Brief) bằng AI cho hợp đồng này?',
    confirmText: 'Lập báo cáo',
    type: 'primary'
  });
  if (!confirmed) return;

  // Show a modal loading indicator immediately in the center of the screen
  const modalBody = `
      <div style="text-align: center; padding: 20px 0;">
        <div class="ai-pulse-ring" style="margin: 0 auto 16px auto;"></div>
        <p style="font-size: 14px; color: var(--text-secondary); margin: 0; font-weight: 500;">
          Đang kiểm tra tính sẵn sàng của Phân tích rủi ro (Risk Analysis)...
        </p>
      </div>
    `;
  const modalHtml = renderModal('checking-risk-modal', 'Đang kiểm tra', modalBody, '');
  document.getElementById('modal-root').innerHTML = modalHtml;

  // Show loading spinner in the panel too
  AppState.aiLoadingType = 'DECISION_BRIEF';
  AppState.activeAiTab = 'DECISION_BRIEF';
  AppState.aiPanelCollapsed = false;
  updateAIPanelOnly();
  showToast('Đang kiểm tra tính sẵn sàng của phân tích rủi ro (Risk Analysis)...', 'info');

  api('checkRiskAvailability', contractId, AppState.token)
    .then(checkResult => {
      closeModal('checking-risk-modal');
      var targetVNo = (checkResult.data && checkResult.data.targetVersionNo) || AppState.selectedAiVersion;
      if (checkResult.data && checkResult.data.available) {
        // Risk Analysis is already available, run Decision Brief directly on the latest contract version
        runDecisionBriefFlow(contractId, targetVNo);
      } else {
        // Risk Analysis is not available, clear loading spinner in panel
        AppState.aiLoadingType = null;
        updateAIPanelOnly();

        // popup confirm with role selection
        var htmlRoleForm = '';
        htmlRoleForm += '<div style="margin-top:10px; display:flex; flex-direction:column; gap:12px;">';
        htmlRoleForm += '  <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.5; margin:0;">';
        htmlRoleForm += '    Hợp đồng này chưa được chạy phân tích rủi ro (Risk Analysis) cho phiên bản mới nhất v' + targetVNo + '. Để tạo Decision Brief, AI cần dữ liệu Risk Analysis làm đầu vào.<br/>';
        htmlRoleForm += '    Bạn có đồng ý để hệ thống chạy tự động phân tích rủi ro trước không?';
        htmlRoleForm += '  </p>';
        htmlRoleForm += '  <div style="display:flex; align-items:center; gap:8px; background: rgba(255,255,255,0.02); padding:10px; border-radius:6px; border:1px solid var(--border-card);">';
        htmlRoleForm += '    <span style="font-size:13px; font-weight:600; color:var(--text-secondary);">Vai trò công ty:</span>';
        htmlRoleForm += '    <select id="auto-run-role-select" class="form-control" style="width: auto; padding: 4px 24px 4px 8px; font-size: 13px; height: 32px; border-radius: 4px; background-color: var(--bg-secondary); border: 1px solid rgba(255,255,255,0.1); color: var(--text-primary);">';
        htmlRoleForm += '      <option value="BUYER">🛒 Bên Mua</option>';
        htmlRoleForm += '      <option value="SELLER">📦 Bên Bán</option>';
        htmlRoleForm += '    </select>';
        htmlRoleForm += '  </div>';
        htmlRoleForm += '</div>';

        var footerHtml = '';
        footerHtml += '<button class="btn btn-secondary" onclick="closeModal(\'auto-risk-modal\')">Huỷ</button>';
        footerHtml += '<button class="btn btn-ai" id="confirm-auto-run-btn" onclick="startChainRiskAndBriefFlow(\'' + contractId + '\', ' + targetVNo + ')">⚡ Đồng ý & Chạy</button>';

        const modalHtml = renderModal('auto-risk-modal', 'Chưa có Phân tích Rủi ro', htmlRoleForm, footerHtml);
        document.getElementById('modal-root').innerHTML = modalHtml;
      }
    })
    .catch(err => {
      closeModal('checking-risk-modal');
      AppState.aiLoadingType = null;
      updateAIPanelOnly();
      showToast('Lỗi kiểm tra tính sẵn sàng: ' + err.message, 'error');
    });
}

function startChainRiskAndBriefFlow(contractId, versionNo) {
  const roleSelect = document.getElementById('auto-run-role-select');
  const selectedRole = roleSelect ? roleSelect.value : 'BUYER';
  closeModal('auto-risk-modal');

  // Step 1: Run Risk Analysis
  AppState.aiLoadingType = 'RISK';
  AppState.activeAiTab = 'RISK';
  AppState.aiPanelCollapsed = false;
  updateAIPanelOnly();
  showToast('Bước 1/2: Đang tự động chạy Phân tích rủi ro với vai trò đã chọn...', 'info');

  api('analyzeContract', contractId, 'RISK', AppState.token, versionNo, selectedRole)
    .then(result => {
      if (result.success) {
        if (AppState.currentContract && AppState.currentContract.contractId === contractId) {
          if (!AppState.currentContract.aiAnalyses) {
            AppState.currentContract.aiAnalyses = {};
          }
          AppState.currentContract.aiAnalyses['RISK'] = result.data;
          if (!AppState.currentContract.aiAnalyses.allAnalyses) {
            AppState.currentContract.aiAnalyses.allAnalyses = [];
          }
          AppState.currentContract.aiAnalyses.allAnalyses = AppState.currentContract.aiAnalyses.allAnalyses.filter(
            a => !(a.versionNo === result.data.versionNo && a.analysisType === result.data.analysisType)
          );
          AppState.currentContract.aiAnalyses.allAnalyses.push(result.data);

          if (AppState.contractDetailsMap) {
            AppState.contractDetailsMap[contractId] = AppState.currentContract;
          }
          saveContractDetailCache(contractId, AppState.currentContract);
        }
        showToast('Hoàn thành Bước 1/2: Đã phân tích rủi ro thành công.', 'success');

        // Step 2: Run Decision Brief
        runDecisionBriefFlow(contractId, versionNo);
      } else {
        AppState.aiLoadingType = null;
        showToast('Lỗi chạy phân tích rủi ro tự động: ' + (result.message || ''), 'error');
        updateAIPanelOnly();
      }
    })
    .catch(err => {
      AppState.aiLoadingType = null;
      showToast('Lỗi chạy phân tích rủi ro tự động: ' + err.message, 'error');
      updateAIPanelOnly();
    });
}

function runDecisionBriefFlow(contractId, versionNo) {
  AppState.aiLoadingType = 'DECISION_BRIEF';
  AppState.activeAiTab = 'DECISION_BRIEF';
  AppState.aiPanelCollapsed = false;
  updateAIPanelOnly();
  showToast('Đang lập báo cáo Decision Brief AI cho hợp đồng, vui lòng chờ...', 'info');

  api('generateDecisionBrief', contractId, AppState.token, versionNo)
    .then(result => {
      AppState.aiLoadingType = null;
      if (result.success) {
        if (AppState.currentContract && AppState.currentContract.contractId === contractId) {
          if (!AppState.currentContract.aiAnalyses) {
            AppState.currentContract.aiAnalyses = {};
          }
          AppState.currentContract.aiAnalyses['DECISION_BRIEF'] = result.data;
          if (!AppState.currentContract.aiAnalyses.allAnalyses) {
            AppState.currentContract.aiAnalyses.allAnalyses = [];
          }
          // Remove old brief if it exists for the same version and type
          AppState.currentContract.aiAnalyses.allAnalyses = AppState.currentContract.aiAnalyses.allAnalyses.filter(
            a => !(a.versionNo === result.data.versionNo && a.analysisType === result.data.analysisType)
          );
          AppState.currentContract.aiAnalyses.allAnalyses.push(result.data);

          if (AppState.contractDetailsMap) {
            AppState.contractDetailsMap[contractId] = AppState.currentContract;
          }
          saveContractDetailCache(contractId, AppState.currentContract);
        }
        showToast('Tạo Decision Brief thành công!', 'success');
      } else {
        showToast(result.message || 'Lỗi khi tạo Decision Brief', 'error');
      }
      updateAIPanelOnly();
    })
    .catch(err => {
      AppState.aiLoadingType = null;
      showToast('Lỗi kết nối tạo Decision Brief: ' + err.message, 'error');
      updateAIPanelOnly();
    });
}

function switchAiTab(tabName) {
  AppState.activeAiTab = tabName;
  updateAIPanelOnly();
}

function toggleAIPanel(collapsed) {
  AppState.aiPanelCollapsed = collapsed;
  updateAIPanelOnly();
}

function handleAiVersionChange(versionNo) {
  AppState.selectedAiVersion = parseInt(versionNo, 10);
  updateAIPanelOnly();
}

function handleCompanyRoleChange(role) {
  AppState.selectedCompanyRole = role;
  updateAIPanelOnly();
}

function generateClientUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function handleAddTaskRow() {
  if (!AppState.currentContract) return;
  if (!AppState.currentContract.taskList) {
    AppState.currentContract.taskList = [];
  }
  AppState.currentContract.taskList.push({
    contractId: AppState.currentContractId,
    taskId: generateClientUUID(),
    clauses: '',
    issueSummary: '',
    category: 'Must Fix',
    legalRecommendation: '',
    status: '',
    userNotes: '',
    legalDecision: 'NoGo'
  });
  updateAIPanelOnly();
  updateActionButtonsOnly();
  refreshTaskListExpandedModal();
}

function handleDeleteTaskRow(taskId) {
  if (!AppState.currentContract || !AppState.currentContract.taskList) return;
  AppState.currentContract.taskList = AppState.currentContract.taskList.filter(t => t.taskId !== taskId);
  updateAIPanelOnly();
  updateActionButtonsOnly();
  refreshTaskListExpandedModal();
}

function autoResizeTaskTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  if (el.disabled) {
    el.style.height = Math.max(32, el.scrollHeight) + 'px';
    el.style.overflowY = 'visible';
  } else {
    var scrollH = el.scrollHeight;
    var newHeight = Math.max(68, Math.min(scrollH, 240));
    el.style.height = newHeight + 'px';
    el.style.overflowY = scrollH > 240 ? 'auto' : 'hidden';
  }
}

function initTaskListTextareasAutoResize() {
  var resizeAll = function () {
    var textareas = document.querySelectorAll('.task-list-table textarea.form-control');
    textareas.forEach(function (ta) {
      autoResizeTaskTextarea(ta);
    });
  };
  resizeAll();
  setTimeout(resizeAll, 30);
  setTimeout(resizeAll, 150);
}

function handleTaskFieldChange(taskId, fieldName, value) {
  if (!AppState.currentContract || !AppState.currentContract.taskList) return;
  const task = AppState.currentContract.taskList.find(t => t.taskId === taskId);
  if (task) {
    task[fieldName] = value;
  }
  if (fieldName === 'legalDecision') {
    updateActionButtonsOnly();
    refreshTaskListExpandedModal();
  }
}

function handleSaveTaskListOnly(btnEl) {
  if (!AppState.currentContract) return;
  const taskList = AppState.currentContract.taskList || [];
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerText = '⏳ Đang lưu...';
  }
  showToast('Đang lưu Task List...', 'info');
  api('saveTaskList', AppState.currentContractId, taskList, AppState.token)
    .then(() => {
      showToast('Đã lưu Task List thành công', 'success');
      if (AppState.contractDetailsMap && AppState.currentContractId && AppState.contractDetailsMap[AppState.currentContractId]) {
        AppState.contractDetailsMap[AppState.currentContractId].taskList = taskList;
      }
      if (AppState.currentContract && AppState.currentContractId) {
        saveContractDetailCache(AppState.currentContractId, AppState.currentContract);
      }
      renderContractDetailContent();
      refreshTaskListExpandedModal();
    })
    .catch(err => {
      showToast('Lỗi lưu Task List: ' + err.message, 'error');
    })
    .finally(() => {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerText = btnEl.getAttribute('data-original-text') || '💾 Lưu nháp';
      }
    });
}

async function handleSubmitTaskListToUser(btnEl) {
  if (!AppState.currentContract) return;
  const confirmed = await showConfirmDialog({
    title: 'Gửi Task List cho User',
    message: 'Bạn muốn gửi Task List này cho User?\nTrạng thái hợp đồng sẽ chuyển thành Draft để User chỉnh sửa.',
    confirmText: 'Gửi cho User',
    type: 'primary'
  });
  if (!confirmed) return;

  showGlobalLoading('Đang gửi Task List cho User...', 'Đang cập nhật nhiệm vụ và chuyển trạng thái về Draft...');
  const taskList = AppState.currentContract.taskList || [];
  invalidateContractDetailCache(AppState.currentContractId);

  try {
    const result = await api('submitTaskListToUser', AppState.currentContractId, taskList, AppState.token, true);
    closeModal('task-list-expanded-modal');
    showToast('Đã gửi Task List thành công', 'success');
    applyStatusDelta(result?.data, AppState.currentContractId);
    hideGlobalLoading();
    loadDashboardData(false);
    triggerBackgroundEmail(result?.data?.emailContext);
  } catch (err) {
    showToast('Lỗi gửi Task List: ' + err.message, 'error');
    hideGlobalLoading();
  }
}

async function handleSubmitTaskListToLegal(btnEl) {
  if (!AppState.currentContract) return;
  const confirmed = await showConfirmDialog({
    title: 'Gửi review cho Legal',
    message: 'Xác nhận gửi yêu cầu review lại cho Legal?',
    confirmText: 'Gửi cho Legal',
    type: 'primary'
  });
  if (!confirmed) return;

  showGlobalLoading('Đang gửi yêu cầu review...', 'Đang cập nhật Task List và chuyển trạng thái sang Legal Review...');
  const taskList = AppState.currentContract.taskList || [];
  invalidateContractDetailCache(AppState.currentContractId);

  try {
    const result = await api('submitTaskListToLegal', AppState.currentContractId, taskList, AppState.token, true);
    closeModal('task-list-expanded-modal');
    showToast('Đã gửi yêu cầu review thành công', 'success');
    applyStatusDelta(result?.data, AppState.currentContractId);
    hideGlobalLoading();
    loadDashboardData(false);
    triggerBackgroundEmail(result?.data?.emailContext);
  } catch (err) {
    showToast('Lỗi gửi review: ' + err.message, 'error');
    hideGlobalLoading();
  }
}

function showTaskListExpandedModal() {
  const contract = AppState.currentContract;
  if (!contract) return;
  const bodyHtml = renderTaskListPanel(contract, AppState.user?.role, true);
  const modalHtml = renderModal('task-list-expanded-modal', 'Danh sách nhiệm vụ (Task List)', bodyHtml, '');
  document.getElementById('modal-root').innerHTML = modalHtml;
  initTaskListTextareasAutoResize();
}

function refreshTaskListExpandedModal() {
  const modalBody = document.querySelector('#task-list-expanded-modal .modal-body');
  if (modalBody && AppState.currentContract) {
    modalBody.innerHTML = renderTaskListPanel(AppState.currentContract, AppState.user?.role, true);
    initTaskListTextareasAutoResize();
  }
}

let isCreatingContract = false;

async function handleCreateContract() {
  if (isCreatingContract) return;

  const title = document.getElementById('new-contract-title')?.value.trim();
  const supplier = document.getElementById('new-contract-supplier')?.value.trim();
  const description = document.getElementById('new-contract-description')?.value.trim();
  const fileInput = document.getElementById('new-contract-file');
  const file = fileInput?.files[0];

  if (!title) {
    showToast('Vui lòng nhập tên hợp đồng', 'error');
    return;
  }
  if (!supplier) {
    showToast('Vui lòng nhập tên nhà cung cấp', 'error');
    return;
  }
  if (!description) {
    showToast('Vui lòng nhập mô tả hợp đồng', 'error');
    return;
  }
  if (!file) {
    showToast('Vui lòng chọn file hợp đồng', 'error');
    return;
  }
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext !== 'docx' && ext !== 'doc') {
    showToast('Định dạng file không hợp lệ. Vui lòng chỉ chọn file Word (.doc, .docx)', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('File lớn hơn 10MB, vui lòng chọn file nhỏ hơn', 'error');
    return;
  }

  const confirmed = await showConfirmDialog({
    title: 'Xác nhận tạo hợp đồng',
    message: `Bạn có chắc chắn muốn khởi tạo hợp đồng "${title}" với nhà cung cấp "${supplier}" không?`,
    confirmText: 'Tạo hợp đồng',
    type: 'primary'
  });
  if (!confirmed) return;

  isCreatingContract = true;
  closeModal('new-contract-modal');
  showGlobalLoading('Đang tạo hợp đồng...', 'Đang lưu file lên Google Drive và khởi tạo bản ghi...');

  try {
    const fileData = await readFileAsBase64(file);
    // Encode reference files
    const refFilesList = multiFileSelections['ref-files-create-list'] || [];
    let referenceFilesData = [];
    if (refFilesList.length > 0) {
      for (let i = 0; i < refFilesList.length; i++) {
        const refBase64 = await readFileAsBase64(refFilesList[i]);
        referenceFilesData.push({
          fileData: refBase64,
          fileName: refFilesList[i].name
        });
      }
    }
    const result = await api('createContract', title, supplier, description, fileData, file.name, AppState.token, referenceFilesData.length > 0 ? referenceFilesData : null);
    showToast('Tạo hợp đồng thành công', 'success');
    AppState.filters.status = 'PENDING_ACTION'; // Tự động chuyển tab về "Cần xử lý"
    AppState.currentPage = 1; // Reset về trang 1

    // Optimistic UI Update: Hiển thị ngay hợp đồng mới lên giao diện tức thì
    if (result && result.data) {
      if (Array.isArray(AppState.contracts)) {
        AppState.contracts = [result.data, ...AppState.contracts.filter(c => c.contractId !== result.data.contractId)];
      } else {
        AppState.contracts = [result.data];
      }
      if (AppState.stats) {
        AppState.stats.draft = (AppState.stats.draft || 0) + 1;
        AppState.stats.pendingAction = (AppState.stats.pendingAction || 0) + 1;
        AppState.stats.total = (AppState.stats.total || 0) + 1;
      }
      saveDashboardCache(AppState.contracts, AppState.stats, Date.now());
      if (AppState.currentView === 'dashboard') {
        renderDashboardContent();
      }
    }

    hideGlobalLoading(); // Tắt spinner ngay lập tức (không bắt user chờ đợi thêm)
    loadDashboardData(true); // Đồng bộ ngầm với server
  } catch (err) {
    showToast('Lỗi tạo hợp đồng: ' + err.message, 'error');
  } finally {
    isCreatingContract = false;
    hideGlobalLoading();
  }
}

async function handleUploadVersion() {
  const fileInput = document.getElementById('upload-version-file');
  const file = fileInput?.files[0];
  const changeSummary = document.getElementById('upload-change-summary')?.value.trim();
  const negoNotes = document.getElementById('upload-nego-notes')?.value.trim();

  if (!file) {
    showToast('Vui lòng chọn file', 'error');
    return;
  }
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext !== 'docx' && ext !== 'doc') {
    showToast('Định dạng file không hợp lệ. Vui lòng chỉ chọn file Word (.doc, .docx)', 'error');
    return;
  }
  if (!changeSummary) {
    showToast('Vui lòng nhập tóm tắt thay đổi', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('File lớn hơn 10MB, vui lòng chọn file nhỏ hơn', 'error');
    return;
  }

  const confirmed = await showConfirmDialog({
    title: 'Xác nhận tải phiên bản mới',
    message: `Bạn có chắc chắn muốn tải lên phiên bản mới "${file.name}" cho hợp đồng này không?`,
    confirmText: 'Tải lên',
    type: 'primary'
  });
  if (!confirmed) return;

  closeModal('upload-version-modal');
  showGlobalLoading('Đang tải lên phiên bản mới...', 'Đang lưu trữ tài liệu và đồng bộ lịch sử...');
  invalidateContractDetailCache(AppState.currentContractId);

  try {
    const fileData = await readFileAsBase64(file);
    const result = await api('uploadNewVersion', AppState.currentContractId, fileData, file.name, changeSummary, negoNotes, AppState.token);
    showToast('Tải lên phiên bản mới thành công', 'success');
    AppState.selectedAiVersion = null; // Reset to select the new latest version
    applyVersionDelta(result?.data, AppState.currentContractId);
    hideGlobalLoading();
    loadDashboardData(false);
  } catch (err) {
    showToast('Lỗi tải lên: ' + err.message, 'error');
    hideGlobalLoading();
  }
}

async function handleAddComment() {
  const versionNo = AppState.currentContract?.currentVersion || 1;
  const clauseRef = '';
  const text = document.getElementById('comment-text')?.value.trim();
  const currentStatus = AppState.currentContract?.status;
  let textToSend = text;

  // Auto-populate comment if Draft and empty
  if (!textToSend && (currentStatus === 'DRAFT' || currentStatus === 'USER_REVISING')) {
    textToSend = 'Legal vui lòng review hợp đồng';
  }

  if (!textToSend) {
    showToast('Vui lòng nhập nội dung yêu cầu', 'error');
    return;
  }

  let nextStatus = null;
  let nextStatusLabel = '';
  if (currentStatus === 'DRAFT' || currentStatus === 'USER_REVISING') {
    nextStatus = 'PENDING_LEGAL';
    nextStatusLabel = 'Chuyển sang Legal Review';
  } else if (currentStatus === 'PENDING_LEGAL') {
    nextStatus = 'LEGAL_COMMENTED';
    nextStatusLabel = 'Cập nhật Legal Commented';
  } else if (currentStatus === 'PENDING_HOL') {
    nextStatus = 'HOL_COMMENTED';
    nextStatusLabel = 'Cập nhật Head Commented';
  }

  const actionMsg = (currentStatus === 'DRAFT' || currentStatus === 'USER_REVISING')
    ? 'Bạn có chắc chắn muốn gửi yêu cầu review hợp đồng này cho Legal không?'
    : `Bạn có chắc chắn muốn gửi ý kiến/yêu cầu này?${nextStatusLabel ? ` (${nextStatusLabel})` : ''}`;

  const confirmed = await showConfirmDialog({
    title: 'Xác nhận gửi yêu cầu',
    message: actionMsg,
    confirmText: (currentStatus === 'DRAFT' || currentStatus === 'USER_REVISING') ? 'Gửi review' : 'Gửi yêu cầu',
    type: 'primary'
  });
  if (!confirmed) return;

  closeModal('comment-modal');
  showGlobalLoading('Đang gửi yêu cầu...', 'Đang cập nhật trạng thái và ghi nhận yêu cầu...');
  const taskList = AppState.currentContract?.taskList || [];
  invalidateContractDetailCache(AppState.currentContractId);

  try {
    if (nextStatus) {
      await api('saveTaskList', AppState.currentContractId, taskList, AppState.token);
    }
    let result = await api('addComment', AppState.currentContractId, parseInt(versionNo), clauseRef, textToSend, AppState.token);
    let emailContextToSend = null;
    if (nextStatus) {
      const statusResult = await api('updateContractStatus', AppState.currentContractId, nextStatus, '', AppState.token, true);
      showToast('Đã gửi yêu cầu thành công', 'success');
      applyStatusDelta(statusResult?.data, AppState.currentContractId);
      emailContextToSend = statusResult?.data?.emailContext;
    } else {
      showToast('Đã gửi yêu cầu thành công', 'success');
      applyCommentDelta(result?.data, AppState.currentContractId);
    }
    hideGlobalLoading();
    loadDashboardData(false);
    if (emailContextToSend) {
      triggerBackgroundEmail(emailContextToSend);
    }
  } catch (err) {
    showToast('Lỗi gửi yêu cầu: ' + err.message, 'error');
    hideGlobalLoading();
  }
}

// ------------------------------------------------------------
// 10. View Render Functions
// ------------------------------------------------------------
function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;

  switch (AppState.currentView) {
    case 'login':
      app.innerHTML = renderLoginView();
      break;
    case 'dashboard':
      app.innerHTML = renderDashboardView();
      break;
    case 'archived':
      app.innerHTML = renderArchivedView();
      break;
    case 'contract-detail':
      app.innerHTML = renderContractDetailView();
      break;
    default:
      app.innerHTML = renderLoginView();
  }
}

function renderSidebar(activeView = 'dashboard') {
  const user = AppState.user || {};
  let avatarLetter = 'U';
  const role = (user.role || '').toUpperCase();
  if (role === 'LEGAL') {
    avatarLetter = 'L';
  } else if (role === 'HOL') {
    avatarLetter = 'H';
  }
  const roleBadge = user.role || '';
  const isCollapsed = AppState.isSidebarCollapsed !== false;

  return `
    <aside class="sidebar ${isCollapsed ? 'collapsed' : ''}">
      <div class="sidebar-brand">
        <span class="sidebar-brand-icon">📋</span>
        <span class="sidebar-brand-text">CR System</span>
      </div>
      <nav class="sidebar-nav">
        <a class="nav-item ${activeView === 'dashboard' ? 'active' : ''}" href="#dashboard">
          <span class="nav-icon">📊</span>
          <span class="nav-text">Tổng quan</span>
        </a>
        <a class="nav-item ${activeView === 'archived' ? 'active' : ''}" href="#archived">
          <span class="nav-icon">📁</span>
          <span class="nav-text">Đã duyệt</span>
        </a>
      </nav>
      <div class="sidebar-footer">
        <div class="user-avatar">${avatarLetter}</div>
        <div class="user-info">
          <span class="user-name">${user.displayName || user.username || ''}</span>
          <span class="role-badge">${roleBadge}</span>
        </div>
      </div>
      <button class="sidebar-toggle" onclick="toggleSidebar()" title="Thu gọn sidebar">
        <span>◀</span>
      </button>
    </aside>
  `;
}

function renderLoginView() {
  if (sessionStorage.getItem('login_started') === '1') {
    return `
      <div class="login-page">
        <div class="login-card fade-in" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 40px;">
          <div class="loading-spinner" style="margin-bottom: 20px; width: 40px; height: 40px;"></div>
          <h2 style="color: var(--text-primary); font-size: 18px; margin-bottom: 8px;">Đang xác thực...</h2>
          <p style="color: var(--text-secondary); font-size: 14px; text-align: center;">Vui lòng đợi trong giây lát, hệ thống đang hoàn tất quá trình đăng nhập.</p>
        </div>
        <div class="login-bg-decoration"></div>
      </div>`;
  }

  let errorDisplay = AppState.loginError ? 'block' : 'none';
  let errorMsg = AppState.loginError || '';

  return `
    <div class="login-page">
      <div class="login-card fade-in">
        <div class="login-header">
          <div class="login-logo">📋</div>
          <h1 class="login-title gradient-text">Contract Review System <span style="font-size: 16px; color: #ff3366;">(v2.0 - Vercel)</span></h1>
          <p class="login-subtitle">Hệ thống quản lý review hợp đồng</p>
        </div>
        <div class="login-form">
          <div id="login-error" class="login-error" style="display:${errorDisplay}; margin-bottom: 12px; color: #b91c1c; background: #fee2e2; border: 1px solid #f87171; padding: 12px; border-radius: 6px; font-size: 13.5px; line-height: 1.5; text-align: center;">${errorMsg}</div>
          <button id="login-btn-google" class="btn btn-primary w-full" style="display:flex; justify-content:center; align-items:center; gap:10px; background-color: #ffffff; color: #1f2937; border: 1px solid #d1d5db; height: 44px; font-weight: 500; margin-bottom: 12px;" onclick="handleGoogleLogin()">
            <svg style="width:18px;height:18px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Đăng nhập với Google
          </button>
          <button id="login-btn-ms" class="btn btn-primary w-full" style="display:flex; justify-content:center; align-items:center; gap:10px; background-color: #2F2F2F; color: #ffffff; border: 1px solid #2F2F2F; height: 44px; font-weight: 500;" onclick="handleMicrosoftLogin()">
            <svg style="width:18px;height:18px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><path fill="#f25022" d="M0 0h10v10H0z"/><path fill="#7fba00" d="M11 0h10v10H11z"/><path fill="#00a4ef" d="M0 11h10v10H0z"/><path fill="#ffb900" d="M11 11h10v10H11z"/></svg>
            Đăng nhập với Microsoft
          </button>
        </div>
      </div>
      <div class="login-bg-decoration"></div>
    </div>`;
}

function renderDashboardView() {
  const user = AppState.user || {};
  const roleBadge = user.role || '';

  return `
    <div class="app-layout">
      ${renderSidebar('dashboard')}
      <div class="main-content ${AppState.isSidebarCollapsed !== false ? 'sidebar-collapsed' : ''}">
        <div class="topbar">
          <h1 class="topbar-title">Tổng quan</h1>
          <div class="topbar-right">
            ${renderThemeToggleBtn()}
            <div class="topbar-user">
              <span class="topbar-user-name">${user.displayName || ''}</span>
              <span class="role-badge">${roleBadge}</span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="loadDashboardData(true)" title="Tải lại danh sách mới nhất từ server">🔄 Làm mới</button>
            <button class="btn btn-outline btn-sm" onclick="handleLogout()">Đăng xuất</button>
          </div>
        </div>
        <div id="dashboard-content">
          ${AppState.contracts !== null ? getDashboardContentHTML() : renderLoadingSpinner('Đang tải dữ liệu...')}
        </div>
      </div>
    </div>
  `;
}

function getDashboardStatsHTML() {
  const stats = AppState.stats || {};
  return `
    <div class="stats-row" id="dashboard-stats">
      ${renderStatCard('⏳', 'Cần xử lý', stats.pending || 0, '#f59e0b', 'PENDING_ACTION', AppState.filters.status === 'PENDING_ACTION')}
      ${renderStatCard('⚖️', 'Legal Review', stats.legalReview || 0, '#3b82f6', 'LEGAL_REVIEW', AppState.filters.status === 'LEGAL_REVIEW')}
      ${renderStatCard('🔍', 'Head Review', stats.headReview || 0, '#8b5cf6', 'HEAD_REVIEW', AppState.filters.status === 'HEAD_REVIEW')}
    </div>
  `;
}

function getDashboardFilterBarHTML() {
  const isUserRole = (AppState.user?.role || '').toUpperCase() === 'USER';
  return `
    <div class="filter-bar" id="dashboard-filter-bar">
      <div class="filter-bar-left">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="search-input" placeholder="Tìm kiếm theo mã, tên HĐ, nhà cung cấp..."
            value="${AppState.filters.search}" oninput="handleSearchInput(this.value)" />
        </div>
      </div>
      ${isUserRole ? `
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="btn btn-primary" onclick="showNewContractModal()"><span>➕</span> Tạo hợp đồng mới</button>
      </div>` : ''}
    </div>
  `;
}

function getDashboardListHTML() {
  const isUserRole = (AppState.user?.role || '').toUpperCase() === 'USER';
  const filtered = filterContracts();

  if (AppState.loading) {
    return renderLoadingSkeleton();
  } else if (filtered.length === 0) {
    const emptySubtext = isUserRole ? 'Tạo hợp đồng mới để bắt đầu' : 'Không có hợp đồng nào';
    return renderEmptyState('📄', 'Chưa có hợp đồng', emptySubtext);
  } else {
    // Phân trang danh sách hợp đồng (20 record mỗi trang)
    const itemsPerPage = 20;
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (AppState.currentPage > totalPages) AppState.currentPage = totalPages;
    if (AppState.currentPage < 1) AppState.currentPage = 1;

    const startIndex = (AppState.currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, endIndex);

    const cardsHtml = `<div class="contract-list">${paginatedItems.map(c =>
      renderContractCard(c, AppState.user?.role)
    ).join('')}</div>`;

    const paginationHtml = renderPagination(totalItems, itemsPerPage, AppState.currentPage, 'changePage');
    return `<div id="contract-list">${cardsHtml}</div>` + paginationHtml;
  }
}

function getDashboardContentHTML() {
  return getDashboardStatsHTML() + getDashboardFilterBarHTML() + `<div id="dashboard-list-container">${getDashboardListHTML()}</div>`;
}

function renderDashboardContent(onlyList = false) {
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  const listContainer = document.getElementById('dashboard-list-container');
  if (onlyList && listContainer) {
    listContainer.innerHTML = getDashboardListHTML();
    const statsContainer = document.getElementById('dashboard-stats');
    if (statsContainer) {
      statsContainer.outerHTML = getDashboardStatsHTML();
    }
  } else {
    container.innerHTML = getDashboardContentHTML();
  }
}

function renderArchivedView() {
  const user = AppState.user || {};
  const roleBadge = user.role || '';

  return `
    <div class="app-layout">
      ${renderSidebar('archived')}
      <div class="main-content ${AppState.isSidebarCollapsed !== false ? 'sidebar-collapsed' : ''}">
        <div class="topbar">
          <h1 class="topbar-title">Hợp đồng đã duyệt</h1>
          <div class="topbar-right">
            ${renderThemeToggleBtn()}
            <div class="topbar-user">
              <span class="topbar-user-name">${user.displayName || ''}</span>
              <span class="role-badge">${roleBadge}</span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="loadArchivedContractsData(true)" title="Tải lại danh sách Đã duyệt mới nhất từ server">🔄 Làm mới</button>
            <button class="btn btn-outline btn-sm" onclick="handleLogout()">Đăng xuất</button>
          </div>
        </div>
        <div id="archived-content">
          ${AppState.archivedContracts !== null ? getArchivedContentHTML() : renderLoadingSpinner('Đang tải danh sách hợp đồng đã duyệt...')}
        </div>
      </div>
    </div>
  `;
}

function getAllApprovedContracts() {
  const activeApproved = (AppState.contracts || []).filter(c => c.status === 'HOL_APPROVED' || c.status === 'COMPLETED');
  const archived = AppState.archivedContracts || [];
  const map = new Map();
  archived.forEach(c => { if (c && c.contractId) map.set(String(c.contractId), c); });
  activeApproved.forEach(c => { if (c && c.contractId) map.set(String(c.contractId), c); });
  return Array.from(map.values());
}

function filterArchivedContracts() {
  if (AppState.isDeepSearching && AppState.deepSearchResults) {
    return AppState.deepSearchResults;
  }

  let list = getAllApprovedContracts();

  if (AppState.archivedSearch) {
    const keyword = AppState.archivedSearch.toLowerCase();
    list = list.filter(c =>
      (c.title || '').toLowerCase().includes(keyword) ||
      (c.supplier || '').toLowerCase().includes(keyword) ||
      (c.contractId || '').toLowerCase().includes(keyword) ||
      (c.createdBy || '').toLowerCase().includes(keyword)
    );
  }

  return list;
}

function getArchivedBannerHTML() {
  const isDeep = AppState.isDeepSearching;
  const filtered = filterArchivedContracts();
  const searchTrim = (AppState.archivedSearch || '').trim();

  if (isDeep) {
    return `
      <div class="deep-search-active-banner fade-in">
        <div class="deep-search-active-title">
          <span>🔎 Kết quả tìm kiếm toàn bộ kho lưu trữ cho: <strong>"${AppState.deepSearchQuery}"</strong> (Tìm thấy <strong>${filtered.length}</strong> hợp đồng)</span>
        </div>
        <button class="btn btn-outline btn-sm" onclick="handleClearDeepSearch()" title="Quay lại danh sách hợp đồng gần đây">✕ Quay lại danh sách gần đây</button>
      </div>
    `;
  } else if (searchTrim.length > 0) {
    return `
      <div class="deep-search-banner fade-in">
        <div class="deep-search-info">
          <span>💡 Đang lọc trong <strong>${getAllApprovedContracts().length}</strong> hợp đồng gần nhất.</span>
        </div>
        <button class="btn btn-outline btn-sm deep-search-btn" onclick="handleTriggerDeepSearch()" ${AppState.deepSearchLoading ? 'disabled' : ''} title="Tìm kiếm trên toàn bộ dữ liệu lịch sử trên máy chủ (hoặc nhấn Enter)">
          ${AppState.deepSearchLoading ? '<span class="loading-spinner-xs"></span> Đang tìm kiếm máy chủ...' : '🔍 Tìm kiếm sâu trên toàn bộ máy chủ'}
        </button>
      </div>
    `;
  }
  return '';
}

function getArchivedCountLabelHTML() {
  const isDeep = AppState.isDeepSearching;
  const filtered = filterArchivedContracts();
  return isDeep
    ? `Kết quả tìm kiếm sâu: <strong>${filtered.length}</strong> hợp đồng`
    : `Hiển thị <strong>${filtered.length}</strong> / <strong>${getAllApprovedContracts().length}</strong> hợp đồng gần nhất`;
}

function getArchivedFilterBarHTML() {
  return `
    <div class="filter-bar" id="archived-filter-bar">
      <div class="filter-bar-left">
        <div class="search-input-wrapper" style="min-width: 340px;">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="archived-search-input" placeholder="Tìm kiếm theo mã, tiêu đề, nhà cung cấp (Enter để tìm sâu)..."
            value="${AppState.archivedSearch || ''}" oninput="handleArchivedSearchInput(this.value)" onkeydown="handleArchivedSearchKeydown(event)" />
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span id="archived-count-label" class="text-muted" style="font-size: 13px;">${getArchivedCountLabelHTML()}</span>
      </div>
    </div>
  `;
}

function getArchivedListHTML() {
  const isDeep = AppState.isDeepSearching;
  const filtered = filterArchivedContracts();
  const searchTrim = (AppState.archivedSearch || '').trim();

  if (AppState.loading || AppState.deepSearchLoading) {
    return renderLoadingSkeleton();
  } else if (filtered.length === 0) {
    if (isDeep) {
      return renderEmptyState('🔍', 'Không tìm thấy hợp đồng', `Không có hợp đồng nào trong toàn bộ kho lưu trữ khớp với từ khóa "${AppState.deepSearchQuery}"`);
    } else if (searchTrim.length > 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <div class="empty-state-title">Không tìm thấy trong danh sách gần nhất</div>
          <div class="empty-state-desc">Hợp đồng bạn tìm kiếm có thể đã được lưu trữ từ lâu trong lịch sử.</div>
          <button class="btn btn-primary btn-sm" style="margin-top: 12px;" onclick="handleTriggerDeepSearch()">
            🔍 Tìm kiếm sâu trên toàn bộ máy chủ
          </button>
        </div>
      `;
    } else {
      return renderEmptyState('📁', 'Không tìm thấy hợp đồng', 'Chưa có hợp đồng nào ở trạng thái Đã duyệt.');
    }
  } else {
    const itemsPerPage = 20;
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (AppState.archivedCurrentPage > totalPages) AppState.archivedCurrentPage = totalPages;
    if (AppState.archivedCurrentPage < 1) AppState.archivedCurrentPage = 1;

    const startIndex = (AppState.archivedCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, endIndex);

    const cardsHtml = `<div class="contract-list">${paginatedItems.map(c =>
      renderContractCard(c, AppState.user?.role)
    ).join('')}</div>`;

    const paginationHtml = renderPagination(totalItems, itemsPerPage, AppState.archivedCurrentPage, 'changeArchivedPage');
    return `<div id="archived-contract-list">${cardsHtml}</div>` + paginationHtml;
  }
}

function getArchivedContentHTML() {
  return getArchivedFilterBarHTML() + `<div id="archived-banner-container">${getArchivedBannerHTML()}</div>` + `<div id="archived-list-container">${getArchivedListHTML()}</div>`;
}

function renderArchivedContent(onlyList = false) {
  const container = document.getElementById('archived-content');
  if (!container) return;

  const listContainer = document.getElementById('archived-list-container');
  if (onlyList && listContainer) {
    const countLabel = document.getElementById('archived-count-label');
    if (countLabel) countLabel.innerHTML = getArchivedCountLabelHTML();
    const bannerContainer = document.getElementById('archived-banner-container');
    if (bannerContainer) bannerContainer.innerHTML = getArchivedBannerHTML();
    listContainer.innerHTML = getArchivedListHTML();
  } else {
    container.innerHTML = getArchivedContentHTML();
  }
}

let _archivedSearchDebounce = null;
function handleArchivedSearchInput(value) {
  AppState.archivedSearch = value;
  AppState.archivedCurrentPage = 1;
  // Nếu đang ở deep search mà người dùng sửa từ khóa khác với query cũ -> thoát deep search về local search
  if (AppState.isDeepSearching && value !== AppState.deepSearchQuery) {
    AppState.isDeepSearching = false;
    AppState.deepSearchResults = null;
  }
  if (_archivedSearchDebounce) clearTimeout(_archivedSearchDebounce);
  _archivedSearchDebounce = setTimeout(() => {
    renderArchivedContent(true); // Chỉ cập nhật banner, count, và list. Giữ nguyên input DOM!
  }, 800);
}

function handleArchivedSearchKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const query = (AppState.archivedSearch || '').trim();
    if (query) {
      handleTriggerDeepSearch();
    }
  }
}

function handleTriggerDeepSearch() {
  const query = (AppState.archivedSearch || '').trim();
  if (!query) {
    showToast('Vui lòng nhập từ khóa để tìm kiếm sâu', 'warning');
    return;
  }

  AppState.deepSearchLoading = true;
  renderArchivedContent(true);

  api('searchArchivedContracts', AppState.token, query)
    .then(result => {
      const data = result.data || {};
      AppState.deepSearchResults = data.contracts || [];
      AppState.deepSearchQuery = query;
      AppState.isDeepSearching = true;
      AppState.deepSearchLoading = false;
      AppState.archivedCurrentPage = 1;
      renderArchivedContent(true);
    })
    .catch(err => {
      AppState.deepSearchLoading = false;
      showToast('Lỗi khi tìm kiếm sâu: ' + err.message, 'error');
      renderArchivedContent(true);
    });
}

function handleClearDeepSearch() {
  AppState.isDeepSearching = false;
  AppState.deepSearchResults = null;
  AppState.deepSearchQuery = '';
  AppState.archivedSearch = '';
  AppState.archivedCurrentPage = 1;
  const input = document.getElementById('archived-search-input');
  if (input) input.value = '';
  renderArchivedContent(true);
}

function changeArchivedPage(page) {
  AppState.archivedCurrentPage = page;
  renderArchivedContent(true);
}

function handleBackFromDetail() {
  if (AppState.previousView === 'archived') {
    navigateTo('archived');
  } else {
    navigateTo('dashboard');
  }
}

function renderContractDetailView() {
  const user = AppState.user || {};
  const roleBadge = user.role || '';
  const currentNav = AppState.previousView === 'archived' ? 'archived' : 'dashboard';

  return `
    <div class="app-layout">
      ${renderSidebar(currentNav)}
      <div class="main-content ${AppState.isSidebarCollapsed !== false ? 'sidebar-collapsed' : ''}">
        <div class="topbar">
          <div class="topbar-left" style="display: flex; align-items: center; gap: 8px;">
            <button class="btn btn-ghost btn-sm" onclick="handleBackFromDetail()">← Quay lại</button>
            <button class="btn btn-ghost btn-sm btn-refresh-detail" id="btn-refresh-detail" onclick="handleRefreshContractDetail()" title="Làm mới chi tiết hợp đồng từ máy chủ">
              🔄 Làm mới
            </button>
          </div>
          <div class="topbar-right">
            ${renderThemeToggleBtn()}
            <div class="topbar-user">
              <span class="topbar-user-name">${user.displayName || ''}</span>
              <span class="role-badge">${roleBadge}</span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="handleLogout()">Đăng xuất</button>
          </div>
        </div>
        <div id="contract-detail-area">
          ${(AppState.currentContract) ? getContractDetailContentHTML() : renderLoadingSpinner('Đang tải chi tiết hợp đồng...')}
        </div>
      </div>
    </div>
  `;
}

async function handleRefreshContractDetail() {
  const contractId = AppState.currentContractId;
  if (!contractId) return;

  const btn = document.getElementById('btn-refresh-detail');
  if (btn) {
    btn.innerHTML = '<span style="display:inline-block;animation:spin 0.8s linear infinite;">🔄</span> Đang nạp...';
    btn.disabled = true;
  }

  // Bật ngay hiệu ứng Skeleton Loading ở Tab bên dưới VÀ vô hiệu hóa Panel AI bên phải
  if (AppState.currentContract) {
    AppState.currentContract.isHydrating = true;
    AppState.currentContract.hydratingMessage = 'Đang tải dữ liệu mới nhất từ máy chủ...';
    renderTabContent();
    updateAIPanelOnly();
  }

  showToast('Đang làm mới dữ liệu hợp đồng...', 'info');
  try {
    await loadContractDetail(contractId, true);
    showToast('Đã làm mới dữ liệu thành công', 'success');
  } catch (e) {
    showToast('Lỗi làm mới: ' + (e.message || e), 'error');
  } finally {
    if (btn) {
      btn.innerHTML = '🔄 Làm mới';
      btn.disabled = false;
    }
  }
}

function getContractDetailContentHTML() {
  const contract = AppState.currentContract;
  if (!contract) {
    return renderLoadingSpinner('Đang tải chi tiết hợp đồng...');
  }

  const versions = contract.versions || [];
  const comments = contract.comments || [];
  const activities = contract.activities || [];
  const referenceFiles = contract.referenceFiles || [];
  const user = AppState.user || {};

  const rejectBadge = contract.rejectCount >= 0
    ? `<span class="reject-badge">⚠️ Lần review thứ ${contract.rejectCount + 1}</span>`
    : '';

  const headerHtml = `
    <div class="contract-detail-header fade-in">
      <div class="contract-title-row">
        <span class="contract-id-badge">${contract.contractId || ''}</span>
        <h1 class="contract-detail-title">${contract.title || 'Không có tiêu đề'}</h1>
      </div>
      ${contract.description ? `<p class="contract-description">${contract.description}</p>` : ''}
      <div class="contract-meta-row">
        <div class="contract-meta-left">
          <span class="meta-item">🏢 ${contract.supplier || 'Chưa có nhà cung cấp'}</span>
          ${renderStatusBadge(contract.status)}
          ${rejectBadge}
        </div>
        <div class="contract-actions-right" id="contract-actions-container">
          ${renderActionButtons(contract, user.role)}
        </div>
      </div>
    </div>
  `;

  const tabBarHtml = `
    <div class="tabs-container">
      <div class="tab-bar">
        <button class="tab-item ${AppState.activeTab === 'overview' ? 'active' : ''}" onclick="switchTab('overview')">
          📊 Tổng quan
        </button>
        <button class="tab-item ${AppState.activeTab === 'versions' ? 'active' : ''}" onclick="switchTab('versions')">
          📁 Phiên bản (${versions.length})
        </button>
        <button class="tab-item ${AppState.activeTab === 'comments' ? 'active' : ''}" onclick="switchTab('comments')">
          💬 Trao đổi (${comments.length})
        </button>
        <button class="tab-item ${AppState.activeTab === 'documents' ? 'active' : ''}" onclick="switchTab('documents')">
          📎 Tài liệu (${referenceFiles.length})
        </button>
      </div>
    </div>
  `;

  return `
    <div class="detail-split-layout">
      <div class="split-left-panel">
        ${headerHtml}
        ${tabBarHtml}
        <div id="tab-content" class="tab-content"></div>
      </div>
      <div class="split-right-panel" id="ai-assistant-panel">
        ${renderAIAssistantPanel(contract)}
      </div>
    </div>
  `;
}

function renderContractDetailContent() {
  const container = document.getElementById('contract-detail-area');
  if (!container) return;
  container.innerHTML = getContractDetailContentHTML();
  renderTabContent();
  initTaskListTextareasAutoResize();
}


function renderTabContent() {
  const tabContent = document.getElementById('tab-content');
  if (!tabContent) return;

  const contract = AppState.currentContract;
  if (!contract) return;

  // Hiển thị Skeleton loading nhẹ nhàng bên trong Tab nếu đang nạp ngầm (isHydrating)
  if (contract.isHydrating) {
    const msg = contract.hydratingMessage || 'Đang đồng bộ dữ liệu...';
    tabContent.innerHTML = `
      <div class="tab-panel active fade-in" style="padding: 24px; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 16px; color: var(--color-primary, #3b82f6); font-weight: 500; font-size: 14px;">
          <span style="display: inline-block; animation: spin 0.8s linear infinite;">🔄</span> ${msg}
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px; max-width: 500px; margin: 0 auto; opacity: 0.6;">
          <div style="height: 18px; background: var(--border-card, #e0e0e0); border-radius: 4px;"></div>
          <div style="height: 48px; background: var(--border-card, #e0e0e0); border-radius: 6px;"></div>
          <div style="height: 48px; background: var(--border-card, #e0e0e0); border-radius: 6px;"></div>
        </div>
      </div>
    `;
    return;
  }

  const versions = contract.versions || [];
  const comments = contract.comments || [];
  const activities = contract.activities || [];
  const user = AppState.user || {};

  switch (AppState.activeTab) {
    case 'overview':
      tabContent.innerHTML = `
        <div class="tab-panel active fade-in">
          <h3 class="section-title">📋 Lịch sử hoạt động</h3>
          ${activities.length > 0
          ? renderTimeline(activities)
          : renderEmptyState('📭', 'Chưa có hoạt động', 'Các hoạt động sẽ hiển thị ở đây')}
        </div>
      `;
      break;

    case 'versions':
      let canUploadVersion = false;
      const status = contract.status;
      if (status === 'DRAFT' || status === 'USER_REVISING') {
        if (user.role === 'USER' && contract.createdBy === user.username) {
          canUploadVersion = true;
        }
      } else if (status === 'PENDING_LEGAL' || status === 'LEGAL_COMMENTED') {
        if (user.role === 'LEGAL') {
          canUploadVersion = true;
        }
      } else if (status === 'LEGAL_APPROVED' || status === 'PENDING_HOL' || status === 'HOL_COMMENTED') {
        if (user.role === 'HOL') {
          canUploadVersion = true;
        }
      }

      tabContent.innerHTML = `
        <div class="tab-panel active fade-in">
          <div class="section-header">
            <h3 class="section-title">📁 Danh sách phiên bản</h3>
            ${canUploadVersion ? `
            <button class="btn btn-outline btn-sm" onclick="showUploadVersionModal('${contract.contractId}')">
              ⬆️ Tải phiên bản mới
            </button>
            ` : ''}
          </div>
          ${versions.length > 0
          ? versions.map((v, idx) => renderVersionItem(v, versions.length - 1 - idx)).join('')
          : renderEmptyState('📁', 'Chưa có phiên bản', 'Tải lên phiên bản đầu tiên')}
        </div>
      `;
      break;

    case 'comments':
      const sortedComments = [...comments].sort((a, b) => {
        const timeA = parseDateTimeString(a.commentAt).getTime() || 0;
        const timeB = parseDateTimeString(b.commentAt).getTime() || 0;
        return timeB - timeA;
      });
      tabContent.innerHTML = `
        <div class="tab-panel active fade-in">
          <div class="comments-list">
            <h3 class="section-title">📨 Lịch sử trao đổi</h3>
            <div class="comments-container">
              ${sortedComments.length > 0
          ? sortedComments.map(c => renderCommentBubble(c)).join('')
          : renderEmptyState('💬', 'Chưa có góp ý', 'Hãy là người đầu tiên góp ý')}
            </div>
          </div>
        </div>
      `;
      break;

    case 'documents':
      const refFiles = contract.referenceFiles || [];
      const canUploadRef = !['HOL_APPROVED', 'COMPLETED'].includes(contract.status);
      const refFileCount = refFiles.length;
      
      tabContent.innerHTML = `
        <div class="tab-panel active fade-in">
          <div class="section-header">
            <h3 class="section-title">📎 Tài liệu tham chiếu</h3>
            ${canUploadRef && refFileCount < 10 ? `
            <button class="btn btn-outline btn-sm" onclick="showUploadRefFileModal('${contract.contractId}')">
              ⬆️ Thêm tài liệu
            </button>
            ` : ''}
          </div>
          ${refFileCount >= 10 ? '<p class="ref-file-limit-msg">⚠️ Đã đạt giới hạn 10 tài liệu tham chiếu</p>' : ''}
          <div class="ref-files-list">
            ${refFiles.length > 0
              ? refFiles.map(f => renderReferenceFileItem(f, user, contract.status)).join('')
              : renderEmptyState('📎', 'Chưa có tài liệu tham chiếu', 'Upload tài liệu bổ sung cho hợp đồng')}
          </div>
        </div>
      `;
      break;

    default:
      tabContent.innerHTML = '';
  }
}

function getFileIcon(fileName, mimeType) {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  const iconMap = {
    'pdf': '📕', 'doc': '📘', 'docx': '📘',
    'xls': '📊', 'xlsx': '📊', 'csv': '📊',
    'ppt': '📙', 'pptx': '📙',
    'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
    'zip': '📦', 'rar': '📦', '7z': '📦',
    'txt': '📄', 'rtf': '📄', 'odt': '📄',
    'mp4': '🎬', 'avi': '🎬', 'mov': '🎬',
    'mp3': '🎵', 'wav': '🎵'
  };
  return iconMap[ext] || '📄';
}

function formatFileSizeDisplay(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + sizes[i];
}

function renderReferenceFileItem(file, user, contractStatus) {
  const icon = getFileIcon(file.fileName, file.mimeType);
  const fileSize = formatFileSizeDisplay(file.fileSize);
  const canDelete = file.uploadedBy === user.username && !['HOL_APPROVED', 'COMPLETED'].includes(contractStatus);
  
  return `
    <div class="ref-file-item">
      <div class="ref-file-icon">${icon}</div>
      <div class="ref-file-info">
        <div class="ref-file-name">${file.fileName}</div>
        <div class="ref-file-meta">
          <span>${fileSize}</span>
          <span>•</span>
          <span>Tải lên bởi <strong>${file.uploadedBy}</strong></span>
          <span>•</span>
          <span>${file.uploadedAt || ''}</span>
        </div>
      </div>
      <div class="ref-file-actions">
        <a href="${file.fileUrl}" target="_blank" class="btn btn-outline btn-sm" title="Xem tài liệu">
          👁️ Xem
        </a>
        ${canDelete ? `
        <button class="btn btn-ghost btn-sm ref-file-delete-btn" onclick="handleDeleteRefFile('${file.contractId}', '${file.fileId}', '${file.fileName.replace(/'/g, "\\'")}')"
          title="Xóa tài liệu">
          🗑️
        </button>
        ` : ''}
      </div>
    </div>
  `;
}

function switchTab(tabName) {
  AppState.activeTab = tabName;

  // Cập nhật active class trên tab bar
  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.classList.remove('active');
  });
  const activeTabEl = document.querySelector(`.tab-item[onclick="switchTab('${tabName}')"]`);
  if (activeTabEl) activeTabEl.classList.add('active');

  renderTabContent();
}

// ------------------------------------------------------------
// 12. Modal Show Functions
// ------------------------------------------------------------
function showNewContractModal() {
  const modalBody = `
    <div class="modal-form">
      <div class="form-group">
        <label for="new-contract-title">Tên hợp đồng <span class="required">*</span></label>
        <input type="text" id="new-contract-title" class="form-control" placeholder="VD: Hợp đồng cung cấp dịch vụ IT" />
      </div>
      <div class="form-group">
        <label for="new-contract-supplier">Nhà cung cấp <span class="required">*</span></label>
        <input type="text" id="new-contract-supplier" class="form-control" placeholder="VD: Công ty ABC" />
      </div>
      <div class="form-group">
        <label for="new-contract-description">Mô tả <span class="required">*</span></label>
        <textarea id="new-contract-description" class="form-control" rows="3" placeholder="Mô tả ngắn về hợp đồng..."></textarea>
      </div>
      <div class="form-group">
        <label>File hợp đồng <span class="required">*</span></label>
        <div class="file-upload-area" id="new-contract-upload-area">
          <span class="file-upload-icon">📁</span>
          <p class="file-upload-text">Kéo thả file hoặc click để chọn</p>
          <p class="file-upload-subtext">.docx, .doc - Tối đa 10MB</p>
        </div>
        <input type="file" id="new-contract-file" accept=".docx,.doc" style="display:none" />
        <div id="new-contract-file-info"></div>
      </div>
      <div class="form-group">
        <label>📎 Tài liệu tham chiếu <span class="label-optional">(không bắt buộc)</span></label>
        <div class="file-upload-area" id="ref-files-create-upload-area">
          <span class="file-upload-icon">📎</span>
          <p class="file-upload-text">Kéo thả hoặc click để chọn file tham chiếu</p>
          <p class="file-upload-subtext">Mọi định dạng, tối đa 10MB/file, tối đa 5 file</p>
        </div>
        <input type="file" id="ref-files-create-input" multiple style="display:none" />
        <div id="ref-files-create-list" class="multi-file-list"></div>
      </div>
    </div>
  `;

  const modalFooter = `
    <button class="btn btn-ghost" onclick="closeModal('new-contract-modal')">Huỷ</button>
    <button class="btn btn-primary" id="create-contract-btn" onclick="handleCreateContract()">Tạo hợp đồng</button>
  `;

  const modalHtml = renderModal('new-contract-modal', 'Tạo hợp đồng mới', modalBody, modalFooter);
  document.getElementById('modal-root').innerHTML = modalHtml;
  setupFileUpload('new-contract-upload-area', 'new-contract-file', 'new-contract-file-info');
  setupMultiFileUpload('ref-files-create-upload-area', 'ref-files-create-input', 'ref-files-create-list', 5);
}

function showUploadVersionModal(contractId) {
  const modalBody = `
    <div class="modal-form">
      <div class="form-group">
        <label>File phiên bản mới <span class="required">*</span></label>
        <div class="file-upload-area" id="upload-version-upload-area">
          <span class="file-upload-icon">📁</span>
          <p class="file-upload-text">Kéo thả file hoặc click để chọn</p>
          <p class="file-upload-subtext">.docx, .doc - Tối đa 10MB</p>
        </div>
        <input type="file" id="upload-version-file" accept=".docx,.doc" style="display:none" />
        <div id="upload-version-file-info"></div>
      </div>
      <div class="form-group">
        <label for="upload-change-summary">Tóm tắt thay đổi <span class="required">*</span></label>
        <textarea id="upload-change-summary" class="form-control" rows="3" placeholder="Mô tả những thay đổi chính trong phiên bản này..."></textarea>
      </div>
      <div class="form-group">
        <label for="upload-nego-notes">Ghi chú đàm phán</label>
        <textarea id="upload-nego-notes" class="form-control" rows="2" placeholder="Ghi chú từ quá trình đàm phán (tuỳ chọn)..."></textarea>
      </div>
    </div>
  `;

  const modalFooter = `
    <button class="btn btn-ghost" onclick="closeModal('upload-version-modal')">Huỷ</button>
    <button class="btn btn-primary" id="upload-version-btn" onclick="handleUploadVersion()">Tải lên</button>
  `;

  const modalHtml = renderModal('upload-version-modal', 'Tải lên phiên bản mới', modalBody, modalFooter);
  document.getElementById('modal-root').innerHTML = modalHtml;
  setupFileUpload('upload-version-upload-area', 'upload-version-file', 'upload-version-file-info');
}

function showCommentModal(contractId) {
  const title = 'Thêm Yêu cầu';
  const contract = AppState.currentContract;

  const placeholderText = (contract.status === 'DRAFT' || contract.status === 'USER_REVISING')
    ? 'Legal vui lòng review hợp đồng (mặc định nếu bỏ trống)'
    : 'Nhập nội dung yêu cầu...';

  const modalBody = `
    <div class="modal-form">
      <div class="form-group">
        <label for="comment-text">Nội dung yêu cầu <span class="required">*</span></label>
        <textarea id="comment-text" class="form-control" rows="4" placeholder="${placeholderText}"></textarea>
      </div>
    </div>
  `;

  const submitText = (contract.status === 'DRAFT' || contract.status === 'USER_REVISING') ? 'Yêu cầu review' : 'Gửi yêu cầu';

  const modalFooter = `
    <button class="btn btn-ghost" onclick="closeModal('comment-modal')">Huỷ</button>
    <button class="btn btn-primary" id="add-comment-btn" onclick="handleAddComment()">${submitText}</button>
  `;

  const modalHtml = renderModal('comment-modal', title, modalBody, modalFooter);
  document.getElementById('modal-root').innerHTML = modalHtml;
}

function showUploadRefFileModal(contractId) {
  const currentCount = (AppState.currentContract?.referenceFiles || []).length;
  const remainingSlots = Math.max(0, 10 - currentCount);

  if (remainingSlots <= 0) {
    showToast('Hợp đồng đã đạt tối đa 10 tài liệu tham chiếu', 'warning');
    return;
  }

  const modalBody = `
    <div class="modal-form">
      <div class="form-group">
        <label>Chọn tài liệu tham chiếu</label>
        <div class="file-upload-area" id="ref-files-tab-upload-area">
          <span class="file-upload-icon">📎</span>
          <p class="file-upload-text">Kéo thả hoặc click để chọn nhiều file</p>
          <p class="file-upload-subtext">Mọi định dạng, tối đa 10MB/file. Có thể tải thêm tối đa ${remainingSlots} file (tổng tối đa 10 file)</p>
        </div>
        <input type="file" id="ref-files-tab-input" multiple style="display:none" />
        <div id="ref-files-tab-list" class="multi-file-list"></div>
      </div>
    </div>
  `;

  const modalFooter = `
    <button class="btn btn-ghost" onclick="closeModal('ref-file-modal')">Huỷ</button>
    <button class="btn btn-primary" onclick="handleUploadRefFile()">Tải lên</button>
  `;

  const modalHtml = renderModal('ref-file-modal', 'Thêm tài liệu tham chiếu', modalBody, modalFooter);
  document.getElementById('modal-root').innerHTML = modalHtml;
  setupMultiFileUpload('ref-files-tab-upload-area', 'ref-files-tab-input', 'ref-files-tab-list', remainingSlots);
}

async function handleUploadRefFile() {
  const files = multiFileSelections['ref-files-tab-list'] || [];

  if (files.length === 0) {
    showToast('Vui lòng chọn ít nhất 1 tài liệu', 'error');
    return;
  }

  const currentCount = (AppState.currentContract?.referenceFiles || []).length;
  if (currentCount + files.length > 10) {
    showToast(`Tổng số tài liệu sẽ vượt quá giới hạn 10 file (hiện có ${currentCount}, đang chọn ${files.length})`, 'error');
    return;
  }

  closeModal('ref-file-modal');
  showGlobalLoading('Đang tải lên tài liệu...', `Đang chuẩn bị tải lên ${files.length} tài liệu tham chiếu...`);
  invalidateContractDetailCache(AppState.currentContractId);

  let successCount = 0;
  let errorMessages = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    showGlobalLoading('Đang tải lên tài liệu...', `Đang lưu tài liệu "${file.name}" (${i + 1}/${files.length})...`);
    try {
      const fileData = await readFileAsBase64(file);
      const result = await api('uploadReferenceFile', AppState.currentContractId, fileData, file.name, AppState.token);
      if (result && result.success) {
        applyReferenceFileDelta('upload', result.data, AppState.currentContractId);
        successCount++;
      } else {
        errorMessages.push(`${file.name}: ${result?.message || 'Lỗi không xác định'}`);
      }
    } catch (err) {
      errorMessages.push(`${file.name}: ${err.message}`);
    }
  }

  hideGlobalLoading();

  if (successCount > 0 && errorMessages.length === 0) {
    showToast(`Đã tải lên thành công ${successCount} tài liệu tham chiếu`, 'success');
  } else if (successCount > 0 && errorMessages.length > 0) {
    showToast(`Đã tải lên ${successCount}/${files.length} tài liệu. Lỗi: ${errorMessages.join(', ')}`, 'warning');
  } else {
    showToast(`Lỗi tải lên: ${errorMessages.join(', ')}`, 'error');
  }
}

async function handleDeleteRefFile(contractId, fileId, fileName) {
  const confirmed = await showConfirmDialog({
    title: 'Xác nhận xóa tài liệu',
    message: `Bạn có chắc chắn muốn xóa tài liệu "${fileName}" không? Hành động này không thể hoàn tác.`,
    confirmText: 'Xóa tài liệu',
    type: 'danger'
  });
  if (!confirmed) return;

  showGlobalLoading('Đang xóa tài liệu...', 'Đang xóa tài liệu tham chiếu khỏi hệ thống...');
  invalidateContractDetailCache(contractId);

  try {
    const result = await api('deleteReferenceFile', contractId, fileId, AppState.token);
    showToast('Đã xóa tài liệu tham chiếu', 'success');
    applyReferenceFileDelta('delete', result?.data, contractId);
    hideGlobalLoading();
  } catch (err) {
    showToast('Lỗi xóa tài liệu: ' + err.message, 'error');
    hideGlobalLoading();
  }
}

// ------------------------------------------------------------
// 13. Drag & Drop File Upload
// ------------------------------------------------------------
function isFileTypeAllowed(file, acceptAttr) {
  if (!acceptAttr || !acceptAttr.trim()) return true;
  const allowed = acceptAttr.split(',').map(s => s.trim().toLowerCase());
  const fileName = (file && file.name) ? file.name.toLowerCase() : '';
  const fileExt = '.' + fileName.split('.').pop();
  return allowed.some(ext => ext === fileExt || file.type === ext);
}

function setupFileUpload(uploadAreaId, fileInputId, fileInfoId) {
  setTimeout(() => {
    const area = document.getElementById(uploadAreaId);
    const input = document.getElementById(fileInputId);
    if (!area || !input) return;

    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.classList.add('drag-over');
    });

    area.addEventListener('dragleave', () => {
      area.classList.remove('drag-over');
    });

    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.classList.remove('drag-over');
      if (e.dataTransfer.files.length) {
        const file = e.dataTransfer.files[0];
        if (input.accept && !isFileTypeAllowed(file, input.accept)) {
          input.value = '';
          const info = document.getElementById(fileInfoId);
          if (info) info.innerHTML = '<div class="file-warning" style="color: #ef4444;">❌ Định dạng file không hợp lệ. Vui lòng chỉ chọn file Word (.doc, .docx)</div>';
          showToast('Định dạng file không hợp lệ. Vui lòng chỉ chọn file Word (.doc, .docx)', 'error');
          return;
        }
        input.files = e.dataTransfer.files;
        updateFileInfo(input, fileInfoId);
      }
    });

    area.addEventListener('click', () => input.click());
    input.addEventListener('change', () => updateFileInfo(input, fileInfoId));
  }, 100);
}

function updateFileInfo(input, infoId) {
  const info = document.getElementById(infoId);
  if (!info) return;

  if (input.files && input.files.length) {
    const file = input.files[0];
    if (input.accept && !isFileTypeAllowed(file, input.accept)) {
      input.value = '';
      info.innerHTML = '<div class="file-warning" style="color: #ef4444;">❌ Định dạng file không hợp lệ. Vui lòng chỉ chọn file Word (.doc, .docx)</div>';
      showToast('Định dạng file không hợp lệ. Vui lòng chỉ chọn file Word (.doc, .docx)', 'error');
      return;
    }
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    info.innerHTML = `<div class="file-info">📄 ${file.name} (${sizeMB} MB)</div>`;
    if (file.size > 10 * 1024 * 1024) {
      info.innerHTML += '<div class="file-warning" style="color: #ef4444;">❌ File lớn hơn 10MB, vui lòng chọn file khác nhỏ hơn</div>';
      showToast('File lớn hơn 10MB, vui lòng chọn file nhỏ hơn', 'error');
    }
  } else {
    info.innerHTML = '';
  }
}

let multiFileSelections = {};

function setupMultiFileUpload(uploadAreaId, fileInputId, listContainerId, maxFiles) {
  multiFileSelections[listContainerId] = [];
  
  setTimeout(() => {
    const area = document.getElementById(uploadAreaId);
    const input = document.getElementById(fileInputId);
    if (!area || !input) return;

    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.classList.add('drag-over');
    });

    area.addEventListener('dragleave', () => {
      area.classList.remove('drag-over');
    });

    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.classList.remove('drag-over');
      if (e.dataTransfer.files.length) {
        addMultiFiles(e.dataTransfer.files, listContainerId, maxFiles);
      }
    });

    area.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      addMultiFiles(input.files, listContainerId, maxFiles);
      input.value = ''; // Reset to allow re-selecting same files
    });
  }, 100);
}

function addMultiFiles(fileList, listContainerId, maxFiles) {
  const currentFiles = multiFileSelections[listContainerId] || [];
  
  for (let i = 0; i < fileList.length; i++) {
    if (currentFiles.length >= maxFiles) {
      showToast(`Tối đa ${maxFiles} file tham chiếu`, 'error');
      break;
    }
    const file = fileList[i];
    if (file.size > 10 * 1024 * 1024) {
      showToast(`File "${file.name}" lớn hơn 10MB, đã bỏ qua`, 'error');
      continue;
    }
    // Check duplicate by name
    if (currentFiles.some(f => f.name === file.name)) {
      showToast(`File "${file.name}" đã được chọn`, 'error');
      continue;
    }
    currentFiles.push(file);
  }
  
  multiFileSelections[listContainerId] = currentFiles;
  renderMultiFileList(listContainerId);
}

function removeMultiFile(listContainerId, index) {
  const currentFiles = multiFileSelections[listContainerId] || [];
  currentFiles.splice(index, 1);
  multiFileSelections[listContainerId] = currentFiles;
  renderMultiFileList(listContainerId);
}

function renderMultiFileList(listContainerId) {
  const container = document.getElementById(listContainerId);
  if (!container) return;
  
  const files = multiFileSelections[listContainerId] || [];
  if (files.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = files.map((file, idx) => {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    const icon = getFileIcon(file.name, '');
    return `
      <div class="multi-file-item">
        <span class="multi-file-icon">${icon}</span>
        <span class="multi-file-name">${file.name}</span>
        <span class="multi-file-size">(${sizeMB} MB)</span>
        <button class="multi-file-remove" onclick="removeMultiFile('${listContainerId}', ${idx})" title="Bỏ file">&times;</button>
      </div>
    `;
  }).join('');
}

// ------------------------------------------------------------
// 14. Filter Functions
// ------------------------------------------------------------
function filterContracts() {
  let result = AppState.contracts || [];

  if (AppState.filters.status !== 'ALL') {
    if (AppState.filters.status === 'PENDING_ACTION') {
      result = result.filter(c => {
        return c.status === 'DRAFT' || c.status === 'USER_REVISING';
      });
    } else if (AppState.filters.status === 'LEGAL_REVIEW') {
      result = result.filter(c => {
        return c.status === 'PENDING_LEGAL' ||
          c.status === 'LEGAL_COMMENTED' ||
          c.status === 'LEGAL_APPROVED';
      });
    } else if (AppState.filters.status === 'HEAD_REVIEW') {
      result = result.filter(c => {
        return c.status === 'PENDING_HOL' ||
          c.status === 'HOL_COMMENTED';
      });
    } else {
      result = result.filter(c => {
        const label = STATUS_LABELS[c.status];
        const filterLabel = STATUS_LABELS[AppState.filters.status];
        return label && filterLabel && label === filterLabel;
      });
    }
  }

  if (AppState.filters.search) {
    const keyword = AppState.filters.search.toLowerCase();
    result = result.filter(c =>
      (c.contractId || '').toLowerCase().includes(keyword) ||
      (c.title || '').toLowerCase().includes(keyword) ||
      (c.supplier || '').toLowerCase().includes(keyword) ||
      (c.createdBy || '').toLowerCase().includes(keyword)
    );
  }

  return result;
}

let _searchDebounce = null;
function handleSearchInput(value) {
  AppState.filters.search = value;
  AppState.currentPage = 1; // Reset về trang 1 khi tìm kiếm
  if (_searchDebounce) clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(() => {
    renderDashboardContent(true); // Chỉ re-render danh sách, giữ nguyên input DOM & focus
  }, 800);
}

function handleCardClick(filterType) {
  AppState.filters.status = filterType;
  AppState.currentPage = 1; // Reset về trang 1 khi lọc
  const dropdown = document.getElementById('status-filter');
  if (dropdown) {
    dropdown.value = filterType;
  }
  renderDashboardContent(true);
}

function handleStatusFilter(value) {
  AppState.filters.status = value;
  AppState.currentPage = 1; // Reset về trang 1 khi lọc
  renderDashboardContent(true);
}

function changePage(page) {
  AppState.currentPage = page;
  renderDashboardContent(true);
}

function renderContractList() {
  renderDashboardContent(true);
}

// ------------------------------------------------------------
// 15. Sidebar Toggle
// ------------------------------------------------------------
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  sidebar?.classList.toggle('collapsed');
  mainContent?.classList.toggle('sidebar-collapsed');
  AppState.isSidebarCollapsed = sidebar?.classList.contains('collapsed') ?? true;
}

// ------------------------------------------------------------
// 15.5. Theme Management (Dark / Light Mode)
// ------------------------------------------------------------
function initTheme() {
  const saved = localStorage.getItem('cr_theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const currentTheme = saved || (prefersLight ? 'light' : 'dark');
  AppState.theme = currentTheme;
  document.documentElement.setAttribute('data-theme', currentTheme);
}

function toggleTheme() {
  const next = AppState.theme === 'light' ? 'dark' : 'light';
  AppState.theme = next;
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cr_theme', next);

  document.querySelectorAll('.btn-theme-toggle').forEach(btn => {
    btn.innerHTML = next === 'light' ? '🌙' : '☀️';
    btn.title = next === 'light' ? 'Chuyển sang giao diện Tối' : 'Chuyển sang giao diện Sáng';
  });
}

function renderThemeToggleBtn() {
  const isLight = AppState.theme === 'light';
  return `<button class="btn btn-ghost btn-sm btn-theme-toggle" onclick="toggleTheme()" title="${isLight ? 'Chuyển sang giao diện Tối' : 'Chuyển sang giao diện Sáng'}">
    ${isLight ? '🌙' : '☀️'}
  </button>`;
}

// ------------------------------------------------------------
// 16. Initialization
// ------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  // Nếu đã có user từ cache localStorage, điều hướng ngay lập tức theo hash hiện tại (không hiện login / đang xác thực)
  if (AppState.user) {
    handleRoute();
  } else {
    // Chưa có session và URL đang ở #login hoặc rỗng -> render login
    if (window.location.hash === '#login' || window.location.hash === '' || window.location.hash === '#') {
      AppState.currentView = 'login';
      renderApp();
    }
  }

  window.addEventListener('hashchange', handleRoute);
});


// --- EXPOSE TO GLOBAL WINDOW FOR INLINE ONCLICK HANDLERS ---
window.parseDateTimeString = parseDateTimeString;
window.formatDate = formatDate;
window.timeAgo = timeAgo;
window.formatMarkdown = formatMarkdown;
window.renderStatusBadge = renderStatusBadge;
window.renderStatCard = renderStatCard;
window.renderContractCard = renderContractCard;
window.renderContractTable = renderContractTable;
window.renderTimeline = renderTimeline;
window.renderVersionItem = renderVersionItem;
window.renderCommentBubble = renderCommentBubble;
window.renderModal = renderModal;
window.renderLoadingSpinner = renderLoadingSpinner;
window.renderEmptyState = renderEmptyState;
window.renderToast = renderToast;
window.renderActionButtons = renderActionButtons;
window.renderLoadingSkeleton = renderLoadingSkeleton;
window.renderPagination = renderPagination;
window.renderSummaryPanel = renderSummaryPanel;
window.renderAIAssistantPanel = renderAIAssistantPanel;
window.renderRiskPanel = renderRiskPanel;
window.renderDecisionBriefPanel = renderDecisionBriefPanel;
window.renderTaskListPanel = renderTaskListPanel;
window.getFreshToken = getFreshToken;
window.api = api;
window.readFileAsBase64 = readFileAsBase64;
window.showToast = showToast;
window.showConfirmDialog = showConfirmDialog;
window.showGlobalLoading = showGlobalLoading;
window.hideGlobalLoading = hideGlobalLoading;
window.closeModal = closeModal;
window.navigateTo = navigateTo;
window.handleRoute = handleRoute;
window.loadDashboardData = loadDashboardData;
window.loadArchivedContractsData = loadArchivedContractsData;
window.loadContractDetail = loadContractDetail;
window.handleGoogleLogin = handleGoogleLogin;
window.handleMicrosoftLogin = handleMicrosoftLogin;
window.handleLogout = handleLogout;
window.submitForReview = submitForReview;
window.deleteContract = deleteContract;
window.approveContract = approveContract;
window.markCompleted = markCompleted;
window.handleTriggerAI = handleTriggerAI;
window.handleTriggerDecisionBrief = handleTriggerDecisionBrief;
window.startChainRiskAndBriefFlow = startChainRiskAndBriefFlow;
window.runDecisionBriefFlow = runDecisionBriefFlow;
window.switchAiTab = switchAiTab;
window.toggleAIPanel = toggleAIPanel;
window.handleAiVersionChange = handleAiVersionChange;
window.handleCompanyRoleChange = handleCompanyRoleChange;
window.generateClientUUID = generateClientUUID;
window.handleAddTaskRow = handleAddTaskRow;
window.handleDeleteTaskRow = handleDeleteTaskRow;
window.handleTaskFieldChange = handleTaskFieldChange;
window.autoResizeTaskTextarea = autoResizeTaskTextarea;
window.initTaskListTextareasAutoResize = initTaskListTextareasAutoResize;
window.handleSaveTaskListOnly = handleSaveTaskListOnly;
window.handleSubmitTaskListToUser = handleSubmitTaskListToUser;
window.handleSubmitTaskListToLegal = handleSubmitTaskListToLegal;
window.showTaskListExpandedModal = showTaskListExpandedModal;
window.refreshTaskListExpandedModal = refreshTaskListExpandedModal;
window.handleCreateContract = handleCreateContract;
window.handleUploadVersion = handleUploadVersion;
window.handleAddComment = handleAddComment;
window.renderApp = renderApp;
window.renderSidebar = renderSidebar;
window.renderLoginView = renderLoginView;
window.renderDashboardView = renderDashboardView;
window.renderDashboardContent = renderDashboardContent;
window.renderArchivedView = renderArchivedView;
window.renderArchivedContent = renderArchivedContent;
window.handleArchivedSearchInput = handleArchivedSearchInput;
window.handleArchivedSearchKeydown = handleArchivedSearchKeydown;
window.handleTriggerDeepSearch = handleTriggerDeepSearch;
window.handleClearDeepSearch = handleClearDeepSearch;
window.changeArchivedPage = changeArchivedPage;
window.handleBackFromDetail = handleBackFromDetail;
window.handleRefreshContractDetail = handleRefreshContractDetail;
window.getAllApprovedContracts = getAllApprovedContracts;
window.filterArchivedContracts = filterArchivedContracts;
window.renderContractDetailView = renderContractDetailView;
window.renderContractDetailContent = renderContractDetailContent;
window.renderTabContent = renderTabContent;
window.switchTab = switchTab;
window.showNewContractModal = showNewContractModal;
window.showUploadVersionModal = showUploadVersionModal;
window.showCommentModal = showCommentModal;
window.setupFileUpload = setupFileUpload;
window.updateFileInfo = updateFileInfo;
window.filterContracts = filterContracts;
window.handleSearchInput = handleSearchInput;
window.handleCardClick = handleCardClick;
window.handleStatusFilter = handleStatusFilter;
window.changePage = changePage;
window.renderContractList = renderContractList;
window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
window.renderThemeToggleBtn = renderThemeToggleBtn;

window.getFileIcon = getFileIcon;
window.formatFileSizeDisplay = formatFileSizeDisplay;
window.renderReferenceFileItem = renderReferenceFileItem;
window.showUploadRefFileModal = showUploadRefFileModal;
window.handleUploadRefFile = handleUploadRefFile;
window.handleDeleteRefFile = handleDeleteRefFile;
window.setupMultiFileUpload = setupMultiFileUpload;
window.addMultiFiles = addMultiFiles;
window.removeMultiFile = removeMultiFile;
window.renderMultiFileList = renderMultiFileList;

