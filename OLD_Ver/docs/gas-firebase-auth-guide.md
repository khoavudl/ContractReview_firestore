# Hướng dẫn Kỹ thuật: Authentication & Authorization cho Google Apps Script + Firebase + Vercel

> **Mục đích**: File này mô tả chi tiết kỹ thuật authen/author đã được triển khai thực tế trong dự án Contract Review. Khi đưa file này vào một dự án GAS khác, AI sẽ hiểu toàn bộ pattern và có thể tái sử dụng.

---

## Tổng quan kiến trúc

```
┌─────────────────┐     Firebase ID Token      ┌─────────────────────────┐
│  Frontend (SPA) │ ──────────────────────────► │  Backend (Google Apps   │
│  Vercel + Vite  │     HTTP POST (fetch)       │  Script - Web App)     │
│                 │ ◄────────────────────────── │                        │
│  Firebase Auth  │      JSON Response          │  Identity Toolkit API  │
│  (Client SDK)   │                             │  + Google Sheets (DB)  │
└────────┬────────┘                             └───────────┬────────────┘
         │                                                  │
         │ OAuth Redirect                                   │ Verify Token
         ▼                                                  ▼
┌─────────────────┐                             ┌────────────────────────┐
│ Google / Microsoft│                           │ Google Identity        │
│ OAuth Providers   │                           │ Toolkit REST API       │
└───────────────────┘                           └────────────────────────┘
```

---

## Tại sao phải tách Frontend ra Vercel (không dùng HtmlService của GAS)?

Google Apps Script có `HtmlService` để serve giao diện trực tiếp, nhưng nó có **2 hạn chế nghiêm trọng** khiến không phù hợp cho hệ thống cần đa phương thức đăng nhập:

1. **Không hỗ trợ Microsoft OAuth (và các OAuth provider bên ngoài Google)**:
   - GAS HtmlService chạy trong iframe sandbox trên domain `script.google.com`.
   - Firebase Auth sử dụng `signInWithRedirect()` / `signInWithPopup()` cần redirect URL phải match với domain đã đăng ký trên Firebase Console & trên Azure AD (Microsoft).
   - Domain `script.google.com` **không thể đăng ký làm redirect URI** cho Microsoft Azure AD OAuth.
   - Kết quả: **Chỉ Google Sign-In hoạt động** trên GAS HtmlService. Microsoft Sign-In sẽ bị lỗi redirect.

2. **Hạn chế sandbox**:
   - HtmlService chạy trong mode `IFRAME` sandbox, giới hạn nhiều Web API hiện đại.
   - Không kiểm soát được domain, headers, hay routing → khó cấu hình CORS cho Firebase Auth.

**Giải pháp**: Tách Frontend thành SPA độc lập, deploy trên Vercel (hoặc Netlify, Cloudflare Pages...). Domain custom (ví dụ: `app.example.com`) được đăng ký là Authorized Domain trên cả Firebase Console lẫn Azure AD → cả Google và Microsoft OAuth đều hoạt động.

---

## Phần 1: Setup Firebase Project

