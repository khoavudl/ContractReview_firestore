/**
 * Config.gs - Constants, configuration, and transition rules
 * for the Contract Review Workflow system.
 */

// ─── Firebase Config ──────────────────────────────────────────
// Firebase API Key now loaded from PropertiesService
const ALLOWED_DOMAINS = ['@foodempire.vn']; // Các domain được phép đăng nhập
const BYPASS_DOMAIN_CHECK = true; // Set to false để bật tính năng chặn domain

// ─── Sheet Names ──────────────────────────────────────────────
const SHEET_NAMES = {
  USERS: 'users',
  CONTRACTS: 'contracts',
  VERSIONS: 'versions',
  COMMENTS: 'comments',
  ACTIVITY_LOG: 'activity_log',
  AI_ANALYSES: 'ai_analyses',
  TASK_LIST: 'task_list',
  REFERENCE_FILES: 'reference_files'
};

// ─── AI Types ──────────────────────────────────────────────────
const AI_TYPES = {
  SUMMARY: 'SUMMARY',
  RISK: 'RISK',
  DECISION_BRIEF: 'DECISION_BRIEF'
};

// ─── Contract Statuses ────────────────────────────────────────
const STATUS = {
  DRAFT: 'DRAFT',
  PENDING_LEGAL: 'PENDING_LEGAL',
  LEGAL_COMMENTED: 'LEGAL_COMMENTED',
  USER_REVISING: 'USER_REVISING',
  LEGAL_APPROVED: 'LEGAL_APPROVED',
  PENDING_HOL: 'PENDING_HOL',
  HOL_COMMENTED: 'HOL_COMMENTED',
  HOL_APPROVED: 'HOL_APPROVED',
  COMPLETED: 'COMPLETED'
};

// ─── Status Labels (English Mapping) ─────────────────────────
const STATUS_LABELS = {
  DRAFT: 'Draft',
  PENDING_LEGAL: 'Legal Review',
  LEGAL_COMMENTED: 'Legal Review',
  USER_REVISING: 'Draft',
  LEGAL_APPROVED: 'Head Review',
  PENDING_HOL: 'Head Review',
  HOL_COMMENTED: 'Head Review',
  HOL_APPROVED: 'Approved',
  COMPLETED: 'Approved',
  LEGAL_REVIEW: 'Legal Review',
  HEAD_REVIEW: 'Head Review'
};

// ─── User Roles ───────────────────────────────────────────────
const ROLES = {
  USER: 'USER',
  LEGAL: 'LEGAL',
  HOL: 'HOL'
};

// ─── Session & Misc Constants ─────────────────────────────────
const SESSION_TTL = 28800; // 8 hours in seconds
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const EMAIL_FORWARD_TAG = '[CR]';
const DISABLE_EMAIL_NOTIFICATIONS = false; // Set to true to disable outgoing email notifications and automatic replies
const EMAIL_WHITELIST = []; // Chỉ gửi email tới các địa chỉ trong list. Để [] khi go-live.
const FRONTEND_URL = 'https://contract-review-weld.vercel.app'; // URL frontend cho link trong email
const MAX_REFERENCE_FILES = 10;
const MAX_REF_FILES_ON_CREATE = 5;

// ─── Status Transition Rules ─────────────────────────────────
const TRANSITIONS = {
  [STATUS.DRAFT]: {
    next: [STATUS.PENDING_LEGAL],
    roles: [ROLES.USER]
  },
  [STATUS.PENDING_LEGAL]: {
    next: [STATUS.LEGAL_COMMENTED, STATUS.LEGAL_APPROVED],
    roles: [ROLES.LEGAL]
  },
  [STATUS.LEGAL_COMMENTED]: {
    next: [STATUS.USER_REVISING],
    roles: ['SYSTEM']
  },
  [STATUS.USER_REVISING]: {
    next: [STATUS.PENDING_LEGAL],
    roles: [ROLES.USER]
  },
  [STATUS.LEGAL_APPROVED]: {
    next: [STATUS.PENDING_HOL],
    roles: ['SYSTEM']
  },
  [STATUS.PENDING_HOL]: {
    next: [STATUS.HOL_APPROVED, STATUS.HOL_COMMENTED],
    roles: [ROLES.HOL]
  },
  [STATUS.HOL_COMMENTED]: {
    next: [STATUS.USER_REVISING],
    roles: ['SYSTEM']
  },
  [STATUS.HOL_APPROVED]: {
    next: [STATUS.COMPLETED],
    roles: [ROLES.USER]
  }
};

var _cachedConfig = null;
/**
 * Returns application configuration from ScriptProperties.
 * @return {Object} { spreadsheetId, rootFolderId, geminiApiKey, webAppUrl }
 */
function getConfig_() {
  if (!_cachedConfig) {
    var props = PropertiesService.getScriptProperties();
    _cachedConfig = {
      spreadsheetId: props.getProperty('SPREADSHEET_ID'),
      archiveSpreadsheetId: props.getProperty('ARCHIVE_SPREADSHEET_ID'),
      rootFolderId: props.getProperty('ROOT_FOLDER_ID'),
      geminiApiKey: props.getProperty('GEMINI_API_KEY'),
      firebaseApiKey: props.getProperty('FIREBASE_API_KEY'),
      webAppUrl: props.getProperty('WEB_APP_URL')
    };
  }
  return _cachedConfig;
}

/**
 * Validates whether a status transition is allowed for a given role.
 * @param {string} currentStatus - The current contract status.
 * @param {string} newStatus - The desired new status.
 * @param {string} userRole - The role of the user attempting the transition.
 * @return {boolean} True if transition is valid, false otherwise.
 */
function canTransition_(currentStatus, newStatus, userRole) {
  var rule = TRANSITIONS[currentStatus];
  if (!rule) {
    return false;
  }
  if (rule.next.indexOf(newStatus) === -1) {
    return false;
  }
  // SYSTEM transitions are automatic and always allowed
  if (rule.roles.indexOf('SYSTEM') !== -1) {
    return true;
  }
  if (rule.roles.indexOf(userRole) === -1) {
    return false;
  }
  return true;
}

/**
 * Parses a custom datetime string (format: dd/MM/yyyy HH:mm) into a JavaScript Date object.
 * @param {string|Date|number} str - The date string, Date object, or timestamp.
 * @return {Date} Parsed date object.
 */
function parseDateTimeString_(str) {
  if (!str) return new Date(0);
  if (str instanceof Date) return str;
  if (typeof str === 'number') return new Date(str);
  var parts = String(str).split(' ');
  if (parts.length < 2) {
    var d = new Date(str);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }
  var dateParts = parts[0].split('/');
  var timeParts = parts[1].split(':');
  if (dateParts.length === 3 && timeParts.length >= 2) {
    var day = parseInt(dateParts[0], 10);
    var month = parseInt(dateParts[1], 10) - 1; // 0-based
    var year = parseInt(dateParts[2], 10);
    var hours = parseInt(timeParts[0], 10);
    var minutes = parseInt(timeParts[1], 10);
    return new Date(year, month, day, hours, minutes);
  }
  var d = new Date(str);
  return isNaN(d.getTime()) ? new Date(0) : d;
}
