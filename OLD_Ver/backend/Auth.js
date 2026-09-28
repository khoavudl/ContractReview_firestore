/**
 * Auth.gs - Authentication system using Firebase Identity Toolkit.
 * Verifies Firebase ID tokens and maps to local user roles.
 */

/**
 * Checks if a session token (Firebase JWT) is valid.
 * @param {string} token - The Firebase ID token.
 * @return {Object} jsonResponse with user info if valid.
 */
function checkSession(token) {
  try {
    var user = validateSession_(token);
    if (!user || !user.valid) {
      return jsonResponse_(false, null, 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
    }
    return jsonResponse_(true, { user: user }, 'Phiên hợp lệ.');
  } catch (err) {
    Logger.log('CheckSession error: ' + err.message);
    return jsonResponse_(false, null, 'Lỗi kiểm tra phiên: ' + err.message);
  }
}

/**
 * Validates a Firebase ID token and returns the mapped user object.
 * Checks CacheService first to avoid hitting Identity Toolkit API rate limits.
 * @param {string} token - The Firebase ID token.
 * @return {Object} User session object with a 'valid' property.
 */
function validateSession_(token) {
  if (!token) return { valid: false };

  // Generate a short cache key using MD5 (Cache keys max 250 chars)
  var tokenHash = hashString_(token);
  var cache = CacheService.getScriptCache();
  
  // Rate Limiting (15 requests/minute)
  var rateKey = 'rate_limit_' + tokenHash;
  var rateDataStr = cache.get(rateKey);
  var rateData = rateDataStr ? JSON.parse(rateDataStr) : { count: 0, expiresAt: new Date().getTime() + 60000 };
  var now = new Date().getTime();
  
  if (now > rateData.expiresAt) {
    rateData = { count: 0, expiresAt: now + 60000 };
  }
  
  if (rateData.count >= 15) {
    throw new Error('HTTP 429 - Quá giới hạn 15 request/phút. Vui lòng thử lại sau.');
  }
  
  rateData.count += 1;
  var ttl = Math.max(1, Math.ceil((rateData.expiresAt - now) / 1000));
  cache.put(rateKey, JSON.stringify(rateData), ttl);

  var cached = cache.get(tokenHash);

  if (cached) {
    try {
      var sessionData = JSON.parse(cached);
      if (sessionData) {
        sessionData.valid = true;
        return sessionData;
      }
    } catch (e) {
      // Ignore cache parse error
    }
  }

  // Not in cache, verify via Identity Toolkit API
  var payload = verifyFirebaseToken_(token);
  if (!payload || !payload.users || payload.users.length === 0) {
    return { valid: false };
  }

  var firebaseUser = payload.users[0];
  var email = firebaseUser.email;

  if (!email) return { valid: false };

  // Domain restriction check
  if (!BYPASS_DOMAIN_CHECK) {
    var domainAllowed = false;
    for (var i = 0; i < ALLOWED_DOMAINS.length; i++) {
      if (email.toLowerCase().endsWith(ALLOWED_DOMAINS[i].toLowerCase())) {
        domainAllowed = true;
        break;
      }
    }
    if (!domainAllowed) {
      throw new Error('Domain email không được phép truy cập hệ thống.');
    }
  }

  // Map to local user role from USERS sheet
  var sheet = getSheet_(SHEET_NAMES.USERS);
  var users = sheetToObjects_(sheet);
  var localUser = null;

  for (var j = 0; j < users.length; j++) {
    if (users[j].email && users[j].email.toLowerCase() === email.toLowerCase()) {
      localUser = users[j];
      break;
    }
  }

  if (!localUser) {
    throw new Error('Email chưa được cấp quyền trong hệ thống.');
  }

  var sessionData = {
    username: localUser.username,
    role: localUser.role,
    email: localUser.email,
    displayName: localUser.display_name,
    valid: true
  };

  // Cache for 1 hour (Firebase token TTL is 1 hour max)
  cache.put(tokenHash, JSON.stringify(sessionData), 3600);

  return sessionData;
}

/**
 * Calls Google Identity Toolkit API to verify the Firebase ID Token.
 * @param {string} idToken 
 * @return {Object} The API response payload.
 */
function verifyFirebaseToken_(idToken) {
  var url = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + getConfig_().firebaseApiKey;
  var payload = {
    idToken: idToken
  };
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    Logger.log('Identity Toolkit Error: ' + response.getContentText());
    return null;
  }
  
  return JSON.parse(response.getContentText());
}

/**
 * Helper to hash long tokens into short cache keys.
 */
function hashString_(str) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, str);
  var hex = '';
  for (var i = 0; i < rawHash.length; i++) {
    var byte = rawHash[i];
    if (byte < 0) byte += 256;
    var hexByte = byte.toString(16);
    if (hexByte.length === 1) hexByte = '0' + hexByte;
    hex += hexByte;
  }
  return hex;
}