### 1.1. Tạo Firebase Project
1. Vào [Firebase Console](https://console.firebase.google.com/) → **Add Project**.
2. Bật **Authentication** → Tab **Sign-in method**:
   - Enable **Google** provider.
   - Enable **Microsoft** provider → Điền `Application (client) ID` và `Client Secret` từ Azure AD App Registration.
3. Tab **Settings** → **Authorized domains**: Thêm domain của frontend (ví dụ: `your-app.vercel.app`, `localhost`).

### 1.2. Lấy Firebase Config
Vào **Project Settings** → **General** → **Your apps** → **Web app** → Copy config object:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com", // Sẽ được override ở frontend
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```

### 1.3. Đăng ký Microsoft OAuth (Azure AD)
1. Vào [Azure Portal](https://portal.azure.com/) → **Azure Active Directory** → **App registrations** → **New registration**.
2. Redirect URI: `https://your-project.firebaseapp.com/__/auth/handler` (Firebase cung cấp sẵn URL này).
3. Copy **Application (client) ID** và tạo **Client Secret** → Paste vào Firebase Console (phần Microsoft provider).

---

## Phần 2: Setup Frontend (Vite + Vercel)

### 2.1. Cài đặt Firebase SDK
Trong `index.html`, load Firebase SDK compat version (không cần npm install):

```html
<!-- Firebase App (core) -->
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<!-- Firebase Auth -->
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
```

> **Lưu ý**: Dùng `compat` version để sử dụng cú pháp `firebase.auth()` quen thuộc. Nếu dùng modular SDK thì import khác.

### 2.2. Khởi tạo Firebase Auth (`main.js`)

```javascript
// --- Firebase Config ---
// Trick quan trọng: authDomain dùng domain của chính frontend (Vercel)
// thay vì firebaseapp.com để redirect OAuth hoạt động mượt mà.
// Khi dev local thì fallback về domain gốc của Firebase.
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: window.location.hostname === 'localhost'
    ? "your-project.firebaseapp.com"  // Dev mode: dùng domain Firebase gốc
    : window.location.hostname,        // Production: dùng domain Vercel
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};

// --- Init Firebase ---
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

// --- Providers ---
const googleProvider = new firebase.auth.GoogleAuthProvider();

function getMicrosoftProvider() {
  const provider = new firebase.auth.OAuthProvider('microsoft.com');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}
```

### 2.3. Luồng đăng nhập (Login Flow)

```javascript
// Login bằng Google
function handleGoogleLogin() {
  firebase.auth().signInWithRedirect(googleProvider);
}

// Login bằng Microsoft
function handleMicrosoftLogin() {
  firebase.auth().signInWithRedirect(getMicrosoftProvider());
}

// Logout
function handleLogout() {
  firebase.auth().signOut();
}
```

### 2.4. Xử lý Auth State + Gọi Backend

```javascript
// Xử lý kết quả redirect (quan trọng! phải có)
firebase.auth().getRedirectResult()
  .then((result) => {
    if (result && result.user) {
      // Login thành công sau redirect
    }
  })
  .catch((err) => {
    console.error('Lỗi sau redirect:', err);
  });

// Listener chính: theo dõi trạng thái auth
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User đã đăng nhập → lấy ID Token (JWT) từ Firebase
    user.getIdToken().then((token) => {
      // Gửi token xuống Backend GAS để xác thực + lấy thông tin user nội bộ
      api('checkSession', token)
        .then(result => {
          // result.data.user = { username, role, email, displayName }
          // → Lưu vào AppState, điều hướng vào Dashboard
        })
        .catch(err => {
          // Email không có trong hệ thống → sign out
          firebase.auth().signOut();
        });
    });
  } else {
    // User chưa đăng nhập → hiển thị trang Login
  }
});
```

### 2.5. API Layer: Gọi Google Apps Script

```javascript
// URL của GAS Web App (deploy as web app → lấy URL)
const GAS_API_URL = import.meta.env.VITE_GAS_API_URL || 'YOUR_GAS_WEB_APP_URL';

// Hàm gọi API chung
function api(functionName, ...args) {
  return fetch(GAS_API_URL, {
    method: 'POST',
    redirect: 'follow',  // QUAN TRỌNG: GAS redirect POST requests
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // GAS không nhận application/json
    },
    body: JSON.stringify({
      action: functionName,  // Tên hàm cần gọi ở Backend
      args: args             // Mảng tham số, token luôn là 1 trong các args
    })
  })
  .then(response => response.json())
  .then(result => {
    if (result && result.success) return result;
    throw new Error(result?.message || 'Có lỗi xảy ra');
  });
}

// Ví dụ gọi:
// api('checkSession', token)
// api('getContracts', token)
// api('updateContractStatus', contractId, 'PENDING_LEGAL', '', token)
```

> **Lưu ý quan trọng**:
> - `Content-Type` phải là `text/plain` (không phải `application/json`) vì GAS Web App bị lỗi CORS với `application/json`.
> - `redirect: 'follow'` bắt buộc vì GAS Web App redirect request trước khi trả response.

### 2.6. Vercel Config (`vercel.json`)
Proxy Firebase Auth requests qua Vercel để tránh lỗi CORS và cho phép `authDomain` = domain Vercel:

```json
{
  "rewrites": [
    {
      "source": "/__/auth/:path*",
      "destination": "https://YOUR-PROJECT.firebaseapp.com/__/auth/:path*"
    },
    {
      "source": "/__/firebase/init.json",
      "destination": "https://YOUR-PROJECT.firebaseapp.com/__/firebase/init.json"
    }
  ]
}
```

> **Giải thích**: Khi `authDomain` = `your-app.vercel.app`, Firebase SDK sẽ gọi `your-app.vercel.app/__/auth/handler` thay vì `firebaseapp.com`. Vercel rewrites proxy request này về Firebase → OAuth redirect hoạt động trên domain của bạn.

---

## Phần 3: Setup Backend (Google Apps Script)

### 3.1. Cấu hình `appsscript.json`

```json
{
  "timeZone": "Asia/Ho_Chi_Minh",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

- `executeAs: "USER_DEPLOYING"`: Mọi request chạy dưới quyền của người deploy, không phải user gọi API.
- `access: "ANYONE"`: Cho phép bất kỳ ai gọi API (authen tự xử lý ở code, không dựa vào GAS built-in auth).
- `script.external_request`: Cần thiết để gọi Google Identity Toolkit API.

### 3.2. Lưu secrets vào Script Properties
Vào **Project Settings** → **Script Properties**, thêm:
- `FIREBASE_API_KEY`: API Key của Firebase project (lấy từ Firebase Console).
- `SPREADSHEET_ID`: ID của Google Sheets làm DB.
- Các key khác tùy dự án.

```javascript
// Config.js
function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    spreadsheetId: props.getProperty('SPREADSHEET_ID'),
    firebaseApiKey: props.getProperty('FIREBASE_API_KEY'),
    // ... các config khác
  };
}
```

### 3.3. API Gateway (`ApiGateway.js`)
Entry point duy nhất cho mọi request từ Frontend:

```javascript
function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var args = requestData.args || [];

    // WHITELIST: Chỉ cho phép gọi các hàm đã đăng ký
    var allowedActions = {
      "checkSession": checkSession,
      "getContracts": getContracts,
      "createContract": createContract,
      // ... thêm các action khác
    };

    if (!allowedActions[action]) {
      throw new Error("Action not found or not allowed: " + action);
    }

    // Gọi hàm tương ứng với đúng tham số
    var result = allowedActions[action].apply(this, args);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: err.message,
      data: null
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

> **Bảo mật**: Pattern whitelist này rất quan trọng. Không whitelist = attacker có thể gọi bất kỳ hàm GAS nào.

### 3.4. Authentication: Xác thực Firebase Token (`Auth.js`)

```javascript
// Cấu hình domain cho phép (Config.js)
const ALLOWED_DOMAINS = ['@company.vn'];  // Chỉ cho phép email công ty
const BYPASS_DOMAIN_CHECK = false;        // true = tắt kiểm tra domain (dev mode)

/**
 * Xác thực Firebase ID Token.
 * Được gọi ở ĐẦU MỖI hàm nghiệp vụ để bảo vệ endpoint.
 */
function validateSession_(token) {
  if (!token) return { valid: false };

  // --- Bước 1: Cache Check ---
  // Hash token bằng MD5 làm cache key (token JWT quá dài cho CacheService)
  var tokenHash = hashString_(token);
  var cache = CacheService.getScriptCache();

  // Rate Limiting: 15 requests/phút/token
  var rateKey = 'rate_limit_' + tokenHash;
  var rateDataStr = cache.get(rateKey);
  var rateData = rateDataStr ? JSON.parse(rateDataStr)
                             : { count: 0, expiresAt: new Date().getTime() + 60000 };
  var now = new Date().getTime();

  if (now > rateData.expiresAt) {
    rateData = { count: 0, expiresAt: now + 60000 };
  }
  if (rateData.count >= 15) {
    throw new Error('HTTP 429 - Rate limit exceeded.');
  }
  rateData.count += 1;
  cache.put(rateKey, JSON.stringify(rateData),
            Math.max(1, Math.ceil((rateData.expiresAt - now) / 1000)));

  // Kiểm tra cache session (tránh gọi API mỗi lần)
  var cached = cache.get(tokenHash);
  if (cached) {
    var sessionData = JSON.parse(cached);
    if (sessionData) {
      sessionData.valid = true;
      return sessionData;
    }
  }

  // --- Bước 2: Verify Token qua Google Identity Toolkit API ---
  var payload = verifyFirebaseToken_(token);
  if (!payload || !payload.users || payload.users.length === 0) {
    return { valid: false };
  }

  var email = payload.users[0].email;
  if (!email) return { valid: false };

  // --- Bước 3: Kiểm tra Domain ---
  if (!BYPASS_DOMAIN_CHECK) {
    var domainAllowed = false;
    for (var i = 0; i < ALLOWED_DOMAINS.length; i++) {
      if (email.toLowerCase().endsWith(ALLOWED_DOMAINS[i].toLowerCase())) {
        domainAllowed = true;
        break;
      }
    }
    if (!domainAllowed) {
      throw new Error('Domain email không được phép truy cập.');
    }
  }

  // --- Bước 4: Map Email → Role từ Google Sheets ---
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

  // --- Bước 5: Tạo session object & cache ---
  var sessionData = {
    username: localUser.username,
    role: localUser.role,       // 'USER', 'LEGAL', 'HOL', etc.
    email: localUser.email,
    displayName: localUser.display_name,
    valid: true
  };

  // Cache 1 giờ (Firebase token TTL max = 1 giờ)
  cache.put(tokenHash, JSON.stringify(sessionData), 3600);
  return sessionData;
}

/**
 * Gọi Google Identity Toolkit REST API để verify Firebase ID Token.
 */
function verifyFirebaseToken_(idToken) {
  var url = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='
            + getConfig_().firebaseApiKey;

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ idToken: idToken }),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    Logger.log('Identity Toolkit Error: ' + response.getContentText());
    return null;
  }

  return JSON.parse(response.getContentText());
}

/**
 * Hash string bằng MD5 để làm cache key.
 */
function hashString_(str) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, str);
  var hex = '';
  for (var i = 0; i < rawHash.length; i++) {
    var byte = rawHash[i];
    if (byte < 0) byte += 256;
    hex += ('0' + byte.toString(16)).slice(-2);
  }
  return hex;
}
```

### 3.5. Sử dụng `validateSession_` trong các Service

**Mỗi hàm nghiệp vụ** phải gọi `validateSession_` ở dòng đầu tiên:

```javascript
// Ví dụ trong ContractService.js
function getContracts(token) {
  var session = validateSession_(token);
  if (!session.valid) {
    return jsonResponse_(false, null, 'Phiên đăng nhập không hợp lệ.');
  }

  // Logic nghiệp vụ ở đây...
  // session.role, session.email, session.username có thể dùng để lọc dữ liệu
}
```

---

## Phần 4: Authorization (Phân quyền - RBAC)

### 4.1. Định nghĩa Roles (`Config.js`)

```javascript
const ROLES = {
  USER: 'USER',    // Nhân viên tạo hợp đồng
  LEGAL: 'LEGAL',  // Bộ phận Pháp chế review
  HOL: 'HOL'       // Head of Legal / Quản lý cấp cao duyệt cuối
};
```

### 4.2. Bảng Users trong Google Sheets
Sheet `users` có cấu trúc:

| username | email | role | display_name |
|----------|-------|------|-------------|
| john.doe | john@company.vn | USER | John Doe |
| legal01 | legal@company.vn | LEGAL | Legal Team |
| boss01 | boss@company.vn | HOL | Head of Legal |

### 4.3. State Machine cho Workflow (Transition Rules)

Thay vì viết if/else phức tạp, dùng **State Machine** object:

```javascript
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

// Quy tắc: Từ trạng thái nào → được phép chuyển sang trạng thái nào → bởi Role nào
const TRANSITIONS = {
  [STATUS.DRAFT]: {
    next: [STATUS.PENDING_LEGAL],
    roles: [ROLES.USER]              // Chỉ USER mới được submit review
  },
  [STATUS.PENDING_LEGAL]: {
    next: [STATUS.LEGAL_COMMENTED, STATUS.LEGAL_APPROVED],
    roles: [ROLES.LEGAL]             // Chỉ LEGAL mới được duyệt/comment
  },
  [STATUS.LEGAL_COMMENTED]: {
    next: [STATUS.USER_REVISING],
    roles: ['SYSTEM']                // Hệ thống tự động chuyển
  },
  [STATUS.USER_REVISING]: {
    next: [STATUS.PENDING_LEGAL],
    roles: [ROLES.USER]              // USER sửa xong → gửi lại
  },
  [STATUS.LEGAL_APPROVED]: {
    next: [STATUS.PENDING_HOL],
    roles: ['SYSTEM']                // Hệ thống tự chuyển lên HOL
  },
  [STATUS.PENDING_HOL]: {
    next: [STATUS.HOL_APPROVED, STATUS.HOL_COMMENTED],
    roles: [ROLES.HOL]               // Chỉ HOL mới được duyệt/comment
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

// Hàm kiểm tra transition hợp lệ
function canTransition_(currentStatus, newStatus, userRole) {
  var rule = TRANSITIONS[currentStatus];
  if (!rule) return false;
  if (rule.next.indexOf(newStatus) === -1) return false;
  if (rule.roles.indexOf('SYSTEM') !== -1) return true;  // SYSTEM luôn được phép
  if (rule.roles.indexOf(userRole) === -1) return false;
  return true;
}
```

### 4.4. Kiểm tra quyền sở hữu (chống BOLA/IDOR)

```javascript
// Trong hàm updateContractStatus:
// Kiểm tra: USER chỉ được thao tác trên hợp đồng do chính mình tạo
var createdByOwner = contractRow[7]; // Column created_by
if (user.role === ROLES.USER && createdByOwner !== user.username) {
  return jsonResponse_(false, null, 'Bạn không có quyền thao tác trên hợp đồng này.');
}
```

---

## Phần 5: Luồng bảo mật tổng thể (Security Flow)

```
User mở app (Vercel)
  │
  ├─► Chưa đăng nhập → Hiển thị trang Login
  │     │
  │     ├─► Click "Google Login" → firebase.auth().signInWithRedirect(googleProvider)
  │     └─► Click "Microsoft Login" → firebase.auth().signInWithRedirect(getMicrosoftProvider())
  │           │
  │           ▼
  │     OAuth redirect → Provider xác thực → Redirect về Vercel
  │           │
  │           ▼
  │     firebase.auth().onAuthStateChanged(user) fires
  │           │
  │           ▼
  │     user.getIdToken() → Lấy JWT Token
  │           │
  │           ▼
  │     api('checkSession', token) → POST to GAS Web App
  │           │
  │           ▼ (Backend)
  │     ┌─ validateSession_(token)
  │     │   ├─ Rate limit check (15 req/min)
  │     │   ├─ Cache check (CacheService, TTL 1h)
  │     │   ├─ Verify token → Identity Toolkit API
  │     │   ├─ Domain check (ALLOWED_DOMAINS)
  │     │   └─ Map email → Role (Google Sheets 'users')
  │     │
  │     └─► Return { username, role, email, displayName }
  │           │
  │           ▼ (Frontend)
  │     Lưu user info + token vào AppState → Vào Dashboard
  │
  └─► Đã đăng nhập → Mỗi API call đều gửi kèm token
        │
        ▼ (Backend - Mỗi endpoint)
        validateSession_(token)  ← Luôn gọi đầu tiên
        canTransition_()         ← Kiểm tra quyền chuyển trạng thái
        Owner check              ← Kiểm tra quyền sở hữu (nếu cần)
```

---

## Phần 6: Checklist áp dụng cho dự án GAS mới

### Firebase & Vercel
- [ ] Tạo Firebase Project, bật Google + Microsoft provider
- [ ] Đăng ký Microsoft App trên Azure AD, paste credentials vào Firebase
- [ ] Thêm domain Vercel vào Firebase Authorized Domains
- [ ] Tạo `vercel.json` với rewrites proxy cho Firebase Auth
- [ ] Load Firebase Auth SDK trong `index.html` (compat version)
- [ ] Init Firebase + setup providers trong `main.js`
- [ ] Implement `onAuthStateChanged` + `getRedirectResult`
- [ ] Hàm `api()` dùng `fetch` POST với `Content-Type: text/plain`, `redirect: follow`

### Google Apps Script
- [ ] `appsscript.json`: `executeAs: USER_DEPLOYING`, `access: ANYONE`
- [ ] Thêm scope `script.external_request` (để gọi Identity Toolkit)
- [ ] Lưu `FIREBASE_API_KEY` vào Script Properties
- [ ] Tạo `ApiGateway.js` với `doPost()` + whitelist actions
- [ ] Tạo `Auth.js` với `validateSession_()` + `verifyFirebaseToken_()`
- [ ] Tạo `Config.js` với ROLES, TRANSITIONS, ALLOWED_DOMAINS
- [ ] Setup sheet `users` (email, role, username, display_name)
- [ ] Mỗi hàm nghiệp vụ: gọi `validateSession_(token)` ở dòng đầu
- [ ] Kiểm tra `canTransition_()` cho các thao tác thay đổi trạng thái
- [ ] Kiểm tra owner cho các thao tác nhạy cảm (chống BOLA/IDOR)
- [ ] Deploy Web App: Execute as Me, Anyone can access

---

## Phần 7: Lưu ý & Best Practices

1. **Không lưu Firebase API Key trong code**: Dùng `PropertiesService.getScriptProperties()`.
2. **Luôn validate token ở Backend**: Frontend token có thể bị forge. Chỉ tin Backend verification.
3. **Rate Limiting**: GAS Identity Toolkit có quota. Cache session + rate limit để tránh hit quota.
4. **Token TTL**: Firebase ID Token hết hạn sau 1 giờ. Frontend tự refresh (SDK tự lo), nhưng cache Backend cũng nên TTL 1h.
5. **`text/plain` thay vì `application/json`**: GAS Web App bị CORS preflight với `application/json`. Dùng `text/plain` để tránh.
6. **Domain Check có thể bật/tắt**: Dùng flag `BYPASS_DOMAIN_CHECK` để dev dễ hơn, production thì phải tắt bypass.
7. **Whitelist actions**: Không bao giờ cho phép gọi hàm động (ví dụ: `eval(action)` hay `this[action]()`). Luôn dùng object map tường minh.
